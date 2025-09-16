/**
 * @fileoverview Sales routes for order processing and sales management
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { SalesController } from '../controllers/SalesController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const salesController = new SalesController();

// Validation middleware
const validateProcessOrder = [
  body('orden_codigo')
    .isInt({ min: 1 })
    .withMessage('Valid order ID is required'),
  body('metodo_pago')
    .isIn(['efectivo', 'tarjeta', 'transferencia', 'cheque'])
    .withMessage('Valid payment method is required'),
  body('monto_pagado')
    .isFloat({ min: 0 })
    .withMessage('Paid amount must be a positive number'),
  body('descuento')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a positive number'),
  body('propina')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tip must be a positive number')
];

const validateRefundOrder = [
  body('orden_codigo')
    .isInt({ min: 1 })
    .withMessage('Valid order ID is required'),
  body('monto_reembolso')
    .isFloat({ min: 0 })
    .withMessage('Refund amount must be a positive number'),
  body('motivo')
    .notEmpty()
    .withMessage('Refund reason is required')
];

/**
 * @route GET /api/sales
 * @desc Get all sales with pagination and filters
 * @access Private
 */
router.get('/', 
  authenticateToken,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('fecha_inicio')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO date'),
    query('fecha_fin')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO date'),
    query('metodo_pago')
      .optional()
      .isIn(['efectivo', 'tarjeta', 'transferencia', 'cheque'])
      .withMessage('Invalid payment method'),
    query('mesa_codigo')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Table ID must be a positive integer')
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
    const limit = parseInt(req.query.limit as string) || 10;
    const fechaInicio = req.query.fecha_inicio as string;
    const fechaFin = req.query.fecha_fin as string;
    const metodoPago = req.query.metodo_pago as string;
    const mesaCodigo = req.query.mesa_codigo ? parseInt(req.query.mesa_codigo as string) : undefined;
    
    const result = await salesController.getSales(page, limit, fechaInicio, fechaFin, metodoPago, mesaCodigo);
    res.json(result);
  })
);

/**
 * @route GET /api/sales/:id
 * @desc Get sale by ID
 * @access Private
 */
router.get('/:id', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const saleId = parseInt(req.params.id);
    if (isNaN(saleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sale ID'
      } as ApiResponse);
    }

    const result = await salesController.getSaleById(saleId);
    res.json(result);
  })
);

/**
 * @route POST /api/sales/process-order
 * @desc Process order payment
 * @access Private
 */
router.post('/process-order', 
  authenticateToken, 
  requireRole(['process_payments']),
  validateProcessOrder,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await salesController.processOrder(req.body, req.user!.usu_codigo);
    res.status(201).json(result);
  })
);

/**
 * @route POST /api/sales/refund
 * @desc Process order refund
 * @access Private
 */
router.post('/refund', 
  authenticateToken, 
  requireRole(['process_refunds']),
  validateRefundOrder,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await salesController.processRefund(req.body, req.user!.usu_codigo);
    res.status(201).json(result);
  })
);

/**
 * @route GET /api/sales/daily-summary
 * @desc Get daily sales summary
 * @access Private
 */
router.get('/daily-summary', 
  authenticateToken,
  [
    query('fecha')
      .optional()
      .isISO8601()
      .withMessage('Date must be a valid ISO date')
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

    const fecha = req.query.fecha as string;
    const result = await salesController.getDailySummary(fecha);
    res.json(result);
  })
);

/**
 * @route GET /api/sales/hourly-summary
 * @desc Get hourly sales summary
 * @access Private
 */
router.get('/hourly-summary', 
  authenticateToken,
  [
    query('fecha')
      .optional()
      .isISO8601()
      .withMessage('Date must be a valid ISO date')
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

    const fecha = req.query.fecha as string;
    const result = await salesController.getHourlySummary(fecha);
    res.json(result);
  })
);

/**
 * @route GET /api/sales/top-products
 * @desc Get top selling products
 * @access Private
 */
router.get('/top-products', 
  authenticateToken,
  [
    query('fecha_inicio')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO date'),
    query('fecha_fin')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO date'),
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
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await salesController.getTopProducts(fechaInicio, fechaFin, limit);
    res.json(result);
  })
);

/**
 * @route GET /api/sales/payment-methods
 * @desc Get sales by payment method
 * @access Private
 */
router.get('/payment-methods', 
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
    
    const result = await salesController.getSalesByPaymentMethod(fechaInicio, fechaFin);
    res.json(result);
  })
);

/**
 * @route GET /api/sales/table-performance
 * @desc Get table performance metrics
 * @access Private
 */
router.get('/table-performance', 
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
    
    const result = await salesController.getTablePerformance(fechaInicio, fechaFin);
    res.json(result);
  })
);

export { router as salesRoutes };
