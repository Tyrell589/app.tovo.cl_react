/**
 * @fileoverview Customer routes for customer management
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, authenticateCustomer, requireRole } from '../middleware/auth';
import { CustomerController } from '../controllers/CustomerController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const customerController = new CustomerController();

// Validation middleware
const validateCustomerRegistration = [
  body('cli_nombre')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('cli_apellidopat')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('cli_email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('cli_telefono')
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 8, max: 15 })
    .withMessage('Phone number must be between 8 and 15 characters'),
  body('cli_password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('cli_direccion')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address must be less than 200 characters'),
  body('cli_ciudad')
    .optional()
    .isLength({ max: 50 })
    .withMessage('City must be less than 50 characters')
];

const validateCustomerUpdate = [
  body('cli_nombre')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('cli_apellidopat')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('cli_email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('cli_telefono')
    .optional()
    .isLength({ min: 8, max: 15 })
    .withMessage('Phone number must be between 8 and 15 characters'),
  body('cli_direccion')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address must be less than 200 characters'),
  body('cli_ciudad')
    .optional()
    .isLength({ max: 50 })
    .withMessage('City must be less than 50 characters')
];

/**
 * @route POST /api/customers/register
 * @desc Register new customer
 * @access Public
 */
router.post('/register', 
  validateCustomerRegistration,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await customerController.registerCustomer(req.body);
    res.status(201).json(result);
  })
);

/**
 * @route POST /api/customers/login
 * @desc Customer login
 * @access Public
 */
router.post('/login', 
  [
    body('cli_email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('cli_password')
      .notEmpty()
      .withMessage('Password is required')
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

    const result = await customerController.loginCustomer(req.body);
    res.json(result);
  })
);

/**
 * @route GET /api/customers/profile
 * @desc Get customer profile
 * @access Private (Customer)
 */
router.get('/profile', 
  authenticateCustomer,
  asyncHandler(async (req, res) => {
    const result = await customerController.getCustomerProfile(req.customer!.cli_codigo);
    res.json(result);
  })
);

/**
 * @route PUT /api/customers/profile
 * @desc Update customer profile
 * @access Private (Customer)
 */
router.put('/profile', 
  authenticateCustomer,
  validateCustomerUpdate,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await customerController.updateCustomerProfile(req.customer!.cli_codigo, req.body);
    res.json(result);
  })
);

/**
 * @route GET /api/customers
 * @desc Get all customers (Admin)
 * @access Private (Admin)
 */
router.get('/', 
  authenticateToken,
  requireRole(['view_customers']),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
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
    const search = req.query.search as string;
    
    const result = await customerController.getCustomers(page, limit, search);
    res.json(result);
  })
);

/**
 * @route GET /api/customers/:id
 * @desc Get customer by ID (Admin)
 * @access Private (Admin)
 */
router.get('/:id', 
  authenticateToken,
  requireRole(['view_customers']),
  asyncHandler(async (req, res) => {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid customer ID'
      } as ApiResponse);
    }

    const result = await customerController.getCustomerById(customerId);
    res.json(result);
  })
);

/**
 * @route PUT /api/customers/:id
 * @desc Update customer (Admin)
 * @access Private (Admin)
 */
router.put('/:id', 
  authenticateToken,
  requireRole(['manage_customers']),
  validateCustomerUpdate,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid customer ID'
      } as ApiResponse);
    }

    const result = await customerController.updateCustomer(customerId, req.body);
    res.json(result);
  })
);

/**
 * @route DELETE /api/customers/:id
 * @desc Delete customer (Admin)
 * @access Private (Admin)
 */
router.delete('/:id', 
  authenticateToken,
  requireRole(['delete_customers']),
  asyncHandler(async (req, res) => {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid customer ID'
      } as ApiResponse);
    }

    const result = await customerController.deleteCustomer(customerId);
    res.json(result);
  })
);

export { router as customerRoutes };
