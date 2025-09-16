/**
 * @fileoverview Order controller for managing restaurant orders
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse, 
  PaginatedResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class OrderController {
  /**
   * Get all orders with pagination and filters
   */
  async getOrders(
    page: number = 1, 
    limit: number = 10, 
    status?: string, 
    mesaCodigo?: number, 
    fechaInicio?: string, 
    fechaFin?: string
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { flg_del: 1 };
      
      if (status) {
        whereClause.ord_estado = status;
      }
      
      if (mesaCodigo) {
        whereClause.mesa_codigo = mesaCodigo;
      }
      
      if (fechaInicio && fechaFin) {
        whereClause.ord_fecha = {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        };
      }

      const [orders, total] = await Promise.all([
        prisma.orden.findMany({
          where: whereClause,
          include: {
            mesa: {
              include: {
                categoria: true
              }
            },
            cliente: true,
            usuario: {
              select: {
                usu_codigo: true,
                usu_nombre: true,
                usu_apellidopat: true,
                usu_apellidomat: true
              }
            },
            ordenproducto: {
              include: {
                plato: true,
                bebida: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { ord_fecha: 'desc' }
        }),
        prisma.orden.count({
          where: whereClause
        })
      ]);

      return {
        success: true,
        data: {
          data: orders,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        message: 'Orders retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve orders', 500);
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: number): Promise<ApiResponse> {
    try {
      const order = await prisma.orden.findUnique({
        where: { ord_codigo: id },
        include: {
          mesa: {
            include: {
              categoria: true
            }
          },
          cliente: true,
          usuario: {
            select: {
              usu_codigo: true,
              usu_nombre: true,
              usu_apellidopat: true,
              usu_apellidomat: true
            }
          },
          ordenproducto: {
            include: {
              plato: true,
              bebida: true,
              adiciones: {
                include: {
                  ingrediente: true
                }
              }
            }
          }
        }
      });

      if (!order || order.flg_del !== 1) {
        throw new CustomError('Order not found', 404);
      }

      return {
        success: true,
        data: order,
        message: 'Order retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve order', 500);
    }
  }

  /**
   * Create new order
   */
  async createOrder(orderData: {
    mesa_codigo: number;
    cliente_codigo?: number;
    productos: Array<{
      producto_id: number;
      cantidad: number;
      tipo: 'plato' | 'bebida';
      comentarios?: string;
    }>;
    comentarios?: string;
  }, userId: number): Promise<ApiResponse> {
    try {
      const { mesa_codigo, cliente_codigo, productos, comentarios } = orderData;

      // Verify table exists and is available
      const table = await prisma.mesa.findUnique({
        where: { mesa_codigo }
      });

      if (!table || table.flg_del !== 1) {
        throw new CustomError('Table not found', 404);
      }

      if (table.mesa_estado === 'mantenimiento') {
        throw new CustomError('Table is under maintenance', 400);
      }

      // Verify client exists if provided
      if (cliente_codigo) {
        const client = await prisma.cliente.findUnique({
          where: { cli_codigo: cliente_codigo }
        });

        if (!client || client.flg_del !== 1) {
          throw new CustomError('Client not found', 404);
        }
      }

      // Calculate total
      let total = 0;
      const orderProducts = [];

      for (const producto of productos) {
        let product;
        if (producto.tipo === 'plato') {
          product = await prisma.plato.findUnique({
            where: { pla_codigo: producto.producto_id }
          });
        } else {
          product = await prisma.bebida.findUnique({
            where: { beb_codigo: producto.producto_id }
          });
        }

        if (!product || product.flg_del !== 1) {
          throw new CustomError(`Product not found: ${producto.producto_id}`, 404);
        }

        const precio = product.pla_precio || product.beb_precio || 0;
        const subtotal = precio * producto.cantidad;
        total += subtotal;

        orderProducts.push({
          producto_id: producto.producto_id,
          cantidad: producto.cantidad,
          tipo: producto.tipo,
          precio: precio,
          subtotal: subtotal,
          comentarios: producto.comentarios
        });
      }

      // Create order
      const order = await prisma.orden.create({
        data: {
          mesa_codigo,
          cli_codigo: cliente_codigo || null,
          usu_codigo: userId,
          ord_estado: 'pendiente',
          ord_total: total,
          ord_comentarios: comentarios || '',
          ord_fecha: new Date(),
          flg_del: 1
        }
      });

      // Create order products
      for (const orderProduct of orderProducts) {
        await prisma.ordenProducto.create({
          data: {
            ord_codigo: order.ord_codigo,
            pla_codigo: orderProduct.tipo === 'plato' ? orderProduct.producto_id : null,
            beb_codigo: orderProduct.tipo === 'bebida' ? orderProduct.producto_id : null,
            orp_cantidad: orderProduct.cantidad,
            orp_precio: orderProduct.precio,
            orp_subtotal: orderProduct.subtotal,
            orp_comentarios: orderProduct.comentarios || '',
            flg_del: 1
          }
        });
      }

      // Update table status
      await prisma.mesa.update({
        where: { mesa_codigo },
        data: { mesa_estado: 'ocupada' }
      });

      // Get complete order with relations
      const completeOrder = await prisma.orden.findUnique({
        where: { ord_codigo: order.ord_codigo },
        include: {
          mesa: {
            include: {
              categoria: true
            }
          },
          cliente: true,
          usuario: {
            select: {
              usu_codigo: true,
              usu_nombre: true,
              usu_apellidopat: true,
              usu_apellidomat: true
            }
          },
          ordenproducto: {
            include: {
              plato: true,
              bebida: true
            }
          }
        }
      });

      return {
        success: true,
        data: completeOrder,
        message: 'Order created successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create order', 500);
    }
  }

  /**
   * Update order
   */
  async updateOrder(id: number, orderData: any, userId: number): Promise<ApiResponse> {
    try {
      const existingOrder = await prisma.orden.findUnique({
        where: { ord_codigo: id }
      });

      if (!existingOrder) {
        throw new CustomError('Order not found', 404);
      }

      // Only allow updates to pending orders
      if (existingOrder.ord_estado !== 'pendiente') {
        throw new CustomError('Only pending orders can be updated', 400);
      }

      const order = await prisma.orden.update({
        where: { ord_codigo: id },
        data: {
          ...orderData,
          usu_codigo_modificacion: userId
        },
        include: {
          mesa: {
            include: {
              categoria: true
            }
          },
          cliente: true,
          usuario: {
            select: {
              usu_codigo: true,
              usu_nombre: true,
              usu_apellidopat: true,
              usu_apellidomat: true
            }
          },
          ordenproducto: {
            include: {
              plato: true,
              bebida: true
            }
          }
        }
      });

      return {
        success: true,
        data: order,
        message: 'Order updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update order', 500);
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(id: number, userId: number): Promise<ApiResponse> {
    try {
      const existingOrder = await prisma.orden.findUnique({
        where: { ord_codigo: id }
      });

      if (!existingOrder) {
        throw new CustomError('Order not found', 404);
      }

      // Only allow cancellation of pending or in-progress orders
      if (!['pendiente', 'en_proceso'].includes(existingOrder.ord_estado)) {
        throw new CustomError('Order cannot be cancelled in current status', 400);
      }

      const order = await prisma.orden.update({
        where: { ord_codigo: id },
        data: {
          ord_estado: 'cancelado',
          usu_codigo_modificacion: userId
        }
      });

      // Update table status back to available
      await prisma.mesa.update({
        where: { mesa_codigo: existingOrder.mesa_codigo },
        data: { mesa_estado: 'disponible' }
      });

      return {
        success: true,
        data: order,
        message: 'Order cancelled successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to cancel order', 500);
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    id: number, 
    status: string, 
    comentarios?: string, 
    userId?: number
  ): Promise<ApiResponse> {
    try {
      const validStatuses = ['pendiente', 'en_proceso', 'listo', 'entregado', 'cancelado'];
      
      if (!validStatuses.includes(status)) {
        throw new CustomError('Invalid order status', 400);
      }

      const existingOrder = await prisma.orden.findUnique({
        where: { ord_codigo: id }
      });

      if (!existingOrder) {
        throw new CustomError('Order not found', 404);
      }

      const order = await prisma.orden.update({
        where: { ord_codigo: id },
        data: {
          ord_estado: status,
          ord_comentarios: comentarios || existingOrder.ord_comentarios,
          usu_codigo_modificacion: userId
        },
        include: {
          mesa: {
            include: {
              categoria: true
            }
          },
          cliente: true,
          usuario: {
            select: {
              usu_codigo: true,
              usu_nombre: true,
              usu_apellidopat: true,
              usu_apellidomat: true
            }
          },
          ordenproducto: {
            include: {
              plato: true,
              bebida: true
            }
          }
        }
      });

      // Update table status based on order status
      if (status === 'entregado' || status === 'cancelado') {
        await prisma.mesa.update({
          where: { mesa_codigo: existingOrder.mesa_codigo },
          data: { mesa_estado: 'disponible' }
        });
      }

      return {
        success: true,
        data: order,
        message: 'Order status updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update order status', 500);
    }
  }

  /**
   * Add products to order
   */
  async addProductsToOrder(
    orderId: number, 
    productos: Array<{
      producto_id: number;
      cantidad: number;
      tipo: 'plato' | 'bebida';
      comentarios?: string;
    }>, 
    userId: number
  ): Promise<ApiResponse> {
    try {
      const existingOrder = await prisma.orden.findUnique({
        where: { ord_codigo: orderId }
      });

      if (!existingOrder) {
        throw new CustomError('Order not found', 404);
      }

      // Only allow adding products to pending orders
      if (existingOrder.ord_estado !== 'pendiente') {
        throw new CustomError('Products can only be added to pending orders', 400);
      }

      let additionalTotal = 0;

      // Add products
      for (const producto of productos) {
        let product;
        if (producto.tipo === 'plato') {
          product = await prisma.plato.findUnique({
            where: { pla_codigo: producto.producto_id }
          });
        } else {
          product = await prisma.bebida.findUnique({
            where: { beb_codigo: producto.producto_id }
          });
        }

        if (!product || product.flg_del !== 1) {
          throw new CustomError(`Product not found: ${producto.producto_id}`, 404);
        }

        const precio = product.pla_precio || product.beb_precio || 0;
        const subtotal = precio * producto.cantidad;
        additionalTotal += subtotal;

        await prisma.ordenProducto.create({
          data: {
            ord_codigo: orderId,
            pla_codigo: producto.tipo === 'plato' ? producto.producto_id : null,
            beb_codigo: producto.tipo === 'bebida' ? producto.producto_id : null,
            orp_cantidad: producto.cantidad,
            orp_precio: precio,
            orp_subtotal: subtotal,
            orp_comentarios: producto.comentarios || '',
            flg_del: 1
          }
        });
      }

      // Update order total
      const newTotal = existingOrder.ord_total + additionalTotal;
      await prisma.orden.update({
        where: { ord_codigo: orderId },
        data: {
          ord_total: newTotal,
          usu_codigo_modificacion: userId
        }
      });

      return {
        success: true,
        data: { additionalTotal, newTotal },
        message: 'Products added to order successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to add products to order', 500);
    }
  }

  /**
   * Remove product from order
   */
  async removeProductFromOrder(orderId: number, productId: number, userId: number): Promise<ApiResponse> {
    try {
      const existingOrder = await prisma.orden.findUnique({
        where: { ord_codigo: orderId }
      });

      if (!existingOrder) {
        throw new CustomError('Order not found', 404);
      }

      // Only allow removing products from pending orders
      if (existingOrder.ord_estado !== 'pendiente') {
        throw new CustomError('Products can only be removed from pending orders', 400);
      }

      const orderProduct = await prisma.ordenProducto.findFirst({
        where: {
          ord_codigo: orderId,
          OR: [
            { pla_codigo: productId },
            { beb_codigo: productId }
          ],
          flg_del: 1
        }
      });

      if (!orderProduct) {
        throw new CustomError('Product not found in order', 404);
      }

      // Soft delete the order product
      await prisma.ordenProducto.update({
        where: { orp_codigo: orderProduct.orp_codigo },
        data: { flg_del: 0 }
      });

      // Update order total
      const newTotal = existingOrder.ord_total - orderProduct.orp_subtotal;
      await prisma.orden.update({
        where: { ord_codigo: orderId },
        data: {
          ord_total: Math.max(0, newTotal),
          usu_codigo_modificacion: userId
        }
      });

      return {
        success: true,
        data: { removedSubtotal: orderProduct.orp_subtotal, newTotal },
        message: 'Product removed from order successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to remove product from order', 500);
    }
  }

  /**
   * Get pending orders for kitchen
   */
  async getKitchenPendingOrders(): Promise<ApiResponse> {
    try {
      const orders = await prisma.orden.findMany({
        where: {
          ord_estado: 'pendiente',
          flg_del: 1
        },
        include: {
          mesa: {
            include: {
              categoria: true
            }
          },
          ordenproducto: {
            where: { flg_del: 1 },
            include: {
              plato: {
                include: {
                  cocina: true
                }
              },
              bebida: {
                include: {
                  cocina: true
                }
              }
            }
          }
        },
        orderBy: { ord_fecha: 'asc' }
      });

      return {
        success: true,
        data: orders,
        message: 'Pending kitchen orders retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve pending kitchen orders', 500);
    }
  }

  /**
   * Get in-progress orders for kitchen
   */
  async getKitchenInProgressOrders(): Promise<ApiResponse> {
    try {
      const orders = await prisma.orden.findMany({
        where: {
          ord_estado: 'en_proceso',
          flg_del: 1
        },
        include: {
          mesa: {
            include: {
              categoria: true
            }
          },
          ordenproducto: {
            where: { flg_del: 1 },
            include: {
              plato: {
                include: {
                  cocina: true
                }
              },
              bebida: {
                include: {
                  cocina: true
                }
              }
            }
          }
        },
        orderBy: { ord_fecha: 'asc' }
      });

      return {
        success: true,
        data: orders,
        message: 'In-progress kitchen orders retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve in-progress kitchen orders', 500);
    }
  }

  /**
   * Start order in kitchen
   */
  async startOrderInKitchen(orderId: number, userId: number): Promise<ApiResponse> {
    try {
      const existingOrder = await prisma.orden.findUnique({
        where: { ord_codigo: orderId }
      });

      if (!existingOrder) {
        throw new CustomError('Order not found', 404);
      }

      if (existingOrder.ord_estado !== 'pendiente') {
        throw new CustomError('Only pending orders can be started in kitchen', 400);
      }

      const order = await prisma.orden.update({
        where: { ord_codigo: orderId },
        data: {
          ord_estado: 'en_proceso',
          usu_codigo_modificacion: userId
        },
        include: {
          mesa: {
            include: {
              categoria: true
            }
          },
          ordenproducto: {
            include: {
              plato: true,
              bebida: true
            }
          }
        }
      });

      return {
        success: true,
        data: order,
        message: 'Order started in kitchen successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to start order in kitchen', 500);
    }
  }

  /**
   * Complete order in kitchen
   */
  async completeOrderInKitchen(orderId: number, userId: number): Promise<ApiResponse> {
    try {
      const existingOrder = await prisma.orden.findUnique({
        where: { ord_codigo: orderId }
      });

      if (!existingOrder) {
        throw new CustomError('Order not found', 404);
      }

      if (existingOrder.ord_estado !== 'en_proceso') {
        throw new CustomError('Only in-progress orders can be completed in kitchen', 400);
      }

      const order = await prisma.orden.update({
        where: { ord_codigo: orderId },
        data: {
          ord_estado: 'listo',
          usu_codigo_modificacion: userId
        },
        include: {
          mesa: {
            include: {
              categoria: true
            }
          },
          ordenproducto: {
            include: {
              plato: true,
              bebida: true
            }
          }
        }
      });

      return {
        success: true,
        data: order,
        message: 'Order completed in kitchen successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to complete order in kitchen', 500);
    }
  }
}
