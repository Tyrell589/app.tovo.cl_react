/**
 * @fileoverview Payment routes for payment handling and processing
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { PaymentController } from '../controllers/PaymentController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const paymentController = new PaymentController();

// Validation middleware
const validatePaymentMethod = [
  body('nombre')
    .notEmpty()
    .withMessage('Payment method name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Payment method name must be between 2 and 100 characters'),
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean')
];

const validatePayment = [
  body('orden_codigo')
    .isInt({ min: 1 })
    .withMessage('Valid order ID is required'),
  body('metodo_pago_id')
    .isInt({ min: 1 })
    .withMessage('Valid payment method ID is required'),
  body('monto')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('referencia')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Reference must be less than 100 characters')
];

/**
 * @route GET /api/payments/methods
 * @desc Get all payment methods
 * @access Private
 */
router.get('/methods', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await paymentController.getPaymentMethods();
    res.json(result);
  })
);

/**
 * @route GET /api/payments/methods/:id
 * @desc Get payment method by ID
 * @access Private
 */
router.get('/methods/:id', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const methodId = parseInt(req.params.id);
    if (isNaN(methodId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment method ID'
      } as ApiResponse);
    }

    const result = await paymentController.getPaymentMethodById(methodId);
    res.json(result);
  })
);

/**
 * @route POST /api/payments/methods
 * @desc Create new payment method
 * @access Private (Admin)
 */
router.post('/methods', 
  authenticateToken, 
  requireRole(['manage_payment_methods']),
  validatePaymentMethod,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await paymentController.createPaymentMethod(req.body);
    res.status(201).json(result);
  })
);

/**
 * @route PUT /api/payments/methods/:id
 * @desc Update payment method
 * @access Private (Admin)
 */
router.put('/methods/:id', 
  authenticateToken,
  requireRole(['manage_payment_methods']),
  validatePaymentMethod,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const methodId = parseInt(req.params.id);
    if (isNaN(methodId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment method ID'
      } as ApiResponse);
    }

    const result = await paymentController.updatePaymentMethod(methodId, req.body);
    res.json(result);
  })
);

/**
 * @route DELETE /api/payments/methods/:id
 * @desc Delete payment method
 * @access Private (Admin)
 */
router.delete('/methods/:id', 
  authenticateToken, 
  requireRole(['delete_payment_methods']),
  asyncHandler(async (req, res) => {
    const methodId = parseInt(req.params.id);
    if (isNaN(methodId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment method ID'
      } as ApiResponse);
    }

    const result = await paymentController.deletePaymentMethod(methodId);
    res.json(result);
  })
);

/**
 * @route POST /api/payments/process
 * @desc Process payment
 * @access Private
 */
router.post('/process', 
  authenticateToken, 
  requireRole(['process_payments']),
  validatePayment,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await paymentController.processPayment(req.body, req.user!.usu_codigo);
    res.status(201).json(result);
  })
);

/**
 * @route GET /api/payments
 * @desc Get all payments with pagination and filters
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
    query('metodo_pago_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Payment method ID must be a positive integer'),
    query('orden_codigo')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Order ID must be a positive integer')
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
    const metodoPagoId = req.query.metodo_pago_id ? parseInt(req.query.metodo_pago_id as string) : undefined;
    const ordenCodigo = req.query.orden_codigo ? parseInt(req.query.orden_codigo as string) : undefined;
    
    const result = await paymentController.getPayments(page, limit, fechaInicio, fechaFin, metodoPagoId, ordenCodigo);
    res.json(result);
  })
);

/**
 * @route GET /api/payments/:id
 * @desc Get payment by ID
 * @access Private
 */
router.get('/:id', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const paymentId = parseInt(req.params.id);
    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment ID'
      } as ApiResponse);
    }

    const result = await paymentController.getPaymentById(paymentId);
    res.json(result);
  })
);

/**
 * @route POST /api/payments/:id/refund
 * @desc Process payment refund
 * @access Private
 */
router.post('/:id/refund', 
  authenticateToken, 
  requireRole(['process_refunds']),
  [
    body('monto')
      .isFloat({ min: 0 })
      .withMessage('Refund amount must be a positive number'),
    body('motivo')
      .notEmpty()
      .withMessage('Refund reason is required')
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

    const paymentId = parseInt(req.params.id);
    const { monto, motivo } = req.body;
    
    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment ID'
      } as ApiResponse);
    }

    const result = await paymentController.processRefund(paymentId, monto, motivo, req.user!.usu_codigo);
    res.json(result);
  })
);

/**
 * @route GET /api/payments/summary
 * @desc Get payment summary
 * @access Private
 */
router.get('/summary', 
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
    
    const result = await paymentController.getPaymentSummary(fechaInicio, fechaFin);
    res.json(result);
  })
);

export { router as paymentRoutes };
