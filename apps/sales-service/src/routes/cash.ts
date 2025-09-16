/**
 * @fileoverview Cash routes for cash management and cash register operations
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { CashController } from '../controllers/CashController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const cashController = new CashController();

// Validation middleware
const validateCashRegister = [
  body('monto_inicial')
    .isFloat({ min: 0 })
    .withMessage('Initial amount must be a positive number'),
  body('comentarios')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Comments must be less than 500 characters')
];

const validateCashMovement = [
  body('tipo')
    .isIn(['entrada', 'salida'])
    .withMessage('Movement type must be entrada or salida'),
  body('monto')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('descripcion')
    .notEmpty()
    .withMessage('Description is required'),
  body('comentarios')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Comments must be less than 500 characters')
];

/**
 * @route GET /api/cash/registers
 * @desc Get all cash registers
 * @access Private
 */
router.get('/registers', 
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
    query('estado')
      .optional()
      .isIn(['abierto', 'cerrado'])
      .withMessage('Status must be abierto or cerrado')
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
    const estado = req.query.estado as string;
    
    const result = await cashController.getCashRegisters(page, limit, estado);
    res.json(result);
  })
);

/**
 * @route GET /api/cash/registers/:id
 * @desc Get cash register by ID
 * @access Private
 */
router.get('/registers/:id', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const registerId = parseInt(req.params.id);
    if (isNaN(registerId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cash register ID'
      } as ApiResponse);
    }

    const result = await cashController.getCashRegisterById(registerId);
    res.json(result);
  })
);

/**
 * @route POST /api/cash/registers/open
 * @desc Open cash register
 * @access Private
 */
router.post('/registers/open', 
  authenticateToken, 
  requireRole(['manage_cash']),
  validateCashRegister,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await cashController.openCashRegister(req.body, req.user!.usu_codigo);
    res.status(201).json(result);
  })
);

/**
 * @route POST /api/cash/registers/:id/close
 * @desc Close cash register
 * @access Private
 */
router.post('/registers/:id/close', 
  authenticateToken, 
  requireRole(['manage_cash']),
  [
    body('monto_final')
      .isFloat({ min: 0 })
      .withMessage('Final amount must be a positive number'),
    body('comentarios')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Comments must be less than 500 characters')
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

    const registerId = parseInt(req.params.id);
    const { monto_final, comentarios } = req.body;
    
    if (isNaN(registerId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cash register ID'
      } as ApiResponse);
    }

    const result = await cashController.closeCashRegister(registerId, monto_final, comentarios, req.user!.usu_codigo);
    res.json(result);
  })
);

/**
 * @route GET /api/cash/registers/current
 * @desc Get current open cash register
 * @access Private
 */
router.get('/registers/current', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await cashController.getCurrentCashRegister();
    res.json(result);
  })
);

/**
 * @route POST /api/cash/movements
 * @desc Record cash movement
 * @access Private
 */
router.post('/movements', 
  authenticateToken, 
  requireRole(['manage_cash']),
  validateCashMovement,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await cashController.recordCashMovement(req.body, req.user!.usu_codigo);
    res.status(201).json(result);
  })
);

/**
 * @route GET /api/cash/movements
 * @desc Get cash movements
 * @access Private
 */
router.get('/movements', 
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
    query('tipo')
      .optional()
      .isIn(['entrada', 'salida'])
      .withMessage('Type must be entrada or salida')
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
    const tipo = req.query.tipo as string;
    
    const result = await cashController.getCashMovements(page, limit, fechaInicio, fechaFin, tipo);
    res.json(result);
  })
);

/**
 * @route GET /api/cash/summary
 * @desc Get cash summary
 * @access Private
 */
router.get('/summary', 
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
    const result = await cashController.getCashSummary(fecha);
    res.json(result);
  })
);

/**
 * @route GET /api/cash/reports/daily
 * @desc Get daily cash report
 * @access Private
 */
router.get('/reports/daily', 
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
    const result = await cashController.getDailyCashReport(fecha);
    res.json(result);
  })
);

export { router as cashRoutes };
