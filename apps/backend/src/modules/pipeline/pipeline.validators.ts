import { body, query, param } from 'express-validator';

export const createPipelineValidator = [
  body('workspaceId').isUUID().withMessage('Valid workspace ID required'),
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Pipeline name must be 2–100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('triggerType')
    .optional()
    .isIn(['PUSH', 'PULL_REQUEST', 'SCHEDULE', 'MANUAL'])
    .withMessage('triggerType must be PUSH, PULL_REQUEST, SCHEDULE, or MANUAL'),
  body('configYaml').optional().isString(),
];

export const updatePipelineValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('triggerType')
    .optional()
    .isIn(['PUSH', 'PULL_REQUEST', 'SCHEDULE', 'MANUAL']),
  body('configYaml').optional().isString(),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
    .withMessage('status must be ACTIVE, INACTIVE, or ARCHIVED'),
];

export const triggerRunValidator = [
  body('branch').optional().trim().isLength({ min: 1, max: 200 }),
  body('commitSha').optional().trim().isLength({ min: 7, max: 40 }),
  body('commitMsg').optional().trim().isLength({ max: 300 }),
];

export const decideApprovalValidator = [
  body('decision').isIn(['APPROVED', 'REJECTED']).withMessage('decision must be APPROVED or REJECTED'),
  body('comment').optional().trim().isLength({ max: 1000 }),
];

export const listRunsQueryValidator = [
  query('status').optional().isIn(['QUEUED', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED']),
  query('branch').optional().trim(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const listPipelinesQueryValidator = [
  query('workspaceId').isUUID().withMessage('workspaceId query param required'),
  query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'ARCHIVED']),
  query('search').optional().trim(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];
