/**
 * @fileoverview Authentication middleware for JWT token validation and role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById } from '@tovocl/database';
import { JWTPayload, ApiResponse } from '@tovocl/types';
import { CustomError } from './errorHandler';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        usu_codigo: number;
        usu_email: string;
        usu_nombre: string;
        usu_apellidopat: string;
        rol_codigo: number;
        rol_nombre: string;
      };
    }
  }
}

/**
 * Verify JWT token and attach user to request
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new CustomError('Access token required', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Get user from database
    const user = await findUserById(decoded.userId);
    if (!user || user.flg_del !== 1) {
      throw new CustomError('User not found or inactive', 401);
    }

    // Attach user to request
    req.user = {
      usu_codigo: user.usu_codigo,
      usu_email: user.usu_email,
      usu_nombre: user.usu_nombre,
      usu_apellidopat: user.usu_apellidopat,
      rol_codigo: user.rol_codigo,
      rol_nombre: user.rol.nombre
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new CustomError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new CustomError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Check if user has required role permissions
 */
export const requireRole = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new CustomError('Authentication required', 401));
    }

    // For now, we'll implement basic role checking
    // In a more complex system, you'd check specific permissions
    const userRole = req.user.rol_codigo;
    
    // Admin role (rol_codigo = 1) has all permissions
    if (userRole === 1) {
      return next();
    }

    // Check specific role permissions
    // This is a simplified implementation - you'd want to check actual permissions
    const hasPermission = requiredPermissions.some(permission => {
      // Map permission strings to role codes or check role permissions
      return true; // Simplified for now
    });

    if (!hasPermission) {
      return next(new CustomError('Insufficient permissions', 403));
    }

    next();
  };
};

/**
 * Check if user is admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new CustomError('Authentication required', 401));
  }

  if (req.user.rol_codigo !== 1) {
    return next(new CustomError('Admin access required', 403));
  }

  next();
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      const user = await findUserById(decoded.userId);
      
      if (user && user.flg_del === 1) {
        req.user = {
          usu_codigo: user.usu_codigo,
          usu_email: user.usu_email,
          usu_nombre: user.usu_nombre,
          usu_apellidopat: user.usu_apellidopat,
          rol_codigo: user.rol_codigo,
          rol_nombre: user.rol.nombre
        };
      }
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
  }

  next();
};
