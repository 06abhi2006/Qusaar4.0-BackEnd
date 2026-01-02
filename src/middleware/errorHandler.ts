import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Centralized Error Handler
 * Provides consistent error responses without exposing internal details
 */
export const errorHandler = (
  err: Error | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error for debugging (in production, use proper logging service)
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Unique constraint violation
      res.status(409).json({
        message: 'A record with this information already exists',
      });
      return;
    }
    if (err.code === 'P2025') {
      // Record not found
      res.status(404).json({
        message: 'Record not found',
      });
      return;
    }
    if (err.code === 'P2003') {
      // Foreign key constraint violation
      res.status(400).json({
        message: 'Invalid reference to related record',
      });
      return;
    }
  }

  // Validation errors (from express-validator)
  if (err.name === 'ValidationError') {
    res.status(400).json({
      message: 'Validation failed',
      errors: (err as any).errors,
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      message: 'Authentication failed',
    });
    return;
  }

  // Default error response
  const statusCode = (err as any).statusCode || 500;
  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : err.message,
  });
};

/**
 * 404 Handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    message: 'Route not found',
    path: req.path,
  });
};

