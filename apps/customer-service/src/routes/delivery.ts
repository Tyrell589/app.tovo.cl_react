/**
 * @fileoverview Delivery routes for delivery management
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, authenticateCustomer, requireRole } from '../middleware/auth';
import { DeliveryController } from '../controllers/DeliveryController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const deliveryController = new DeliveryController();

// Validation middleware
const validateDeliveryRequest = [
  body('orden_codigo')
    .isInt({ min: 1 })
    .withMessage('Valid order ID is required'),
  body('direccion')
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 10, max: 200 })
    .withMessage('Address must be between 10 and 200 characters'),
  body('ciudad')
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('telefono')
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 8, max: 15 })
    .withMessage('Phone number must be between 8 and 15 characters'),
  body('instrucciones')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Instructions must be less than 500 characters')
];

/**
 * @route POST /api/delivery/calculate-fee
 * @desc Calculate delivery fee
 * @access Public
 */
router.post('/calculate-fee', 
  [
    body('latitud')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude is required and must be between -90 and 90'),
    body('longitud')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude is required and must be between -180 and 180'),
    body('monto_orden')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Order amount must be a positive number')
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

    const result = await deliveryController.calculateDeliveryFee(req.body);
    res.json(result);
  })
);

/**
 * @route POST /api/delivery/request
 * @desc Request delivery
 * @access Private (Customer)
 */
router.post('/request', 
  authenticateCustomer,
  validateDeliveryRequest,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await deliveryController.requestDelivery(req.body, req.customer!.cli_codigo);
    res.status(201).json(result);
  })
);

/**
 * @route GET /api/delivery/requests
 * @desc Get delivery requests
 * @access Private (Admin)
 */
router.get('/requests', 
  authenticateToken,
  requireRole(['manage_deliveries']),
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
      .isIn(['pendiente', 'asignado', 'en_camino', 'entregado', 'cancelado'])
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
    const estado = req.query.estado as string;
    
    const result = await deliveryController.getDeliveryRequests(page, limit, estado);
    res.json(result);
  })
);

/**
 * @route GET /api/delivery/requests/:id
 * @desc Get delivery request by ID
 * @access Private
 */
router.get('/requests/:id', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const deliveryId = parseInt(req.params.id);
    if (isNaN(deliveryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid delivery ID'
      } as ApiResponse);
    }

    const result = await deliveryController.getDeliveryRequestById(deliveryId);
    res.json(result);
  })
);

/**
 * @route POST /api/delivery/requests/:id/update-status
 * @desc Update delivery status
 * @access Private
 */
router.post('/requests/:id/update-status', 
  authenticateToken,
  [
    body('estado')
      .isIn(['pendiente', 'asignado', 'en_camino', 'entregado', 'cancelado'])
      .withMessage('Invalid status'),
    body('comentarios')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Comments must be less than 200 characters')
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

    const deliveryId = parseInt(req.params.id);
    const { estado, comentarios } = req.body;
    
    if (isNaN(deliveryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid delivery ID'
      } as ApiResponse);
    }

    const result = await deliveryController.updateDeliveryStatus(deliveryId, estado, comentarios);
    res.json(result);
  })
);

/**
 * @route GET /api/delivery/requests/:id/track
 * @desc Track delivery
 * @access Private
 */
router.get('/requests/:id/track', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const deliveryId = parseInt(req.params.id);
    if (isNaN(deliveryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid delivery ID'
      } as ApiResponse);
    }

    const result = await deliveryController.trackDelivery(deliveryId);
    res.json(result);
  })
);

/**
 * @route POST /api/delivery/requests/:id/cancel
 * @desc Cancel delivery
 * @access Private
 */
router.post('/requests/:id/cancel', 
  authenticateToken,
  [
    body('motivo')
      .notEmpty()
      .withMessage('Cancellation reason is required')
      .isLength({ max: 200 })
      .withMessage('Reason must be less than 200 characters')
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

    const deliveryId = parseInt(req.params.id);
    const { motivo } = req.body;
    
    if (isNaN(deliveryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid delivery ID'
      } as ApiResponse);
    }

    const result = await deliveryController.cancelDelivery(deliveryId, motivo);
    res.json(result);
  })
);

/**
 * @route GET /api/delivery/stats
 * @desc Get delivery statistics
 * @access Private (Admin)
 */
router.get('/stats', 
  authenticateToken,
  requireRole(['view_deliveries']),
  asyncHandler(async (req, res) => {
    const result = await deliveryController.getDeliveryStats();
    res.json(result);
  })
);

export { router as deliveryRoutes };
