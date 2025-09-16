/**
 * @fileoverview Reporting & Analytics Service for TovoCL restaurant management system
 * Handles sales reports, inventory reports, performance metrics, and data export functionality
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDatabase, disconnectDatabase } from '@tovocl/database';
import { salesRoutes } from './routes/sales';
import { inventoryRoutes } from './routes/inventory';
import { performanceRoutes } from './routes/performance';
import { exportRoutes } from './routes/export';
import { analyticsRoutes } from './routes/analytics';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { validateEnv } from './utils/validateEnv';
import { SocketManager } from './services/SocketManager';
import { ReportScheduler } from './services/ReportScheduler';

// Load environment variables
dotenv.config();

// Validate required environment variables
validateEnv();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3008;

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Initialize services
const socketManager = new SocketManager(io);
const reportScheduler = new ReportScheduler();

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
      service: 'reporting-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      socketConnections: io.engine.clientsCount,
      scheduler: reportScheduler.getStatus()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'reporting-service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API routes
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/analytics', analyticsRoutes);

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
  console.log(`🔌 Reporting Client connected: ${socket.id}`);
  
  socket.on('join-dashboard', (dashboardId) => {
    socket.join(`dashboard-${dashboardId}`);
    console.log(`📊 Dashboard ${dashboardId} connected: ${socket.id}`);
  });
  
  socket.on('join-report', (reportId) => {
    socket.join(`report-${reportId}`);
    console.log(`📈 Report ${reportId} connected: ${socket.id}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 Reporting Client disconnected: ${socket.id}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await reportScheduler.stop();
  await disconnectDatabase();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await reportScheduler.stop();
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
    
    // Start report scheduler
    if (process.env.REPORT_SCHEDULE_ENABLED === 'true') {
      await reportScheduler.start();
    }
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`🚀 Reporting & Analytics Service running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`💰 Sales Reports: http://localhost:${PORT}/api/sales`);
      console.log(`📦 Inventory Reports: http://localhost:${PORT}/api/inventory`);
      console.log(`⚡ Performance Metrics: http://localhost:${PORT}/api/performance`);
      console.log(`📤 Data Export: http://localhost:${PORT}/api/export`);
      console.log(`📈 Analytics: http://localhost:${PORT}/api/analytics`);
      console.log(`🔌 Socket.IO ready for real-time reporting updates`);
    });
  } catch (error) {
    console.error('❌ Failed to start Reporting Service:', error);
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
