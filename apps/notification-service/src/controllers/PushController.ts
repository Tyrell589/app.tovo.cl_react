/**
 * @fileoverview Push notification controller
 */

import { 
  ApiResponse
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';
import { PushNotificationService } from '../services/PushNotificationService';

export class PushController {
  private pushNotificationService: PushNotificationService;

  constructor() {
    this.pushNotificationService = new PushNotificationService();
  }

  /**
   * Send push notification
   */
  async sendPushNotification(data: {
    to: string[];
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
  }): Promise<ApiResponse> {
    try {
      const result = await this.pushNotificationService.sendPushNotification(data);

      return {
        success: true,
        data: result,
        message: 'Push notification sent successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to send push notification', 500);
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(data: {
    subscription: any;
    user_id: number;
  }): Promise<ApiResponse> {
    try {
      const result = await this.pushNotificationService.subscribeToPush(data.subscription, data.user_id);

      return {
        success: true,
        data: result,
        message: 'Successfully subscribed to push notifications'
      };
    } catch (error) {
      throw new CustomError('Failed to subscribe to push notifications', 500);
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(data: {
    subscription_id: string;
  }): Promise<ApiResponse> {
    try {
      const result = await this.pushNotificationService.unsubscribeFromPush(data.subscription_id);

      return {
        success: true,
        data: result,
        message: 'Successfully unsubscribed from push notifications'
      };
    } catch (error) {
      throw new CustomError('Failed to unsubscribe from push notifications', 500);
    }
  }

  /**
   * Get push notification service status
   */
  async getPushStatus(): Promise<ApiResponse> {
    try {
      const status = await this.pushNotificationService.getStatus();

      return {
        success: true,
        data: status,
        message: 'Push notification service status retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to get push notification service status', 500);
    }
  }
}
