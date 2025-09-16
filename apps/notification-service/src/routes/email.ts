/**
 * @fileoverview Email notification routes
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { EmailController } from '../controllers/EmailController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const emailController = new EmailController();

/**
 * @route POST /api/email/send
 * @desc Send email notification
 * @access Public
 */
router.post('/send', 
  [
    body('to')
      .isEmail()
      .withMessage('Valid email address is required'),
    body('subject')
      .notEmpty()
      .withMessage('Subject is required'),
    body('template')
      .optional()
      .isString()
      .withMessage('Template must be a string'),
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

    const result = await emailController.sendEmail(req.body);
    res.json(result);
  })
);

/**
 * @route POST /api/email/order-confirmation
 * @desc Send order confirmation email
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
    body('customer.email')
      .isEmail()
      .withMessage('Valid customer email is required')
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

    const result = await emailController.sendOrderConfirmation(req.body);
    res.json(result);
  })
);

/**
 * @route POST /api/email/order-status-update
 * @desc Send order status update email
 * @access Public
 */
router.post('/order-status-update', 
  [
    body('order_id')
      .isInt({ min: 1 })
      .withMessage('Valid order ID is required'),
    body('customer')
      .isObject()
      .withMessage('Customer data is required'),
    body('customer.email')
      .isEmail()
      .withMessage('Valid customer email is required'),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
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

    const result = await emailController.sendOrderStatusUpdate(req.body);
    res.json(result);
  })
);

/**
 * @route POST /api/email/delivery-notification
 * @desc Send delivery notification email
 * @access Public
 */
router.post('/delivery-notification', 
  [
    body('order_id')
      .isInt({ min: 1 })
      .withMessage('Valid order ID is required'),
    body('customer')
      .isObject()
      .withMessage('Customer data is required'),
    body('customer.email')
      .isEmail()
      .withMessage('Valid customer email is required'),
    body('estimated_time')
      .notEmpty()
      .withMessage('Estimated time is required')
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

    const result = await emailController.sendDeliveryNotification(req.body);
    res.json(result);
  })
);

/**
 * @route POST /api/email/low-stock-alert
 * @desc Send low stock alert email
 * @access Public
 */
router.post('/low-stock-alert', 
  [
    body('recipients')
      .isArray({ min: 1 })
      .withMessage('Recipients must be a non-empty array'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('Items must be a non-empty array')
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

    const result = await emailController.sendLowStockAlert(req.body);
    res.json(result);
  })
);

/**
 * @route POST /api/email/daily-sales-report
 * @desc Send daily sales report email
 * @access Public
 */
router.post('/daily-sales-report', 
  [
    body('recipients')
      .isArray({ min: 1 })
      .withMessage('Recipients must be a non-empty array'),
    body('date')
      .isISO8601()
      .withMessage('Valid date is required'),
    body('total_orders')
      .isInt({ min: 0 })
      .withMessage('Total orders must be a non-negative integer'),
    body('total_revenue')
      .isFloat({ min: 0 })
      .withMessage('Total revenue must be a non-negative number')
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

    const result = await emailController.sendDailySalesReport(req.body);
    res.json(result);
  })
);

/**
 * @route GET /api/email/status
 * @desc Get email service status
 * @access Public
 */
router.get('/status', 
  asyncHandler(async (req, res) => {
    const result = await emailController.getEmailStatus();
    res.json(result);
  })
);

export { router as emailRoutes };
