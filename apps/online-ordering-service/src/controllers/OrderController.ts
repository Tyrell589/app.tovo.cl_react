/**
 * @fileoverview Order controller for online ordering
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse, 
  PaginatedResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export class OrderController {
  /**
   * Create new order
   */
  async createOrder(orderData: {
    cart_id: string;
    customer_info: {
      nombre: string;
      telefono: string;
      email: string;
    };
    delivery_info: {
      direccion: string;
      ciudad: string;
      instrucciones?: string;
    };
    payment_method: string;
    special_instructions?: string;
  }): Promise<ApiResponse> {
    try {
      const { cart_id, customer_info, delivery_info, payment_method, special_instructions } = orderData;

      // Generate tracking code
      const trackingCode = uuidv4().substring(0, 8).toUpperCase();

      // Create order in database
      const order = await prisma.orden.create({
        data: {
          ord_fecha: new Date(),
          ord_estado: 'pendiente',
          ord_total: 0, // Will be calculated from cart
          ord_comentarios: special_instructions || '',
          ord_codigo_seguimiento: trackingCode,
          cli_codigo: 1, // Default customer for online orders
          mesa_codigo: 1, // Default table for online orders
          flg_del: 1
        }
      });

      // Create delivery record
      const delivery = await prisma.entrega.create({
        data: {
          ord_codigo: order.ord_codigo,
          ent_direccion: delivery_info.direccion,
          ent_ciudad: delivery_info.ciudad,
          ent_telefono: customer_info.telefono,
          ent_instrucciones: delivery_info.instrucciones || '',
          ent_estado: 'pendiente',
          ent_fecha_solicitud: new Date(),
          flg_del: 1
        }
      });

      return {
        success: true,
        data: {
          order_id: order.ord_codigo,
          tracking_code: trackingCode,
          status: order.ord_estado,
          customer: customer_info,
          delivery: {
            address: delivery_info.direccion,
            city: delivery_info.ciudad,
            status: delivery.ent_estado
          },
          payment_method: payment_method,
          created_at: order.ord_fecha
        },
        message: 'Order created successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to create order', 500);
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: number): Promise<ApiResponse> {
    try {
      const order = await prisma.orden.findUnique({
        where: { ord_codigo: orderId },
        include: {
          cliente: {
            select: {
              cli_nombre: true,
              cli_apellidopat: true,
              cli_telefono: true,
              cli_email: true
            }
          },
          entrega: true,
          ordenproducto: {
            include: {
              plato: true,
              bebida: true
            }
          }
        }
      });

      if (!order || order.flg_del !== 1) {
        throw new CustomError('Order not found', 404);
      }

      return {
        success: true,
        data: {
          order_id: order.ord_codigo,
          tracking_code: order.ord_codigo_seguimiento,
          status: order.ord_estado,
          total: order.ord_total,
          comments: order.ord_comentarios,
          created_at: order.ord_fecha,
          customer: order.cliente,
          delivery: order.entrega,
          products: order.ordenproducto.map(op => ({
            id: op.orp_codigo,
            product: op.plato || op.bebida,
            quantity: op.orp_cantidad,
            price: op.orp_precio,
            subtotal: op.orp_subtotal
          }))
        },
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
   * Track order by tracking code
   */
  async trackOrder(trackingCode: string): Promise<ApiResponse> {
    try {
      const order = await prisma.orden.findFirst({
        where: { 
          ord_codigo_seguimiento: trackingCode,
          flg_del: 1
        },
        include: {
          entrega: true,
          ordenproducto: {
            include: {
              plato: true,
              bebida: true
            }
          }
        }
      });

      if (!order) {
        throw new CustomError('Order not found', 404);
      }

      return {
        success: true,
        data: {
          order_id: order.ord_codigo,
          tracking_code: order.ord_codigo_seguimiento,
          status: order.ord_estado,
          total: order.ord_total,
          created_at: order.ord_fecha,
          delivery: {
            address: order.entrega?.ent_direccion,
            city: order.entrega?.ent_ciudad,
            status: order.entrega?.ent_estado,
            requested_at: order.entrega?.ent_fecha_solicitud,
            dispatched_at: order.entrega?.ent_fecha_salida,
            delivered_at: order.entrega?.ent_fecha_entrega
          },
          products: order.ordenproducto.map(op => ({
            name: op.plato?.pla_nombre || op.bebida?.beb_nombre,
            quantity: op.orp_cantidad,
            price: op.orp_precio
          }))
        },
        message: 'Order tracking retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to track order', 500);
    }
  }

  /**
   * Get all orders (Admin)
   */
  async getAllOrders(
    page: number = 1, 
    limit: number = 10, 
    status?: string
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { flg_del: 1 };
      
      if (status) {
        whereClause.ord_estado = status;
      }

      const [orders, total] = await Promise.all([
        prisma.orden.findMany({
          where: whereClause,
          include: {
            cliente: {
              select: {
                cli_nombre: true,
                cli_apellidopat: true,
                cli_telefono: true,
                cli_email: true
              }
            },
            entrega: true
          },
          skip,
          take: limit,
          orderBy: { ord_fecha: 'desc' }
        }),
        prisma.orden.count({
          where: whereClause
        })
      ]);

      const result = {
        data: orders.map(order => ({
          order_id: order.ord_codigo,
          tracking_code: order.ord_codigo_seguimiento,
          status: order.ord_estado,
          total: order.ord_total,
          created_at: order.ord_fecha,
          customer: order.cliente,
          delivery: order.entrega
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

      return {
        success: true,
        data: result,
        message: 'Orders retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve orders', 500);
    }
  }
}
