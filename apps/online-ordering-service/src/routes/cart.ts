/**
 * @fileoverview Cart routes for online ordering
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { CartController } from '../controllers/CartController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const cartController = new CartController();

// Validation middleware
const validateAddToCart = [
  body('product_id')
    .isInt({ min: 1 })
    .withMessage('Valid product ID is required'),
  body('type')
    .isIn(['plato', 'bebida'])
    .withMessage('Type must be plato or bebida'),
  body('quantity')
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10'),
  body('special_instructions')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Special instructions must be less than 200 characters')
];

/**
 * @route GET /api/cart/:cartId
 * @desc Get cart contents
 * @access Public
 */
router.get('/:cartId', 
  asyncHandler(async (req, res) => {
    const cartId = req.params.cartId;
    if (!cartId) {
      return res.status(400).json({
        success: false,
        error: 'Cart ID is required'
      } as ApiResponse);
    }

    const result = await cartController.getCart(cartId);
    res.json(result);
  })
);

/**
 * @route POST /api/cart/:cartId/add
 * @desc Add item to cart
 * @access Public
 */
router.post('/:cartId/add', 
  validateAddToCart,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const cartId = req.params.cartId;
    const { product_id, type, quantity, special_instructions } = req.body;
    
    if (!cartId) {
      return res.status(400).json({
        success: false,
        error: 'Cart ID is required'
      } as ApiResponse);
    }

    const result = await cartController.addToCart(
      cartId, 
      product_id, 
      type, 
      quantity, 
      special_instructions
    );
    res.json(result);
  })
);

/**
 * @route DELETE /api/cart/:cartId/items/:itemId
 * @desc Remove item from cart
 * @access Public
 */
router.delete('/:cartId/items/:itemId', 
  asyncHandler(async (req, res) => {
    const cartId = req.params.cartId;
    const itemId = req.params.itemId;
    
    if (!cartId || !itemId) {
      return res.status(400).json({
        success: false,
        error: 'Cart ID and Item ID are required'
      } as ApiResponse);
    }

    const result = await cartController.removeFromCart(cartId, itemId);
    res.json(result);
  })
);

/**
 * @route DELETE /api/cart/:cartId/clear
 * @desc Clear cart
 * @access Public
 */
router.delete('/:cartId/clear', 
  asyncHandler(async (req, res) => {
    const cartId = req.params.cartId;
    
    if (!cartId) {
      return res.status(400).json({
        success: false,
        error: 'Cart ID is required'
      } as ApiResponse);
    }

    const result = await cartController.clearCart(cartId);
    res.json(result);
  })
);

/**
 * @route GET /api/cart/:cartId/summary
 * @desc Get cart summary
 * @access Public
 */
router.get('/:cartId/summary', 
  asyncHandler(async (req, res) => {
    const cartId = req.params.cartId;
    
    if (!cartId) {
      return res.status(400).json({
        success: false,
        error: 'Cart ID is required'
      } as ApiResponse);
    }

    const result = await cartController.getCartSummary(cartId);
    res.json(result);
  })
);

export { router as cartRoutes };
