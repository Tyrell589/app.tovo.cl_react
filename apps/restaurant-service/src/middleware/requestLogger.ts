/**
 * @fileoverview Request logging middleware for restaurant service
 */

import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Log request
  console.log(`📥 ${req.method} ${req.url} - ${req.ip}`);
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    
    console.log(`${statusColor} ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};
