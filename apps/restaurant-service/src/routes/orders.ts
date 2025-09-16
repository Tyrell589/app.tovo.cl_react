/**
 * @fileoverview Order routes for managing restaurant orders
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { OrderController } from '../controllers/OrderController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const orderController = new OrderController();

// Validation middleware
const validateCreateOrder = [
  body('mesa_codigo')
    .isInt({ min: 1 })
    .withMessage('Valid table ID is required'),
  body('cliente_codigo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid client ID is required'),
  body('productos')
    .isArray({ min: 1 })
    .withMessage('At least one product is required'),
  body('productos.*.producto_id')
    .isInt({ min: 1 })
    .withMessage('Valid product ID is required'),
  body('productos.*.cantidad')
    .isFloat({ min: 0.01 })
    .withMessage('Valid quantity is required'),
  body('productos.*.tipo')
    .isIn(['plato', 'bebida'])
    .withMessage('Product type must be plato or bebida')
];

const validateUpdateOrder = [
  body('estado')
    .optional()
    .isIn(['pendiente', 'en_proceso', 'listo', 'entregado', 'cancelado'])
    .withMessage('Invalid order status'),
  body('comentarios')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Comments must be less than 500 characters')
];

/**
 * @route GET /api/orders
 * @desc Get all orders with pagination and filters
 * @access Private
 */
router.get('/', 
  authenticateToken,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['pendiente', 'en_proceso', 'listo', 'entregado', 'cancelado'])
      .withMessage('Invalid order status'),
    query('mesa_codigo')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Table ID must be a positive integer'),
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
    const status = req.query.status as string;
    const mesaCodigo = req.query.mesa_codigo ? parseInt(req.query.mesa_codigo as string) : undefined;
    const fechaInicio = req.query.fecha_inicio as string;
    const fechaFin = req.query.fecha_fin as string;
    
    const result = await orderController.getOrders(page, limit, status, mesaCodigo, fechaInicio, fechaFin);
    res.json(result);
  })
);

/**
 * @route GET /api/orders/:id
 * @desc Get order by ID
 * @access Private
 */
router.get('/:id', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      } as ApiResponse);
    }

    const result = await orderController.getOrderById(orderId);
    res.json(result);
  })
);

/**
 * @route POST /api/orders
 * @desc Create new order
 * @access Private
 */
router.post('/', 
  authenticateToken, 
  requireRole(['create_orders']),
  validateCreateOrder,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await orderController.createOrder(req.body, req.user!.usu_codigo);
    res.status(201).json(result);
  })
);

/**
 * @route PUT /api/orders/:id
 * @desc Update order
 * @access Private
 */
router.put('/:id', 
  authenticateToken,
  requireRole(['update_orders']),
  validateUpdateOrder,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      } as ApiResponse);
    }

    const result = await orderController.updateOrder(orderId, req.body, req.user!.usu_codigo);
    res.json(result);
  })
);

/**
 * @route DELETE /api/orders/:id
 * @desc Cancel order
 * @access Private
 */
router.delete('/:id', 
  authenticateToken, 
  requireRole(['cancel_orders']),
  asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      } as ApiResponse);
    }

    const result = await orderController.cancelOrder(orderId, req.user!.usu_codigo);
    res.json(result);
  })
);

/**
 * @route POST /api/orders/:id/status
 * @desc Update order status
 * @access Private
 */
router.post('/:id/status', 
  authenticateToken,
  requireRole(['update_orders']),
  [
    body('estado')
      .isIn(['pendiente', 'en_proceso', 'listo', 'entregado', 'cancelado'])
      .withMessage('Invalid order status'),
    body('comentarios')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Comments must be less than 500 characters')
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

    const orderId = parseInt(req.params.id);
    const { estado, comentarios } = req.body;
    
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      } as ApiResponse);
    }

    const result = await orderController.updateOrderStatus(orderId, estado, comentarios, req.user!.usu_codigo);
    res.json(result);
  })
);

/**
 * @route POST /api/orders/:id/products
 * @desc Add products to order
 * @access Private
 */
router.post('/:id/products', 
  authenticateToken,
  requireRole(['update_orders']),
  [
    body('productos')
      .isArray({ min: 1 })
      .withMessage('At least one product is required'),
    body('productos.*.producto_id')
      .isInt({ min: 1 })
      .withMessage('Valid product ID is required'),
    body('productos.*.cantidad')
      .isFloat({ min: 0.01 })
      .withMessage('Valid quantity is required'),
    body('productos.*.tipo')
      .isIn(['plato', 'bebida'])
      .withMessage('Product type must be plato or bebida')
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

    const orderId = parseInt(req.params.id);
    const { productos } = req.body;
    
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      } as ApiResponse);
    }

    const result = await orderController.addProductsToOrder(orderId, productos, req.user!.usu_codigo);
    res.json(result);
  })
);

/**
 * @route DELETE /api/orders/:id/products/:productId
 * @desc Remove product from order
 * @access Private
 */
router.delete('/:id/products/:productId', 
  authenticateToken,
  requireRole(['update_orders']),
  asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id);
    const productId = parseInt(req.params.productId);
    
    if (isNaN(orderId) || isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order or product ID'
      } as ApiResponse);
    }

    const result = await orderController.removeProductFromOrder(orderId, productId, req.user!.usu_codigo);
    res.json(result);
  })
);

/**
 * @route GET /api/orders/kitchen/pending
 * @desc Get pending orders for kitchen
 * @access Private
 */
router.get('/kitchen/pending', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await orderController.getKitchenPendingOrders();
    res.json(result);
  })
);

/**
 * @route GET /api/orders/kitchen/in-progress
 * @desc Get in-progress orders for kitchen
 * @access Private
 */
router.get('/kitchen/in-progress', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await orderController.getKitchenInProgressOrders();
    res.json(result);
  })
);

/**
 * @route POST /api/orders/:id/kitchen/start
 * @desc Start order in kitchen
 * @access Private
 */
router.post('/:id/kitchen/start', 
  authenticateToken,
  requireRole(['kitchen_orders']),
  asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id);
    
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      } as ApiResponse);
    }

    const result = await orderController.startOrderInKitchen(orderId, req.user!.usu_codigo);
    res.json(result);
  })
);

/**
 * @route POST /api/orders/:id/kitchen/complete
 * @desc Mark order as ready in kitchen
 * @access Private
 */
router.post('/:id/kitchen/complete', 
  authenticateToken,
  requireRole(['kitchen_orders']),
  asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id);
    
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      } as ApiResponse);
    }

    const result = await orderController.completeOrderInKitchen(orderId, req.user!.usu_codigo);
    res.json(result);
  })
);

export { router as orderRoutes };
