/**
 * @fileoverview Role management routes for CRUD operations
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { RoleController } from '../controllers/RoleController';
import { ApiResponse } from '@tovocl/types';

const router = Router();
const roleController = new RoleController();

// Validation middleware
const validateCreateRole = [
  body('rol_nombre')
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters'),
  body('rol_cerrarmesa')
    .optional()
    .isBoolean()
    .withMessage('rol_cerrarmesa must be a boolean'),
  body('rol_crearadiciones')
    .optional()
    .isBoolean()
    .withMessage('rol_crearadiciones must be a boolean'),
  body('rol_cancelaradiciones')
    .optional()
    .isBoolean()
    .withMessage('rol_cancelaradiciones must be a boolean'),
  body('rol_crearplatos')
    .optional()
    .isBoolean()
    .withMessage('rol_crearplatos must be a boolean'),
  body('rol_eliminarplatos')
    .optional()
    .isBoolean()
    .withMessage('rol_eliminarplatos must be a boolean'),
  body('rol_crearbebidas')
    .optional()
    .isBoolean()
    .withMessage('rol_crearbebidas must be a boolean'),
  body('rol_eliminarbebidas')
    .optional()
    .isBoolean()
    .withMessage('rol_eliminarbebidas must be a boolean'),
  body('rol_crearclientes')
    .optional()
    .isBoolean()
    .withMessage('rol_crearclientes must be a boolean'),
  body('rol_eliminarclientes')
    .optional()
    .isBoolean()
    .withMessage('rol_eliminarclientes must be a boolean'),
  body('rol_crearusuarios')
    .optional()
    .isBoolean()
    .withMessage('rol_crearusuarios must be a boolean'),
  body('rol_eliminarusuarios')
    .optional()
    .isBoolean()
    .withMessage('rol_eliminarusuarios must be a boolean'),
  body('rol_verventas')
    .optional()
    .isBoolean()
    .withMessage('rol_verventas must be a boolean'),
  body('rol_verreportes')
    .optional()
    .isBoolean()
    .withMessage('rol_verreportes must be a boolean'),
  body('rol_configuracion')
    .optional()
    .isBoolean()
    .withMessage('rol_configuracion must be a boolean'),
  body('rol_controlstock')
    .optional()
    .isBoolean()
    .withMessage('rol_controlstock must be a boolean'),
  body('rol_movimientodinero')
    .optional()
    .isBoolean()
    .withMessage('rol_movimientodinero must be a boolean'),
  body('rol_arqueos')
    .optional()
    .isBoolean()
    .withMessage('rol_arqueos must be a boolean'),
  body('rol_propinas')
    .optional()
    .isBoolean()
    .withMessage('rol_propinas must be a boolean'),
  body('rol_delivery')
    .optional()
    .isBoolean()
    .withMessage('rol_delivery must be a boolean'),
  body('rol_mostrador')
    .optional()
    .isBoolean()
    .withMessage('rol_mostrador must be a boolean'),
  body('rol_cocina')
    .optional()
    .isBoolean()
    .withMessage('rol_cocina must be a boolean'),
  body('rol_administracion')
    .optional()
    .isBoolean()
    .withMessage('rol_administracion must be a boolean'),
  body('rol_online')
    .optional()
    .isBoolean()
    .withMessage('rol_online must be a boolean')
];

const validateUpdateRole = [
  body('rol_nombre')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters'),
  // All permission fields are optional for updates
  ...Object.keys({
    rol_cerrarmesa: true,
    rol_crearadiciones: true,
    rol_cancelaradiciones: true,
    rol_crearplatos: true,
    rol_eliminarplatos: true,
    rol_crearbebidas: true,
    rol_eliminarbebidas: true,
    rol_crearclientes: true,
    rol_eliminarclientes: true,
    rol_crearusuarios: true,
    rol_eliminarusuarios: true,
    rol_verventas: true,
    rol_verreportes: true,
    rol_configuracion: true,
    rol_controlstock: true,
    rol_movimientodinero: true,
    rol_arqueos: true,
    rol_propinas: true,
    rol_delivery: true,
    rol_mostrador: true,
    rol_cocina: true,
    rol_administracion: true,
    rol_online: true
  }).map(field => 
    body(field)
      .optional()
      .isBoolean()
      .withMessage(`${field} must be a boolean`)
  )
];

/**
 * @route GET /api/roles
 * @desc Get all roles
 * @access Private (Admin)
 */
router.get('/', 
  authenticateToken, 
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await roleController.getRoles();
    res.json(result);
  })
);

/**
 * @route GET /api/roles/:id
 * @desc Get role by ID
 * @access Private (Admin)
 */
router.get('/:id', 
  authenticateToken, 
  requireAdmin,
  asyncHandler(async (req, res) => {
    const roleId = parseInt(req.params.id);
    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role ID'
      } as ApiResponse);
    }

    const result = await roleController.getRoleById(roleId);
    res.json(result);
  })
);

/**
 * @route POST /api/roles
 * @desc Create new role
 * @access Private (Admin)
 */
router.post('/', 
  authenticateToken, 
  requireAdmin,
  validateCreateRole,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const result = await roleController.createRole(req.body);
    res.status(201).json(result);
  })
);

/**
 * @route PUT /api/roles/:id
 * @desc Update role
 * @access Private (Admin)
 */
router.put('/:id', 
  authenticateToken, 
  requireAdmin,
  validateUpdateRole,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse);
    }

    const roleId = parseInt(req.params.id);
    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role ID'
      } as ApiResponse);
    }

    const result = await roleController.updateRole(roleId, req.body);
    res.json(result);
  })
);

/**
 * @route DELETE /api/roles/:id
 * @desc Delete role (soft delete)
 * @access Private (Admin)
 */
router.delete('/:id', 
  authenticateToken, 
  requireAdmin,
  asyncHandler(async (req, res) => {
    const roleId = parseInt(req.params.id);
    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role ID'
      } as ApiResponse);
    }

    const result = await roleController.deleteRole(roleId);
    res.json(result);
  })
);

export { router as roleRoutes };
