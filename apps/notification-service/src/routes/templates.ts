/**
 * @fileoverview Email template routes
 */

import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { TemplateController } from '../controllers/TemplateController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const templateController = new TemplateController();

/**
 * @route GET /api/templates
 * @desc Get available templates
 * @access Public
 */
router.get('/', 
  asyncHandler(async (req, res) => {
    const result = await templateController.getTemplates();
    res.json(result);
  })
);

/**
 * @route GET /api/templates/:name
 * @desc Get specific template
 * @access Public
 */
router.get('/:name', 
  [
    query('preview')
      .optional()
      .isBoolean()
      .withMessage('Preview must be a boolean')
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

    const templateName = req.params.name;
    const preview = req.query.preview === 'true';
    
    const result = await templateController.getTemplate(templateName, preview);
    res.json(result);
  })
);

export { router as templateRoutes };
