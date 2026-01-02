import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    // Verify user exists in database and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ message: 'Account is inactive' });
      return;
    }

    // Verify token role matches database role (prevents role escalation)
    if (user.role !== decoded.role) {
      res.status(401).json({ message: 'Token role mismatch' });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired' });
      return;
    }
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

/**
 * Role-Based Access Control Middleware
 * Ensures user has one of the required roles
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

/**
 * Resource Ownership Check Middleware
 * For routes where users can only access their own resources
 */
export const requireOwnership = (resourceParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const resourceId = req.params[resourceParam];

    try {
      // For patients: can only access their own data
      if (req.user.role === 'patient') {
        const patient = await prisma.patient.findUnique({
          where: { userId: req.user.id },
        });

        if (!patient || patient.id !== resourceId) {
          res.status(403).json({ message: 'Access denied: You can only view your own records' });
          return;
        }
      }

      // For doctors: can access their own appointments/records
      if (req.user.role === 'doctor') {
        // This will be handled in route-specific logic
        // Middleware just ensures user is authenticated
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ message: 'Authorization check failed' });
    }
  };
};

