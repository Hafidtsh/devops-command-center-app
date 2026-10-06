import { body, param, query } from 'express-validator';

export const createWorkspaceValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Workspace name must be 2–100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('orgId').isUUID().withMessage('Valid organization ID required'),
];

export const updateWorkspaceValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
];

export const inviteMemberValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('role')
    .isIn(['ADMIN', 'EDITOR', 'VIEWER'])
    .withMessage('Role must be ADMIN, EDITOR, or VIEWER'),
];

export const updateMemberRoleValidator = [
  body('role')
    .isIn(['ADMIN', 'EDITOR', 'VIEWER'])
    .withMessage('Role must be ADMIN, EDITOR, or VIEWER'),
];

export const createEnvironmentValidator = [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Environment name required'),
  body('type')
    .isIn(['DEV', 'STAGING', 'PRODUCTION', 'CUSTOM'])
    .withMessage('Type must be DEV, STAGING, PRODUCTION, or CUSTOM'),
  body('isProtected').optional().isBoolean(),
];

export const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];
