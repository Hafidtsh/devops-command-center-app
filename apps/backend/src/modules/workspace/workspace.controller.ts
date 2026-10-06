import { Request, Response, NextFunction } from 'express';
import { workspaceService } from './workspace.service';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';

export const workspaceController = {
  // ─── Workspaces ────────────────────────────────────────────────────────────

  async listMyWorkspaces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await workspaceService.listMyWorkspaces(req.user!.id);
      sendSuccess(res, data, 'Workspaces retrieved');
    } catch (err) { next(err); }
  },

  async getWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await workspaceService.getWorkspace(req.params.workspaceId as string, req.user!.id);
      sendSuccess(res, data, 'Workspace retrieved');
    } catch (err) { next(err); }
  },

  async createWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await workspaceService.createWorkspace(req.body, req.user!.id);
      sendCreated(res, data, 'Workspace created');
    } catch (err) { next(err); }
  },

  async updateWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await workspaceService.updateWorkspace(
        req.params.workspaceId as string, req.user!.id, req.body
      );
      sendSuccess(res, data, 'Workspace updated');
    } catch (err) { next(err); }
  },

  async deleteWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await workspaceService.deleteWorkspace(req.params.workspaceId as string, req.user!.id);
      sendSuccess(res, null, 'Workspace deleted');
    } catch (err) { next(err); }
  },

  // ─── Members ───────────────────────────────────────────────────────────────

  async inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await workspaceService.inviteMember(
        req.params.workspaceId as string, req.user!.id, req.body
      );
      sendCreated(res, data, 'Member invited successfully');
    } catch (err) { next(err); }
  },

  async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await workspaceService.updateMemberRole(
        req.params.workspaceId as string, req.user!.id, req.params.userId as string, req.body
      );
      sendSuccess(res, data, 'Member role updated');
    } catch (err) { next(err); }
  },

  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await workspaceService.removeMember(
        req.params.workspaceId as string, req.user!.id, req.params.userId as string
      );
      sendSuccess(res, null, 'Member removed');
    } catch (err) { next(err); }
  },

  // ─── Environments ──────────────────────────────────────────────────────────

  async listEnvironments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await workspaceService.listEnvironments(
        req.params.workspaceId as string, req.user!.id
      );
      sendSuccess(res, data, 'Environments retrieved');
    } catch (err) { next(err); }
  },

  async createEnvironment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await workspaceService.createEnvironment(
        req.params.workspaceId as string, req.user!.id, req.body
      );
      sendCreated(res, data, 'Environment created');
    } catch (err) { next(err); }
  },

  // ─── Audit Logs ────────────────────────────────────────────────────────────

  async listAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await workspaceService.listAuditLogs(
        req.params.workspaceId as string, req.user!.id, page, limit
      );
      sendSuccess(res, result.logs, 'Audit logs retrieved', 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (err) { next(err); }
  },
};
