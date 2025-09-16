/**
 * @fileoverview Socket.IO manager for real-time online ordering updates
 */

import { Server as SocketIOServer } from 'socket.io';

export class SocketManager {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Emit cart update to specific cart
   */
  emitCartUpdate(cartId: string, update: any): void {
    this.io.to(`cart-${cartId}`).emit('cart-update', {
      type: 'cart-update',
      data: update,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit order status update to customer
   */
  emitOrderStatusUpdate(orderId: number, order: any): void {
    this.io.to(`order-${orderId}`).emit('order-status-update', {
      type: 'order-status-update',
      data: order,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit delivery update to customer
   */
  emitDeliveryUpdate(orderId: number, delivery: any): void {
    this.io.to(`order-${orderId}`).emit('delivery-update', {
      type: 'delivery-update',
      data: delivery,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit delivery tracking update
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
  emitCustomerNotification(orderId: number, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    this.io.to(`order-${orderId}`).emit('notification', {
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
   * Get connected carts count
   */
  getConnectedCartsCount(): number {
    const cartRooms = Array.from(this.io.sockets.adapter.rooms.keys())
      .filter(room => room.startsWith('cart-'));
    return cartRooms.length;
  }

  /**
   * Get connected orders count
   */
  getConnectedOrdersCount(): number {
    const orderRooms = Array.from(this.io.sockets.adapter.rooms.keys())
      .filter(room => room.startsWith('order-'));
    return orderRooms.length;
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
