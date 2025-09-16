/**
 * @fileoverview Workflow routes for kitchen workflow management
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { WorkflowController } from '../controllers/WorkflowController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const workflowController = new WorkflowController();

/**
 * @route GET /api/workflow/stations
 * @desc Get workflow stations
 * @access Public
 */
router.get('/stations', 
  asyncHandler(async (req, res) => {
    const result = await workflowController.getWorkflowStations();
    res.json(result);
  })
);

/**
 * @route GET /api/workflow/queue
 * @desc Get workflow queue
 * @access Public
 */
router.get('/queue', 
  [
    query('station')
      .optional()
      .isIn(['grill', 'salad', 'pizza', 'dessert', 'beverage'])
      .withMessage('Invalid station'),
    query('status')
      .optional()
      .isIn(['pending', 'in_progress', 'ready', 'completed'])
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

    const station = req.query.station as string;
    const status = req.query.status as string;
    
    const result = await workflowController.getWorkflowQueue(station, status);
    res.json(result);
  })
);

/**
 * @route POST /api/workflow/assign
 * @desc Assign order to station
 * @access Public
 */
router.post('/assign', 
  [
    body('order_id')
      .isInt({ min: 1 })
      .withMessage('Valid order ID is required'),
    body('station')
      .notEmpty()
      .withMessage('Station is required'),
    body('user_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Valid user ID is required')
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

    const { order_id, station, user_id } = req.body;
    const result = await workflowController.assignOrderToStation(order_id, station, user_id);
    res.json(result);
  })
);

/**
 * @route POST /api/workflow/complete
 * @desc Complete order at station
 * @access Public
 */
router.post('/complete', 
  [
    body('order_id')
      .isInt({ min: 1 })
      .withMessage('Valid order ID is required'),
    body('station')
      .notEmpty()
      .withMessage('Station is required'),
    body('user_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Valid user ID is required'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes must be less than 500 characters')
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

    const { order_id, station, user_id, notes } = req.body;
    const result = await workflowController.completeOrderAtStation(order_id, station, user_id, notes);
    res.json(result);
  })
);

/**
 * @route GET /api/workflow/stats
 * @desc Get workflow statistics
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
    const result = await workflowController.getWorkflowStats(period);
    res.json(result);
  })
);

export { router as workflowRoutes };
