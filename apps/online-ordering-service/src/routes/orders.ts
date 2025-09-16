/**
 * @fileoverview Order routes for online ordering
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';
import { OrderController } from '../controllers/OrderController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const orderController = new OrderController();

// Validation middleware
const validateCreateOrder = [
  body('cart_id')
    .notEmpty()
    .withMessage('Cart ID is required'),
  body('customer_info')
    .isObject()
    .withMessage('Customer info is required'),
  body('customer_info.nombre')
    .notEmpty()
    .withMessage('Customer name is required'),
  body('customer_info.telefono')
    .notEmpty()
    .withMessage('Customer phone is required'),
  body('customer_info.email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('delivery_info')
    .isObject()
    .withMessage('Delivery info is required'),
  body('delivery_info.direccion')
    .notEmpty()
    .withMessage('Delivery address is required'),
  body('delivery_info.ciudad')
    .notEmpty()
    .withMessage('Delivery city is required'),
  body('payment_method')
    .isIn(['efectivo', 'tarjeta', 'transferencia'])
    .withMessage('Payment method must be efectivo, tarjeta, or transferencia')
];

/**
 * @route POST /api/orders
 * @desc Create new order
 * @access Public
 */
router.post('/', 
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

    const result = await orderController.createOrder(req.body);
    res.status(201).json(result);
  })
);

/**
 * @route GET /api/orders/:id
 * @desc Get order by ID
 * @access Public
 */
router.get('/:id', 
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
 * @route GET /api/orders/tracking/:trackingCode
 * @desc Track order by tracking code
 * @access Public
 */
router.get('/tracking/:trackingCode', 
  asyncHandler(async (req, res) => {
    const trackingCode = req.params.trackingCode;
    if (!trackingCode) {
      return res.status(400).json({
        success: false,
        error: 'Tracking code is required'
      } as ApiResponse);
    }

    const result = await orderController.trackOrder(trackingCode);
    res.json(result);
  })
);

/**
 * @route GET /api/orders
 * @desc Get all orders (Admin)
 * @access Private (Admin)
 */
router.get('/', 
  optionalAuth,
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
      .isIn(['pendiente', 'confirmado', 'en_preparacion', 'listo', 'en_camino', 'entregado', 'cancelado'])
      .withMessage('Invalid status')
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
    
    const result = await orderController.getAllOrders(page, limit, status);
    res.json(result);
  })
);

export { router as orderRoutes };
