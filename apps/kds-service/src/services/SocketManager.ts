/**
 * @fileoverview Socket.IO manager for real-time kitchen updates
 */

import { Server as SocketIOServer } from 'socket.io';

export class SocketManager {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Emit new order to kitchen
   */
  emitNewOrder(kitchenId: string, order: any): void {
    this.io.to(`kitchen-${kitchenId}`).emit('new-order', {
      type: 'new-order',
      data: order,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit order update to kitchen
   */
  emitOrderUpdate(kitchenId: string, order: any): void {
    this.io.to(`kitchen-${kitchenId}`).emit('order-update', {
      type: 'order-update',
      data: order,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit order status update
   */
  emitOrderStatusUpdate(orderId: number, status: string, stationId?: string): void {
    this.io.to(`order-${orderId}`).emit('order-status-update', {
      type: 'order-status-update',
      data: { orderId, status, stationId },
      timestamp: new Date().toISOString()
    });

    if (stationId) {
      this.io.to(`station-${stationId}`).emit('station-order-update', {
        type: 'station-order-update',
        data: { orderId, status },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Emit station update
   */
  emitStationUpdate(stationId: string, update: any): void {
    this.io.to(`station-${stationId}`).emit('station-update', {
      type: 'station-update',
      data: update,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit kitchen display update
   */
  emitKitchenDisplayUpdate(kitchenId: string, display: any): void {
    this.io.to(`kitchen-${kitchenId}`).emit('kitchen-display-update', {
      type: 'kitchen-display-update',
      data: display,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit printer status update
   */
  emitPrinterStatusUpdate(printerId: string, status: any): void {
    this.io.emit('printer-status-update', {
      type: 'printer-status-update',
      data: { printerId, status },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit sound notification
   */
  emitSoundNotification(kitchenId: string, soundType: string, data?: any): void {
    this.io.to(`kitchen-${kitchenId}`).emit('sound-notification', {
      type: 'sound-notification',
      data: { soundType, data },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit alert to kitchen
   */
  emitKitchenAlert(kitchenId: string, alert: any): void {
    this.io.to(`kitchen-${kitchenId}`).emit('kitchen-alert', {
      type: 'kitchen-alert',
      data: alert,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connected kitchens count
   */
  getConnectedKitchensCount(): number {
    const kitchenRooms = Array.from(this.io.sockets.adapter.rooms.keys())
      .filter(room => room.startsWith('kitchen-'));
    return kitchenRooms.length;
  }

  /**
   * Get connected stations count
   */
  getConnectedStationsCount(): number {
    const stationRooms = Array.from(this.io.sockets.adapter.rooms.keys())
      .filter(room => room.startsWith('station-'));
    return stationRooms.length;
  }

  /**
   * Get connected orders count
   */
  getConnectedOrdersCount(): number {
    const orderRooms = Array.from(this.io.sockets.adapter.rooms.keys())
      .filter(room => room.startsWith('order-'));
    return orderRooms.length;
  }
}
