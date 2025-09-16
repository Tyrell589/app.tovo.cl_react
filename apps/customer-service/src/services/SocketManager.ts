/**
 * @fileoverview Socket.IO manager for real-time customer updates
 */

import { Server as SocketIOServer } from 'socket.io';

export class SocketManager {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Emit customer update to specific customer
   */
  emitCustomerUpdate(customerId: number, update: any): void {
    this.io.to(`customer-${customerId}`).emit('customer-update', {
      type: 'customer-update',
      data: update,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit order status update to customer
   */
  emitOrderStatusUpdate(customerId: number, order: any): void {
    this.io.to(`customer-${customerId}`).emit('order-status-update', {
      type: 'order-status-update',
      data: order,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit delivery update to customer
   */
  emitDeliveryUpdate(customerId: number, delivery: any): void {
    this.io.to(`customer-${customerId}`).emit('delivery-update', {
      type: 'delivery-update',
      data: delivery,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit delivery update to delivery tracking
   */
  emitDeliveryTrackingUpdate(deliveryId: number, update: any): void {
    this.io.to(`delivery-${deliveryId}`).emit('delivery-tracking-update', {
      type: 'delivery-tracking-update',
      data: update,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit notification to customer
   */
  emitCustomerNotification(customerId: number, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    this.io.to(`customer-${customerId}`).emit('notification', {
      type: 'notification',
      data: { message, type },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit notification to all customers
   */
  emitBroadcastNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    this.io.emit('broadcast-notification', {
      type: 'broadcast-notification',
      data: { message, type },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connected customers count
   */
  getConnectedCustomersCount(): number {
    const customerRooms = Array.from(this.io.sockets.adapter.rooms.keys())
      .filter(room => room.startsWith('customer-'));
    return customerRooms.length;
  }

  /**
   * Get connected delivery tracking count
   */
  getConnectedDeliveryTrackingCount(): number {
    const deliveryRooms = Array.from(this.io.sockets.adapter.rooms.keys())
      .filter(room => room.startsWith('delivery-'));
    return deliveryRooms.length;
  }
}
