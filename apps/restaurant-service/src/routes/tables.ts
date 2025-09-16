/**
 * @fileoverview Table routes for managing restaurant tables
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { TableController } from '../controllers/TableController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const tableController = new TableController();

// Validation middleware
const validateCreateTable = [
  body('mesa_nombre')
    .notEmpty()
    .withMessage('Table name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Table name must be between 1 and 50 characters'),
  body('mesa_capacidad')
    .isInt({ min: 1, max: 20 })
    .withMessage('Table capacity must be between 1 and 20'),
  body('cat_codigo')
    .isInt({ min: 1 })
    .withMessage('Valid category is required'),
  body('mesa_ubicacion')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters')
];

const validateUpdateTable = [
  body('mesa_nombre')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Table name must be between 1 and 50 characters'),
  body('mesa_capacidad')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Table capacity must be between 1 and 20'),
  body('cat_codigo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid category is required'),
  body('mesa_ubicacion')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters')
];

/**
 * @route GET /api/tables
 * @desc Get all tables with pagination and filters
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
    query('status')
      .optional()
      .isIn(['disponible', 'ocupada', 'reservada', 'mantenimiento'])
      .withMessage('Status must be disponible, ocupada, reservada, or mantenimiento'),
    query('categoria')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Category must be a positive integer'),
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters')
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
    const status = req.query.status as string;
    const categoria = req.query.categoria ? parseInt(req.query.categoria as string) : undefined;
    const search = req.query.search as string;
    
    const result = await tableController.getTables(page, limit, status, categoria, search);
    res.json(result);
  })
);

/**
 * @route GET /api/tables/:id
 * @desc Get table by ID
 * @access Private
 */
router.get('/:id', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const tableId = parseInt(req.params.id);
    if (isNaN(tableId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table ID'
      } as ApiResponse);
    }

    const result = await tableController.getTableById(tableId);
    res.json(result);
  })
);

/**
 * @route POST /api/tables
 * @desc Create new table
 * @access Private (Admin or Manager)
 */
router.post('/', 
  authenticateToken, 
  requireRole(['manage_tables']),
  validateCreateTable,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await tableController.createTable(req.body);
    res.status(201).json(result);
  })
);

/**
 * @route PUT /api/tables/:id
 * @desc Update table
 * @access Private (Admin or Manager)
 */
router.put('/:id', 
  authenticateToken,
  requireRole(['manage_tables']),
  validateUpdateTable,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const tableId = parseInt(req.params.id);
    if (isNaN(tableId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table ID'
      } as ApiResponse);
    }

    const result = await tableController.updateTable(tableId, req.body);
    res.json(result);
  })
);

/**
 * @route DELETE /api/tables/:id
 * @desc Delete table (soft delete)
 * @access Private (Admin)
 */
router.delete('/:id', 
  authenticateToken, 
  requireRole(['delete_tables']),
  asyncHandler(async (req, res) => {
    const tableId = parseInt(req.params.id);
    if (isNaN(tableId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table ID'
      } as ApiResponse);
    }

    const result = await tableController.deleteTable(tableId);
    res.json(result);
  })
);

/**
 * @route POST /api/tables/:id/assign
 * @desc Assign table to waiter
 * @access Private (Admin or Manager)
 */
router.post('/:id/assign', 
  authenticateToken,
  requireRole(['manage_tables']),
  [
    body('waiter_id')
      .isInt({ min: 1 })
      .withMessage('Valid waiter ID is required')
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

    const tableId = parseInt(req.params.id);
    const { waiter_id } = req.body;
    
    if (isNaN(tableId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table ID'
      } as ApiResponse);
    }

    const result = await tableController.assignTable(tableId, waiter_id);
    res.json(result);
  })
);

/**
 * @route POST /api/tables/:id/status
 * @desc Update table status
 * @access Private (Admin or Manager)
 */
router.post('/:id/status', 
  authenticateToken,
  requireRole(['manage_tables']),
  [
    body('status')
      .isIn(['disponible', 'ocupada', 'reservada', 'mantenimiento'])
      .withMessage('Status must be disponible, ocupada, reservada, or mantenimiento')
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

    const tableId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (isNaN(tableId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table ID'
      } as ApiResponse);
    }

    const result = await tableController.updateTableStatus(tableId, status);
    res.json(result);
  })
);

/**
 * @route GET /api/tables/:id/orders
 * @desc Get table orders
 * @access Private
 */
router.get('/:id/orders', 
  authenticateToken,
  [
    query('status')
      .optional()
      .isIn(['pendiente', 'en_proceso', 'listo', 'entregado', 'cancelado'])
      .withMessage('Invalid order status'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
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

    const tableId = parseInt(req.params.id);
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (isNaN(tableId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table ID'
      } as ApiResponse);
    }

    const result = await tableController.getTableOrders(tableId, status, page, limit);
    res.json(result);
  })
);

/**
 * @route GET /api/tables/categories
 * @desc Get table categories
 * @access Private
 */
router.get('/categories', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await tableController.getTableCategories();
    res.json(result);
  })
);

export { router as tableRoutes };
