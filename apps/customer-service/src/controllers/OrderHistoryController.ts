/**
 * @fileoverview Order history controller for customer order tracking
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse, 
  PaginatedResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class OrderHistoryController {
  /**
   * Get customer order history
   */
  async getCustomerOrderHistory(
    customerId: number,
    page: number = 1, 
    limit: number = 10, 
    estado?: string, 
    fechaInicio?: string, 
    fechaFin?: string
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { 
        cli_codigo: customerId,
        flg_del: 1 
      };
      
      if (estado) {
        whereClause.ord_estado = estado;
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
        message: 'Order history retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve order history', 500);
    }
  }

  /**
   * Get specific order details
   */
  async getOrderDetails(customerId: number, orderId: number): Promise<ApiResponse> {
    try {
      const order = await prisma.orden.findFirst({
        where: { 
          ord_codigo: orderId,
          cli_codigo: customerId,
          flg_del: 1
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

      if (!order) {
        throw new CustomError('Order not found', 404);
      }

      return {
        success: true,
        data: order,
        message: 'Order details retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve order details', 500);
    }
  }

  /**
   * Get customer order statistics
   */
  async getCustomerOrderStats(customerId: number): Promise<ApiResponse> {
    try {
      const [
        totalOrders,
        totalSpent,
        averageOrderValue,
        orderStatusCounts,
        monthlyStats
      ] = await Promise.all([
        // Total orders
        prisma.orden.count({
          where: {
            cli_codigo: customerId,
            flg_del: 1
          }
        }),
        // Total spent
        prisma.orden.aggregate({
          where: {
            cli_codigo: customerId,
            flg_del: 1
          },
          _sum: {
            ord_total: true
          }
        }),
        // Average order value
        prisma.orden.aggregate({
          where: {
            cli_codigo: customerId,
            flg_del: 1
          },
          _avg: {
            ord_total: true
          }
        }),
        // Order status counts
        prisma.orden.groupBy({
          by: ['ord_estado'],
          where: {
            cli_codigo: customerId,
            flg_del: 1
          },
          _count: {
            ord_codigo: true
          }
        }),
        // Monthly stats for last 6 months
        prisma.$queryRaw`
          SELECT 
            DATE_FORMAT(ord_fecha, '%Y-%m') as month,
            COUNT(*) as order_count,
            SUM(ord_total) as total_spent
          FROM orden 
          WHERE cli_codigo = ${customerId} 
            AND flg_del = 1
            AND ord_fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
          GROUP BY DATE_FORMAT(ord_fecha, '%Y-%m')
          ORDER BY month DESC
        `
      ]);

      const stats = {
        total_orders: totalOrders,
        total_spent: totalSpent._sum.ord_total || 0,
        average_order_value: averageOrderValue._avg.ord_total || 0,
        order_status_counts: orderStatusCounts.reduce((acc, status) => {
          acc[status.ord_estado] = status._count.ord_codigo;
          return acc;
        }, {} as Record<string, number>),
        monthly_stats: monthlyStats
      };

      return {
        success: true,
        data: stats,
        message: 'Order statistics retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve order statistics', 500);
    }
  }

  /**
   * Get customer favorite products
   */
  async getCustomerFavorites(customerId: number, limit: number = 10): Promise<ApiResponse> {
    try {
      const favoriteProducts = await prisma.ordenProducto.groupBy({
        by: ['pla_codigo', 'beb_codigo'],
        where: {
          orden: {
            cli_codigo: customerId,
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
        take: limit
      });

      // Get product details
      const productDetails = await Promise.all(
        favoriteProducts.map(async (fp) => {
          let product = null;
          if (fp.pla_codigo) {
            product = await prisma.plato.findUnique({
              where: { pla_codigo: fp.pla_codigo },
              select: { 
                pla_nombre: true, 
                pla_precio: true,
                categoria: {
                  select: { cat_nombre: true }
                }
              }
            });
          } else if (fp.beb_codigo) {
            product = await prisma.bebida.findUnique({
              where: { beb_codigo: fp.beb_codigo },
              select: { 
                beb_nombre: true, 
                beb_precio: true,
                categoria: {
                  select: { cbe_nombre: true }
                }
              }
            });
          }

          return {
            product_id: fp.pla_codigo || fp.beb_codigo,
            type: fp.pla_codigo ? 'plato' : 'bebida',
            name: product?.pla_nombre || product?.beb_nombre || 'Unknown',
            price: product?.pla_precio || product?.beb_precio || 0,
            category: product?.categoria?.cat_nombre || product?.categoria?.cbe_nombre || 'Unknown',
            times_ordered: fp._sum.orp_cantidad || 0,
            total_spent: fp._sum.orp_subtotal || 0
          };
        })
      );

      return {
        success: true,
        data: productDetails,
        message: 'Favorite products retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve favorite products', 500);
    }
  }

  /**
   * Get recent orders
   */
  async getRecentOrders(customerId: number, limit: number = 5): Promise<ApiResponse> {
    try {
      const recentOrders = await prisma.orden.findMany({
        where: {
          cli_codigo: customerId,
          flg_del: 1
        },
        include: {
          mesa: {
            select: {
              mesa_nombre: true
            }
          },
          ordenproducto: {
            include: {
              plato: {
                select: {
                  pla_nombre: true
                }
              },
              bebida: {
                select: {
                  beb_nombre: true
                }
              }
            },
            take: 3
          }
        },
        orderBy: { ord_fecha: 'desc' },
        take: limit
      });

      return {
        success: true,
        data: recentOrders,
        message: 'Recent orders retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve recent orders', 500);
    }
  }

  /**
   * Get all orders (Admin)
   */
  async getAllOrders(
    page: number = 1, 
    limit: number = 10, 
    customerId?: number, 
    estado?: string, 
    fechaInicio?: string, 
    fechaFin?: string
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { flg_del: 1 };
      
      if (customerId) {
        whereClause.cli_codigo = customerId;
      }
      
      if (estado) {
        whereClause.ord_estado = estado;
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
            cliente: {
              select: {
                cli_codigo: true,
                cli_nombre: true,
                cli_apellidopat: true,
                cli_email: true,
                cli_telefono: true
              }
            },
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
        message: 'All orders retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve all orders', 500);
    }
  }
}
