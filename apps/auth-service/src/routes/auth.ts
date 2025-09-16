/**
 * @fileoverview Authentication routes for login, logout, and token management
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { AuthController } from '../controllers/AuthController';
import { AuthRequest, ApiResponse } from '@tovocl/types';

const router = Router();
const authController = new AuthController();

// Validation middleware
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

/**
 * @route POST /api/auth/login
 * @desc Login user and return JWT tokens
 * @access Public
 */
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    } as ApiResponse);
  }

  const { email, password } = req.body as AuthRequest;
  const result = await authController.login(email, password);
  
  res.json(result);
}));

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post('/refresh', validateRefreshToken, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    } as ApiResponse);
  }

  const { refreshToken } = req.body;
  const result = await authController.refreshToken(refreshToken);
  
  res.json(result);
}));

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate tokens
 * @access Private
 */
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  const result = await authController.logout(req.user!.usu_codigo);
  res.json(result);
}));

/**
 * @route GET /api/auth/me
 * @desc Get current user information
 * @access Private
 */
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const result = await authController.getCurrentUser(req.user!.usu_codigo);
  res.json(result);
}));

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password', 
  authenticateToken, 
  validateChangePassword, 
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const { currentPassword, newPassword } = req.body;
    const result = await authController.changePassword(
      req.user!.usu_codigo, 
      currentPassword, 
      newPassword
    );
    
    res.json(result);
  })
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password', 
  body('email').isEmail().normalizeEmail(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required'
      } as ApiResponse);
    }

    const { email } = req.body;
    const result = await authController.forgotPassword(email);
    res.json(result);
  })
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
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

    const { token, password } = req.body;
    const result = await authController.resetPassword(token, password);
    res.json(result);
  })
);

/**
 * @route POST /api/auth/verify-email
 * @desc Verify email address
 * @access Public
 */
router.post('/verify-email',
  body('token').notEmpty().withMessage('Verification token is required'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required'
      } as ApiResponse);
    }

    const { token } = req.body;
    const result = await authController.verifyEmail(token);
    res.json(result);
  })
);

export { router as authRoutes };
