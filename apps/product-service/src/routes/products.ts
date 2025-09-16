/**
 * @fileoverview Product routes for CRUD operations on plates and beverages
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { ProductController } from '../controllers/ProductController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const productController = new ProductController();

// Validation middleware
const validateCreateProduct = [
  body('nombre')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('precio')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('categoria')
    .isInt({ min: 1 })
    .withMessage('Valid category is required'),
  body('tipo')
    .isIn(['plato', 'bebida'])
    .withMessage('Product type must be either plato or bebida')
];

const validateUpdateProduct = [
  body('nombre')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('precio')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('categoria')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid category is required')
];

/**
 * @route GET /api/products
 * @desc Get all products with pagination and filters
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
    const tipo = req.query.tipo as string;
    const categoria = req.query.categoria ? parseInt(req.query.categoria as string) : undefined;
    const search = req.query.search as string;
    
    const result = await productController.getProducts(page, limit, tipo, categoria, search);
    res.json(result);
  })
);

/**
 * @route GET /api/products/:id
 * @desc Get product by ID
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

    const result = await productController.getProductById(productId);
    res.json(result);
  })
);

/**
 * @route POST /api/products
 * @desc Create new product
 * @access Private (Admin or Manager)
 */
router.post('/', 
  authenticateToken, 
  requireRole(['create_products']),
  validateCreateProduct,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await productController.createProduct(req.body);
    res.status(201).json(result);
  })
);

/**
 * @route PUT /api/products/:id
 * @desc Update product
 * @access Private (Admin or Manager)
 */
router.put('/:id', 
  authenticateToken,
  requireRole(['update_products']),
  validateUpdateProduct,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      } as ApiResponse);
    }

    const result = await productController.updateProduct(productId, req.body);
    res.json(result);
  })
);

/**
 * @route DELETE /api/products/:id
 * @desc Delete product (soft delete)
 * @access Private (Admin)
 */
router.delete('/:id', 
  authenticateToken, 
  requireRole(['delete_products']),
  asyncHandler(async (req, res) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      } as ApiResponse);
    }

    const result = await productController.deleteProduct(productId);
    res.json(result);
  })
);

/**
 * @route POST /api/products/:id/toggle-status
 * @desc Toggle product active status
 * @access Private (Admin or Manager)
 */
router.post('/:id/toggle-status', 
  authenticateToken,
  requireRole(['update_products']),
  asyncHandler(async (req, res) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      } as ApiResponse);
    }

    const result = await productController.toggleProductStatus(productId);
    res.json(result);
  })
);

/**
 * @route GET /api/products/:id/ingredients
 * @desc Get product ingredients
 * @access Private
 */
router.get('/:id/ingredients', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      } as ApiResponse);
    }

    const result = await productController.getProductIngredients(productId);
    res.json(result);
  })
);

/**
 * @route POST /api/products/:id/ingredients
 * @desc Add ingredient to product
 * @access Private (Admin or Manager)
 */
router.post('/:id/ingredients', 
  authenticateToken,
  requireRole(['update_products']),
  [
    body('ingrediente_id')
      .isInt({ min: 1 })
      .withMessage('Valid ingredient ID is required'),
    body('cantidad')
      .isFloat({ min: 0 })
      .withMessage('Quantity must be a positive number')
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

    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      } as ApiResponse);
    }

    const { ingrediente_id, cantidad } = req.body;
    const result = await productController.addProductIngredient(productId, ingrediente_id, cantidad);
    res.json(result);
  })
);

/**
 * @route DELETE /api/products/:id/ingredients/:ingredientId
 * @desc Remove ingredient from product
 * @access Private (Admin or Manager)
 */
router.delete('/:id/ingredients/:ingredientId', 
  authenticateToken,
  requireRole(['update_products']),
  asyncHandler(async (req, res) => {
    const productId = parseInt(req.params.id);
    const ingredientId = parseInt(req.params.ingredientId);
    
    if (isNaN(productId) || isNaN(ingredientId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product or ingredient ID'
      } as ApiResponse);
    }

    const result = await productController.removeProductIngredient(productId, ingredientId);
    res.json(result);
  })
);

export { router as productRoutes };
