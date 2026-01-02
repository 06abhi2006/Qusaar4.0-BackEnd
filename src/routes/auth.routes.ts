import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { AuthService } from '../services/auth.service';
import { AuditService } from '../middleware/audit';
import { validators, validate } from '../middleware/validation';

const router = Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/signup
 * Register a new user account
 * Note: In production, restrict role assignment based on business rules
 */
router.post(
  '/signup',
  authLimiter,
  validate([
    validators.email,
    validators.password,
    validators.name,
    body('role')
      .optional()
      .isIn(['admin', 'doctor', 'receptionist', 'patient'])
      .withMessage('Invalid role'),
  ]),
  async (req: Request, res: Response) => {
    try {
      const { email, password, name, role } = req.body;

      // Default to patient role for self-registration
      // In production, only admins should create admin/doctor/receptionist accounts
      const userRole = role || 'patient';

      const result = await AuthService.signup({
        email,
        password,
        name,
        role: userRole,
      });

      // Audit log
      try {
        await AuditService.log(
          result.user.id,
          AuditService.ACTIONS.LOGIN, // Using LOGIN action for signup
          undefined,
          { email, action: 'SIGNUP' }
        );
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
        // Don't fail signup if audit logging fails
      }

      res.status(201).json(result);
    } catch (error: any) {
      if (error.message === 'Email already registered') {
        res.status(409).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message || 'Signup failed' });
      }
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post(
  '/login',
  authLimiter,
  validate([validators.email, validators.password]),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login({ email, password });

      // Audit log
      try {
        await AuditService.log(
          result.user.id,
          AuditService.ACTIONS.LOGIN,
          undefined,
          { email }
        );
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
        // Don't fail login if audit logging fails
      }

      res.json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message || 'Login failed' });
    }
  }
);

export default router;

