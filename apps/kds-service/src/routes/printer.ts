/**
 * @fileoverview Printer routes for kitchen printing
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { PrinterController } from '../controllers/PrinterController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const printerController = new PrinterController();

/**
 * @route POST /api/printer/test
 * @desc Test printer connection
 * @access Public
 */
router.post('/test', 
  asyncHandler(async (req, res) => {
    const result = await printerController.testConnection();
    res.json(result);
  })
);

/**
 * @route POST /api/printer/print-order
 * @desc Print order
 * @access Public
 */
router.post('/print-order', 
  [
    body('order_id')
      .isInt({ min: 1 })
      .withMessage('Valid order ID is required')
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

    const { order_id } = req.body;
    const result = await printerController.printOrder(order_id);
    res.json(result);
  })
);

/**
 * @route POST /api/printer/print-kitchen-ticket
 * @desc Print kitchen ticket
 * @access Public
 */
router.post('/print-kitchen-ticket', 
  [
    body('order_id')
      .isInt({ min: 1 })
      .withMessage('Valid order ID is required'),
    body('station')
      .notEmpty()
      .withMessage('Station is required')
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

    const { order_id, station } = req.body;
    const result = await printerController.printKitchenTicket(order_id, station);
    res.json(result);
  })
);

/**
 * @route POST /api/printer/print-receipt
 * @desc Print receipt
 * @access Public
 */
router.post('/print-receipt', 
  [
    body('order_id')
      .isInt({ min: 1 })
      .withMessage('Valid order ID is required')
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

    const { order_id } = req.body;
    const result = await printerController.printReceipt(order_id);
    res.json(result);
  })
);

/**
 * @route GET /api/printer/status
 * @desc Get printer status
 * @access Public
 */
router.get('/status', 
  asyncHandler(async (req, res) => {
    const result = await printerController.getPrinterStatus();
    res.json(result);
  })
);

export { router as printerRoutes };
