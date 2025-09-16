/**
 * @fileoverview Delivery routes for online ordering
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { DeliveryController } from '../controllers/DeliveryController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const deliveryController = new DeliveryController();

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
 * @route GET /api/delivery/track/:orderId
 * @desc Track delivery by order ID
 * @access Public
 */
router.get('/track/:orderId', 
  asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      } as ApiResponse);
    }

    const result = await deliveryController.trackDelivery(orderId);
    res.json(result);
  })
);

/**
 * @route GET /api/delivery/status/:orderId
 * @desc Get delivery status by order ID
 * @access Public
 */
router.get('/status/:orderId', 
  asyncHandler(async (req, res) => {
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      } as ApiResponse);
    }

    const result = await deliveryController.getDeliveryStatus(orderId);
    res.json(result);
  })
);

/**
 * @route GET /api/delivery/estimates
 * @desc Get delivery time estimates
 * @access Public
 */
router.get('/estimates', 
  [
    query('latitud')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude is required and must be between -90 and 90'),
    query('longitud')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude is required and must be between -180 and 180')
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

    const latitud = parseFloat(req.query.latitud as string);
    const longitud = parseFloat(req.query.longitud as string);
    
    const result = await deliveryController.getDeliveryEstimates(latitud, longitud);
    res.json(result);
  })
);

export { router as deliveryRoutes };
