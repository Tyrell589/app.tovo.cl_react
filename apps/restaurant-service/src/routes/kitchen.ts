/**
 * @fileoverview Kitchen routes for managing kitchen workflow and KDS
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { KitchenController } from '../controllers/KitchenController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const kitchenController = new KitchenController();

// Validation middleware
const validateKitchenAssignment = [
  body('cocina_codigo')
    .isInt({ min: 1 })
    .withMessage('Valid kitchen ID is required'),
  body('usuario_codigo')
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required')
];

/**
 * @route GET /api/kitchen/display
 * @desc Get kitchen display data
 * @access Private
 */
router.get('/display', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await kitchenController.getKitchenDisplay();
    res.json(result);
  })
);

/**
 * @route GET /api/kitchen/orders
 * @desc Get all kitchen orders
 * @access Private
 */
router.get('/orders', 
  authenticateToken,
  [
    query('status')
      .optional()
      .isIn(['pendiente', 'en_proceso', 'listo'])
      .withMessage('Invalid order status'),
    query('cocina_codigo')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Kitchen ID must be a positive integer'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
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

    const status = req.query.status as string;
    const cocinaCodigo = req.query.cocina_codigo ? parseInt(req.query.cocina_codigo as string) : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await kitchenController.getKitchenOrders(status, cocinaCodigo, page, limit);
    res.json(result);
  })
);

/**
 * @route GET /api/kitchen/orders/:id
 * @desc Get kitchen order by ID
 * @access Private
 */
router.get('/orders/:id', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      } as ApiResponse);
    }

    const result = await kitchenController.getKitchenOrderById(orderId);
    res.json(result);
  })
);

/**
 * @route POST /api/kitchen/orders/:id/start
 * @desc Start order in kitchen
 * @access Private
 */
router.post('/orders/:id/start', 
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

    const result = await kitchenController.startOrder(orderId, req.user!.usu_codigo);
    res.json(result);
  })
);

/**
 * @route POST /api/kitchen/orders/:id/complete
 * @desc Complete order in kitchen
 * @access Private
 */
router.post('/orders/:id/complete', 
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

    const result = await kitchenController.completeOrder(orderId, req.user!.usu_codigo);
    res.json(result);
  })
);

/**
 * @route POST /api/kitchen/orders/:id/pause
 * @desc Pause order in kitchen
 * @access Private
 */
router.post('/orders/:id/pause', 
  authenticateToken,
  requireRole(['kitchen_orders']),
  [
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
    const { comentarios } = req.body;
    
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      } as ApiResponse);
    }

    const result = await kitchenController.pauseOrder(orderId, comentarios, req.user!.usu_codigo);
    res.json(result);
  })
);

/**
 * @route GET /api/kitchen/stations
 * @desc Get kitchen stations
 * @access Private
 */
router.get('/stations', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await kitchenController.getKitchenStations();
    res.json(result);
  })
);

/**
 * @route GET /api/kitchen/stations/:id
 * @desc Get kitchen station by ID
 * @access Private
 */
router.get('/stations/:id', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const stationId = parseInt(req.params.id);
    if (isNaN(stationId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid station ID'
      } as ApiResponse);
    }

    const result = await kitchenController.getKitchenStationById(stationId);
    res.json(result);
  })
);

/**
 * @route POST /api/kitchen/stations/:id/assign
 * @desc Assign user to kitchen station
 * @access Private
 */
router.post('/stations/:id/assign', 
  authenticateToken,
  requireRole(['manage_kitchen']),
  validateKitchenAssignment,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const stationId = parseInt(req.params.id);
    const { usuario_codigo } = req.body;
    
    if (isNaN(stationId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid station ID'
      } as ApiResponse);
    }

    const result = await kitchenController.assignUserToStation(stationId, usuario_codigo);
    res.json(result);
  })
);

/**
 * @route GET /api/kitchen/stats
 * @desc Get kitchen statistics
 * @access Private
 */
router.get('/stats', 
  authenticateToken,
  [
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

    const fechaInicio = req.query.fecha_inicio as string;
    const fechaFin = req.query.fecha_fin as string;
    
    const result = await kitchenController.getKitchenStats(fechaInicio, fechaFin);
    res.json(result);
  })
);

/**
 * @route GET /api/kitchen/queue
 * @desc Get kitchen queue status
 * @access Private
 */
router.get('/queue', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await kitchenController.getKitchenQueue();
    res.json(result);
  })
);

export { router as kitchenRoutes };
