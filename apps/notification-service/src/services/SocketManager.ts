/**
 * @fileoverview Socket.IO manager for real-time notifications
 */

import { Server as SocketIOServer } from 'socket.io';

export class SocketManager {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Send notification to specific user
   */
  sendToUser(userId: number, notification: any): void {
    this.io.to(`user-${userId}`).emit('notification', {
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send notification to specific role
   */
  sendToRole(roleId: number, notification: any): void {
    this.io.to(`role-${roleId}`).emit('role-notification', {
      type: 'role-notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send notification to all connected users
   */
  sendBroadcast(notification: any): void {
    this.io.emit('broadcast-notification', {
      type: 'broadcast-notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send order notification
   */
  sendOrderNotification(orderId: number, notification: any): void {
    this.io.emit('order-notification', {
      type: 'order-notification',
      data: { orderId, ...notification },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send kitchen notification
   */
  sendKitchenNotification(notification: any): void {
    this.io.emit('kitchen-notification', {
      type: 'kitchen-notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send sales notification
   */
  sendSalesNotification(notification: any): void {
    this.io.emit('sales-notification', {
      type: 'sales-notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send inventory alert
   */
  sendInventoryAlert(alert: any): void {
    this.io.emit('inventory-alert', {
      type: 'inventory-alert',
      data: alert,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send system notification
   */
  sendSystemNotification(notification: any): void {
    this.io.emit('system-notification', {
      type: 'system-notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send email status update
   */
  sendEmailStatusUpdate(notificationId: string, status: any): void {
    this.io.emit('email-status-update', {
      type: 'email-status-update',
      data: { notificationId, status },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send SMS status update
   */
  sendSMSStatusUpdate(notificationId: string, status: any): void {
    this.io.emit('sms-status-update', {
      type: 'sms-status-update',
      data: { notificationId, status },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send push notification status update
   */
  sendPushStatusUpdate(notificationId: string, status: any): void {
    this.io.emit('push-status-update', {
      type: 'push-status-update',
      data: { notificationId, status },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    const userRooms = Array.from(this.io.sockets.adapter.rooms.keys())
      .filter(room => room.startsWith('user-'));
    return userRooms.length;
  }

  /**
   * Get connected roles count
   */
  getConnectedRolesCount(): number {
    const roleRooms = Array.from(this.io.sockets.adapter.rooms.keys())
      .filter(room => room.startsWith('role-'));
    return roleRooms.length;
  }

  /**
   * Get total connected clients count
   */
  getTotalConnectionsCount(): number {
    return this.io.engine.clientsCount;
  }
}
