/**
 * @fileoverview Notification routes
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { NotificationController } from '../controllers/NotificationController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const notificationController = new NotificationController();

/**
 * @route POST /api/notifications/send
 * @desc Send notification
 * @access Public
 */
router.post('/send', 
  [
    body('type')
      .isIn(['email', 'sms', 'push', 'realtime'])
      .withMessage('Type must be email, sms, push, or realtime'),
    body('recipients')
      .isArray({ min: 1 })
      .withMessage('Recipients must be a non-empty array'),
    body('title')
      .notEmpty()
      .withMessage('Title is required'),
    body('message')
      .notEmpty()
      .withMessage('Message is required'),
    body('data')
      .optional()
      .isObject()
      .withMessage('Data must be an object')
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

    const result = await notificationController.sendNotification(req.body);
    res.json(result);
  })
);

/**
 * @route GET /api/notifications/history
 * @desc Get notification history
 * @access Public
 */
router.get('/history', 
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('type')
      .optional()
      .isIn(['email', 'sms', 'push', 'realtime'])
      .withMessage('Type must be email, sms, push, or realtime'),
    query('status')
      .optional()
      .isIn(['pending', 'sent', 'failed'])
      .withMessage('Status must be pending, sent, or failed')
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
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const status = req.query.status as string;
    
    const result = await notificationController.getNotificationHistory(page, limit, type, status);
    res.json(result);
  })
);

/**
 * @route GET /api/notifications/stats
 * @desc Get notification statistics
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
    const result = await notificationController.getNotificationStats(period);
    res.json(result);
  })
);

/**
 * @route POST /api/notifications/test
 * @desc Test notification
 * @access Public
 */
router.post('/test', 
  [
    body('type')
      .isIn(['email', 'sms', 'push', 'realtime'])
      .withMessage('Type must be email, sms, push, or realtime'),
    body('recipient')
      .notEmpty()
      .withMessage('Recipient is required')
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

    const result = await notificationController.testNotification(req.body);
    res.json(result);
  })
);

export { router as notificationRoutes };
