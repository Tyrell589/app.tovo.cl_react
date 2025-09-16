/**
 * @fileoverview Notification Service for TovoCL restaurant management system
 * Handles real-time notifications, email notifications, SMS integration, and push notifications
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDatabase, disconnectDatabase } from '@tovocl/database';
import { notificationRoutes } from './routes/notifications';
import { emailRoutes } from './routes/email';
import { smsRoutes } from './routes/sms';
import { pushRoutes } from './routes/push';
import { templateRoutes } from './routes/templates';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { validateEnv } from './utils/validateEnv';
import { SocketManager } from './services/SocketManager';
import { NotificationQueue } from './services/NotificationQueue';
import { EmailService } from './services/EmailService';
import { SMSService } from './services/SMSService';
import { PushNotificationService } from './services/PushNotificationService';

// Load environment variables
dotenv.config();

// Validate required environment variables
validateEnv();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3009;

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Initialize services
const socketManager = new SocketManager(io);
const notificationQueue = new NotificationQueue();
const emailService = new EmailService();
const smsService = new SMSService();
const pushNotificationService = new PushNotificationService();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { healthCheck } = await import('@tovocl/database');
    const dbHealth = await healthCheck();
    
    res.json({
      success: true,
      service: 'notification-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      socketConnections: io.engine.clientsCount,
      queue: await notificationQueue.getStatus(),
      email: await emailService.getStatus(),
      sms: await smsService.getStatus(),
      push: await pushNotificationService.getStatus()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'notification-service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/templates', templateRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Notification Client connected: ${socket.id}`);
  
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} connected: ${socket.id}`);
  });
  
  socket.on('join-role', (roleId) => {
    socket.join(`role-${roleId}`);
    console.log(`👥 Role ${roleId} connected: ${socket.id}`);
  });
  
  socket.on('join-notification', (notificationId) => {
    socket.join(`notification-${notificationId}`);
    console.log(`🔔 Notification ${notificationId} connected: ${socket.id}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 Notification Client disconnected: ${socket.id}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await notificationQueue.stop();
  await disconnectDatabase();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await notificationQueue.stop();
  await disconnectDatabase();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Initialize services
    await emailService.initialize();
    await smsService.initialize();
    await pushNotificationService.initialize();
    
    // Start notification queue
    await notificationQueue.start();
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`🚀 Notification Service running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔔 Notifications API: http://localhost:${PORT}/api/notifications`);
      console.log(`📧 Email API: http://localhost:${PORT}/api/email`);
      console.log(`📱 SMS API: http://localhost:${PORT}/api/sms`);
      console.log(`🔔 Push API: http://localhost:${PORT}/api/push`);
      console.log(`📄 Templates API: http://localhost:${PORT}/api/templates`);
      console.log(`🔌 Socket.IO ready for real-time notifications`);
    });
  } catch (error) {
    console.error('❌ Failed to start Notification Service:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;
