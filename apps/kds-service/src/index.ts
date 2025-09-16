/**
 * @fileoverview Kitchen Display System (KDS) Service for TovoCL restaurant management system
 * Handles real-time order display, kitchen workflow management, order preparation tracking, and printer integration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDatabase, disconnectDatabase } from '@tovocl/database';
import { kdsRoutes } from './routes/kds';
import { printerRoutes } from './routes/printer';
import { workflowRoutes } from './routes/workflow';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { validateEnv } from './utils/validateEnv';
import { SocketManager } from './services/SocketManager';
import { PrinterService } from './services/PrinterService';

// Load environment variables
dotenv.config();

// Validate required environment variables
validateEnv();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3007;

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Initialize services
const socketManager = new SocketManager(io);
const printerService = new PrinterService();

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
      service: 'kds-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      printer: await printerService.healthCheck(),
      socketConnections: io.engine.clientsCount
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'kds-service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API routes
app.use('/api/kds', kdsRoutes);
app.use('/api/printer', printerRoutes);
app.use('/api/workflow', workflowRoutes);

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
  console.log(`🔌 KDS Client connected: ${socket.id}`);
  
  socket.on('join-kitchen', (kitchenId) => {
    socket.join(`kitchen-${kitchenId}`);
    console.log(`👨‍🍳 Kitchen ${kitchenId} connected: ${socket.id}`);
  });
  
  socket.on('join-station', (stationId) => {
    socket.join(`station-${stationId}`);
    console.log(`🍳 Station ${stationId} connected: ${socket.id}`);
  });
  
  socket.on('join-order', (orderId) => {
    socket.join(`order-${orderId}`);
    console.log(`📋 Order ${orderId} connected: ${socket.id}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 KDS Client disconnected: ${socket.id}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await printerService.disconnect();
  await disconnectDatabase();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await printerService.disconnect();
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
    
    // Initialize printer service
    await printerService.initialize();
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`🚀 Kitchen Display System (KDS) Service running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🍳 KDS API: http://localhost:${PORT}/api/kds`);
      console.log(`🖨️ Printer API: http://localhost:${PORT}/api/printer`);
      console.log(`⚙️ Workflow API: http://localhost:${PORT}/api/workflow`);
      console.log(`🔌 Socket.IO ready for real-time kitchen updates`);
    });
  } catch (error) {
    console.error('❌ Failed to start KDS Service:', error);
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
