import { body, param, ValidationChain } from 'express-validator';

/**
 * Validation rules for common fields
 */
export const validators = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),

  password: body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  name: body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  phone: body('phone')
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters'),

  uuid: param('id')
    .isUUID()
    .withMessage('Invalid ID format'),

  age: body('age')
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be between 0 and 150'),

  gender: body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),

  appointmentStatus: body('status')
    .optional()
    .isIn(['scheduled', 'completed', 'cancelled'])
    .withMessage('Invalid appointment status'),

  date: body('date')
    .isISO8601()
    .withMessage('Invalid date format'),

  time: body('time')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:MM)'),
};

/**
 * Helper to validate request
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: any, res: any, next: any) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: result.array(),
        });
      }
    }
    next();
  };
};

