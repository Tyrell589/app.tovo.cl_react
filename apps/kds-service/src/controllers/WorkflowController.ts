/**
 * @fileoverview Workflow controller for kitchen workflow management
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class WorkflowController {
  /**
   * Get workflow stations
   */
  async getWorkflowStations(): Promise<ApiResponse> {
    try {
      const stations = [
        {
          id: 'grill',
          name: 'Grill Station',
          description: 'Grilled items, meats, and hot dishes',
          capacity: parseInt(process.env.KITCHEN_STATION_CAPACITY || '10'),
          active_orders: 0,
          queue_length: 0,
          efficiency: 0
        },
        {
          id: 'salad',
          name: 'Salad Station',
          description: 'Salads, cold dishes, and appetizers',
          capacity: parseInt(process.env.KITCHEN_STATION_CAPACITY || '10'),
          active_orders: 0,
          queue_length: 0,
          efficiency: 0
        },
        {
          id: 'pizza',
          name: 'Pizza Station',
          description: 'Pizzas, pastas, and Italian dishes',
          capacity: parseInt(process.env.KITCHEN_STATION_CAPACITY || '10'),
          active_orders: 0,
          queue_length: 0,
          efficiency: 0
        },
        {
          id: 'dessert',
          name: 'Dessert Station',
          description: 'Desserts, sweets, and final preparations',
          capacity: parseInt(process.env.KITCHEN_STATION_CAPACITY || '10'),
          active_orders: 0,
          queue_length: 0,
          efficiency: 0
        },
        {
          id: 'beverage',
          name: 'Beverage Station',
          description: 'Drinks, beverages, and liquid preparations',
          capacity: parseInt(process.env.KITCHEN_STATION_CAPACITY || '10'),
          active_orders: 0,
          queue_length: 0,
          efficiency: 0
        }
      ];

      return {
        success: true,
        data: stations,
        message: 'Workflow stations retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve workflow stations', 500);
    }
  }

  /**
   * Get workflow queue
   */
  async getWorkflowQueue(station?: string, status?: string): Promise<ApiResponse> {
    try {
      const whereClause: any = { 
        flg_del: 1,
        ord_estado: { in: ['pendiente', 'en_proceso', 'listo'] }
      };

      if (status) {
        const statusMap: { [key: string]: string } = {
          'pending': 'pendiente',
          'in_progress': 'en_proceso',
          'ready': 'listo',
          'completed': 'entregado'
        };
        whereClause.ord_estado = statusMap[status] || status;
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

      const queue = {
        station: station || 'all',
        status: status || 'all',
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
            name: item.plato?.pla_nombre || item.bebida?.beb_nombre || 'Unknown',
            quantity: item.orp_cantidad,
            comment: item.orp_comentario
          })),
          total: order.ord_total,
          priority: this.calculateOrderPriority(order),
          estimated_completion: this.calculateEstimatedCompletion(order)
        })),
        last_updated: new Date().toISOString()
      };

      return {
        success: true,
        data: queue,
        message: 'Workflow queue retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve workflow queue', 500);
    }
  }

  /**
   * Assign order to station
   */
  async assignOrderToStation(
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

      if (order.ord_estado === 'entregado') {
        throw new CustomError('Order already delivered', 400);
      }

      // Update order status
      const updatedOrder = await prisma.orden.update({
        where: { ord_codigo: orderId },
        data: { ord_estado: 'en_proceso' }
      });

      return {
        success: true,
        data: {
          order_id: orderId,
          station: station,
          status: 'en_proceso',
          assigned_at: new Date().toISOString(),
          assigned_by: userId
        },
        message: 'Order assigned to station successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to assign order to station', 500);
    }
  }

  /**
   * Complete order at station
   */
  async completeOrderAtStation(
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
            `${order.ord_comentarios || ''}\nStation ${station}: ${notes}`.trim() : 
            order.ord_comentarios
        }
      });

      return {
        success: true,
        data: {
          order_id: orderId,
          station: station,
          status: 'listo',
          completed_at: new Date().toISOString(),
          completed_by: userId,
          notes: notes
        },
        message: 'Order completed at station successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to complete order at station', 500);
    }
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(period: string = 'day'): Promise<ApiResponse> {
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
        averageProcessingTime,
        stationEfficiency
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
        // Average processing time
        prisma.$queryRaw`
          SELECT 
            AVG(TIMESTAMPDIFF(MINUTE, ord_fecha, NOW())) as avg_processing_time
          FROM orden 
          WHERE ord_fecha >= ${startDate}
            AND flg_del = 1
            AND ord_estado = 'entregado'
        `,
        // Station efficiency
        this.calculateStationEfficiency(startDate)
      ]);

      const stats = {
        period: period,
        total_orders: totalOrders,
        completed_orders: completedOrders,
        pending_orders: totalOrders - completedOrders,
        completion_rate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
        average_processing_time_minutes: averageProcessingTime[0]?.avg_processing_time || 0,
        station_efficiency: stationEfficiency,
        generated_at: new Date().toISOString()
      };

      return {
        success: true,
        data: stats,
        message: 'Workflow statistics retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve workflow statistics', 500);
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
   * Calculate estimated completion time
   */
  private calculateEstimatedCompletion(order: any): Date {
    const baseTime = parseInt(process.env.KDS_PREPARATION_TIME_MINUTES || '20');
    const itemTime = order.ordenproducto.length * 2; // 2 minutes per item
    const totalMinutes = baseTime + itemTime;
    
    return new Date(Date.now() + totalMinutes * 60000);
  }

  /**
   * Calculate station efficiency
   */
  private async calculateStationEfficiency(startDate: Date): Promise<any[]> {
    const stations = ['grill', 'salad', 'pizza', 'dessert', 'beverage'];
    const efficiency = [];

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

      const completedOrders = stationOrders.filter(o => o.ord_estado === 'entregado');
      const efficiencyRate = stationOrders.length > 0 ? 
        (completedOrders.length / stationOrders.length) * 100 : 0;

      efficiency.push({
        station_id: station,
        total_orders: stationOrders.length,
        completed_orders: completedOrders.length,
        efficiency_rate: efficiencyRate,
        average_processing_time: 0 // Would be calculated from actual data
      });
    }

    return efficiency;
  }
}
