/**
 * @fileoverview SMS notification routes
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { SMSController } from '../controllers/SMSController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const smsController = new SMSController();

/**
 * @route POST /api/sms/send
 * @desc Send SMS notification
 * @access Public
 */
router.post('/send', 
  [
    body('to')
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('message')
      .notEmpty()
      .withMessage('Message is required')
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

    const result = await smsController.sendSMS(req.body);
    res.json(result);
  })
);

/**
 * @route POST /api/sms/order-confirmation
 * @desc Send order confirmation SMS
 * @access Public
 */
router.post('/order-confirmation', 
  [
    body('order_id')
      .isInt({ min: 1 })
      .withMessage('Valid order ID is required'),
    body('customer')
      .isObject()
      .withMessage('Customer data is required'),
    body('customer.phone')
      .isMobilePhone('any')
      .withMessage('Valid customer phone is required')
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

    const result = await smsController.sendOrderConfirmation(req.body);
    res.json(result);
  })
);

/**
 * @route POST /api/sms/verification-code
 * @desc Send verification code SMS
 * @access Public
 */
router.post('/verification-code', 
  [
    body('phone')
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('code')
      .isLength({ min: 4, max: 8 })
      .withMessage('Code must be between 4 and 8 characters')
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

    const result = await smsController.sendVerificationCode(req.body);
    res.json(result);
  })
);

/**
 * @route GET /api/sms/status
 * @desc Get SMS service status
 * @access Public
 */
router.get('/status', 
  asyncHandler(async (req, res) => {
    const result = await smsController.getSMSStatus();
    res.json(result);
  })
);

export { router as smsRoutes };
