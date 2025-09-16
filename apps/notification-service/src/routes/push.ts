/**
 * @fileoverview Push notification routes
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { PushController } from '../controllers/PushController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const pushController = new PushController();

/**
 * @route POST /api/push/send
 * @desc Send push notification
 * @access Public
 */
router.post('/send', 
  [
    body('to')
      .isArray({ min: 1 })
      .withMessage('Recipients must be a non-empty array'),
    body('title')
      .notEmpty()
      .withMessage('Title is required'),
    body('body')
      .notEmpty()
      .withMessage('Body is required')
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

    const result = await pushController.sendPushNotification(req.body);
    res.json(result);
  })
);

/**
 * @route POST /api/push/subscribe
 * @desc Subscribe to push notifications
 * @access Public
 */
router.post('/subscribe', 
  [
    body('subscription')
      .isObject()
      .withMessage('Subscription data is required'),
    body('user_id')
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

    const result = await pushController.subscribeToPush(req.body);
    res.json(result);
  })
);

/**
 * @route POST /api/push/unsubscribe
 * @desc Unsubscribe from push notifications
 * @access Public
 */
router.post('/unsubscribe', 
  [
    body('subscription_id')
      .notEmpty()
      .withMessage('Subscription ID is required')
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

    const result = await pushController.unsubscribeFromPush(req.body);
    res.json(result);
  })
);

/**
 * @route GET /api/push/status
 * @desc Get push notification service status
 * @access Public
 */
router.get('/status', 
  asyncHandler(async (req, res) => {
    const result = await pushController.getPushStatus();
    res.json(result);
  })
);

export { router as pushRoutes };
