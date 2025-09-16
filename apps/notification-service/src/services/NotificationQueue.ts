/**
 * @fileoverview Notification queue service for managing notification jobs
 */

import Queue from 'bull';
import { EmailService } from './EmailService';
import { SMSService } from './SMSService';
import { PushNotificationService } from './PushNotificationService';
import { SocketManager } from './SocketManager';

export class NotificationQueue {
  private emailQueue: Queue.Queue;
  private smsQueue: Queue.Queue;
  private pushQueue: Queue.Queue;
  private realtimeQueue: Queue.Queue;
  private emailService: EmailService;
  private smsService: SMSService;
  private pushNotificationService: PushNotificationService;
  private socketManager: SocketManager | null = null;

  constructor() {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0')
    };

    // Initialize queues
    this.emailQueue = new Queue('email notifications', { redis: redisConfig });
    this.smsQueue = new Queue('sms notifications', { redis: redisConfig });
    this.pushQueue = new Queue('push notifications', { redis: redisConfig });
    this.realtimeQueue = new Queue('realtime notifications', { redis: redisConfig });

    // Initialize services
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.pushNotificationService = new PushNotificationService();

    this.setupQueueProcessors();
  }

  /**
   * Set socket manager for real-time updates
   */
  setSocketManager(socketManager: SocketManager): void {
    this.socketManager = socketManager;
  }

  /**
   * Start the notification queue
   */
  async start(): Promise<void> {
    try {
      console.log('🚀 Notification queues started');
    } catch (error) {
      console.error('Failed to start notification queues:', error);
      throw error;
    }
  }

  /**
   * Stop the notification queue
   */
  async stop(): Promise<void> {
    try {
      await Promise.all([
        this.emailQueue.close(),
        this.smsQueue.close(),
        this.pushQueue.close(),
        this.realtimeQueue.close()
      ]);
      console.log('🛑 Notification queues stopped');
    } catch (error) {
      console.error('Failed to stop notification queues:', error);
      throw error;
    }
  }

  /**
   * Get queue status
   */
  async getStatus(): Promise<any> {
    try {
      const [emailStats, smsStats, pushStats, realtimeStats] = await Promise.all([
        this.emailQueue.getJobCounts(),
        this.smsQueue.getJobCounts(),
        this.pushQueue.getJobCounts(),
        this.realtimeQueue.getJobCounts()
      ]);

      return {
        email: emailStats,
        sms: smsStats,
        push: pushStats,
        realtime: realtimeStats,
        total: {
          waiting: emailStats.waiting + smsStats.waiting + pushStats.waiting + realtimeStats.waiting,
          active: emailStats.active + smsStats.active + pushStats.active + realtimeStats.active,
          completed: emailStats.completed + smsStats.completed + pushStats.completed + realtimeStats.completed,
          failed: emailStats.failed + smsStats.failed + pushStats.failed + realtimeStats.failed
        }
      };
    } catch (error) {
      console.error('Failed to get queue status:', error);
      return { error: 'Failed to get queue status' };
    }
  }

  /**
   * Add email notification to queue
   */
  async addEmailNotification(data: any, options?: any): Promise<void> {
    try {
      await this.emailQueue.add('send-email', data, {
        attempts: parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS || '3'),
        backoff: {
          type: 'exponential',
          delay: parseInt(process.env.NOTIFICATION_RETRY_DELAY || '5000')
        },
        ...options
      });
    } catch (error) {
      console.error('Failed to add email notification to queue:', error);
      throw error;
    }
  }

  /**
   * Add SMS notification to queue
   */
  async addSMSNotification(data: any, options?: any): Promise<void> {
    try {
      await this.smsQueue.add('send-sms', data, {
        attempts: parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS || '3'),
        backoff: {
          type: 'exponential',
          delay: parseInt(process.env.NOTIFICATION_RETRY_DELAY || '5000')
        },
        ...options
      });
    } catch (error) {
      console.error('Failed to add SMS notification to queue:', error);
      throw error;
    }
  }

  /**
   * Add push notification to queue
   */
  async addPushNotification(data: any, options?: any): Promise<void> {
    try {
      await this.pushQueue.add('send-push', data, {
        attempts: parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS || '3'),
        backoff: {
          type: 'exponential',
          delay: parseInt(process.env.NOTIFICATION_RETRY_DELAY || '5000')
        },
        ...options
      });
    } catch (error) {
      console.error('Failed to add push notification to queue:', error);
      throw error;
    }
  }

  /**
   * Add real-time notification to queue
   */
  async addRealtimeNotification(data: any, options?: any): Promise<void> {
    try {
      await this.realtimeQueue.add('send-realtime', data, {
        attempts: 1, // Real-time notifications don't need retries
        ...options
      });
    } catch (error) {
      console.error('Failed to add real-time notification to queue:', error);
      throw error;
    }
  }

  /**
   * Setup queue processors
   */
  private setupQueueProcessors(): void {
    // Email queue processor
    this.emailQueue.process('send-email', async (job) => {
      try {
        const { to, subject, template, data, userId } = job.data;
        
        const result = await this.emailService.sendEmail({
          to,
          subject,
          template,
          data
        });

        // Send status update via socket
        if (this.socketManager && userId) {
          this.socketManager.sendEmailStatusUpdate(job.id.toString(), {
            status: 'sent',
            result
          });
        }

        return result;
      } catch (error) {
        console.error('Email notification failed:', error);
        
        // Send error status update via socket
        if (this.socketManager) {
          this.socketManager.sendEmailStatusUpdate(job.id.toString(), {
            status: 'failed',
            error: error.message
          });
        }
        
        throw error;
      }
    });

    // SMS queue processor
    this.smsQueue.process('send-sms', async (job) => {
      try {
        const { to, message, userId } = job.data;
        
        const result = await this.smsService.sendSMS({
          to,
          message
        });

        // Send status update via socket
        if (this.socketManager && userId) {
          this.socketManager.sendSMSStatusUpdate(job.id.toString(), {
            status: 'sent',
            result
          });
        }

        return result;
      } catch (error) {
        console.error('SMS notification failed:', error);
        
        // Send error status update via socket
        if (this.socketManager) {
          this.socketManager.sendSMSStatusUpdate(job.id.toString(), {
            status: 'failed',
            error: error.message
          });
        }
        
        throw error;
      }
    });

    // Push notification queue processor
    this.pushQueue.process('send-push', async (job) => {
      try {
        const { to, title, body, data, userId } = job.data;
        
        const result = await this.pushNotificationService.sendPushNotification({
          to,
          title,
          body,
          data
        });

        // Send status update via socket
        if (this.socketManager && userId) {
          this.socketManager.sendPushStatusUpdate(job.id.toString(), {
            status: 'sent',
            result
          });
        }

        return result;
      } catch (error) {
        console.error('Push notification failed:', error);
        
        // Send error status update via socket
        if (this.socketManager) {
          this.socketManager.sendPushStatusUpdate(job.id.toString(), {
            status: 'failed',
            error: error.message
          });
        }
        
        throw error;
      }
    });

    // Real-time notification queue processor
    this.realtimeQueue.process('send-realtime', async (job) => {
      try {
        const { type, data, userId, roleId } = job.data;
        
        // Send real-time notification via socket
        if (this.socketManager) {
          if (userId) {
            this.socketManager.sendToUser(userId, { type, ...data });
          } else if (roleId) {
            this.socketManager.sendToRole(roleId, { type, ...data });
          } else {
            this.socketManager.sendBroadcast({ type, ...data });
          }
        }

        return { status: 'sent' };
      } catch (error) {
        console.error('Real-time notification failed:', error);
        throw error;
      }
    });

    // Queue event handlers
    this.emailQueue.on('completed', (job) => {
      console.log(`✅ Email notification completed: ${job.id}`);
    });

    this.emailQueue.on('failed', (job, err) => {
      console.error(`❌ Email notification failed: ${job.id}`, err);
    });

    this.smsQueue.on('completed', (job) => {
      console.log(`✅ SMS notification completed: ${job.id}`);
    });

    this.smsQueue.on('failed', (job, err) => {
      console.error(`❌ SMS notification failed: ${job.id}`, err);
    });

    this.pushQueue.on('completed', (job) => {
      console.log(`✅ Push notification completed: ${job.id}`);
    });

    this.pushQueue.on('failed', (job, err) => {
      console.error(`❌ Push notification failed: ${job.id}`, err);
    });

    this.realtimeQueue.on('completed', (job) => {
      console.log(`✅ Real-time notification completed: ${job.id}`);
    });

    this.realtimeQueue.on('failed', (job, err) => {
      console.error(`❌ Real-time notification failed: ${job.id}`, err);
    });
  }
}
