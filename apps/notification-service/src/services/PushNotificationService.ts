/**
 * @fileoverview Push notification service for sending push notifications
 */

import webpush from 'web-push';
import * as admin from 'firebase-admin';

export class PushNotificationService {
  private isInitialized: boolean = false;
  private firebaseApp: admin.app.App | null = null;

  /**
   * Initialize push notification service
   */
  async initialize(): Promise<void> {
    try {
      if (process.env.PUSH_NOTIFICATIONS_ENABLED !== 'true') {
        console.log('🔔 Push notification service disabled');
        return;
      }

      // Initialize VAPID keys for web push
      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT || 'mailto:admin@tovocl.com',
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
      }

      // Initialize Firebase Admin SDK for mobile push
      if (process.env.FIREBASE_ENABLED === 'true') {
        const serviceAccount = {
          type: 'service_account',
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: process.env.FIREBASE_AUTH_URI,
          token_uri: process.env.FIREBASE_TOKEN_URI
        };

        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
        });
      }

      this.isInitialized = true;
      console.log('🔔 Push notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize push notification service:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Get push notification service status
   */
  async getStatus(): Promise<{ enabled: boolean; initialized: boolean; error?: string }> {
    return {
      enabled: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
      initialized: this.isInitialized,
      error: this.isInitialized ? undefined : 'Push notification service not initialized'
    };
  }

  /**
   * Send push notification
   */
  async sendPushNotification(data: {
    to: string | string[];
    title: string;
    body: string;
    data?: any;
    icon?: string;
    badge?: string;
    image?: string;
    url?: string;
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    vibrate?: number[];
    actions?: any[];
  }): Promise<any> {
    try {
      if (!this.isInitialized) {
        throw new Error('Push notification service not initialized');
      }

      const { to, title, body, data: payloadData, ...options } = data;
      const recipients = Array.isArray(to) ? to : [to];

      const results = [];

      for (const recipient of recipients) {
        try {
          // Determine if it's a web push or mobile push based on the recipient format
          if (recipient.startsWith('web:')) {
            const subscription = JSON.parse(recipient.substring(4));
            const result = await this.sendWebPush(subscription, {
              title,
              body,
              data: payloadData,
              ...options
            });
            results.push({ recipient, success: true, result });
          } else {
            // Mobile push notification
            const result = await this.sendMobilePush(recipient, {
              title,
              body,
              data: payloadData,
              ...options
            });
            results.push({ recipient, success: true, result });
          }
        } catch (error) {
          results.push({ recipient, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      throw error;
    }
  }

  /**
   * Send web push notification
   */
  private async sendWebPush(subscription: any, payload: any): Promise<any> {
    try {
      const result = await webpush.sendNotification(subscription, JSON.stringify(payload));
      return result;
    } catch (error) {
      console.error('Failed to send web push notification:', error);
      throw error;
    }
  }

  /**
   * Send mobile push notification
   */
  private async sendMobilePush(token: string, payload: any): Promise<any> {
    try {
      if (!this.firebaseApp) {
        throw new Error('Firebase not initialized');
      }

      const message = {
        token: token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.image
        },
        data: payload.data || {},
        android: {
          notification: {
            icon: payload.icon || 'ic_notification',
            color: '#FF6B6B',
            sound: payload.silent ? undefined : 'default',
            vibrate: payload.vibrate || [200, 100, 200]
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body
              },
              badge: 1,
              sound: payload.silent ? undefined : 'default'
            }
          }
        }
      };

      const result = await admin.messaging().send(message);
      return result;
    } catch (error) {
      console.error('Failed to send mobile push notification:', error);
      throw error;
    }
  }

  /**
   * Send order confirmation push notification
   */
  async sendOrderConfirmation(orderData: any): Promise<any> {
    return this.sendPushNotification({
      to: orderData.customer.push_token,
      title: 'Order Confirmed!',
      body: `Your order #${orderData.order_id} has been confirmed. Total: $${orderData.total}`,
      data: {
        type: 'order_confirmation',
        order_id: orderData.order_id,
        total: orderData.total
      },
      icon: '/icons/order-confirmed.png',
      url: `/orders/${orderData.order_id}`
    });
  }

  /**
   * Send order status update push notification
   */
  async sendOrderStatusUpdate(orderData: any): Promise<any> {
    return this.sendPushNotification({
      to: orderData.customer.push_token,
      title: 'Order Update',
      body: `Your order #${orderData.order_id} is now ${orderData.status}`,
      data: {
        type: 'order_status_update',
        order_id: orderData.order_id,
        status: orderData.status
      },
      icon: '/icons/order-update.png',
      url: `/orders/${orderData.order_id}`
    });
  }

  /**
   * Send delivery notification push notification
   */
  async sendDeliveryNotification(deliveryData: any): Promise<any> {
    return this.sendPushNotification({
      to: deliveryData.customer.push_token,
      title: 'Delivery Update',
      body: `Your delivery #${deliveryData.order_id} is on its way! ETA: ${deliveryData.estimated_time}`,
      data: {
        type: 'delivery_notification',
        order_id: deliveryData.order_id,
        estimated_time: deliveryData.estimated_time
      },
      icon: '/icons/delivery.png',
      url: `/delivery/${deliveryData.order_id}`
    });
  }

  /**
   * Send low stock alert push notification
   */
  async sendLowStockAlert(alertData: any): Promise<any> {
    return this.sendPushNotification({
      to: alertData.recipients,
      title: 'Low Stock Alert',
      body: `${alertData.items.length} items are running low on stock`,
      data: {
        type: 'low_stock_alert',
        items: alertData.items
      },
      icon: '/icons/alert.png',
      url: '/inventory/alerts'
    });
  }

  /**
   * Send promotional push notification
   */
  async sendPromotionalNotification(promotionData: any): Promise<any> {
    return this.sendPushNotification({
      to: promotionData.recipients,
      title: promotionData.title,
      body: promotionData.description,
      data: {
        type: 'promotional',
        promotion_id: promotionData.id,
        discount: promotionData.discount
      },
      icon: '/icons/promotion.png',
      image: promotionData.image,
      url: `/promotions/${promotionData.id}`
    });
  }

  /**
   * Send system notification push notification
   */
  async sendSystemNotification(notificationData: any): Promise<any> {
    return this.sendPushNotification({
      to: notificationData.recipients,
      title: 'System Notification',
      body: notificationData.message,
      data: {
        type: 'system_notification',
        notification_id: notificationData.id
      },
      icon: '/icons/system.png',
      url: notificationData.url
    });
  }

  /**
   * Send bulk push notification
   */
  async sendBulkPushNotification(recipients: string[], notification: any): Promise<any[]> {
    try {
      if (!this.isInitialized) {
        throw new Error('Push notification service not initialized');
      }

      const results = [];

      for (const recipient of recipients) {
        try {
          const result = await this.sendPushNotification({
            to: recipient,
            ...notification
          });
          results.push({ recipient, success: true, result });
        } catch (error) {
          results.push({ recipient, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to send bulk push notification:', error);
      throw error;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(subscription: any, userId: number): Promise<any> {
    try {
      // In a real implementation, you would store the subscription in the database
      // For now, we'll just return a success response
      return {
        success: true,
        subscription_id: `sub_${Date.now()}`,
        user_id: userId
      };
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(subscriptionId: string): Promise<any> {
    try {
      // In a real implementation, you would remove the subscription from the database
      return {
        success: true,
        subscription_id: subscriptionId
      };
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }
}
