import { body } from 'express-validator';

export const registerValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2–100 characters'),
];

export const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  body('totpCode').optional().isLength({ min: 6, max: 6 }).isNumeric().withMessage('TOTP code must be 6 digits'),
];

export const refreshTokenValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token required'),
];

export const verifyMfaValidator = [
  body('totpCode').isLength({ min: 6, max: 6 }).isNumeric().withMessage('TOTP code must be 6 digits'),
];

export const disableMfaValidator = [
  body('password').notEmpty().withMessage('Password required'),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

export const updateProfileValidator = [
  body('fullName').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2–100 characters'),
  body('avatarUrl').optional().isURL().withMessage('Avatar URL must be a valid URL'),
];
