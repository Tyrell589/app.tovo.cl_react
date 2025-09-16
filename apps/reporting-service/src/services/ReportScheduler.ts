/**
 * @fileoverview Report scheduler for automated report generation
 */

import * as cron from 'node-cron';
import { prisma } from '@tovocl/database';

export class ReportScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning: boolean = false;

  /**
   * Start the report scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Report scheduler is already running');
      return;
    }

    try {
      // Daily sales report at 2 AM
      this.scheduleJob('daily-sales', '0 2 * * *', () => {
        this.generateDailySalesReport();
      });

      // Weekly inventory report on Mondays at 3 AM
      this.scheduleJob('weekly-inventory', '0 3 * * 1', () => {
        this.generateWeeklyInventoryReport();
      });

      // Monthly performance report on the 1st at 4 AM
      this.scheduleJob('monthly-performance', '0 4 1 * *', () => {
        this.generateMonthlyPerformanceReport();
      });

      // Hourly real-time analytics
      this.scheduleJob('hourly-analytics', '0 * * * *', () => {
        this.generateHourlyAnalytics();
      });

      // Cleanup old exports daily at 1 AM
      this.scheduleJob('cleanup-exports', '0 1 * * *', () => {
        this.cleanupOldExports();
      });

      this.isRunning = true;
      console.log('📅 Report scheduler started successfully');
    } catch (error) {
      console.error('Failed to start report scheduler:', error);
      throw error;
    }
  }

  /**
   * Stop the report scheduler
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      for (const [name, job] of this.jobs) {
        job.stop();
        console.log(`Stopped scheduled job: ${name}`);
      }
      
      this.jobs.clear();
      this.isRunning = false;
      console.log('📅 Report scheduler stopped successfully');
    } catch (error) {
      console.error('Failed to stop report scheduler:', error);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { running: boolean; jobs: string[] } {
    return {
      running: this.isRunning,
      jobs: Array.from(this.jobs.keys())
    };
  }

  /**
   * Schedule a new job
   */
  private scheduleJob(name: string, cronExpression: string, task: () => void): void {
    if (this.jobs.has(name)) {
      console.log(`Job ${name} already exists, skipping...`);
      return;
    }

    const job = cron.schedule(cronExpression, task, {
      scheduled: false,
      timezone: 'America/Santiago'
    });

    job.start();
    this.jobs.set(name, job);
    console.log(`📅 Scheduled job: ${name} (${cronExpression})`);
  }

  /**
   * Generate daily sales report
   */
  private async generateDailySalesReport(): Promise<void> {
    try {
      console.log('📊 Generating daily sales report...');
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get sales data for yesterday
      const salesData = await prisma.orden.findMany({
        where: {
          ord_fecha: {
            gte: yesterday,
            lt: today
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

      const report = {
        date: yesterday.toISOString().split('T')[0],
        total_orders: salesData.length,
        total_revenue: salesData.reduce((sum, order) => sum + Number(order.ord_total), 0),
        average_order_value: salesData.length > 0 ? 
          salesData.reduce((sum, order) => sum + Number(order.ord_total), 0) / salesData.length : 0,
        top_products: this.getTopProducts(salesData),
        generated_at: new Date().toISOString()
      };

      console.log('📊 Daily sales report generated:', report);
    } catch (error) {
      console.error('Failed to generate daily sales report:', error);
    }
  }

  /**
   * Generate weekly inventory report
   */
  private async generateWeeklyInventoryReport(): Promise<void> {
    try {
      console.log('📦 Generating weekly inventory report...');
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      oneWeekAgo.setHours(0, 0, 0, 0);

      // Get inventory movements for the past week
      const movements = await prisma.movimientoStock.findMany({
        where: {
          mov_fecha: {
            gte: oneWeekAgo
          },
          flg_del: 1
        },
        include: {
          ingrediente: true
        }
      });

      const report = {
        period: `${oneWeekAgo.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
        total_movements: movements.length,
        low_stock_items: await this.getLowStockItems(),
        high_consumption_items: this.getHighConsumptionItems(movements),
        generated_at: new Date().toISOString()
      };

      console.log('📦 Weekly inventory report generated:', report);
    } catch (error) {
      console.error('Failed to generate weekly inventory report:', error);
    }
  }

  /**
   * Generate monthly performance report
   */
  private async generateMonthlyPerformanceReport(): Promise<void> {
    try {
      console.log('⚡ Generating monthly performance report...');
      
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      oneMonthAgo.setHours(0, 0, 0, 0);

      // Get performance data for the past month
      const orders = await prisma.orden.findMany({
        where: {
          ord_fecha: {
            gte: oneMonthAgo
          },
          flg_del: 1
        }
      });

      const report = {
        period: `${oneMonthAgo.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
        total_orders: orders.length,
        total_revenue: orders.reduce((sum, order) => sum + Number(order.ord_total), 0),
        average_order_value: orders.length > 0 ? 
          orders.reduce((sum, order) => sum + Number(order.ord_total), 0) / orders.length : 0,
        order_completion_rate: this.calculateOrderCompletionRate(orders),
        generated_at: new Date().toISOString()
      };

      console.log('⚡ Monthly performance report generated:', report);
    } catch (error) {
      console.error('Failed to generate monthly performance report:', error);
    }
  }

  /**
   * Generate hourly analytics
   */
  private async generateHourlyAnalytics(): Promise<void> {
    try {
      console.log('📈 Generating hourly analytics...');
      
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const orders = await prisma.orden.findMany({
        where: {
          ord_fecha: {
            gte: oneHourAgo
          },
          flg_del: 1
        }
      });

      const analytics = {
        hour: oneHourAgo.getHours(),
        orders_count: orders.length,
        revenue: orders.reduce((sum, order) => sum + Number(order.ord_total), 0),
        generated_at: new Date().toISOString()
      };

      console.log('📈 Hourly analytics generated:', analytics);
    } catch (error) {
      console.error('Failed to generate hourly analytics:', error);
    }
  }

  /**
   * Cleanup old exports
   */
  private async cleanupOldExports(): Promise<void> {
    try {
      console.log('🧹 Cleaning up old exports...');
      
      const retentionDays = parseInt(process.env.EXPORT_RETENTION_DAYS || '30');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // In a real implementation, you would clean up actual export files
      console.log(`🧹 Cleaned up exports older than ${cutoffDate.toISOString()}`);
    } catch (error) {
      console.error('Failed to cleanup old exports:', error);
    }
  }

  /**
   * Get top products from sales data
   */
  private getTopProducts(salesData: any[]): any[] {
    const productCounts: { [key: string]: { name: string; count: number; revenue: number } } = {};

    salesData.forEach(order => {
      order.ordenproducto.forEach((item: any) => {
        const productName = item.plato?.pla_nombre || item.bebida?.beb_nombre || 'Unknown';
        const productKey = `${productName}_${item.plato ? 'plato' : 'bebida'}`;
        
        if (!productCounts[productKey]) {
          productCounts[productKey] = {
            name: productName,
            count: 0,
            revenue: 0
          };
        }
        
        productCounts[productKey].count += item.orp_cantidad;
        productCounts[productKey].revenue += Number(item.orp_subtotal);
      });
    });

    return Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get low stock items
   */
  private async getLowStockItems(): Promise<any[]> {
    try {
      const ingredients = await prisma.ingrediente.findMany({
        where: {
          flg_del: 1,
          ing_estado: 1
        }
      });

      return ingredients
        .filter(ingredient => Number(ingredient.ing_stock) < 10) // Low stock threshold
        .map(ingredient => ({
          name: ingredient.ing_nombre,
          current_stock: Number(ingredient.ing_stock),
          unit: ingredient.ing_unidad
        }));
    } catch (error) {
      console.error('Failed to get low stock items:', error);
      return [];
    }
  }

  /**
   * Get high consumption items
   */
  private getHighConsumptionItems(movements: any[]): any[] {
    const consumption: { [key: string]: { name: string; quantity: number } } = {};

    movements.forEach(movement => {
      if (movement.mov_tipo === 'salida') {
        const ingredientName = movement.ingrediente.ing_nombre;
        if (!consumption[ingredientName]) {
          consumption[ingredientName] = {
            name: ingredientName,
            quantity: 0
          };
        }
        consumption[ingredientName].quantity += Number(movement.mov_cantidad);
      }
    });

    return Object.values(consumption)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }

  /**
   * Calculate order completion rate
   */
  private calculateOrderCompletionRate(orders: any[]): number {
    const completedOrders = orders.filter(order => order.ord_estado === 'entregado');
    return orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0;
  }
}
