/**
 * @fileoverview KDS controller for kitchen display system
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';
import { SocketManager } from '../services/SocketManager';
import { PrinterService } from '../services/PrinterService';

export class KDSController {
  private socketManager: SocketManager;
  private printerService: PrinterService;

  constructor() {
    this.socketManager = new SocketManager(null as any); // Will be injected
    this.printerService = new PrinterService();
  }

  /**
   * Get kitchen display data
   */
  async getKitchenDisplay(
    kitchenId?: number, 
    station?: string, 
    status?: string
  ): Promise<ApiResponse> {
    try {
      const whereClause: any = { 
        flg_del: 1,
        ord_estado: { in: ['pendiente', 'en_proceso', 'listo'] }
      };

      if (status) {
        whereClause.ord_estado = status;
      }

      const orders = await prisma.orden.findMany({
        where: whereClause,
        include: {
          cliente: {
            select: {
              cli_nombre: true,
              cli_apellidopat: true,
              cli_telefono: true
            }
          },
          mesa: {
            select: {
              mesa_nombre: true,
              mesa_capacidad: true
            }
          },
          ordenproducto: {
            include: {
              plato: {
                select: {
                  pla_nombre: true,
                  pla_descripcion: true,
                  categoria: {
                    select: {
                      cat_nombre: true
                    }
                  }
                }
              },
              bebida: {
                select: {
                  beb_nombre: true,
                  beb_descripcion: true,
                  categoria: {
                    select: {
                      cbe_nombre: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { ord_fecha: 'asc' },
        take: 50
      });

      // Filter by station if specified
      let filteredOrders = orders;
      if (station) {
        filteredOrders = orders.filter(order => 
          order.ordenproducto.some(item => 
            this.belongsToStation(item, station)
          )
        );
      }

      const displayData = {
        kitchen_id: kitchenId || 1,
        station: station || 'all',
        total_orders: filteredOrders.length,
        orders: filteredOrders.map(order => ({
          order_id: order.ord_codigo,
          table: order.mesa?.mesa_nombre || 'N/A',
          customer: order.cliente ? 
            `${order.cliente.cli_nombre} ${order.cliente.cli_apellidopat}` : 
            'N/A',
          status: order.ord_estado,
          created_at: order.ord_fecha,
          items: order.ordenproducto.map(item => ({
            id: item.orp_codigo,
            name: item.plato?.pla_nombre || item.bebida?.beb_nombre || 'Unknown',
            type: item.plato ? 'plato' : 'bebida',
            quantity: item.orp_cantidad,
            price: item.orp_precio,
            comment: item.orp_comentario,
            category: item.plato?.categoria?.cat_nombre || 
                     item.bebida?.categoria?.cbe_nombre || 'N/A'
          })),
          total: order.ord_total,
          preparation_time: this.calculatePreparationTime(order.ordenproducto),
          priority: this.calculateOrderPriority(order)
        })),
        last_updated: new Date().toISOString()
      };

      return {
        success: true,
        data: displayData,
        message: 'Kitchen display data retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve kitchen display data', 500);
    }
  }

  /**
   * Get active orders for kitchen
   */
  async getActiveOrders(
    kitchenId?: number, 
    station?: string, 
    limit: number = 20
  ): Promise<ApiResponse> {
    try {
      const whereClause: any = { 
        flg_del: 1,
        ord_estado: { in: ['pendiente', 'en_proceso'] }
      };

      const orders = await prisma.orden.findMany({
        where: whereClause,
        include: {
          cliente: {
            select: {
              cli_nombre: true,
              cli_apellidopat: true,
              cli_telefono: true
            }
          },
          mesa: {
            select: {
              mesa_nombre: true
            }
          },
          ordenproducto: {
            include: {
              plato: true,
              bebida: true
            }
          }
        },
        orderBy: { ord_fecha: 'asc' },
        take: limit
      });

      // Filter by station if specified
      let filteredOrders = orders;
      if (station) {
        filteredOrders = orders.filter(order => 
          order.ordenproducto.some(item => 
            this.belongsToStation(item, station)
          )
        );
      }

      return {
        success: true,
        data: {
          orders: filteredOrders.map(order => ({
            order_id: order.ord_codigo,
            table: order.mesa?.mesa_nombre || 'N/A',
            customer: order.cliente ? 
              `${order.cliente.cli_nombre} ${order.cliente.cli_apellidopat}` : 
              'N/A',
            status: order.ord_estado,
            created_at: order.ord_fecha,
            items_count: order.ordenproducto.length,
            total: order.ord_total,
            preparation_time: this.calculatePreparationTime(order.ordenproducto),
            priority: this.calculateOrderPriority(order)
          })),
          total: filteredOrders.length
        },
        message: 'Active orders retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve active orders', 500);
    }
  }

  /**
   * Get specific order details
   */
  async getOrderDetails(orderId: number): Promise<ApiResponse> {
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
          mesa: {
            select: {
              mesa_nombre: true,
              mesa_capacidad: true
            }
          },
          ordenproducto: {
            include: {
              plato: {
                include: {
                  categoria: true
                }
              },
              bebida: {
                include: {
                  categoria: true
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
        data: {
          order_id: order.ord_codigo,
          table: order.mesa?.mesa_nombre || 'N/A',
          customer: order.cliente ? {
            name: `${order.cliente.cli_nombre} ${order.cliente.cli_apellidopat}`,
            phone: order.cliente.cli_telefono,
            email: order.cliente.cli_email
          } : null,
          status: order.ord_estado,
          created_at: order.ord_fecha,
          total: order.ord_total,
          items: order.ordenproducto.map(item => ({
            id: item.orp_codigo,
            name: item.plato?.pla_nombre || item.bebida?.beb_nombre || 'Unknown',
            type: item.plato ? 'plato' : 'bebida',
            quantity: item.orp_cantidad,
            price: item.orp_precio,
            subtotal: item.orp_subtotal,
            comment: item.orp_comentario,
            category: item.plato?.categoria?.cat_nombre || 
                     item.bebida?.categoria?.cbe_nombre || 'N/A',
            additions: item.adiciones?.map(add => ({
              name: add.ingrediente.ing_nombre,
              quantity: add.adi_cantidad,
              cost: add.adi_costo
            })) || []
          })),
          preparation_time: this.calculatePreparationTime(order.ordenproducto),
          priority: this.calculateOrderPriority(order)
        },
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
   * Start order preparation
   */
  async startOrderPreparation(
    orderId: number, 
    station: string, 
    userId?: number
  ): Promise<ApiResponse> {
    try {
      const order = await prisma.orden.findUnique({
        where: { ord_codigo: orderId }
      });

      if (!order || order.flg_del !== 1) {
        throw new CustomError('Order not found', 404);
      }

      if (order.ord_estado === 'listo') {
        throw new CustomError('Order already completed', 400);
      }

      // Update order status
      const updatedOrder = await prisma.orden.update({
        where: { ord_codigo: orderId },
        data: { ord_estado: 'en_proceso' }
      });

      // Print kitchen ticket
      await this.printerService.printKitchenTicket(order, station);

      // Emit real-time update
      this.socketManager.emitOrderStatusUpdate(orderId, 'en_proceso', station);

      return {
        success: true,
        data: {
          order_id: orderId,
          status: 'en_proceso',
          station: station,
          started_at: new Date().toISOString(),
          started_by: userId
        },
        message: 'Order preparation started successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to start order preparation', 500);
    }
  }

  /**
   * Complete order preparation
   */
  async completeOrderPreparation(
    orderId: number, 
    station: string, 
    userId?: number, 
    notes?: string
  ): Promise<ApiResponse> {
    try {
      const order = await prisma.orden.findUnique({
        where: { ord_codigo: orderId }
      });

      if (!order || order.flg_del !== 1) {
        throw new CustomError('Order not found', 404);
      }

      if (order.ord_estado === 'entregado') {
        throw new CustomError('Order already delivered', 400);
      }

      // Update order status
      const updatedOrder = await prisma.orden.update({
        where: { ord_codigo: orderId },
        data: { 
          ord_estado: 'listo',
          ord_comentarios: notes ? 
            `${order.ord_comentarios || ''}\nKitchen Notes: ${notes}`.trim() : 
            order.ord_comentarios
        }
      });

      // Print receipt
      await this.printerService.printReceipt(order);

      // Emit real-time update
      this.socketManager.emitOrderStatusUpdate(orderId, 'listo', station);

      return {
        success: true,
        data: {
          order_id: orderId,
          status: 'listo',
          station: station,
          completed_at: new Date().toISOString(),
          completed_by: userId,
          notes: notes
        },
        message: 'Order preparation completed successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to complete order preparation', 500);
    }
  }

  /**
   * Get kitchen stations
   */
  async getKitchenStations(): Promise<ApiResponse> {
    try {
      const stations = [
        {
          id: 'grill',
          name: 'Grill Station',
          description: 'Grilled items, meats, and hot dishes',
          capacity: parseInt(process.env.KITCHEN_STATION_CAPACITY || '10'),
          active_orders: 0 // Would be calculated from actual data
        },
        {
          id: 'salad',
          name: 'Salad Station',
          description: 'Salads, cold dishes, and appetizers',
          capacity: parseInt(process.env.KITCHEN_STATION_CAPACITY || '10'),
          active_orders: 0
        },
        {
          id: 'pizza',
          name: 'Pizza Station',
          description: 'Pizzas, pastas, and Italian dishes',
          capacity: parseInt(process.env.KITCHEN_STATION_CAPACITY || '10'),
          active_orders: 0
        },
        {
          id: 'dessert',
          name: 'Dessert Station',
          description: 'Desserts, sweets, and final preparations',
          capacity: parseInt(process.env.KITCHEN_STATION_CAPACITY || '10'),
          active_orders: 0
        },
        {
          id: 'beverage',
          name: 'Beverage Station',
          description: 'Drinks, beverages, and liquid preparations',
          capacity: parseInt(process.env.KITCHEN_STATION_CAPACITY || '10'),
          active_orders: 0
        }
      ];

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
   * Get orders for specific station
   */
  async getStationOrders(stationId: string, limit: number = 20): Promise<ApiResponse> {
    try {
      const whereClause: any = { 
        flg_del: 1,
        ord_estado: { in: ['pendiente', 'en_proceso'] }
      };

      const orders = await prisma.orden.findMany({
        where: whereClause,
        include: {
          cliente: {
            select: {
              cli_nombre: true,
              cli_apellidopat: true
            }
          },
          mesa: {
            select: {
              mesa_nombre: true
            }
          },
          ordenproducto: {
            include: {
              plato: true,
              bebida: true
            }
          }
        },
        orderBy: { ord_fecha: 'asc' },
        take: limit
      });

      // Filter orders for this station
      const stationOrders = orders.filter(order => 
        order.ordenproducto.some(item => 
          this.belongsToStation(item, stationId)
        )
      );

      return {
        success: true,
        data: {
          station_id: stationId,
          orders: stationOrders.map(order => ({
            order_id: order.ord_codigo,
            table: order.mesa?.mesa_nombre || 'N/A',
            customer: order.cliente ? 
              `${order.cliente.cli_nombre} ${order.cliente.cli_apellidopat}` : 
              'N/A',
            status: order.ord_estado,
            created_at: order.ord_fecha,
            items: order.ordenproducto.filter(item => 
              this.belongsToStation(item, stationId)
            ).map(item => ({
              name: item.plato?.pla_nombre || item.bebida?.beb_nombre || 'Unknown',
              quantity: item.orp_cantidad,
              comment: item.orp_comentario
            })),
            total: order.ord_total
          })),
          total: stationOrders.length
        },
        message: 'Station orders retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve station orders', 500);
    }
  }

  /**
   * Get kitchen statistics
   */
  async getKitchenStats(period: string = 'day'): Promise<ApiResponse> {
    try {
      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'hour':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const [
        totalOrders,
        completedOrders,
        averagePreparationTime,
        stationStats
      ] = await Promise.all([
        // Total orders in period
        prisma.orden.count({
          where: {
            ord_fecha: { gte: startDate },
            flg_del: 1
          }
        }),
        // Completed orders in period
        prisma.orden.count({
          where: {
            ord_fecha: { gte: startDate },
            ord_estado: 'entregado',
            flg_del: 1
          }
        }),
        // Average preparation time (simplified)
        prisma.$queryRaw`
          SELECT 
            AVG(TIMESTAMPDIFF(MINUTE, ord_fecha, NOW())) as avg_prep_time
          FROM orden 
          WHERE ord_fecha >= ${startDate}
            AND flg_del = 1
            AND ord_estado = 'entregado'
        `,
        // Station statistics
        this.getStationStatistics(startDate)
      ]);

      const stats = {
        period: period,
        total_orders: totalOrders,
        completed_orders: completedOrders,
        pending_orders: totalOrders - completedOrders,
        completion_rate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
        average_preparation_time_minutes: averagePreparationTime[0]?.avg_prep_time || 0,
        station_stats: stationStats,
        generated_at: new Date().toISOString()
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
   * Check if order item belongs to station
   */
  private belongsToStation(item: any, station: string): boolean {
    const productName = (item.plato?.pla_nombre || item.bebida?.beb_nombre || '').toLowerCase();
    const categoryName = (item.plato?.categoria?.cat_nombre || 
                         item.bebida?.categoria?.cbe_nombre || '').toLowerCase();

    const stationKeywords: { [key: string]: string[] } = {
      grill: ['hamburguesa', 'pollo', 'carne', 'pescado', 'grill', 'parrilla'],
      salad: ['ensalada', 'verdura', 'vegetal', 'salad'],
      pizza: ['pizza', 'pasta', 'italiana'],
      dessert: ['postre', 'helado', 'torta', 'flan', 'dulce'],
      beverage: ['bebida', 'jugo', 'agua', 'coca', 'cerveza', 'refresco']
    };

    const keywords = stationKeywords[station.toLowerCase()] || [];
    return keywords.some(keyword => 
      productName.includes(keyword) || categoryName.includes(keyword)
    );
  }

  /**
   * Calculate preparation time for order
   */
  private calculatePreparationTime(items: any[]): number {
    const baseTime = parseInt(process.env.KDS_PREPARATION_TIME_MINUTES || '20');
    const itemTime = items.length * 2; // 2 minutes per item
    return baseTime + itemTime;
  }

  /**
   * Calculate order priority
   */
  private calculateOrderPriority(order: any): 'low' | 'medium' | 'high' | 'urgent' {
    const now = new Date();
    const orderTime = new Date(order.ord_fecha);
    const minutesSinceOrder = (now.getTime() - orderTime.getTime()) / (1000 * 60);

    if (minutesSinceOrder > 30) return 'urgent';
    if (minutesSinceOrder > 20) return 'high';
    if (minutesSinceOrder > 10) return 'medium';
    return 'low';
  }

  /**
   * Get station statistics
   */
  private async getStationStatistics(startDate: Date): Promise<any[]> {
    const stations = ['grill', 'salad', 'pizza', 'dessert', 'beverage'];
    const stats = [];

    for (const station of stations) {
      const stationOrders = await prisma.orden.findMany({
        where: {
          ord_fecha: { gte: startDate },
          flg_del: 1,
          ordenproducto: {
            some: {
              OR: [
                { plato: { pla_nombre: { contains: station } } },
                { bebida: { beb_nombre: { contains: station } } }
              ]
            }
          }
        }
      });

      stats.push({
        station_id: station,
        total_orders: stationOrders.length,
        completed_orders: stationOrders.filter(o => o.ord_estado === 'entregado').length,
        pending_orders: stationOrders.filter(o => o.ord_estado !== 'entregado').length
      });
    }

    return stats;
  }
}
