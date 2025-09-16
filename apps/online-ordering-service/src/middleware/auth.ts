/**
 * @fileoverview Authentication middleware for JWT token validation
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, ApiResponse } from '@tovocl/types';
import { CustomError } from './errorHandler';

// Extend Request interface to include user and customer
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
      customer?: {
        cli_codigo: number;
        cli_email: string;
        cli_nombre: string;
        cli_apellidopat: string;
        cli_telefono: string;
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
 * Verify customer JWT token and attach customer to request
 */
export const authenticateCustomer = async (
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
    
    // For customer tokens, we'll use a different structure
    // This is a simplified implementation
    req.customer = {
      cli_codigo: decoded.userId,
      cli_email: decoded.email,
      cli_nombre: 'Customer',
      cli_apellidopat: 'Name',
      cli_telefono: ''
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
      req.user = {
        usu_codigo: decoded.userId,
        usu_email: decoded.email,
        usu_nombre: 'User',
        usu_apellidopat: 'Name',
        rol_codigo: decoded.roleId,
        rol_nombre: 'User'
      };
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
