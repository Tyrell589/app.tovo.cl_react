/**
 * @fileoverview Coupon routes for coupon management
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { CouponController } from '../controllers/CouponController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const couponController = new CouponController();

// Validation middleware
const validateCreateCoupon = [
  body('cup_codigo')
    .notEmpty()
    .withMessage('Coupon code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Coupon code must be between 3 and 20 characters'),
  body('cup_descripcion')
    .notEmpty()
    .withMessage('Coupon description is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Description must be between 5 and 200 characters'),
  body('cup_tipo')
    .isIn(['porcentaje', 'monto_fijo'])
    .withMessage('Coupon type must be porcentaje or monto_fijo'),
  body('cup_valor')
    .isFloat({ min: 0 })
    .withMessage('Coupon value must be a positive number'),
  body('cup_fechainicio')
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  body('cup_fechafin')
    .isISO8601()
    .withMessage('End date must be a valid ISO date'),
  body('cup_usosmaximos')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max uses must be a positive integer'),
  body('cup_montominimo')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number')
];

const validateUpdateCoupon = [
  body('cup_descripcion')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Description must be between 5 and 200 characters'),
  body('cup_tipo')
    .optional()
    .isIn(['porcentaje', 'monto_fijo'])
    .withMessage('Coupon type must be porcentaje or monto_fijo'),
  body('cup_valor')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Coupon value must be a positive number'),
  body('cup_fechainicio')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  body('cup_fechafin')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO date'),
  body('cup_usosmaximos')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max uses must be a positive integer'),
  body('cup_montominimo')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number')
];

const validateApplyCoupon = [
  body('cup_codigo')
    .notEmpty()
    .withMessage('Coupon code is required'),
  body('orden_codigo')
    .isInt({ min: 1 })
    .withMessage('Valid order ID is required')
];

/**
 * @route GET /api/coupons
 * @desc Get all coupons with pagination and filters
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
    query('estado')
      .optional()
      .isIn(['activo', 'inactivo', 'expirado'])
      .withMessage('Status must be activo, inactivo, or expirado'),
    query('tipo')
      .optional()
      .isIn(['porcentaje', 'monto_fijo'])
      .withMessage('Type must be porcentaje or monto_fijo'),
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
    const estado = req.query.estado as string;
    const tipo = req.query.tipo as string;
    const search = req.query.search as string;
    
    const result = await couponController.getCoupons(page, limit, estado, tipo, search);
    res.json(result);
  })
);

/**
 * @route GET /api/coupons/:id
 * @desc Get coupon by ID
 * @access Private
 */
router.get('/:id', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const couponId = parseInt(req.params.id);
    if (isNaN(couponId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coupon ID'
      } as ApiResponse);
    }

    const result = await couponController.getCouponById(couponId);
    res.json(result);
  })
);

/**
 * @route POST /api/coupons
 * @desc Create new coupon
 * @access Private (Admin)
 */
router.post('/', 
  authenticateToken, 
  requireRole(['manage_coupons']),
  validateCreateCoupon,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await couponController.createCoupon(req.body);
    res.status(201).json(result);
  })
);

/**
 * @route PUT /api/coupons/:id
 * @desc Update coupon
 * @access Private (Admin)
 */
router.put('/:id', 
  authenticateToken,
  requireRole(['manage_coupons']),
  validateUpdateCoupon,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const couponId = parseInt(req.params.id);
    if (isNaN(couponId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coupon ID'
      } as ApiResponse);
    }

    const result = await couponController.updateCoupon(couponId, req.body);
    res.json(result);
  })
);

/**
 * @route DELETE /api/coupons/:id
 * @desc Delete coupon
 * @access Private (Admin)
 */
router.delete('/:id', 
  authenticateToken, 
  requireRole(['delete_coupons']),
  asyncHandler(async (req, res) => {
    const couponId = parseInt(req.params.id);
    if (isNaN(couponId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coupon ID'
      } as ApiResponse);
    }

    const result = await couponController.deleteCoupon(couponId);
    res.json(result);
  })
);

/**
 * @route POST /api/coupons/apply
 * @desc Apply coupon to order
 * @access Private
 */
router.post('/apply', 
  authenticateToken,
  validateApplyCoupon,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await couponController.applyCoupon(req.body);
    res.json(result);
  })
);

/**
 * @route POST /api/coupons/validate
 * @desc Validate coupon code
 * @access Private
 */
router.post('/validate', 
  authenticateToken,
  [
    body('cup_codigo')
      .notEmpty()
      .withMessage('Coupon code is required'),
    body('monto_orden')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Order amount must be a positive number')
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

    const { cup_codigo, monto_orden } = req.body;
    const result = await couponController.validateCoupon(cup_codigo, monto_orden);
    res.json(result);
  })
);

/**
 * @route GET /api/coupons/:id/usage
 * @desc Get coupon usage statistics
 * @access Private
 */
router.get('/:id/usage', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const couponId = parseInt(req.params.id);
    if (isNaN(couponId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coupon ID'
      } as ApiResponse);
    }

    const result = await couponController.getCouponUsage(couponId);
    res.json(result);
  })
);

/**
 * @route POST /api/coupons/:id/toggle-status
 * @desc Toggle coupon active status
 * @access Private (Admin)
 */
router.post('/:id/toggle-status', 
  authenticateToken,
  requireRole(['manage_coupons']),
  asyncHandler(async (req, res) => {
    const couponId = parseInt(req.params.id);
    if (isNaN(couponId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coupon ID'
      } as ApiResponse);
    }

    const result = await couponController.toggleCouponStatus(couponId);
    res.json(result);
  })
);

export { router as couponRoutes };
