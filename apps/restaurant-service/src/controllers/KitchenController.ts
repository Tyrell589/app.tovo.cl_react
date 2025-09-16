/**
 * @fileoverview Kitchen controller for managing kitchen workflow and KDS
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse, 
  PaginatedResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class KitchenController {
  /**
   * Get kitchen display data
   */
  async getKitchenDisplay(): Promise<ApiResponse> {
    try {
      // Get pending orders
      const pendingOrders = await prisma.orden.findMany({
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

      // Get in-progress orders
      const inProgressOrders = await prisma.orden.findMany({
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

      // Get ready orders
      const readyOrders = await prisma.orden.findMany({
        where: {
          ord_estado: 'listo',
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

      // Get kitchen stations
      const stations = await prisma.cocina.findMany({
        where: { flg_del: 1 },
        include: {
          usuario: {
            select: {
              usu_codigo: true,
              usu_nombre: true,
              usu_apellidopat: true,
              usu_apellidomat: true
            }
          }
        },
        orderBy: { coc_nombre: 'asc' }
      });

      return {
        success: true,
        data: {
          pendingOrders,
          inProgressOrders,
          readyOrders,
          stations,
          summary: {
            pending: pendingOrders.length,
            inProgress: inProgressOrders.length,
            ready: readyOrders.length,
            total: pendingOrders.length + inProgressOrders.length + readyOrders.length
          }
        },
        message: 'Kitchen display data retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve kitchen display data', 500);
    }
  }

  /**
   * Get kitchen orders
   */
  async getKitchenOrders(
    status?: string, 
    cocinaCodigo?: number, 
    page: number = 1, 
    limit: number = 10
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { 
        flg_del: 1,
        ord_estado: { in: ['pendiente', 'en_proceso', 'listo'] }
      };
      
      if (status) {
        whereClause.ord_estado = status;
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
          skip,
          take: limit,
          orderBy: { ord_fecha: 'asc' }
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
        message: 'Kitchen orders retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve kitchen orders', 500);
    }
  }

  /**
   * Get kitchen order by ID
   */
  async getKitchenOrderById(id: number): Promise<ApiResponse> {
    try {
      const order = await prisma.orden.findUnique({
        where: { ord_codigo: id },
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
              },
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
        message: 'Kitchen order retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve kitchen order', 500);
    }
  }

  /**
   * Start order in kitchen
   */
  async startOrder(orderId: number, userId: number): Promise<ApiResponse> {
    try {
      const existingOrder = await prisma.orden.findUnique({
        where: { ord_codigo: orderId }
      });

      if (!existingOrder) {
        throw new CustomError('Order not found', 404);
      }

      if (existingOrder.ord_estado !== 'pendiente') {
        throw new CustomError('Only pending orders can be started', 400);
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
      throw new CustomError('Failed to start order', 500);
    }
  }

  /**
   * Complete order in kitchen
   */
  async completeOrder(orderId: number, userId: number): Promise<ApiResponse> {
    try {
      const existingOrder = await prisma.orden.findUnique({
        where: { ord_codigo: orderId }
      });

      if (!existingOrder) {
        throw new CustomError('Order not found', 404);
      }

      if (existingOrder.ord_estado !== 'en_proceso') {
        throw new CustomError('Only in-progress orders can be completed', 400);
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
      throw new CustomError('Failed to complete order', 500);
    }
  }

  /**
   * Pause order in kitchen
   */
  async pauseOrder(orderId: number, comentarios?: string, userId?: number): Promise<ApiResponse> {
    try {
      const existingOrder = await prisma.orden.findUnique({
        where: { ord_codigo: orderId }
      });

      if (!existingOrder) {
        throw new CustomError('Order not found', 404);
      }

      if (!['pendiente', 'en_proceso'].includes(existingOrder.ord_estado)) {
        throw new CustomError('Only pending or in-progress orders can be paused', 400);
      }

      const order = await prisma.orden.update({
        where: { ord_codigo: orderId },
        data: {
          ord_estado: 'pausado',
          ord_comentarios: comentarios || existingOrder.ord_comentarios,
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
        message: 'Order paused successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to pause order', 500);
    }
  }

  /**
   * Get kitchen stations
   */
  async getKitchenStations(): Promise<ApiResponse> {
    try {
      const stations = await prisma.cocina.findMany({
        where: { flg_del: 1 },
        include: {
          usuario: {
            select: {
              usu_codigo: true,
              usu_nombre: true,
              usu_apellidopat: true,
              usu_apellidomat: true
            }
          }
        },
        orderBy: { coc_nombre: 'asc' }
      });

      return {
        success: true,
        data: stations,
        message: 'Kitchen stations retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve kitchen stations', 500);
    }
  }

  /**
   * Get kitchen station by ID
   */
  async getKitchenStationById(id: number): Promise<ApiResponse> {
    try {
      const station = await prisma.cocina.findUnique({
        where: { coc_codigo: id },
        include: {
          usuario: {
            select: {
              usu_codigo: true,
              usu_nombre: true,
              usu_apellidopat: true,
              usu_apellidomat: true
            }
          }
        }
      });

      if (!station || station.flg_del !== 1) {
        throw new CustomError('Kitchen station not found', 404);
      }

      return {
        success: true,
        data: station,
        message: 'Kitchen station retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve kitchen station', 500);
    }
  }

  /**
   * Assign user to kitchen station
   */
  async assignUserToStation(stationId: number, userId: number): Promise<ApiResponse> {
    try {
      // Verify station exists
      const station = await prisma.cocina.findUnique({
        where: { coc_codigo: stationId }
      });

      if (!station) {
        throw new CustomError('Kitchen station not found', 404);
      }

      // Verify user exists
      const user = await prisma.usuario.findUnique({
        where: { usu_codigo: userId }
      });

      if (!user) {
        throw new CustomError('User not found', 404);
      }

      const updatedStation = await prisma.cocina.update({
        where: { coc_codigo: stationId },
        data: { usu_codigo: userId },
        include: {
          usuario: {
            select: {
              usu_codigo: true,
              usu_nombre: true,
              usu_apellidopat: true,
              usu_apellidomat: true
            }
          }
        }
      });

      return {
        success: true,
        data: updatedStation,
        message: 'User assigned to kitchen station successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to assign user to station', 500);
    }
  }

  /**
   * Get kitchen statistics
   */
  async getKitchenStats(fechaInicio?: string, fechaFin?: string): Promise<ApiResponse> {
    try {
      const whereClause: any = { flg_del: 1 };
      
      if (fechaInicio && fechaFin) {
        whereClause.ord_fecha = {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        };
      } else {
        // Default to today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        whereClause.ord_fecha = {
          gte: today,
          lt: tomorrow
        };
      }

      const [
        totalOrders,
        pendingOrders,
        inProgressOrders,
        completedOrders,
        cancelledOrders,
        averagePrepTime
      ] = await Promise.all([
        prisma.orden.count({
          where: whereClause
        }),
        prisma.orden.count({
          where: { ...whereClause, ord_estado: 'pendiente' }
        }),
        prisma.orden.count({
          where: { ...whereClause, ord_estado: 'en_proceso' }
        }),
        prisma.orden.count({
          where: { ...whereClause, ord_estado: 'listo' }
        }),
        prisma.orden.count({
          where: { ...whereClause, ord_estado: 'cancelado' }
        }),
        // This would need to be calculated based on actual prep times
        // For now, we'll return a placeholder
        Promise.resolve(0)
      ]);

      const stats = {
        totalOrders,
        pendingOrders,
        inProgressOrders,
        completedOrders,
        cancelledOrders,
        averagePrepTime,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
        cancellationRate: totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0
      };

      return {
        success: true,
        data: stats,
        message: 'Kitchen statistics retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve kitchen statistics', 500);
    }
  }

  /**
   * Get kitchen queue status
   */
  async getKitchenQueue(): Promise<ApiResponse> {
    try {
      const [pendingCount, inProgressCount, readyCount] = await Promise.all([
        prisma.orden.count({
          where: {
            ord_estado: 'pendiente',
            flg_del: 1
          }
        }),
        prisma.orden.count({
          where: {
            ord_estado: 'en_proceso',
            flg_del: 1
          }
        }),
        prisma.orden.count({
          where: {
            ord_estado: 'listo',
            flg_del: 1
          }
        })
      ]);

      const queue = {
        pending: pendingCount,
        inProgress: inProgressCount,
        ready: readyCount,
        total: pendingCount + inProgressCount + readyCount,
        estimatedWaitTime: pendingCount * 15 // 15 minutes per order estimate
      };

      return {
        success: true,
        data: queue,
        message: 'Kitchen queue status retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve kitchen queue status', 500);
    }
  }
}
