/**
 * @fileoverview Menu routes for online ordering
 */

import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { MenuController } from '../controllers/MenuController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const menuController = new MenuController();

/**
 * @route GET /api/menu/categories
 * @desc Get menu categories
 * @access Public
 */
router.get('/categories', 
  asyncHandler(async (req, res) => {
    const result = await menuController.getCategories();
    res.json(result);
  })
);

/**
 * @route GET /api/menu/products
 * @desc Get menu products with filters
 * @access Public
 */
router.get('/products', 
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('category_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Category ID must be a positive integer'),
    query('type')
      .optional()
      .isIn(['plato', 'bebida'])
      .withMessage('Type must be plato or bebida'),
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
    const limit = parseInt(req.query.limit as string) || 20;
    const categoryId = req.query.category_id ? parseInt(req.query.category_id as string) : undefined;
    const type = req.query.type as string;
    const search = req.query.search as string;
    
    const result = await menuController.getProducts(page, limit, categoryId, type, search);
    res.json(result);
  })
);

/**
 * @route GET /api/menu/products/:id
 * @desc Get product by ID
 * @access Public
 */
router.get('/products/:id', 
  asyncHandler(async (req, res) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      } as ApiResponse);
    }

    const result = await menuController.getProductById(productId);
    res.json(result);
  })
);

/**
 * @route GET /api/menu/search
 * @desc Search products
 * @access Public
 */
router.get('/search', 
  [
    query('q')
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
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

    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await menuController.searchProducts(query, limit);
    res.json(result);
  })
);

/**
 * @route GET /api/menu/featured
 * @desc Get featured products
 * @access Public
 */
router.get('/featured', 
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Limit must be between 1 and 20')
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

    const limit = parseInt(req.query.limit as string) || 10;
    const result = await menuController.getFeaturedProducts(limit);
    res.json(result);
  })
);

export { router as menuRoutes };
