/**
 * @fileoverview Turn routes for managing restaurant shifts and turns
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { TurnController } from '../controllers/TurnController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const turnController = new TurnController();

// Validation middleware
const validateCreateTurn = [
  body('tur_nombre')
    .notEmpty()
    .withMessage('Turn name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Turn name must be between 2 and 100 characters'),
  body('tur_hora_inicio')
    .isString()
    .withMessage('Start time is required'),
  body('tur_hora_fin')
    .isString()
    .withMessage('End time is required')
];

const validateUpdateTurn = [
  body('tur_nombre')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Turn name must be between 2 and 100 characters'),
  body('tur_hora_inicio')
    .optional()
    .isString()
    .withMessage('Start time must be a string'),
  body('tur_hora_fin')
    .optional()
    .isString()
    .withMessage('End time must be a string')
];

/**
 * @route GET /api/turns
 * @desc Get all turns with pagination and filters
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
    
    const result = await turnController.getTurns(page, limit, search);
    res.json(result);
  })
);

/**
 * @route GET /api/turns/:id
 * @desc Get turn by ID
 * @access Private
 */
router.get('/:id', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const turnId = parseInt(req.params.id);
    if (isNaN(turnId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid turn ID'
      } as ApiResponse);
    }

    const result = await turnController.getTurnById(turnId);
    res.json(result);
  })
);

/**
 * @route POST /api/turns
 * @desc Create new turn
 * @access Private (Admin or Manager)
 */
router.post('/', 
  authenticateToken, 
  requireRole(['manage_turns']),
  validateCreateTurn,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await turnController.createTurn(req.body);
    res.status(201).json(result);
  })
);

/**
 * @route PUT /api/turns/:id
 * @desc Update turn
 * @access Private (Admin or Manager)
 */
router.put('/:id', 
  authenticateToken,
  requireRole(['manage_turns']),
  validateUpdateTurn,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const turnId = parseInt(req.params.id);
    if (isNaN(turnId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid turn ID'
      } as ApiResponse);
    }

    const result = await turnController.updateTurn(turnId, req.body);
    res.json(result);
  })
);

/**
 * @route DELETE /api/turns/:id
 * @desc Delete turn (soft delete)
 * @access Private (Admin)
 */
router.delete('/:id', 
  authenticateToken, 
  requireRole(['delete_turns']),
  asyncHandler(async (req, res) => {
    const turnId = parseInt(req.params.id);
    if (isNaN(turnId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid turn ID'
      } as ApiResponse);
    }

    const result = await turnController.deleteTurn(turnId);
    res.json(result);
  })
);

/**
 * @route POST /api/turns/:id/start
 * @desc Start turn
 * @access Private
 */
router.post('/:id/start', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const turnId = parseInt(req.params.id);
    if (isNaN(turnId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid turn ID'
      } as ApiResponse);
    }

    const result = await turnController.startTurn(turnId, req.user!.usu_codigo);
    res.json(result);
  })
);

/**
 * @route POST /api/turns/:id/end
 * @desc End turn
 * @access Private
 */
router.post('/:id/end', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const turnId = parseInt(req.params.id);
    if (isNaN(turnId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid turn ID'
      } as ApiResponse);
    }

    const result = await turnController.endTurn(turnId, req.user!.usu_codigo);
    res.json(result);
  })
);

/**
 * @route GET /api/turns/current
 * @desc Get current active turn
 * @access Private
 */
router.get('/current', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await turnController.getCurrentTurn();
    res.json(result);
  })
);

/**
 * @route GET /api/turns/:id/stats
 * @desc Get turn statistics
 * @access Private
 */
router.get('/:id/stats', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const turnId = parseInt(req.params.id);
    if (isNaN(turnId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid turn ID'
      } as ApiResponse);
    }

    const result = await turnController.getTurnStats(turnId);
    res.json(result);
  })
);

export { router as turnRoutes };
