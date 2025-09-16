/**
 * @fileoverview Image routes for managing product images
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import multer from 'multer';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { ImageController } from '../controllers/ImageController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const imageController = new ImageController();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  fileFilter: fileFilter
});

// Validation middleware
const validateImageUpload = [
  body('product_id')
    .isInt({ min: 1 })
    .withMessage('Valid product ID is required'),
  body('tipo')
    .isIn(['plato', 'bebida'])
    .withMessage('Product type must be either plato or bebida')
];

/**
 * @route POST /api/images/upload
 * @desc Upload product image
 * @access Private (Admin or Manager)
 */
router.post('/upload', 
  authenticateToken, 
  requireRole(['manage_products']),
  upload.single('image'),
  validateImageUpload,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      } as ApiResponse);
    }

    const { product_id, tipo } = req.body;
    const result = await imageController.uploadProductImage(
      parseInt(product_id), 
      tipo, 
      req.file
    );
    
    res.status(201).json(result);
  })
);

/**
 * @route DELETE /api/images/:id
 * @desc Delete product image
 * @access Private (Admin or Manager)
 */
router.delete('/:id', 
  authenticateToken, 
  requireRole(['manage_products']),
  asyncHandler(async (req, res) => {
    const imageId = parseInt(req.params.id);
    if (isNaN(imageId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image ID'
      } as ApiResponse);
    }

    const result = await imageController.deleteProductImage(imageId);
    res.json(result);
  })
);

/**
 * @route GET /api/images/:productId
 * @desc Get product images
 * @access Private
 */
router.get('/:productId', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      } as ApiResponse);
    }

    const result = await imageController.getProductImages(productId);
    res.json(result);
  })
);

/**
 * @route POST /api/images/:id/set-primary
 * @desc Set image as primary
 * @access Private (Admin or Manager)
 */
router.post('/:id/set-primary', 
  authenticateToken,
  requireRole(['manage_products']),
  asyncHandler(async (req, res) => {
    const imageId = parseInt(req.params.id);
    if (isNaN(imageId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image ID'
      } as ApiResponse);
    }

    const result = await imageController.setPrimaryImage(imageId);
    res.json(result);
  })
);

/**
 * @route POST /api/images/resize
 * @desc Resize image
 * @access Private (Admin or Manager)
 */
router.post('/resize', 
  authenticateToken,
  requireRole(['manage_products']),
  upload.single('image'),
  [
    body('width')
      .optional()
      .isInt({ min: 100, max: 2000 })
      .withMessage('Width must be between 100 and 2000 pixels'),
    body('height')
      .optional()
      .isInt({ min: 100, max: 2000 })
      .withMessage('Height must be between 100 and 2000 pixels'),
    body('quality')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Quality must be between 1 and 100')
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      } as ApiResponse);
    }

    const { width, height, quality } = req.body;
    const result = await imageController.resizeImage(
      req.file,
      width ? parseInt(width) : undefined,
      height ? parseInt(height) : undefined,
      quality ? parseInt(quality) : undefined
    );
    
    res.json(result);
  })
);

export { router as imageRoutes };
