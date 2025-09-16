/**
 * @fileoverview Category routes for managing product categories
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { CategoryController } from '../controllers/CategoryController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const categoryController = new CategoryController();

// Validation middleware
const validateCreateCategory = [
  body('nombre')
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('tipo')
    .isIn(['plato', 'bebida'])
    .withMessage('Category type must be either plato or bebida'),
  body('imagen')
    .optional()
    .isString()
    .withMessage('Image must be a string')
];

const validateUpdateCategory = [
  body('nombre')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('imagen')
    .optional()
    .isString()
    .withMessage('Image must be a string')
];

/**
 * @route GET /api/categories
 * @desc Get all categories with pagination and filters
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
      .isIn(['plato', 'bebida'])
      .withMessage('Type must be either plato or bebida'),
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
    const tipo = req.query.tipo as string;
    const search = req.query.search as string;
    
    const result = await categoryController.getCategories(page, limit, tipo, search);
    res.json(result);
  })
);

/**
 * @route GET /api/categories/:id
 * @desc Get category by ID
 * @access Private
 */
router.get('/:id', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID'
      } as ApiResponse);
    }

    const result = await categoryController.getCategoryById(categoryId);
    res.json(result);
  })
);

/**
 * @route POST /api/categories
 * @desc Create new category
 * @access Private (Admin or Manager)
 */
router.post('/', 
  authenticateToken, 
  requireRole(['create_categories']),
  validateCreateCategory,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await categoryController.createCategory(req.body);
    res.status(201).json(result);
  })
);

/**
 * @route PUT /api/categories/:id
 * @desc Update category
 * @access Private (Admin or Manager)
 */
router.put('/:id', 
  authenticateToken,
  requireRole(['update_categories']),
  validateUpdateCategory,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID'
      } as ApiResponse);
    }

    const result = await categoryController.updateCategory(categoryId, req.body);
    res.json(result);
  })
);

/**
 * @route DELETE /api/categories/:id
 * @desc Delete category (soft delete)
 * @access Private (Admin)
 */
router.delete('/:id', 
  authenticateToken, 
  requireRole(['delete_categories']),
  asyncHandler(async (req, res) => {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID'
      } as ApiResponse);
    }

    const result = await categoryController.deleteCategory(categoryId);
    res.json(result);
  })
);

/**
 * @route POST /api/categories/:id/toggle-status
 * @desc Toggle category active status
 * @access Private (Admin or Manager)
 */
router.post('/:id/toggle-status', 
  authenticateToken,
  requireRole(['update_categories']),
  asyncHandler(async (req, res) => {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID'
      } as ApiResponse);
    }

    const result = await categoryController.toggleCategoryStatus(categoryId);
    res.json(result);
  })
);

/**
 * @route GET /api/categories/:id/products
 * @desc Get products in category
 * @access Private
 */
router.get('/:id/products', 
  authenticateToken,
  [
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

    const categoryId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID'
      } as ApiResponse);
    }

    const result = await categoryController.getCategoryProducts(categoryId, page, limit);
    res.json(result);
  })
);

export { router as categoryRoutes };
