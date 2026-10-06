import { Request, Response, NextFunction } from 'express';
import { pipelineService } from './pipeline.service';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';

export const pipelineController = {

  // ─── Pipelines ─────────────────────────────────────────────────────────────

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.query.workspaceId as string;
      const result = await pipelineService.listPipelines(workspaceId, req.user!.id, {
        status: req.query.status as any,
        search: req.query.search as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      });
      sendSuccess(res, result.pipelines, 'Pipelines retrieved', 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (err) { next(err); }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pipelineService.getPipeline(req.params.pipelineId as string, req.user!.id);
      sendSuccess(res, data, 'Pipeline retrieved');
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pipelineService.createPipeline(req.body, req.user!.id);
      sendCreated(res, data, 'Pipeline created');
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pipelineService.updatePipeline(
        req.params.pipelineId as string, req.user!.id, req.body
      );
      sendSuccess(res, data, 'Pipeline updated');
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await pipelineService.deletePipeline(req.params.pipelineId as string, req.user!.id);
      sendSuccess(res, null, 'Pipeline deleted');
    } catch (err) { next(err); }
  },

  // ─── Runs ──────────────────────────────────────────────────────────────────

  async listRuns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await pipelineService.listRuns(req.params.pipelineId as string, req.user!.id, {
        status: req.query.status as any,
        branch: req.query.branch as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      });
      sendSuccess(res, result.runs, 'Runs retrieved', 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (err) { next(err); }
  },

  async getRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pipelineService.getRun(req.params.runId as string, req.user!.id);
      sendSuccess(res, data, 'Run retrieved');
    } catch (err) { next(err); }
  },

  async triggerRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pipelineService.triggerRun(
        req.params.pipelineId as string, req.user!.id, req.body
      );
      sendCreated(res, data, 'Pipeline run triggered');
    } catch (err) { next(err); }
  },

  async cancelRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pipelineService.cancelRun(req.params.runId as string, req.user!.id);
      sendSuccess(res, data, 'Run cancelled');
    } catch (err) { next(err); }
  },

  // ─── Approvals ─────────────────────────────────────────────────────────────

  async getPendingApprovals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.query.workspaceId as string;
      const data = await pipelineService.getPendingApprovals(workspaceId, req.user!.id);
      sendSuccess(res, data, 'Pending approvals retrieved');
    } catch (err) { next(err); }
  },

  async decideApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pipelineService.decideApproval(
        req.params.approvalId as string, req.user!.id, req.body
      );
      sendSuccess(res, data, `Approval ${(req.body.decision as string).toLowerCase()}`);
    } catch (err) { next(err); }
  },

  // ─── Rollback ──────────────────────────────────────────────────────────────

  async getRollbackHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pipelineId = req.params.pipelineId as string;
      const environmentId = req.params.environmentId as string;
      const data = await pipelineService.getRollbackHistory(pipelineId, environmentId, req.user!.id);
      sendSuccess(res, data, 'Rollback history retrieved');
    } catch (err) { next(err); }
  },

  async rollback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pipelineService.rollback(req.params.deploymentId as string, req.user!.id);
      sendCreated(res, data, 'Rollback initiated');
    } catch (err) { next(err); }
  },

  // ─── Stage ─────────────────────────────────────────────────────────────────

  async getStageDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pipelineService.getStageDetails(req.params.stageId as string, req.user!.id);
      sendSuccess(res, data, 'Stage details retrieved');
    } catch (err) { next(err); }
  },

  // ─── Stats ─────────────────────────────────────────────────────────────────

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.query.workspaceId as string;
      const data = await pipelineService.getPipelineStats(workspaceId, req.user!.id);
      sendSuccess(res, data, 'Stats retrieved');
    } catch (err) { next(err); }
  },
};
