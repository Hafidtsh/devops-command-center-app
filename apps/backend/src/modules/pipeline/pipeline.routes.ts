import { Router } from 'express';
import { pipelineController } from './pipeline.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { apiRateLimiter } from '../../middlewares/rateLimiter';
import {
  createPipelineValidator,
  updatePipelineValidator,
  triggerRunValidator,
  decideApprovalValidator,
  listRunsQueryValidator,
  listPipelinesQueryValidator,
} from './pipeline.validators';

const router = Router();

router.use(authenticate);
router.use(apiRateLimiter);

// ─── Pipeline CRUD ────────────────────────────────────────────────────────────
router.get('/', listPipelinesQueryValidator, validate, pipelineController.list);
router.post('/', createPipelineValidator, validate, pipelineController.create);
router.get('/stats', pipelineController.getStats);
router.get('/approvals/pending', pipelineController.getPendingApprovals);
router.get('/:pipelineId', pipelineController.get);
router.patch('/:pipelineId', updatePipelineValidator, validate, pipelineController.update);
router.delete('/:pipelineId', pipelineController.delete);

// ─── Runs ─────────────────────────────────────────────────────────────────────
router.get('/:pipelineId/runs', listRunsQueryValidator, validate, pipelineController.listRuns);
router.post('/:pipelineId/runs', triggerRunValidator, validate, pipelineController.triggerRun);
router.get('/runs/:runId', pipelineController.getRun);
router.post('/runs/:runId/cancel', pipelineController.cancelRun);

// ─── Stages ───────────────────────────────────────────────────────────────────
router.get('/stages/:stageId', pipelineController.getStageDetails);

// ─── Approvals ────────────────────────────────────────────────────────────────
router.post('/approvals/:approvalId/decide', decideApprovalValidator, validate, pipelineController.decideApproval);

// ─── Rollback ─────────────────────────────────────────────────────────────────
router.get('/:pipelineId/rollback/:environmentId/history', pipelineController.getRollbackHistory);
router.post('/deployments/:deploymentId/rollback', pipelineController.rollback);

export default router;
