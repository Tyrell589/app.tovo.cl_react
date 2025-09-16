/**
 * @fileoverview SMS controller
 */

import { 
  ApiResponse
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';
import { SMSService } from '../services/SMSService';

export class SMSController {
  private smsService: SMSService;

  constructor() {
    this.smsService = new SMSService();
  }

  /**
   * Send SMS notification
   */
  async sendSMS(data: {
    to: string;
    message: string;
  }): Promise<ApiResponse> {
    try {
      const result = await this.smsService.sendSMS(data);

      return {
        success: true,
        data: result,
        message: 'SMS sent successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to send SMS', 500);
    }
  }

  /**
   * Send order confirmation SMS
   */
  async sendOrderConfirmation(data: {
    order_id: number;
    customer: {
      phone: string;
      name: string;
    };
    total: number;
    status: string;
  }): Promise<ApiResponse> {
    try {
      const result = await this.smsService.sendOrderConfirmation(data);

      return {
        success: true,
        data: result,
        message: 'Order confirmation SMS sent successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to send order confirmation SMS', 500);
    }
  }

  /**
   * Send verification code SMS
   */
  async sendVerificationCode(data: {
    phone: string;
    code: string;
  }): Promise<ApiResponse> {
    try {
      const result = await this.smsService.sendVerificationCode(data.phone, data.code);

      return {
        success: true,
        data: result,
        message: 'Verification code SMS sent successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to send verification code SMS', 500);
    }
  }

  /**
   * Get SMS service status
   */
  async getSMSStatus(): Promise<ApiResponse> {
    try {
      const status = await this.smsService.getStatus();

      return {
        success: true,
        data: status,
        message: 'SMS service status retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to get SMS service status', 500);
    }
  }
}
