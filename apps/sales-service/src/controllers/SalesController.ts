/**
 * @fileoverview Sales controller for order processing and sales management
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse, 
  PaginatedResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';
import moment from 'moment';

export class SalesController {
  /**
   * Get all sales with pagination and filters
   */
  async getSales(
    page: number = 1, 
    limit: number = 10, 
    fechaInicio?: string, 
    fechaFin?: string, 
    metodoPago?: string, 
    mesaCodigo?: number
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { flg_del: 1 };
      
      if (fechaInicio && fechaFin) {
        whereClause.ord_fecha = {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        };
      }
      
      if (metodoPago) {
        whereClause.ord_metodopago = metodoPago;
      }
      
      if (mesaCodigo) {
        whereClause.mesa_codigo = mesaCodigo;
      }

      const [sales, total] = await Promise.all([
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
          data: sales,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        message: 'Sales retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve sales', 500);
    }
  }

  /**
   * Get sale by ID
   */
  async getSaleById(id: number): Promise<ApiResponse> {
    try {
      const sale = await prisma.orden.findUnique({
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

      if (!sale || sale.flg_del !== 1) {
        throw new CustomError('Sale not found', 404);
      }

      return {
        success: true,
        data: sale,
        message: 'Sale retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve sale', 500);
    }
  }

  /**
   * Process order payment
   */
  async processOrder(
    orderData: {
      orden_codigo: number;
      metodo_pago: string;
      monto_pagado: number;
      descuento?: number;
      propina?: number;
    }, 
    userId: number
  ): Promise<ApiResponse> {
    try {
      const { orden_codigo, metodo_pago, monto_pagado, descuento = 0, propina = 0 } = orderData;

      // Verify order exists and is ready for payment
      const order = await prisma.orden.findUnique({
        where: { ord_codigo: orden_codigo },
        include: {
          mesa: true,
          ordenproducto: true
        }
      });

      if (!order || order.flg_del !== 1) {
        throw new CustomError('Order not found', 404);
      }

      if (order.ord_estado !== 'listo') {
        throw new CustomError('Order must be ready before payment', 400);
      }

      // Calculate totals
      const subtotal = order.ord_total || 0;
      const tax = subtotal * (parseFloat(process.env.TAX_RATE || '0.19'));
      const serviceCharge = subtotal * (parseFloat(process.env.SERVICE_CHARGE_RATE || '0.10'));
      const total = subtotal + tax + serviceCharge - descuento + propina;

      // Validate payment amount
      if (monto_pagado < total) {
        throw new CustomError('Payment amount is insufficient', 400);
      }

      const change = monto_pagado - total;

      // Update order with payment information
      const updatedOrder = await prisma.orden.update({
        where: { ord_codigo: orden_codigo },
        data: {
          ord_estado: 'entregado',
          ord_metodopago: metodo_pago,
          ord_montopagado: monto_pagado,
          ord_descuento: descuento,
          ord_propina: propina,
          ord_impuesto: tax,
          ord_cargoservicio: serviceCharge,
          ord_cambio: change,
          ord_fechapago: new Date(),
          usu_codigo_pago: userId
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

      // Update table status to available
      await prisma.mesa.update({
        where: { mesa_codigo: order.mesa_codigo },
        data: { mesa_estado: 'disponible' }
      });

      return {
        success: true,
        data: {
          order: updatedOrder,
          payment: {
            subtotal,
            tax,
            serviceCharge,
            discount: descuento,
            tip: propina,
            total,
            paid: monto_pagado,
            change
          }
        },
        message: 'Order processed successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to process order', 500);
    }
  }

  /**
   * Process order refund
   */
  async processRefund(
    refundData: {
      orden_codigo: number;
      monto_reembolso: number;
      motivo: string;
    }, 
    userId: number
  ): Promise<ApiResponse> {
    try {
      const { orden_codigo, monto_reembolso, motivo } = refundData;

      // Verify order exists and is eligible for refund
      const order = await prisma.orden.findUnique({
        where: { ord_codigo: orden_codigo }
      });

      if (!order || order.flg_del !== 1) {
        throw new CustomError('Order not found', 404);
      }

      if (order.ord_estado !== 'entregado') {
        throw new CustomError('Only delivered orders can be refunded', 400);
      }

      // Check refund time limit
      const refundDaysLimit = parseInt(process.env.REFUND_DAYS_LIMIT || '30');
      const orderDate = new Date(order.ord_fecha);
      const daysSinceOrder = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceOrder > refundDaysLimit) {
        throw new CustomError(`Refund not allowed after ${refundDaysLimit} days`, 400);
      }

      // Validate refund amount
      if (monto_reembolso > (order.ord_montopagado || 0)) {
        throw new CustomError('Refund amount cannot exceed paid amount', 400);
      }

      // Create refund record
      const refund = await prisma.movimientoDinero.create({
        data: {
          mov_tipo: 2, // 2 = refund
          mov_monto: monto_reembolso,
          mov_descripcion: `Refund for order ${orden_codigo}: ${motivo}`,
          mov_fecha: new Date(),
          ord_codigo: orden_codigo,
          usu_codigo: userId,
          flg_del: 1
        }
      });

      // Update order status
      await prisma.orden.update({
        where: { ord_codigo: orden_codigo },
        data: {
          ord_estado: 'reembolsado',
          ord_comentarios: `Refunded: ${motivo}`
        }
      });

      return {
        success: true,
        data: {
          refund,
          order: {
            ord_codigo: orden_codigo,
            ord_estado: 'reembolsado',
            monto_reembolso
          }
        },
        message: 'Refund processed successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to process refund', 500);
    }
  }

  /**
   * Get daily sales summary
   */
  async getDailySummary(fecha?: string): Promise<ApiResponse> {
    try {
      const targetDate = fecha ? moment(fecha) : moment();
      const startOfDay = targetDate.startOf('day').toDate();
      const endOfDay = targetDate.endOf('day').toDate();

      const [
        totalSales,
        totalOrders,
        averageOrderValue,
        paymentMethods,
        topProducts
      ] = await Promise.all([
        // Total sales
        prisma.orden.aggregate({
          where: {
            ord_fecha: {
              gte: startOfDay,
              lte: endOfDay
            },
            ord_estado: 'entregado',
            flg_del: 1
          },
          _sum: {
            ord_total: true,
            ord_impuesto: true,
            ord_cargoservicio: true,
            ord_propina: true
          }
        }),
        // Total orders
        prisma.orden.count({
          where: {
            ord_fecha: {
              gte: startOfDay,
              lte: endOfDay
            },
            ord_estado: 'entregado',
            flg_del: 1
          }
        }),
        // Average order value
        prisma.orden.aggregate({
          where: {
            ord_fecha: {
              gte: startOfDay,
              lte: endOfDay
            },
            ord_estado: 'entregado',
            flg_del: 1
          },
          _avg: {
            ord_total: true
          }
        }),
        // Payment methods breakdown
        prisma.orden.groupBy({
          by: ['ord_metodopago'],
          where: {
            ord_fecha: {
              gte: startOfDay,
              lte: endOfDay
            },
            ord_estado: 'entregado',
            flg_del: 1
          },
          _sum: {
            ord_total: true
          },
          _count: {
            ord_codigo: true
          }
        }),
        // Top products
        prisma.ordenProducto.groupBy({
          by: ['pla_codigo', 'beb_codigo'],
          where: {
            orden: {
              ord_fecha: {
                gte: startOfDay,
                lte: endOfDay
              },
              ord_estado: 'entregado',
              flg_del: 1
            },
            flg_del: 1
          },
          _sum: {
            orp_cantidad: true,
            orp_subtotal: true
          },
          orderBy: {
            _sum: {
              orp_cantidad: 'desc'
            }
          },
          take: 10
        })
      ]);

      const summary = {
        date: targetDate.format('YYYY-MM-DD'),
        totalSales: totalSales._sum.ord_total || 0,
        totalTax: totalSales._sum.ord_impuesto || 0,
        totalServiceCharge: totalSales._sum.ord_cargoservicio || 0,
        totalTips: totalSales._sum.ord_propina || 0,
        totalOrders,
        averageOrderValue: averageOrderValue._avg.ord_total || 0,
        paymentMethods: paymentMethods.map(pm => ({
          method: pm.ord_metodopago,
          total: pm._sum.ord_total || 0,
          count: pm._count.ord_codigo
        })),
        topProducts: topProducts.map(tp => ({
          product_id: tp.pla_codigo || tp.beb_codigo,
          type: tp.pla_codigo ? 'plato' : 'bebida',
          quantity: tp._sum.orp_cantidad || 0,
          revenue: tp._sum.orp_subtotal || 0
        }))
      };

      return {
        success: true,
        data: summary,
        message: 'Daily summary retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve daily summary', 500);
    }
  }

  /**
   * Get hourly sales summary
   */
  async getHourlySummary(fecha?: string): Promise<ApiResponse> {
    try {
      const targetDate = fecha ? moment(fecha) : moment();
      const startOfDay = targetDate.startOf('day').toDate();
      const endOfDay = targetDate.endOf('day').toDate();

      const hourlyData = await prisma.$queryRaw`
        SELECT 
          HOUR(ord_fecha) as hour,
          COUNT(*) as order_count,
          SUM(ord_total) as total_sales,
          AVG(ord_total) as avg_order_value
        FROM orden 
        WHERE ord_fecha >= ${startOfDay} 
          AND ord_fecha <= ${endOfDay}
          AND ord_estado = 'entregado'
          AND flg_del = 1
        GROUP BY HOUR(ord_fecha)
        ORDER BY hour
      `;

      return {
        success: true,
        data: {
          date: targetDate.format('YYYY-MM-DD'),
          hourlyData
        },
        message: 'Hourly summary retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve hourly summary', 500);
    }
  }

  /**
   * Get top selling products
   */
  async getTopProducts(fechaInicio?: string, fechaFin?: string, limit: number = 10): Promise<ApiResponse> {
    try {
      const whereClause: any = {
        orden: {
          ord_estado: 'entregado',
          flg_del: 1
        },
        flg_del: 1
      };

      if (fechaInicio && fechaFin) {
        whereClause.orden.ord_fecha = {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        };
      }

      const topProducts = await prisma.ordenProducto.groupBy({
        by: ['pla_codigo', 'beb_codigo'],
        where: whereClause,
        _sum: {
          orp_cantidad: true,
          orp_subtotal: true
        },
        orderBy: {
          _sum: {
            orp_cantidad: 'desc'
          }
        },
        take: limit
      });

      // Get product details
      const productDetails = await Promise.all(
        topProducts.map(async (tp) => {
          let product = null;
          if (tp.pla_codigo) {
            product = await prisma.plato.findUnique({
              where: { pla_codigo: tp.pla_codigo },
              select: { pla_nombre: true, pla_precio: true }
            });
          } else if (tp.beb_codigo) {
            product = await prisma.bebida.findUnique({
              where: { beb_codigo: tp.beb_codigo },
              select: { beb_nombre: true, beb_precio: true }
            });
          }

          return {
            product_id: tp.pla_codigo || tp.beb_codigo,
            type: tp.pla_codigo ? 'plato' : 'bebida',
            name: product?.pla_nombre || product?.beb_nombre || 'Unknown',
            price: product?.pla_precio || product?.beb_precio || 0,
            quantity: tp._sum.orp_cantidad || 0,
            revenue: tp._sum.orp_subtotal || 0
          };
        })
      );

      return {
        success: true,
        data: productDetails,
        message: 'Top products retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve top products', 500);
    }
  }

  /**
   * Get sales by payment method
   */
  async getSalesByPaymentMethod(fechaInicio?: string, fechaFin?: string): Promise<ApiResponse> {
    try {
      const whereClause: any = {
        ord_estado: 'entregado',
        flg_del: 1
      };

      if (fechaInicio && fechaFin) {
        whereClause.ord_fecha = {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        };
      }

      const paymentMethods = await prisma.orden.groupBy({
        by: ['ord_metodopago'],
        where: whereClause,
        _sum: {
          ord_total: true,
          ord_impuesto: true,
          ord_cargoservicio: true,
          ord_propina: true
        },
        _count: {
          ord_codigo: true
        }
      });

      return {
        success: true,
        data: paymentMethods.map(pm => ({
          method: pm.ord_metodopago,
          total: pm._sum.ord_total || 0,
          tax: pm._sum.ord_impuesto || 0,
          serviceCharge: pm._sum.ord_cargoservicio || 0,
          tips: pm._sum.ord_propina || 0,
          count: pm._count.ord_codigo
        })),
        message: 'Sales by payment method retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve sales by payment method', 500);
    }
  }

  /**
   * Get table performance metrics
   */
  async getTablePerformance(fechaInicio?: string, fechaFin?: string): Promise<ApiResponse> {
    try {
      const whereClause: any = {
        ord_estado: 'entregado',
        flg_del: 1
      };

      if (fechaInicio && fechaFin) {
        whereClause.ord_fecha = {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        };
      }

      const tablePerformance = await prisma.orden.groupBy({
        by: ['mesa_codigo'],
        where: whereClause,
        _sum: {
          ord_total: true
        },
        _count: {
          ord_codigo: true
        },
        _avg: {
          ord_total: true
        }
      });

      // Get table details
      const tableDetails = await Promise.all(
        tablePerformance.map(async (tp) => {
          const table = await prisma.mesa.findUnique({
            where: { mesa_codigo: tp.mesa_codigo },
            select: { mesa_nombre: true, mesa_capacidad: true }
          });

          return {
            mesa_codigo: tp.mesa_codigo,
            mesa_nombre: table?.mesa_nombre || 'Unknown',
            mesa_capacidad: table?.mesa_capacidad || 0,
            total_sales: tp._sum.ord_total || 0,
            order_count: tp._count.ord_codigo,
            average_order_value: tp._avg.ord_total || 0,
            revenue_per_seat: table?.mesa_capacidad ? (tp._sum.ord_total || 0) / table.mesa_capacidad : 0
          };
        })
      );

      return {
        success: true,
        data: tableDetails.sort((a, b) => b.total_sales - a.total_sales),
        message: 'Table performance retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve table performance', 500);
    }
  }
}
