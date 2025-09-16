/**
 * @fileoverview KDS routes for kitchen display system
 */

import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { KDSController } from '../controllers/KDSController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const kdsController = new KDSController();

/**
 * @route GET /api/kds/display
 * @desc Get kitchen display data
 * @access Public
 */
router.get('/display', 
  [
    query('kitchen_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Kitchen ID must be a positive integer'),
    query('station')
      .optional()
      .isIn(['grill', 'salad', 'pizza', 'dessert', 'beverage'])
      .withMessage('Invalid station'),
    query('status')
      .optional()
      .isIn(['pendiente', 'en_preparacion', 'listo', 'entregado'])
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

    const kitchenId = req.query.kitchen_id ? parseInt(req.query.kitchen_id as string) : undefined;
    const station = req.query.station as string;
    const status = req.query.status as string;
    
    const result = await kdsController.getKitchenDisplay(kitchenId, station, status);
    res.json(result);
  })
);

/**
 * @route GET /api/kds/orders
 * @desc Get active orders for kitchen
 * @access Public
 */
router.get('/orders', 
  [
    query('kitchen_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Kitchen ID must be a positive integer'),
    query('station')
      .optional()
      .isIn(['grill', 'salad', 'pizza', 'dessert', 'beverage'])
      .withMessage('Invalid station'),
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

    const kitchenId = req.query.kitchen_id ? parseInt(req.query.kitchen_id as string) : undefined;
    const station = req.query.station as string;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await kdsController.getActiveOrders(kitchenId, station, limit);
    res.json(result);
  })
);

/**
 * @route GET /api/kds/orders/:id
 * @desc Get specific order details
 * @access Public
 */
router.get('/orders/:id', 
  asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      } as ApiResponse);
    }

    const result = await kdsController.getOrderDetails(orderId);
    res.json(result);
  })
);

/**
 * @route POST /api/kds/orders/:id/start
 * @desc Start order preparation
 * @access Public
 */
router.post('/orders/:id/start', 
  asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id);
    const { station, user_id } = req.body;
    
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      } as ApiResponse);
    }

    const result = await kdsController.startOrderPreparation(orderId, station, user_id);
    res.json(result);
  })
);

/**
 * @route POST /api/kds/orders/:id/complete
 * @desc Complete order preparation
 * @access Public
 */
router.post('/orders/:id/complete', 
  asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.id);
    const { station, user_id, notes } = req.body;
    
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      } as ApiResponse);
    }

    const result = await kdsController.completeOrderPreparation(orderId, station, user_id, notes);
    res.json(result);
  })
);

/**
 * @route GET /api/kds/stations
 * @desc Get kitchen stations
 * @access Public
 */
router.get('/stations', 
  asyncHandler(async (req, res) => {
    const result = await kdsController.getKitchenStations();
    res.json(result);
  })
);

/**
 * @route GET /api/kds/stations/:id/orders
 * @desc Get orders for specific station
 * @access Public
 */
router.get('/stations/:id/orders', 
  asyncHandler(async (req, res) => {
    const stationId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await kdsController.getStationOrders(stationId, limit);
    res.json(result);
  })
);

/**
 * @route GET /api/kds/stats
 * @desc Get kitchen statistics
 * @access Public
 */
router.get('/stats', 
  [
    query('period')
      .optional()
      .isIn(['hour', 'day', 'week', 'month'])
      .withMessage('Period must be hour, day, week, or month')
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

    const period = req.query.period as string || 'day';
    const result = await kdsController.getKitchenStats(period);
    res.json(result);
  })
);

export { router as kdsRoutes };
