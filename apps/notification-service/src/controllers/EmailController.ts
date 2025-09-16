/**
 * @fileoverview Email controller
 */

import { 
  ApiResponse
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';
import { EmailService } from '../services/EmailService';

export class EmailController {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Send email notification
   */
  async sendEmail(data: {
    to: string;
    subject: string;
    template?: string;
    data?: any;
    html?: string;
    text?: string;
  }): Promise<ApiResponse> {
    try {
      const result = await this.emailService.sendEmail(data);

      return {
        success: true,
        data: result,
        message: 'Email sent successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to send email', 500);
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(data: {
    order_id: number;
    customer: {
      email: string;
      name: string;
    };
    total: number;
    status: string;
  }): Promise<ApiResponse> {
    try {
      const result = await this.emailService.sendOrderConfirmation(data);

      return {
        success: true,
        data: result,
        message: 'Order confirmation email sent successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to send order confirmation email', 500);
    }
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(data: {
    order_id: number;
    customer: {
      email: string;
      name: string;
    };
    status: string;
    message?: string;
  }): Promise<ApiResponse> {
    try {
      const result = await this.emailService.sendOrderStatusUpdate(data);

      return {
        success: true,
        data: result,
        message: 'Order status update email sent successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to send order status update email', 500);
    }
  }

  /**
   * Send delivery notification email
   */
  async sendDeliveryNotification(data: {
    order_id: number;
    customer: {
      email: string;
      name: string;
    };
    estimated_time: string;
    driver_name?: string;
  }): Promise<ApiResponse> {
    try {
      const result = await this.emailService.sendDeliveryNotification(data);

      return {
        success: true,
        data: result,
        message: 'Delivery notification email sent successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to send delivery notification email', 500);
    }
  }

  /**
   * Send low stock alert email
   */
  async sendLowStockAlert(data: {
    recipients: string[];
    items: Array<{
      name: string;
      stock: number;
      unit: string;
    }>;
  }): Promise<ApiResponse> {
    try {
      const result = await this.emailService.sendLowStockAlert(data);

      return {
        success: true,
        data: result,
        message: 'Low stock alert email sent successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to send low stock alert email', 500);
    }
  }

  /**
   * Send daily sales report email
   */
  async sendDailySalesReport(data: {
    recipients: string[];
    date: string;
    total_orders: number;
    total_revenue: number;
  }): Promise<ApiResponse> {
    try {
      const result = await this.emailService.sendDailySalesReport(data);

      return {
        success: true,
        data: result,
        message: 'Daily sales report email sent successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to send daily sales report email', 500);
    }
  }

  /**
   * Get email service status
   */
  async getEmailStatus(): Promise<ApiResponse> {
    try {
      const status = await this.emailService.getStatus();

      return {
        success: true,
        data: status,
        message: 'Email service status retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to get email service status', 500);
    }
  }
}
