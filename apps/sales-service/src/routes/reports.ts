/**
 * @fileoverview Reports routes for financial reports and analytics
 */

import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { ReportController } from '../controllers/ReportController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const reportController = new ReportController();

/**
 * @route GET /api/reports/sales
 * @desc Get sales report
 * @access Private
 */
router.get('/sales', 
  authenticateToken,
  requireRole(['view_reports']),
  [
    query('fecha_inicio')
      .isISO8601()
      .withMessage('Start date is required and must be a valid ISO date'),
    query('fecha_fin')
      .isISO8601()
      .withMessage('End date is required and must be a valid ISO date'),
    query('group_by')
      .optional()
      .isIn(['day', 'week', 'month', 'year'])
      .withMessage('Group by must be day, week, month, or year')
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
    const groupBy = req.query.group_by as string || 'day';
    
    const result = await reportController.getSalesReport(fechaInicio, fechaFin, groupBy);
    res.json(result);
  })
);

/**
 * @route GET /api/reports/products
 * @desc Get products report
 * @access Private
 */
router.get('/products', 
  authenticateToken,
  requireRole(['view_reports']),
  [
    query('fecha_inicio')
      .isISO8601()
      .withMessage('Start date is required and must be a valid ISO date'),
    query('fecha_fin')
      .isISO8601()
      .withMessage('End date is required and must be a valid ISO date'),
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

    const fechaInicio = req.query.fecha_inicio as string;
    const fechaFin = req.query.fecha_fin as string;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await reportController.getProductsReport(fechaInicio, fechaFin, limit);
    res.json(result);
  })
);

/**
 * @route GET /api/reports/tables
 * @desc Get tables report
 * @access Private
 */
router.get('/tables', 
  authenticateToken,
  requireRole(['view_reports']),
  [
    query('fecha_inicio')
      .isISO8601()
      .withMessage('Start date is required and must be a valid ISO date'),
    query('fecha_fin')
      .isISO8601()
      .withMessage('End date is required and must be a valid ISO date')
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
    
    const result = await reportController.getTablesReport(fechaInicio, fechaFin);
    res.json(result);
  })
);

/**
 * @route GET /api/reports/payments
 * @desc Get payments report
 * @access Private
 */
router.get('/payments', 
  authenticateToken,
  requireRole(['view_reports']),
  [
    query('fecha_inicio')
      .isISO8601()
      .withMessage('Start date is required and must be a valid ISO date'),
    query('fecha_fin')
      .isISO8601()
      .withMessage('End date is required and must be a valid ISO date')
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
    
    const result = await reportController.getPaymentsReport(fechaInicio, fechaFin);
    res.json(result);
  })
);

/**
 * @route GET /api/reports/cash
 * @desc Get cash report
 * @access Private
 */
router.get('/cash', 
  authenticateToken,
  requireRole(['view_reports']),
  [
    query('fecha_inicio')
      .isISO8601()
      .withMessage('Start date is required and must be a valid ISO date'),
    query('fecha_fin')
      .isISO8601()
      .withMessage('End date is required and must be a valid ISO date')
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
    
    const result = await reportController.getCashReport(fechaInicio, fechaFin);
    res.json(result);
  })
);

/**
 * @route GET /api/reports/summary
 * @desc Get summary report
 * @access Private
 */
router.get('/summary', 
  authenticateToken,
  requireRole(['view_reports']),
  [
    query('fecha_inicio')
      .isISO8601()
      .withMessage('Start date is required and must be a valid ISO date'),
    query('fecha_fin')
      .isISO8601()
      .withMessage('End date is required and must be a valid ISO date')
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
    
    const result = await reportController.getSummaryReport(fechaInicio, fechaFin);
    res.json(result);
  })
);

/**
 * @route GET /api/reports/export/:type
 * @desc Export report
 * @access Private
 */
router.get('/export/:type', 
  authenticateToken,
  requireRole(['export_reports']),
  [
    query('fecha_inicio')
      .isISO8601()
      .withMessage('Start date is required and must be a valid ISO date'),
    query('fecha_fin')
      .isISO8601()
      .withMessage('End date is required and must be a valid ISO date'),
    query('format')
      .optional()
      .isIn(['csv', 'excel', 'pdf'])
      .withMessage('Format must be csv, excel, or pdf')
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

    const reportType = req.params.type;
    const fechaInicio = req.query.fecha_inicio as string;
    const fechaFin = req.query.fecha_fin as string;
    const format = req.query.format as string || 'csv';
    
    const result = await reportController.exportReport(reportType, fechaInicio, fechaFin, format);
    res.json(result);
  })
);

export { router as reportRoutes };
