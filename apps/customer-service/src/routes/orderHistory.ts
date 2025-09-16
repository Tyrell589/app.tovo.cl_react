/**
 * @fileoverview Order history routes for customer order tracking
 */

import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, authenticateCustomer, requireRole } from '../middleware/auth';
import { OrderHistoryController } from '../controllers/OrderHistoryController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const orderHistoryController = new OrderHistoryController();

/**
 * @route GET /api/order-history
 * @desc Get customer order history
 * @access Private (Customer)
 */
router.get('/', 
  authenticateCustomer,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('estado')
      .optional()
      .isIn(['pendiente', 'en_proceso', 'listo', 'entregado', 'cancelado'])
      .withMessage('Invalid status'),
    query('fecha_inicio')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO date'),
    query('fecha_fin')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO date')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const estado = req.query.estado as string;
    const fechaInicio = req.query.fecha_inicio as string;
    const fechaFin = req.query.fecha_fin as string;
    
    const result = await orderHistoryController.getCustomerOrderHistory(
      req.customer!.cli_codigo, 
      page, 
      limit, 
      estado, 
      fechaInicio, 
      fechaFin
    );
    res.json(result);
  })
);

/**
 * @route GET /api/order-history/:id
 * @desc Get specific order details
 * @access Private (Customer)
 */
router.get('/:id', 
  authenticateCustomer,
  asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      } as ApiResponse);
    }

    const result = await orderHistoryController.getOrderDetails(
      req.customer!.cli_codigo, 
      orderId
    );
    res.json(result);
  })
);

/**
 * @route GET /api/order-history/stats
 * @desc Get customer order statistics
 * @access Private (Customer)
 */
router.get('/stats', 
  authenticateCustomer,
  asyncHandler(async (req, res) => {
    const result = await orderHistoryController.getCustomerOrderStats(req.customer!.cli_codigo);
    res.json(result);
  })
);

/**
 * @route GET /api/order-history/favorites
 * @desc Get customer favorite products
 * @access Private (Customer)
 */
router.get('/favorites', 
  authenticateCustomer,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Limit must be between 1 and 20')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const result = await orderHistoryController.getCustomerFavorites(req.customer!.cli_codigo, limit);
    res.json(result);
  })
);

/**
 * @route GET /api/order-history/recent
 * @desc Get recent orders
 * @access Private (Customer)
 */
router.get('/recent', 
  authenticateCustomer,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Limit must be between 1 and 10')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const limit = parseInt(req.query.limit as string) || 5;
    const result = await orderHistoryController.getRecentOrders(req.customer!.cli_codigo, limit);
    res.json(result);
  })
);

/**
 * @route GET /api/order-history/all
 * @desc Get all customer orders (Admin)
 * @access Private (Admin)
 */
router.get('/all', 
  authenticateToken,
  requireRole(['view_orders']),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('customer_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Customer ID must be a positive integer'),
    query('estado')
      .optional()
      .isIn(['pendiente', 'en_proceso', 'listo', 'entregado', 'cancelado'])
      .withMessage('Invalid status'),
    query('fecha_inicio')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO date'),
    query('fecha_fin')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO date')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const customerId = req.query.customer_id ? parseInt(req.query.customer_id as string) : undefined;
    const estado = req.query.estado as string;
    const fechaInicio = req.query.fecha_inicio as string;
    const fechaFin = req.query.fecha_fin as string;
    
    const result = await orderHistoryController.getAllOrders(
      page, 
      limit, 
      customerId, 
      estado, 
      fechaInicio, 
      fechaFin
    );
    res.json(result);
  })
);

export { router as orderHistoryRoutes };
