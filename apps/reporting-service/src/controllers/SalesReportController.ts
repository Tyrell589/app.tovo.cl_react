/**
 * @fileoverview Sales report controller
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class SalesReportController {
  /**
   * Get sales summary
   */
  async getSalesSummary(
    startDate?: Date, 
    endDate?: Date, 
    period: string = 'day'
  ): Promise<ApiResponse> {
    try {
      // Set default date range if not provided
      if (!startDate) {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
      }
      if (!endDate) {
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
      }

      const whereClause = {
        ord_fecha: {
          gte: startDate,
          lte: endDate
        },
        flg_del: 1
      };

      const [
        totalOrders,
        completedOrders,
        totalRevenue,
        averageOrderValue,
        ordersByStatus,
        revenueByHour
      ] = await Promise.all([
        // Total orders
        prisma.orden.count({ where: whereClause }),
        // Completed orders
        prisma.orden.count({ 
          where: { ...whereClause, ord_estado: 'entregado' } 
        }),
        // Total revenue
        prisma.orden.aggregate({
          where: whereClause,
          _sum: { ord_total: true }
        }),
        // Average order value
        prisma.orden.aggregate({
          where: whereClause,
          _avg: { ord_total: true }
        }),
        // Orders by status
        prisma.orden.groupBy({
          by: ['ord_estado'],
          where: whereClause,
          _count: { ord_codigo: true }
        }),
        // Revenue by hour
        this.getRevenueByHour(startDate, endDate)
      ]);

      const summary = {
        period: period,
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        total_orders: totalOrders,
        completed_orders: completedOrders,
        pending_orders: totalOrders - completedOrders,
        completion_rate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
        total_revenue: Number(totalRevenue._sum.ord_total || 0),
        average_order_value: Number(totalRevenue._avg.ord_total || 0),
        orders_by_status: ordersByStatus.map(status => ({
          status: status.ord_estado,
          count: status._count.ord_codigo
        })),
        revenue_by_hour: revenueByHour,
        generated_at: new Date().toISOString()
      };

      return {
        success: true,
        data: summary,
        message: 'Sales summary retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve sales summary', 500);
    }
  }

  /**
   * Get daily sales report
   */
  async getDailySalesReport(date: Date): Promise<ApiResponse> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const whereClause = {
        ord_fecha: {
          gte: startOfDay,
          lte: endOfDay
        },
        flg_del: 1
      };

      const [
        orders,
        revenue,
        topProducts,
        hourlyBreakdown
      ] = await Promise.all([
        // Orders with details
        prisma.orden.findMany({
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
          orderBy: { ord_fecha: 'asc' }
        }),
        // Revenue calculation
        prisma.orden.aggregate({
          where: whereClause,
          _sum: { ord_total: true }
        }),
        // Top products
        this.getTopProducts(startOfDay, endOfDay),
        // Hourly breakdown
        this.getHourlyBreakdown(startOfDay, endOfDay)
      ]);

      const report = {
        date: date.toISOString().split('T')[0],
        total_orders: orders.length,
        total_revenue: Number(revenue._sum.ord_total || 0),
        average_order_value: orders.length > 0 ? 
          Number(revenue._sum.ord_total || 0) / orders.length : 0,
        orders: orders.map(order => ({
          order_id: order.ord_codigo,
          table: order.mesa?.mesa_nombre || 'N/A',
          customer: order.cliente ? 
            `${order.cliente.cli_nombre} ${order.cliente.cli_apellidopat}` : 
            'N/A',
          status: order.ord_estado,
          total: order.ord_total,
          created_at: order.ord_fecha,
          items_count: order.ordenproducto.length
        })),
        top_products: topProducts,
        hourly_breakdown: hourlyBreakdown,
        generated_at: new Date().toISOString()
      };

      return {
        success: true,
        data: report,
        message: 'Daily sales report retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve daily sales report', 500);
    }
  }

  /**
   * Get weekly sales report
   */
  async getWeeklySalesReport(weekStart?: Date): Promise<ApiResponse> {
    try {
      if (!weekStart) {
        weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
      }

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const whereClause = {
        ord_fecha: {
          gte: weekStart,
          lte: weekEnd
        },
        flg_del: 1
      };

      const [
        dailyBreakdown,
        totalRevenue,
        topProducts,
        weeklyTrends
      ] = await Promise.all([
        // Daily breakdown
        this.getDailyBreakdown(weekStart, weekEnd),
        // Total revenue
        prisma.orden.aggregate({
          where: whereClause,
          _sum: { ord_total: true }
        }),
        // Top products for the week
        this.getTopProducts(weekStart, weekEnd),
        // Weekly trends
        this.getWeeklyTrends(weekStart, weekEnd)
      ]);

      const report = {
        week_start: weekStart.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0],
        total_revenue: Number(totalRevenue._sum.ord_total || 0),
        daily_breakdown: dailyBreakdown,
        top_products: topProducts,
        weekly_trends: weeklyTrends,
        generated_at: new Date().toISOString()
      };

      return {
        success: true,
        data: report,
        message: 'Weekly sales report retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve weekly sales report', 500);
    }
  }

  /**
   * Get monthly sales report
   */
  async getMonthlySalesReport(month?: string): Promise<ApiResponse> {
    try {
      let startDate: Date;
      let endDate: Date;

      if (month) {
        const [year, monthNum] = month.split('-').map(Number);
        startDate = new Date(year, monthNum - 1, 1);
        endDate = new Date(year, monthNum, 0);
      } else {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const whereClause = {
        ord_fecha: {
          gte: startDate,
          lte: endDate
        },
        flg_del: 1
      };

      const [
        monthlyStats,
        dailyBreakdown,
        topProducts,
        categoryBreakdown
      ] = await Promise.all([
        // Monthly statistics
        prisma.orden.aggregate({
          where: whereClause,
          _count: { ord_codigo: true },
          _sum: { ord_total: true },
          _avg: { ord_total: true }
        }),
        // Daily breakdown
        this.getDailyBreakdown(startDate, endDate),
        // Top products
        this.getTopProducts(startDate, endDate),
        // Category breakdown
        this.getCategoryBreakdown(startDate, endDate)
      ]);

      const report = {
        month: month || `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
        total_orders: monthlyStats._count.ord_codigo,
        total_revenue: Number(monthlyStats._sum.ord_total || 0),
        average_order_value: Number(monthlyStats._avg.ord_total || 0),
        daily_breakdown: dailyBreakdown,
        top_products: topProducts,
        category_breakdown: categoryBreakdown,
        generated_at: new Date().toISOString()
      };

      return {
        success: true,
        data: report,
        message: 'Monthly sales report retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve monthly sales report', 500);
    }
  }

  /**
   * Get product sales report
   */
  async getProductSalesReport(
    startDate?: Date, 
    endDate?: Date, 
    limit: number = 20
  ): Promise<ApiResponse> {
    try {
      if (!startDate) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
      }
      if (!endDate) {
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
      }

      const whereClause = {
        ord_fecha: {
          gte: startDate,
          lte: endDate
        },
        flg_del: 1
      };

      const orders = await prisma.orden.findMany({
        where: whereClause,
        include: {
          ordenproducto: {
            include: {
              plato: true,
              bebida: true
            }
          }
        }
      });

      const productSales: { [key: string]: any } = {};

      orders.forEach(order => {
        order.ordenproducto.forEach(item => {
          const productName = item.plato?.pla_nombre || item.bebida?.beb_nombre || 'Unknown';
          const productType = item.plato ? 'plato' : 'bebida';
          const productKey = `${productName}_${productType}`;

          if (!productSales[productKey]) {
            productSales[productKey] = {
              name: productName,
              type: productType,
              total_quantity: 0,
              total_revenue: 0,
              order_count: 0,
              average_price: 0
            };
          }

          productSales[productKey].total_quantity += item.orp_cantidad;
          productSales[productKey].total_revenue += Number(item.orp_subtotal);
          productSales[productKey].order_count += 1;
        });
      });

      const productReport = Object.values(productSales)
        .map((product: any) => ({
          ...product,
          average_price: product.total_quantity > 0 ? 
            product.total_revenue / product.total_quantity : 0
        }))
        .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
        .slice(0, limit);

      return {
        success: true,
        data: {
          date_range: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          },
          products: productReport,
          total_products: Object.keys(productSales).length
        },
        message: 'Product sales report retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve product sales report', 500);
    }
  }

  /**
   * Get sales trends
   */
  async getSalesTrends(period: string = 'day', days: number = 30): Promise<ApiResponse> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trends = await this.calculateTrends(startDate, endDate, period);

      return {
        success: true,
        data: {
          period: period,
          days: days,
          trends: trends,
          generated_at: new Date().toISOString()
        },
        message: 'Sales trends retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve sales trends', 500);
    }
  }

  /**
   * Get revenue by hour
   */
  private async getRevenueByHour(startDate: Date, endDate: Date): Promise<any[]> {
    const hourlyRevenue: { [key: number]: number } = {};

    for (let hour = 0; hour < 24; hour++) {
      hourlyRevenue[hour] = 0;
    }

    const orders = await prisma.orden.findMany({
      where: {
        ord_fecha: {
          gte: startDate,
          lte: endDate
        },
        flg_del: 1
      },
      select: {
        ord_fecha: true,
        ord_total: true
      }
    });

    orders.forEach(order => {
      const hour = new Date(order.ord_fecha).getHours();
      hourlyRevenue[hour] += Number(order.ord_total);
    });

    return Object.entries(hourlyRevenue).map(([hour, revenue]) => ({
      hour: parseInt(hour),
      revenue: revenue
    }));
  }

  /**
   * Get top products
   */
  private async getTopProducts(startDate: Date, endDate: Date): Promise<any[]> {
    const orders = await prisma.orden.findMany({
      where: {
        ord_fecha: {
          gte: startDate,
          lte: endDate
        },
        flg_del: 1
      },
      include: {
        ordenproducto: {
          include: {
            plato: true,
            bebida: true
          }
        }
      }
    });

    const productCounts: { [key: string]: any } = {};

    orders.forEach(order => {
      order.ordenproducto.forEach(item => {
        const productName = item.plato?.pla_nombre || item.bebida?.beb_nombre || 'Unknown';
        const productType = item.plato ? 'plato' : 'bebida';
        const productKey = `${productName}_${productType}`;

        if (!productCounts[productKey]) {
          productCounts[productKey] = {
            name: productName,
            type: productType,
            quantity: 0,
            revenue: 0
          };
        }

        productCounts[productKey].quantity += item.orp_cantidad;
        productCounts[productKey].revenue += Number(item.orp_subtotal);
      });
    });

    return Object.values(productCounts)
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, 10);
  }

  /**
   * Get hourly breakdown
   */
  private async getHourlyBreakdown(startDate: Date, endDate: Date): Promise<any[]> {
    const hourlyData: { [key: number]: { orders: number; revenue: number } } = {};

    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = { orders: 0, revenue: 0 };
    }

    const orders = await prisma.orden.findMany({
      where: {
        ord_fecha: {
          gte: startDate,
          lte: endDate
        },
        flg_del: 1
      },
      select: {
        ord_fecha: true,
        ord_total: true
      }
    });

    orders.forEach(order => {
      const hour = new Date(order.ord_fecha).getHours();
      hourlyData[hour].orders += 1;
      hourlyData[hour].revenue += Number(order.ord_total);
    });

    return Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      orders: data.orders,
      revenue: data.revenue
    }));
  }

  /**
   * Get daily breakdown
   */
  private async getDailyBreakdown(startDate: Date, endDate: Date): Promise<any[]> {
    const dailyData: { [key: string]: { orders: number; revenue: number } } = {};

    const orders = await prisma.orden.findMany({
      where: {
        ord_fecha: {
          gte: startDate,
          lte: endDate
        },
        flg_del: 1
      },
      select: {
        ord_fecha: true,
        ord_total: true
      }
    });

    orders.forEach(order => {
      const date = order.ord_fecha.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { orders: 0, revenue: 0 };
      }
      dailyData[date].orders += 1;
      dailyData[date].revenue += Number(order.ord_total);
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        orders: data.orders,
        revenue: data.revenue
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get weekly trends
   */
  private async getWeeklyTrends(startDate: Date, endDate: Date): Promise<any> {
    // Simplified implementation
    return {
      growth_rate: 0,
      peak_hours: [12, 13, 19, 20],
      peak_days: ['Friday', 'Saturday', 'Sunday']
    };
  }

  /**
   * Get category breakdown
   */
  private async getCategoryBreakdown(startDate: Date, endDate: Date): Promise<any[]> {
    const orders = await prisma.orden.findMany({
      where: {
        ord_fecha: {
          gte: startDate,
          lte: endDate
        },
        flg_del: 1
      },
      include: {
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
            }
          }
        }
      }
    });

    const categoryData: { [key: string]: { orders: number; revenue: number } } = {};

    orders.forEach(order => {
      order.ordenproducto.forEach(item => {
        const categoryName = item.plato?.categoria?.cat_nombre || 
                           item.bebida?.categoria?.cbe_nombre || 'Unknown';
        
        if (!categoryData[categoryName]) {
          categoryData[categoryName] = { orders: 0, revenue: 0 };
        }
        categoryData[categoryName].orders += 1;
        categoryData[categoryName].revenue += Number(item.orp_subtotal);
      });
    });

    return Object.entries(categoryData)
      .map(([category, data]) => ({
        category,
        orders: data.orders,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Calculate trends
   */
  private async calculateTrends(startDate: Date, endDate: Date, period: string): Promise<any[]> {
    // Simplified implementation
    const trends = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const periodStart = new Date(current);
      const periodEnd = new Date(current);
      
      if (period === 'day') {
        periodEnd.setDate(periodEnd.getDate() + 1);
      } else if (period === 'week') {
        periodEnd.setDate(periodEnd.getDate() + 7);
      } else if (period === 'month') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      const orders = await prisma.orden.count({
        where: {
          ord_fecha: {
            gte: periodStart,
            lt: periodEnd
          },
          flg_del: 1
        }
      });

      const revenue = await prisma.orden.aggregate({
        where: {
          ord_fecha: {
            gte: periodStart,
            lt: periodEnd
          },
          flg_del: 1
        },
        _sum: { ord_total: true }
      });

      trends.push({
        period: periodStart.toISOString().split('T')[0],
        orders: orders,
        revenue: Number(revenue._sum.ord_total || 0)
      });

      if (period === 'day') {
        current.setDate(current.getDate() + 1);
      } else if (period === 'week') {
        current.setDate(current.getDate() + 7);
      } else if (period === 'month') {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return trends;
  }
}
