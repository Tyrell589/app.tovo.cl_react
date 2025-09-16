/**
 * @fileoverview Socket.IO manager for real-time reporting updates
 */

import { Server as SocketIOServer } from 'socket.io';

export class SocketManager {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Emit report update to dashboard
   */
  emitReportUpdate(dashboardId: string, report: any): void {
    this.io.to(`dashboard-${dashboardId}`).emit('report-update', {
      type: 'report-update',
      data: report,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit analytics update
   */
  emitAnalyticsUpdate(dashboardId: string, analytics: any): void {
    this.io.to(`dashboard-${dashboardId}`).emit('analytics-update', {
      type: 'analytics-update',
      data: analytics,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit performance metrics update
   */
  emitPerformanceUpdate(dashboardId: string, metrics: any): void {
    this.io.to(`dashboard-${dashboardId}`).emit('performance-update', {
      type: 'performance-update',
      data: metrics,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit inventory alert
   */
  emitInventoryAlert(dashboardId: string, alert: any): void {
    this.io.to(`dashboard-${dashboardId}`).emit('inventory-alert', {
      type: 'inventory-alert',
      data: alert,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit sales alert
   */
  emitSalesAlert(dashboardId: string, alert: any): void {
    this.io.to(`dashboard-${dashboardId}`).emit('sales-alert', {
      type: 'sales-alert',
      data: alert,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit export completion notification
   */
  emitExportComplete(dashboardId: string, exportData: any): void {
    this.io.to(`dashboard-${dashboardId}`).emit('export-complete', {
      type: 'export-complete',
      data: exportData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit scheduled report notification
   */
  emitScheduledReport(dashboardId: string, report: any): void {
    this.io.to(`dashboard-${dashboardId}`).emit('scheduled-report', {
      type: 'scheduled-report',
      data: report,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit real-time data update
   */
  emitRealTimeData(dashboardId: string, data: any): void {
    this.io.to(`dashboard-${dashboardId}`).emit('realtime-data', {
      type: 'realtime-data',
      data: data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connected dashboards count
   */
  getConnectedDashboardsCount(): number {
    const dashboardRooms = Array.from(this.io.sockets.adapter.rooms.keys())
      .filter(room => room.startsWith('dashboard-'));
    return dashboardRooms.length;
  }

  /**
   * Get connected reports count
   */
  getConnectedReportsCount(): number {
    const reportRooms = Array.from(this.io.sockets.adapter.rooms.keys())
      .filter(room => room.startsWith('report-'));
    return reportRooms.length;
  }
}
