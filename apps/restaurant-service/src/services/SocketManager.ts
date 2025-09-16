/**
 * @fileoverview Socket.IO manager for real-time restaurant updates
 */

import { Server as SocketIOServer } from 'socket.io';

export class SocketManager {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Emit order update to kitchen
   */
  emitOrderUpdate(order: any): void {
    this.io.to('kitchen').emit('order-update', {
      type: 'order-update',
      data: order,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit new order to kitchen
   */
  emitNewOrder(order: any): void {
    this.io.to('kitchen').emit('new-order', {
      type: 'new-order',
      data: order,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit order status change
   */
  emitOrderStatusChange(orderId: number, status: string, tableId: number): void {
    this.io.to('kitchen').emit('order-status-change', {
      type: 'order-status-change',
      data: { orderId, status, tableId },
      timestamp: new Date().toISOString()
    });

    // Also notify table-specific clients
    this.io.to(`orders-${tableId}`).emit('order-status-change', {
      type: 'order-status-change',
      data: { orderId, status, tableId },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit table status change
   */
  emitTableStatusChange(tableId: number, status: string): void {
    this.io.emit('table-status-change', {
      type: 'table-status-change',
      data: { tableId, status },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit kitchen display update
   */
  emitKitchenDisplayUpdate(displayData: any): void {
    this.io.to('kitchen').emit('kitchen-display-update', {
      type: 'kitchen-display-update',
      data: displayData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit turn change
   */
  emitTurnChange(turn: any): void {
    this.io.emit('turn-change', {
      type: 'turn-change',
      data: turn,
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
   * Get kitchen display clients count
   */
  getKitchenClientsCount(): number {
    const kitchenRoom = this.io.sockets.adapter.rooms.get('kitchen');
    return kitchenRoom ? kitchenRoom.size : 0;
  }

  /**
   * Get order tracking clients count for specific table
   */
  getOrderTrackingClientsCount(tableId: number): number {
    const orderRoom = this.io.sockets.adapter.rooms.get(`orders-${tableId}`);
    return orderRoom ? orderRoom.size : 0;
  }
}
