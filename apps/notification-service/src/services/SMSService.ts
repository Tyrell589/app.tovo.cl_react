/**
 * @fileoverview SMS service for sending SMS notifications
 */

import twilio from 'twilio';

export class SMSService {
  private client: twilio.Twilio | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize SMS service
   */
  async initialize(): Promise<void> {
    try {
      if (process.env.SMS_ENABLED !== 'true') {
        console.log('📱 SMS service disabled');
        return;
      }

      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (!accountSid || !authToken) {
        throw new Error('Twilio credentials not provided');
      }

      this.client = twilio(accountSid, authToken);
      this.isInitialized = true;
      console.log('📱 SMS service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SMS service:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Get SMS service status
   */
  async getStatus(): Promise<{ enabled: boolean; initialized: boolean; error?: string }> {
    return {
      enabled: process.env.SMS_ENABLED === 'true',
      initialized: this.isInitialized,
      error: this.isInitialized ? undefined : 'SMS service not initialized'
    };
  }

  /**
   * Send SMS notification
   */
  async sendSMS(data: {
    to: string;
    message: string;
  }): Promise<any> {
    try {
      if (!this.isInitialized || !this.client) {
        throw new Error('SMS service not initialized');
      }

      const { to, message } = data;

      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });

      console.log(`📱 SMS sent successfully to ${to}: ${result.sid}`);
      
      return {
        sid: result.sid,
        status: result.status,
        to: result.to,
        from: result.from,
        body: result.body,
        dateCreated: result.dateCreated
      };
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw error;
    }
  }

  /**
   * Send order confirmation SMS
   */
  async sendOrderConfirmation(orderData: any): Promise<any> {
    const message = `Order Confirmation #${orderData.order_id}\nTotal: $${orderData.total}\nStatus: ${orderData.status}\nThank you for your order!`;
    
    return this.sendSMS({
      to: orderData.customer.phone,
      message
    });
  }

  /**
   * Send order status update SMS
   */
  async sendOrderStatusUpdate(orderData: any): Promise<any> {
    const message = `Order Update #${orderData.order_id}\nStatus: ${orderData.status}\n${orderData.message || 'Your order status has been updated.'}`;
    
    return this.sendSMS({
      to: orderData.customer.phone,
      message
    });
  }

  /**
   * Send delivery notification SMS
   */
  async sendDeliveryNotification(deliveryData: any): Promise<any> {
    const message = `Delivery Update #${deliveryData.order_id}\nYour delivery is on its way!\nEstimated time: ${deliveryData.estimated_time}\nDriver: ${deliveryData.driver_name || 'TovoCL Driver'}`;
    
    return this.sendSMS({
      to: deliveryData.customer.phone,
      message
    });
  }

  /**
   * Send low stock alert SMS
   */
  async sendLowStockAlert(alertData: any): Promise<any> {
    const items = alertData.items.map((item: any) => `${item.name} (${item.stock} ${item.unit})`).join(', ');
    const message = `Low Stock Alert\nItems running low: ${items}\nPlease restock soon.`;
    
    return this.sendSMS({
      to: alertData.phone,
      message
    });
  }

  /**
   * Send system notification SMS
   */
  async sendSystemNotification(notificationData: any): Promise<any> {
    const message = `System Notification\n${notificationData.message}`;
    
    return this.sendSMS({
      to: notificationData.phone,
      message
    });
  }

  /**
   * Send verification code SMS
   */
  async sendVerificationCode(phone: string, code: string): Promise<any> {
    const message = `Your TovoCL verification code is: ${code}\nThis code will expire in 10 minutes.`;
    
    return this.sendSMS({
      to: phone,
      message
    });
  }

  /**
   * Send password reset SMS
   */
  async sendPasswordReset(phone: string, resetLink: string): Promise<any> {
    const message = `Password Reset\nClick here to reset your password: ${resetLink}\nThis link will expire in 1 hour.`;
    
    return this.sendSMS({
      to: phone,
      message
    });
  }

  /**
   * Send promotional SMS
   */
  async sendPromotionalSMS(phone: string, promotion: any): Promise<any> {
    const message = `Special Offer!\n${promotion.title}\n${promotion.description}\nValid until: ${promotion.expiry_date}`;
    
    return this.sendSMS({
      to: phone,
      message
    });
  }

  /**
   * Send appointment reminder SMS
   */
  async sendAppointmentReminder(appointmentData: any): Promise<any> {
    const message = `Appointment Reminder\nYou have an appointment at ${appointmentData.time} on ${appointmentData.date}\nLocation: ${appointmentData.location}`;
    
    return this.sendSMS({
      to: appointmentData.phone,
      message
    });
  }

  /**
   * Send payment confirmation SMS
   */
  async sendPaymentConfirmation(paymentData: any): Promise<any> {
    const message = `Payment Confirmation\nOrder #${paymentData.order_id}\nAmount: $${paymentData.amount}\nPayment Method: ${paymentData.method}\nThank you for your payment!`;
    
    return this.sendSMS({
      to: paymentData.phone,
      message
    });
  }

  /**
   * Send refund notification SMS
   */
  async sendRefundNotification(refundData: any): Promise<any> {
    const message = `Refund Processed\nOrder #${refundData.order_id}\nRefund Amount: $${refundData.amount}\nRefund Method: ${refundData.method}\nThe refund will appear in your account within 3-5 business days.`;
    
    return this.sendSMS({
      to: refundData.phone,
      message
    });
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSMS(recipients: string[], message: string): Promise<any[]> {
    try {
      if (!this.isInitialized || !this.client) {
        throw new Error('SMS service not initialized');
      }

      const results = [];
      
      for (const recipient of recipients) {
        try {
          const result = await this.sendSMS({ to: recipient, message });
          results.push({ recipient, success: true, result });
        } catch (error) {
          results.push({ recipient, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to send bulk SMS:', error);
      throw error;
    }
  }

  /**
   * Get SMS delivery status
   */
  async getDeliveryStatus(messageSid: string): Promise<any> {
    try {
      if (!this.isInitialized || !this.client) {
        throw new Error('SMS service not initialized');
      }

      const message = await this.client.messages(messageSid).fetch();
      
      return {
        sid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        body: message.body,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated,
        dateSent: message.dateSent,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };
    } catch (error) {
      console.error('Failed to get SMS delivery status:', error);
      throw error;
    }
  }
}
