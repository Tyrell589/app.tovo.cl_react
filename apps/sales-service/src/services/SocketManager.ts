/**
 * @fileoverview Socket.IO manager for real-time sales updates
 */

import { Server as SocketIOServer } from 'socket.io';

export class SocketManager {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Emit sales update to sales dashboard
   */
  emitSalesUpdate(salesData: any): void {
    this.io.to('sales').emit('sales-update', {
      type: 'sales-update',
      data: salesData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit payment processed
   */
  emitPaymentProcessed(payment: any): void {
    this.io.to('sales').emit('payment-processed', {
      type: 'payment-processed',
      data: payment,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit cash register update
   */
  emitCashRegisterUpdate(registerId: number, update: any): void {
    this.io.to(`cash-register-${registerId}`).emit('cash-register-update', {
      type: 'cash-register-update',
      data: update,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit daily summary update
   */
  emitDailySummaryUpdate(summary: any): void {
    this.io.to('sales').emit('daily-summary-update', {
      type: 'daily-summary-update',
      data: summary,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit coupon applied
   */
  emitCouponApplied(coupon: any, order: any): void {
    this.io.to('sales').emit('coupon-applied', {
      type: 'coupon-applied',
      data: { coupon, order },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit refund processed
   */
  emitRefundProcessed(refund: any): void {
    this.io.to('sales').emit('refund-processed', {
      type: 'refund-processed',
      data: refund,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit notification to all clients
   */
  emitNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    this.io.emit('notification', {
      type: 'notification',
      data: { message, type },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit notification to specific room
   */
  emitNotificationToRoom(room: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    this.io.to(room).emit('notification', {
      type: 'notification',
      data: { message, type },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.io.engine.clientsCount;
  }

  /**
   * Get sales dashboard clients count
   */
  getSalesClientsCount(): number {
    const salesRoom = this.io.sockets.adapter.rooms.get('sales');
    return salesRoom ? salesRoom.size : 0;
  }

  /**
   * Get cash register clients count
   */
  getCashRegisterClientsCount(registerId: number): number {
    const registerRoom = this.io.sockets.adapter.rooms.get(`cash-register-${registerId}`);
    return registerRoom ? registerRoom.size : 0;
  }
}
