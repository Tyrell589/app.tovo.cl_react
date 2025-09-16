/**
 * @fileoverview Sales reports routes
 */

import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { SalesReportController } from '../controllers/SalesReportController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const salesReportController = new SalesReportController();

/**
 * @route GET /api/sales/summary
 * @desc Get sales summary
 * @access Public
 */
router.get('/summary', 
  [
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    query('period')
      .optional()
      .isIn(['day', 'week', 'month', 'year'])
      .withMessage('Period must be day, week, month, or year')
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

    const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
    const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
    const period = req.query.period as string || 'day';
    
    const result = await salesReportController.getSalesSummary(startDate, endDate, period);
    res.json(result);
  })
);

/**
 * @route GET /api/sales/daily
 * @desc Get daily sales report
 * @access Public
 */
router.get('/daily', 
  [
    query('date')
      .optional()
      .isISO8601()
      .withMessage('Date must be a valid ISO 8601 date')
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

    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const result = await salesReportController.getDailySalesReport(date);
    res.json(result);
  })
);

/**
 * @route GET /api/sales/weekly
 * @desc Get weekly sales report
 * @access Public
 */
router.get('/weekly', 
  [
    query('week_start')
      .optional()
      .isISO8601()
      .withMessage('Week start must be a valid ISO 8601 date')
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

    const weekStart = req.query.week_start ? new Date(req.query.week_start as string) : undefined;
    const result = await salesReportController.getWeeklySalesReport(weekStart);
    res.json(result);
  })
);

/**
 * @route GET /api/sales/monthly
 * @desc Get monthly sales report
 * @access Public
 */
router.get('/monthly', 
  [
    query('month')
      .optional()
      .matches(/^\d{4}-\d{2}$/)
      .withMessage('Month must be in YYYY-MM format')
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

    const month = req.query.month as string;
    const result = await salesReportController.getMonthlySalesReport(month);
    res.json(result);
  })
);

/**
 * @route GET /api/sales/products
 * @desc Get product sales report
 * @access Public
 */
router.get('/products', 
  [
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
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

    const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
    const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await salesReportController.getProductSalesReport(startDate, endDate, limit);
    res.json(result);
  })
);

/**
 * @route GET /api/sales/trends
 * @desc Get sales trends
 * @access Public
 */
router.get('/trends', 
  [
    query('period')
      .optional()
      .isIn(['day', 'week', 'month'])
      .withMessage('Period must be day, week, or month'),
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365')
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
    const days = parseInt(req.query.days as string) || 30;
    
    const result = await salesReportController.getSalesTrends(period, days);
    res.json(result);
  })
);

export { router as salesRoutes };
