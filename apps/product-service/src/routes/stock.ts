/**
 * @fileoverview Stock routes for managing inventory and stock movements
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { StockController } from '../controllers/StockController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const stockController = new StockController();

// Validation middleware
const validateStockMovement = [
  body('tipo')
    .isInt({ min: 1, max: 2 })
    .withMessage('Movement type must be 1 (in) or 2 (out)'),
  body('cantidad')
    .isFloat({ min: 0 })
    .withMessage('Quantity must be a positive number'),
  body('comentario')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Comment must be less than 100 characters')
];

const validateStockAdjustment = [
  body('cantidad_actual')
    .isFloat({ min: 0 })
    .withMessage('Current quantity must be a positive number'),
  body('comentario')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Comment must be less than 100 characters')
];

/**
 * @route GET /api/stock
 * @desc Get stock levels for all products
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
    query('tipo')
      .optional()
      .isIn(['plato', 'bebida', 'ingrediente'])
      .withMessage('Type must be plato, bebida, or ingrediente'),
    query('low_stock')
      .optional()
      .isBoolean()
      .withMessage('Low stock must be a boolean')
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
    const tipo = req.query.tipo as string;
    const lowStock = req.query.low_stock === 'true';
    
    const result = await stockController.getStockLevels(page, limit, tipo, lowStock);
    res.json(result);
  })
);

/**
 * @route GET /api/stock/:id
 * @desc Get stock level for specific product
 * @access Private
 */
router.get('/:id', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      } as ApiResponse);
    }

    const result = await stockController.getProductStock(productId);
    res.json(result);
  })
);

/**
 * @route POST /api/stock/movements
 * @desc Record stock movement
 * @access Private (Admin or Manager)
 */
router.post('/movements', 
  authenticateToken, 
  requireRole(['manage_stock']),
  validateStockMovement,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await stockController.recordStockMovement(req.body);
    res.status(201).json(result);
  })
);

/**
 * @route GET /api/stock/movements
 * @desc Get stock movement history
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
    query('product_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Product ID must be a positive integer'),
    query('tipo')
      .optional()
      .isInt({ min: 1, max: 2 })
      .withMessage('Movement type must be 1 (in) or 2 (out)'),
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const productId = req.query.product_id ? parseInt(req.query.product_id as string) : undefined;
    const tipo = req.query.tipo ? parseInt(req.query.tipo as string) : undefined;
    const fechaInicio = req.query.fecha_inicio as string;
    const fechaFin = req.query.fecha_fin as string;
    
    const result = await stockController.getStockMovements(page, limit, productId, tipo, fechaInicio, fechaFin);
    res.json(result);
  })
);

/**
 * @route POST /api/stock/adjust
 * @desc Adjust stock level
 * @access Private (Admin or Manager)
 */
router.post('/adjust', 
  authenticateToken, 
  requireRole(['manage_stock']),
  validateStockAdjustment,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await stockController.adjustStock(req.body);
    res.status(201).json(result);
  })
);

/**
 * @route GET /api/stock/reports/low-stock
 * @desc Get low stock report
 * @access Private
 */
router.get('/reports/low-stock', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await stockController.getLowStockReport();
    res.json(result);
  })
);

/**
 * @route GET /api/stock/reports/stock-value
 * @desc Get stock value report
 * @access Private
 */
router.get('/reports/stock-value', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await stockController.getStockValueReport();
    res.json(result);
  })
);

export { router as stockRoutes };
