/**
 * @fileoverview Ingredient routes for managing ingredients and stock
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { IngredientController } from '../controllers/IngredientController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const ingredientController = new IngredientController();

// Validation middleware
const validateCreateIngredient = [
  body('nombre')
    .notEmpty()
    .withMessage('Ingredient name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Ingredient name must be between 2 and 100 characters'),
  body('categoria_id')
    .isInt({ min: 1 })
    .withMessage('Valid category ID is required'),
  body('unidad_id')
    .isInt({ min: 1 })
    .withMessage('Valid unit ID is required'),
  body('costo')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number')
];

const validateUpdateIngredient = [
  body('nombre')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Ingredient name must be between 2 and 100 characters'),
  body('categoria_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid category ID is required'),
  body('unidad_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid unit ID is required'),
  body('costo')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number')
];

/**
 * @route GET /api/ingredients
 * @desc Get all ingredients with pagination and filters
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
    query('categoria_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Category ID must be a positive integer'),
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
    const categoriaId = req.query.categoria_id ? parseInt(req.query.categoria_id as string) : undefined;
    const search = req.query.search as string;
    
    const result = await ingredientController.getIngredients(page, limit, categoriaId, search);
    res.json(result);
  })
);

/**
 * @route GET /api/ingredients/:id
 * @desc Get ingredient by ID
 * @access Private
 */
router.get('/:id', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const ingredientId = parseInt(req.params.id);
    if (isNaN(ingredientId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ingredient ID'
      } as ApiResponse);
    }

    const result = await ingredientController.getIngredientById(ingredientId);
    res.json(result);
  })
);

/**
 * @route POST /api/ingredients
 * @desc Create new ingredient
 * @access Private (Admin or Manager)
 */
router.post('/', 
  authenticateToken, 
  requireRole(['create_ingredients']),
  validateCreateIngredient,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await ingredientController.createIngredient(req.body);
    res.status(201).json(result);
  })
);

/**
 * @route PUT /api/ingredients/:id
 * @desc Update ingredient
 * @access Private (Admin or Manager)
 */
router.put('/:id', 
  authenticateToken,
  requireRole(['update_ingredients']),
  validateUpdateIngredient,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const ingredientId = parseInt(req.params.id);
    if (isNaN(ingredientId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ingredient ID'
      } as ApiResponse);
    }

    const result = await ingredientController.updateIngredient(ingredientId, req.body);
    res.json(result);
  })
);

/**
 * @route DELETE /api/ingredients/:id
 * @desc Delete ingredient (soft delete)
 * @access Private (Admin)
 */
router.delete('/:id', 
  authenticateToken, 
  requireRole(['delete_ingredients']),
  asyncHandler(async (req, res) => {
    const ingredientId = parseInt(req.params.id);
    if (isNaN(ingredientId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ingredient ID'
      } as ApiResponse);
    }

    const result = await ingredientController.deleteIngredient(ingredientId);
    res.json(result);
  })
);

/**
 * @route POST /api/ingredients/:id/toggle-status
 * @desc Toggle ingredient active status
 * @access Private (Admin or Manager)
 */
router.post('/:id/toggle-status', 
  authenticateToken,
  requireRole(['update_ingredients']),
  asyncHandler(async (req, res) => {
    const ingredientId = parseInt(req.params.id);
    if (isNaN(ingredientId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ingredient ID'
      } as ApiResponse);
    }

    const result = await ingredientController.toggleIngredientStatus(ingredientId);
    res.json(result);
  })
);

/**
 * @route GET /api/ingredients/categories
 * @desc Get ingredient categories
 * @access Private
 */
router.get('/categories', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await ingredientController.getIngredientCategories();
    res.json(result);
  })
);

/**
 * @route GET /api/ingredients/units
 * @desc Get ingredient units
 * @access Private
 */
router.get('/units', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await ingredientController.getIngredientUnits();
    res.json(result);
  })
);

export { router as ingredientRoutes };
