/**
 * @fileoverview Email service for sending email notifications
 */

import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize email service
   */
  async initialize(): Promise<void> {
    try {
      if (process.env.EMAIL_ENABLED !== 'true') {
        console.log('📧 Email service disabled');
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Verify connection
      await this.transporter.verify();
      this.isInitialized = true;
      console.log('📧 Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Get email service status
   */
  async getStatus(): Promise<{ enabled: boolean; initialized: boolean; error?: string }> {
    return {
      enabled: process.env.EMAIL_ENABLED === 'true',
      initialized: this.isInitialized,
      error: this.isInitialized ? undefined : 'Email service not initialized'
    };
  }

  /**
   * Send email notification
   */
  async sendEmail(data: {
    to: string | string[];
    subject: string;
    template?: string;
    data?: any;
    html?: string;
    text?: string;
  }): Promise<any> {
    try {
      if (!this.isInitialized || !this.transporter) {
        throw new Error('Email service not initialized');
      }

      const { to, subject, template, data: templateData, html, text } = data;

      // Generate email content
      const emailContent = await this.generateEmailContent({
        template,
        data: templateData,
        html,
        text
      });

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'TovoCL Restaurant',
          address: process.env.EMAIL_FROM_ADDRESS || 'noreply@tovocl.com'
        },
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html: emailContent.html,
        text: emailContent.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`📧 Email sent successfully to ${to}: ${result.messageId}`);
      
      return {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
        response: result.response
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(orderData: any): Promise<any> {
    return this.sendEmail({
      to: orderData.customer.email,
      subject: `Order Confirmation #${orderData.order_id}`,
      template: 'order-confirmation',
      data: orderData
    });
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(orderData: any): Promise<any> {
    return this.sendEmail({
      to: orderData.customer.email,
      subject: `Order Update #${orderData.order_id}`,
      template: 'order-status-update',
      data: orderData
    });
  }

  /**
   * Send delivery notification email
   */
  async sendDeliveryNotification(deliveryData: any): Promise<any> {
    return this.sendEmail({
      to: deliveryData.customer.email,
      subject: `Delivery Update #${deliveryData.order_id}`,
      template: 'delivery-notification',
      data: deliveryData
    });
  }

  /**
   * Send low stock alert email
   */
  async sendLowStockAlert(alertData: any): Promise<any> {
    return this.sendEmail({
      to: alertData.recipients,
      subject: 'Low Stock Alert',
      template: 'low-stock-alert',
      data: alertData
    });
  }

  /**
   * Send daily sales report email
   */
  async sendDailySalesReport(reportData: any): Promise<any> {
    return this.sendEmail({
      to: reportData.recipients,
      subject: `Daily Sales Report - ${reportData.date}`,
      template: 'daily-sales-report',
      data: reportData
    });
  }

  /**
   * Send system notification email
   */
  async sendSystemNotification(notificationData: any): Promise<any> {
    return this.sendEmail({
      to: notificationData.recipients,
      subject: notificationData.subject,
      template: 'system-notification',
      data: notificationData
    });
  }

  /**
   * Generate email content from template
   */
  private async generateEmailContent(data: {
    template?: string;
    data?: any;
    html?: string;
    text?: string;
  }): Promise<{ html: string; text: string }> {
    const { template, data: templateData, html, text } = data;

    if (html && text) {
      return { html, text };
    }

    if (template) {
      return this.renderTemplate(template, templateData);
    }

    // Default content
    return {
      html: '<p>Notification from TovoCL Restaurant</p>',
      text: 'Notification from TovoCL Restaurant'
    };
  }

  /**
   * Render email template
   */
  private async renderTemplate(templateName: string, data: any): Promise<{ html: string; text: string }> {
    // In a real implementation, you would use a template engine like Handlebars or EJS
    // For now, we'll return simple templates
    
    const templates: { [key: string]: { html: string; text: string } } = {
      'order-confirmation': {
        html: `
          <h2>Order Confirmation</h2>
          <p>Thank you for your order!</p>
          <p><strong>Order #${data.order_id}</strong></p>
          <p>Total: $${data.total}</p>
          <p>Status: ${data.status}</p>
        `,
        text: `Order Confirmation\n\nThank you for your order!\nOrder #${data.order_id}\nTotal: $${data.total}\nStatus: ${data.status}`
      },
      'order-status-update': {
        html: `
          <h2>Order Status Update</h2>
          <p>Your order status has been updated.</p>
          <p><strong>Order #${data.order_id}</strong></p>
          <p>New Status: ${data.status}</p>
        `,
        text: `Order Status Update\n\nYour order status has been updated.\nOrder #${data.order_id}\nNew Status: ${data.status}`
      },
      'delivery-notification': {
        html: `
          <h2>Delivery Update</h2>
          <p>Your delivery is on its way!</p>
          <p><strong>Order #${data.order_id}</strong></p>
          <p>Estimated delivery time: ${data.estimated_time}</p>
        `,
        text: `Delivery Update\n\nYour delivery is on its way!\nOrder #${data.order_id}\nEstimated delivery time: ${data.estimated_time}`
      },
      'low-stock-alert': {
        html: `
          <h2>Low Stock Alert</h2>
          <p>The following items are running low on stock:</p>
          <ul>
            ${data.items.map((item: any) => `<li>${item.name} - ${item.stock} ${item.unit}</li>`).join('')}
          </ul>
        `,
        text: `Low Stock Alert\n\nThe following items are running low on stock:\n${data.items.map((item: any) => `- ${item.name} - ${item.stock} ${item.unit}`).join('\n')}`
      },
      'daily-sales-report': {
        html: `
          <h2>Daily Sales Report</h2>
          <p>Date: ${data.date}</p>
          <p>Total Orders: ${data.total_orders}</p>
          <p>Total Revenue: $${data.total_revenue}</p>
        `,
        text: `Daily Sales Report\n\nDate: ${data.date}\nTotal Orders: ${data.total_orders}\nTotal Revenue: $${data.total_revenue}`
      },
      'system-notification': {
        html: `
          <h2>System Notification</h2>
          <p>${data.message}</p>
        `,
        text: `System Notification\n\n${data.message}`
      }
    };

    return templates[templateName] || {
      html: '<p>Notification from TovoCL Restaurant</p>',
      text: 'Notification from TovoCL Restaurant'
    };
  }
}
