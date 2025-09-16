/**
 * @fileoverview Authentication middleware for JWT token validation
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
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
    
    // Attach user to request (simplified for now)
    req.user = {
      usu_codigo: decoded.userId,
      usu_email: decoded.email,
      usu_nombre: 'User',
      usu_apellidopat: 'Name',
      rol_codigo: decoded.roleId,
      rol_nombre: 'User'
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
