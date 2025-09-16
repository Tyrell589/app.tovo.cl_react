/**
 * @fileoverview User management routes for CRUD operations
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { UserController } from '../controllers/UserController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const userController = new UserController();

// Validation middleware
const validateCreateUser = [
  body('usu_nombre')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('usu_apellidopat')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('usu_email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('usu_password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('rol_codigo')
    .isInt({ min: 1 })
    .withMessage('Valid role is required')
];

const validateUpdateUser = [
  body('usu_nombre')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('usu_apellidopat')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('usu_email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('rol_codigo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid role is required')
];

/**
 * @route GET /api/users
 * @desc Get all users with pagination
 * @access Private (Admin)
 */
router.get('/', 
  authenticateToken, 
  requireAdmin,
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await userController.getUsers(page, limit);
    res.json(result);
  })
);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private (Admin or own profile)
 */
router.get('/:id', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      } as ApiResponse);
    }

    // Check if user is accessing their own profile or is admin
    if (req.user!.usu_codigo !== userId && req.user!.rol_codigo !== 1) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
    }

    const result = await userController.getUserById(userId);
    res.json(result);
  })
);

/**
 * @route POST /api/users
 * @desc Create new user
 * @access Private (Admin)
 */
router.post('/', 
  authenticateToken, 
  requireAdmin,
  validateCreateUser,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await userController.createUser(req.body);
    res.status(201).json(result);
  })
);

/**
 * @route PUT /api/users/:id
 * @desc Update user
 * @access Private (Admin or own profile)
 */
router.put('/:id', 
  authenticateToken,
  validateUpdateUser,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      } as ApiResponse);
    }

    // Check if user is updating their own profile or is admin
    if (req.user!.usu_codigo !== userId && req.user!.rol_codigo !== 1) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
    }

    const result = await userController.updateUser(userId, req.body);
    res.json(result);
  })
);

/**
 * @route DELETE /api/users/:id
 * @desc Delete user (soft delete)
 * @access Private (Admin)
 */
router.delete('/:id', 
  authenticateToken, 
  requireAdmin,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      } as ApiResponse);
    }

    // Prevent admin from deleting themselves
    if (req.user!.usu_codigo === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      } as ApiResponse);
    }

    const result = await userController.deleteUser(userId);
    res.json(result);
  })
);

/**
 * @route POST /api/users/:id/activate
 * @desc Activate user account
 * @access Private (Admin)
 */
router.post('/:id/activate', 
  authenticateToken, 
  requireAdmin,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      } as ApiResponse);
    }

    const result = await userController.activateUser(userId);
    res.json(result);
  })
);

/**
 * @route POST /api/users/:id/deactivate
 * @desc Deactivate user account
 * @access Private (Admin)
 */
router.post('/:id/deactivate', 
  authenticateToken, 
  requireAdmin,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      } as ApiResponse);
    }

    // Prevent admin from deactivating themselves
    if (req.user!.usu_codigo === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate your own account'
      } as ApiResponse);
    }

    const result = await userController.deactivateUser(userId);
    res.json(result);
  })
);

export { router as userRoutes };
