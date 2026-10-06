import { Router } from 'express';
import { workspaceController } from './workspace.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { apiRateLimiter } from '../../middlewares/rateLimiter';
import {
  createWorkspaceValidator,
  updateWorkspaceValidator,
  inviteMemberValidator,
  updateMemberRoleValidator,
  createEnvironmentValidator,
  paginationValidator,
} from './workspace.validators';

const router = Router();

// All workspace routes require auth
router.use(authenticate);
router.use(apiRateLimiter);

// ─── Workspace CRUD ───────────────────────────────────────────────────────────
router.get('/', workspaceController.listMyWorkspaces);
router.post('/', createWorkspaceValidator, validate, workspaceController.createWorkspace);
router.get('/:workspaceId', workspaceController.getWorkspace);
router.patch('/:workspaceId', updateWorkspaceValidator, validate, workspaceController.updateWorkspace);
router.delete('/:workspaceId', workspaceController.deleteWorkspace);

// ─── Members ──────────────────────────────────────────────────────────────────
router.post('/:workspaceId/members/invite', inviteMemberValidator, validate, workspaceController.inviteMember);
router.patch('/:workspaceId/members/:userId/role', updateMemberRoleValidator, validate, workspaceController.updateMemberRole);
router.delete('/:workspaceId/members/:userId', workspaceController.removeMember);

// ─── Environments ─────────────────────────────────────────────────────────────
router.get('/:workspaceId/environments', workspaceController.listEnvironments);
router.post('/:workspaceId/environments', createEnvironmentValidator, validate, workspaceController.createEnvironment);

// ─── Audit Logs ───────────────────────────────────────────────────────────────
router.get('/:workspaceId/audit-logs', paginationValidator, validate, workspaceController.listAuditLogs);

export default router;
