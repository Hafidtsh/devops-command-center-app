import { RunStatus, StageType, TriggerType, PipelineStatus, ApprovalStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { logger } from '../../utils/logger';
import { io } from '../../index';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreatePipelineDto {
  workspaceId: string;
  name: string;
  description?: string;
  triggerType?: TriggerType;
  configYaml?: string;
  stages?: CreateStageDto[];
}

export interface UpdatePipelineDto {
  name?: string;
  description?: string;
  triggerType?: TriggerType;
  configYaml?: string;
  status?: PipelineStatus;
}

export interface CreateStageDto {
  name: string;
  type: StageType;
  orderIndex: number;
  requiresApproval?: boolean;
  approverIds?: string[];
}

export interface TriggerRunDto {
  branch?: string;
  commitSha?: string;
  commitMsg?: string;
}

export interface ApproveStageDto {
  comment?: string;
  decision: 'APPROVED' | 'REJECTED';
}

// ─── Pipeline Service ─────────────────────────────────────────────────────────

export const pipelineService = {

  // ─── Pipeline CRUD ──────────────────────────────────────────────────────────

  async listPipelines(workspaceId: string, userId: string, filters: {
    status?: PipelineStatus;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    await this._assertMember(workspaceId, userId);

    const { status, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      workspaceId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [pipelines, total] = await Promise.all([
      prisma.pipeline.findMany({
        where,
        include: {
          creator: { select: { id: true, fullName: true, avatarUrl: true } },
          _count: { select: { runs: true } },
          runs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true, runNumber: true, status: true,
              startedAt: true, finishedAt: true, durationMs: true, branch: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pipeline.count({ where }),
    ]);

    return { pipelines, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getPipeline(pipelineId: string, userId: string) {
    const pipeline = await prisma.pipeline.findUnique({
      where: { id: pipelineId },
      include: {
        creator: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        runs: {
          orderBy: { runNumber: 'desc' },
          take: 10,
          include: {
            stages: { orderBy: { orderIndex: 'asc' } },
            deployments: {
              include: { environment: { select: { id: true, name: true, type: true } } },
            },
          },
        },
        _count: { select: { runs: true } },
      },
    });

    if (!pipeline) throw new AppError('Pipeline not found', 404);
    await this._assertMember(pipeline.workspaceId, userId);
    return pipeline;
  },

  async createPipeline(dto: CreatePipelineDto, userId: string) {
    await this._assertRole(dto.workspaceId, userId, ['ADMIN', 'EDITOR']);

    const pipeline = await prisma.pipeline.create({
      data: {
        workspaceId: dto.workspaceId,
        name: dto.name,
        description: dto.description,
        triggerType: dto.triggerType ?? 'MANUAL',
        configYaml: dto.configYaml,
        createdBy: userId,
      },
      include: {
        creator: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        workspaceId: dto.workspaceId,
        action: 'PIPELINE_CREATED',
        resourceType: 'Pipeline',
        resourceId: pipeline.id,
        detailsJson: { name: pipeline.name },
      },
    });

    logger.info(`Pipeline created: ${pipeline.name} in workspace ${dto.workspaceId}`);
    return pipeline;
  },

  async updatePipeline(pipelineId: string, userId: string, dto: UpdatePipelineDto) {
    const pipeline = await this._getPipelineOrThrow(pipelineId);
    await this._assertRole(pipeline.workspaceId, userId, ['ADMIN', 'EDITOR']);

    const updated = await prisma.pipeline.update({
      where: { id: pipelineId },
      data: dto,
    });

    await prisma.auditLog.create({
      data: {
        userId,
        workspaceId: pipeline.workspaceId,
        action: 'PIPELINE_UPDATED',
        resourceType: 'Pipeline',
        resourceId: pipelineId,
        detailsJson: dto as unknown as Prisma.InputJsonValue,
      },
    });

    return updated;
  },

  async deletePipeline(pipelineId: string, userId: string): Promise<void> {
    const pipeline = await this._getPipelineOrThrow(pipelineId);
    await this._assertRole(pipeline.workspaceId, userId, ['ADMIN']);

    await prisma.pipeline.delete({ where: { id: pipelineId } });
    logger.info(`Pipeline deleted: ${pipelineId}`);
  },

  // ─── Pipeline Runs ──────────────────────────────────────────────────────────

  async listRuns(pipelineId: string, userId: string, filters: {
    status?: RunStatus;
    branch?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const pipeline = await this._getPipelineOrThrow(pipelineId);
    await this._assertMember(pipeline.workspaceId, userId);

    const { status, branch, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      pipelineId,
      ...(status && { status }),
      ...(branch && { branch: { contains: branch } }),
    };

    const [runs, total] = await Promise.all([
      prisma.pipelineRun.findMany({
        where,
        include: {
          stages: { orderBy: { orderIndex: 'asc' } },
          deployments: {
            include: { environment: { select: { id: true, name: true, type: true } } },
          },
        },
        orderBy: { runNumber: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pipelineRun.count({ where }),
    ]);

    return { runs, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getRun(runId: string, userId: string) {
    const run = await prisma.pipelineRun.findUnique({
      where: { id: runId },
      include: {
        pipeline: { select: { id: true, name: true, workspaceId: true } },
        stages: {
          orderBy: { orderIndex: 'asc' },
          include: {
            approvals: {
              include: {
                approver: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
              },
            },
          },
        },
        deployments: {
          include: {
            environment: { select: { id: true, name: true, type: true } },
            deployedByUser: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!run) throw new AppError('Pipeline run not found', 404);
    await this._assertMember(run.pipeline.workspaceId, userId);
    return run;
  },

  /**
   * Trigger a new pipeline run. Simulates stage progression with Socket.IO events.
   */
  async triggerRun(pipelineId: string, userId: string, dto: TriggerRunDto) {
    const pipeline = await this._getPipelineOrThrow(pipelineId);
    await this._assertRole(pipeline.workspaceId, userId, ['ADMIN', 'EDITOR']);

    if (pipeline.status !== 'ACTIVE') {
      throw new AppError('Cannot trigger an inactive or archived pipeline', 400);
    }

    // Get next run number
    const lastRun = await prisma.pipelineRun.findFirst({
      where: { pipelineId },
      orderBy: { runNumber: 'desc' },
    });
    const runNumber = (lastRun?.runNumber ?? 0) + 1;

    // Parse stages from configYaml or use defaults
    const stageConfigs = this._parseStagesFromConfig(pipeline.configYaml);

    const run = await prisma.$transaction(async (tx) => {
      const newRun = await tx.pipelineRun.create({
        data: {
          pipelineId,
          runNumber,
          status: 'QUEUED',
          triggeredBy: userId,
          branch: dto.branch ?? 'main',
          commitSha: dto.commitSha,
          commitMsg: dto.commitMsg,
          startedAt: new Date(),
        },
      });

      // Create stages
      await tx.pipelineStage.createMany({
        data: stageConfigs.map((s, i) => ({
          runId: newRun.id,
          name: s.name,
          type: s.type,
          status: 'QUEUED',
          orderIndex: i,
        })),
      });

      await tx.auditLog.create({
        data: {
          userId,
          workspaceId: pipeline.workspaceId,
          action: 'PIPELINE_RUN_TRIGGERED',
          resourceType: 'PipelineRun',
          resourceId: newRun.id,
          detailsJson: { pipelineId, runNumber, branch: dto.branch },
        },
      });

      return newRun;
    });

    logger.info(`Pipeline run #${runNumber} triggered for pipeline ${pipelineId}`);

    // Simulate async stage execution
    this._simulateRunExecution(run.id, pipeline.workspaceId).catch((err) =>
      logger.error('Run simulation error', { err })
    );

    return this.getRun(run.id, userId);
  },

  /**
   * Cancel a running pipeline run.
   */
  async cancelRun(runId: string, userId: string) {
    const run = await prisma.pipelineRun.findUnique({
      where: { id: runId },
      include: { pipeline: true },
    });

    if (!run) throw new AppError('Pipeline run not found', 404);
    await this._assertRole(run.pipeline.workspaceId, userId, ['ADMIN', 'EDITOR']);

    if (!['QUEUED', 'RUNNING'].includes(run.status)) {
      throw new AppError('Can only cancel runs that are QUEUED or RUNNING', 400);
    }

    const updated = await prisma.pipelineRun.update({
      where: { id: runId },
      data: {
        status: 'CANCELLED',
        finishedAt: new Date(),
      },
    });

    // Cancel all pending/running stages
    await prisma.pipelineStage.updateMany({
      where: { runId, status: { in: ['QUEUED', 'RUNNING'] } },
      data: { status: 'CANCELLED', finishedAt: new Date() },
    });

    io.to(`pipeline-run:${runId}`).emit('run:cancelled', { runId });

    return updated;
  },

  // ─── Approvals ──────────────────────────────────────────────────────────────

  /**
   * Get all pending approvals for a workspace member.
   */
  async getPendingApprovals(workspaceId: string, userId: string) {
    await this._assertMember(workspaceId, userId);

    return prisma.stageApproval.findMany({
      where: {
        approverId: userId,
        status: 'PENDING',
        stage: {
          run: { pipeline: { workspaceId } },
        },
      },
      include: {
        stage: {
          include: {
            run: {
              include: {
                pipeline: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Approve or reject a stage approval request.
   */
  async decideApproval(approvalId: string, userId: string, dto: ApproveStageDto) {
    const approval = await prisma.stageApproval.findUnique({
      where: { id: approvalId },
      include: {
        stage: {
          include: {
            run: { include: { pipeline: true } },
          },
        },
      },
    });

    if (!approval) throw new AppError('Approval not found', 404);
    if (approval.approverId !== userId) throw new AppError('Not authorized to decide this approval', 403);
    if (approval.status !== 'PENDING') throw new AppError('Approval already decided', 400);
    if (approval.expiresAt && approval.expiresAt < new Date()) {
      throw new AppError('Approval has expired', 400);
    }

    const updated = await prisma.stageApproval.update({
      where: { id: approvalId },
      data: {
        status: dto.decision as ApprovalStatus,
        comment: dto.comment,
        decidedAt: new Date(),
      },
    });

    const stage = approval.stage;

    if (dto.decision === 'APPROVED') {
      // Check if all approvals for this stage are approved
      const allApprovals = await prisma.stageApproval.findMany({ where: { stageId: stage.id } });
      const allApproved = allApprovals.every((a) => a.id === approvalId || a.status === 'APPROVED');

      if (allApproved) {
        await prisma.pipelineStage.update({
          where: { id: stage.id },
          data: { status: 'RUNNING', startedAt: new Date() },
        });

        io.to(`pipeline-run:${stage.runId}`).emit('stage:approved', {
          stageId: stage.id,
          stageName: stage.name,
        });

        // Continue simulation for this stage
        this._executeStage(stage.runId, stage.id, stage.name).catch((err) =>
          logger.error('Stage execution error after approval', { err })
        );
      }
    } else {
      // Rejection — fail the stage and the run
      await prisma.$transaction([
        prisma.pipelineStage.update({
          where: { id: stage.id },
          data: { status: 'FAILED', finishedAt: new Date(), errorMsg: `Rejected by approver: ${dto.comment ?? ''}` },
        }),
        prisma.pipelineRun.update({
          where: { id: stage.runId },
          data: { status: 'FAILED', finishedAt: new Date() },
        }),
      ]);

      io.to(`pipeline-run:${stage.runId}`).emit('run:failed', {
        runId: stage.runId,
        reason: `Stage "${stage.name}" was rejected`,
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        workspaceId: stage.run.pipeline.workspaceId,
        action: `APPROVAL_${dto.decision}`,
        resourceType: 'StageApproval',
        resourceId: approvalId,
        detailsJson: { stageId: stage.id, comment: dto.comment },
      },
    });

    return updated;
  },

  // ─── Rollback ───────────────────────────────────────────────────────────────

  /**
   * List the last 10 successful deployments for rollback selection.
   */
  async getRollbackHistory(pipelineId: string, environmentId: string, userId: string) {
    const pipeline = await this._getPipelineOrThrow(pipelineId);
    await this._assertMember(pipeline.workspaceId, userId);

    return prisma.deployment.findMany({
      where: {
        pipelineRun: { pipelineId },
        environmentId,
        status: 'SUCCESS',
        rolledBack: false,
      },
      include: {
        environment: { select: { id: true, name: true, type: true } },
        deployedByUser: { select: { id: true, fullName: true } },
        pipelineRun: { select: { id: true, runNumber: true, branch: true, commitSha: true } },
      },
      orderBy: { deployedAt: 'desc' },
      take: 10,
    });
  },

  /**
   * Roll back to a previous deployment version.
   * Requires approval for production environments (PRD req: US-CICD-003).
   */
  async rollback(deploymentId: string, userId: string) {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        environment: true,
        pipelineRun: { include: { pipeline: true } },
      },
    });

    if (!deployment) throw new AppError('Deployment not found', 404);
    await this._assertRole(deployment.pipelineRun.pipeline.workspaceId, userId, ['ADMIN', 'EDITOR']);

    if (deployment.status !== 'SUCCESS') {
      throw new AppError('Can only rollback successful deployments', 400);
    }

    if (deployment.environment.isProtected) {
      // For protected environments, check the user has ADMIN role
      await this._assertRole(deployment.pipelineRun.pipeline.workspaceId, userId, ['ADMIN']);
    }

    // Get a new run number
    const lastRun = await prisma.pipelineRun.findFirst({
      where: { pipelineId: deployment.pipelineRun.pipelineId },
      orderBy: { runNumber: 'desc' },
    });
    const runNumber = (lastRun?.runNumber ?? 0) + 1;

    const rollbackRun = await prisma.$transaction(async (tx) => {
      const newRun = await tx.pipelineRun.create({
        data: {
          pipelineId: deployment.pipelineRun.pipelineId,
          runNumber,
          status: 'RUNNING',
          triggeredBy: userId,
          branch: deployment.pipelineRun.branch,
          commitSha: deployment.pipelineRun.commitSha,
          commitMsg: `[ROLLBACK] to run #${deployment.pipelineRun.runNumber}`,
          startedAt: new Date(),
        },
      });

      const stage = await tx.pipelineStage.create({
        data: {
          runId: newRun.id,
          name: `Rollback to v${deployment.version}`,
          type: 'DEPLOY',
          status: 'RUNNING',
          orderIndex: 0,
          startedAt: new Date(),
        },
      });

      // Mark original deployment as rolled back
      await tx.deployment.update({
        where: { id: deploymentId },
        data: { rolledBack: true, rollbackTo: newRun.id },
      });

      // Create new deployment record
      await tx.deployment.create({
        data: {
          pipelineRunId: newRun.id,
          environmentId: deployment.environmentId,
          version: deployment.version,
          artifactUrl: deployment.artifactUrl,
          status: 'RUNNING',
          deployedBy: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          workspaceId: deployment.pipelineRun.pipeline.workspaceId,
          action: 'PIPELINE_ROLLBACK',
          resourceType: 'Deployment',
          resourceId: deploymentId,
          detailsJson: {
            targetVersion: deployment.version,
            environment: deployment.environment.name,
            originalRunNumber: deployment.pipelineRun.runNumber,
          },
        },
      });

      return { newRun, stage };
    });

    // Simulate rollback completion
    setTimeout(async () => {
      try {
        await prisma.$transaction([
          prisma.pipelineStage.update({
            where: { id: rollbackRun.stage.id },
            data: { status: 'SUCCESS', finishedAt: new Date() },
          }),
          prisma.pipelineRun.update({
            where: { id: rollbackRun.newRun.id },
            data: { status: 'SUCCESS', finishedAt: new Date(), durationMs: 8000 },
          }),
          prisma.deployment.updateMany({
            where: { pipelineRunId: rollbackRun.newRun.id },
            data: { status: 'SUCCESS' },
          }),
        ]);

        io.to(`pipeline-run:${rollbackRun.newRun.id}`).emit('run:completed', {
          runId: rollbackRun.newRun.id,
          status: 'SUCCESS',
        });
      } catch (err) {
        logger.error('Rollback completion error', { err });
      }
    }, 5000);

    return rollbackRun.newRun;
  },

  // ─── Stage Logs ─────────────────────────────────────────────────────────────

  async getStageDetails(stageId: string, userId: string) {
    const stage = await prisma.pipelineStage.findUnique({
      where: { id: stageId },
      include: {
        run: {
          include: { pipeline: { select: { workspaceId: true } } },
        },
        approvals: {
          include: {
            approver: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!stage) throw new AppError('Stage not found', 404);
    await this._assertMember(stage.run.pipeline.workspaceId, userId);
    return stage;
  },

  // ─── Stats ──────────────────────────────────────────────────────────────────

  async getPipelineStats(workspaceId: string, userId: string) {
    await this._assertMember(workspaceId, userId);

    const [totalPipelines, totalRuns, successRuns, failedRuns, runningRuns] = await Promise.all([
      prisma.pipeline.count({ where: { workspaceId } }),
      prisma.pipelineRun.count({ where: { pipeline: { workspaceId } } }),
      prisma.pipelineRun.count({ where: { pipeline: { workspaceId }, status: 'SUCCESS' } }),
      prisma.pipelineRun.count({ where: { pipeline: { workspaceId }, status: 'FAILED' } }),
      prisma.pipelineRun.count({ where: { pipeline: { workspaceId }, status: 'RUNNING' } }),
    ]);

    // Average duration of successful runs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const avgDurationResult = await prisma.pipelineRun.aggregate({
      where: {
        pipeline: { workspaceId },
        status: 'SUCCESS',
        startedAt: { gte: thirtyDaysAgo },
        durationMs: { not: null },
      },
      _avg: { durationMs: true },
    });

    // Success rate
    const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0;

    // Recent runs (last 7 days for chart)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRuns = await prisma.pipelineRun.findMany({
      where: {
        pipeline: { workspaceId },
        startedAt: { gte: sevenDaysAgo },
      },
      select: { status: true, startedAt: true },
      orderBy: { startedAt: 'asc' },
    });

    return {
      totalPipelines,
      totalRuns,
      successRuns,
      failedRuns,
      runningRuns,
      successRate,
      avgDurationMs: Math.round(avgDurationResult._avg.durationMs ?? 0),
      recentRuns,
    };
  },

  // ─── Internal Helpers ────────────────────────────────────────────────────────

  _parseStagesFromConfig(configYaml: string | null): { name: string; type: StageType }[] {
    // In a real system, parse the YAML. For now, return default stages.
    return [
      { name: 'Build', type: 'BUILD' },
      { name: 'Test', type: 'TEST' },
      { name: 'Deploy to Staging', type: 'DEPLOY' },
      { name: 'Deploy to Production', type: 'DEPLOY' },
    ];
  },

  /**
   * Simulate pipeline run execution — progresses through stages with delays.
   * In production this would integrate with a real CI engine (Jenkins, GitHub Actions, etc.)
   */
  async _simulateRunExecution(runId: string, workspaceId: string): Promise<void> {
    const stages = await prisma.pipelineStage.findMany({
      where: { runId },
      orderBy: { orderIndex: 'asc' },
    });

    // Start run
    await prisma.pipelineRun.update({
      where: { id: runId },
      data: { status: 'RUNNING' },
    });

    io.to(`pipeline-run:${runId}`).emit('run:started', { runId });

    for (const stage of stages) {
      const currentRun = await prisma.pipelineRun.findUnique({ where: { id: runId } });
      if (currentRun?.status === 'CANCELLED') return;

      // Check if stage needs approval (production deploy stages)
      if (stage.type === 'DEPLOY' && stage.name.toLowerCase().includes('production')) {
        await prisma.pipelineStage.update({
          where: { id: stage.id },
          data: { status: 'QUEUED' },
        });

        // Look for workspace approvers (admins)
        const admins = await prisma.workspaceMember.findMany({
          where: { workspaceId, role: { name: 'ADMIN' } },
        });

        if (admins.length > 0) {
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);

          await prisma.stageApproval.createMany({
            data: admins.map((admin) => ({
              stageId: stage.id,
              approverId: admin.userId,
              status: 'PENDING' as ApprovalStatus,
              expiresAt,
            })),
          });

          // Notify approvers
          await prisma.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.userId,
              type: 'APPROVAL' as const,
              title: 'Approval Required',
              message: `Stage "${stage.name}" needs your approval to proceed.`,
            })),
          });

          io.to(`pipeline-run:${runId}`).emit('stage:awaiting-approval', {
            stageId: stage.id,
            stageName: stage.name,
          });

          // Wait for approval — in real system this pauses execution
          // Here we skip to show the waiting state
          return;
        }
      }

      await this._executeStage(runId, stage.id, stage.name);

      // Check if stage failed
      const updatedStage = await prisma.pipelineStage.findUnique({ where: { id: stage.id } });
      if (updatedStage?.status === 'FAILED') return;
    }

    // All stages succeeded
    const durationMs = Math.floor(Math.random() * 120000) + 30000; // 30s–150s
    await prisma.pipelineRun.update({
      where: { id: runId },
      data: { status: 'SUCCESS', finishedAt: new Date(), durationMs },
    });

    io.to(`pipeline-run:${runId}`).emit('run:completed', { runId, status: 'SUCCESS' });

    // Create deployment record for the last deploy stage
    const deployStage = [...stages].reverse().find((s) => s.type === 'DEPLOY');
    if (deployStage) {
      const environment = await prisma.environment.findFirst({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
      });

      if (environment) {
        await prisma.deployment.create({
          data: {
            pipelineRunId: runId,
            environmentId: environment.id,
            version: `v1.0.${Math.floor(Math.random() * 100)}`,
            status: 'SUCCESS',
            deployedBy: (await prisma.pipelineRun.findUnique({ where: { id: runId } }))!.triggeredBy!,
          },
        });
      }
    }
  },

  async _executeStage(runId: string, stageId: string, stageName: string): Promise<void> {
    const delay = Math.floor(Math.random() * 8000) + 2000; // 2–10s

    await prisma.pipelineStage.update({
      where: { id: stageId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    io.to(`pipeline-run:${runId}`).emit('stage:started', { stageId, stageName });

    // Emit mock log lines
    const logLines = [
      `[INFO] Starting stage: ${stageName}`,
      `[INFO] Pulling latest changes...`,
      `[INFO] Running commands...`,
      `[SUCCESS] Stage ${stageName} completed`,
    ];

    for (let i = 0; i < logLines.length; i++) {
      setTimeout(() => {
        io.to(`pipeline-run:${runId}`).emit('stage:log', {
          stageId,
          line: logLines[i],
          timestamp: new Date().toISOString(),
        });
      }, (delay / logLines.length) * i);
    }

    await new Promise((resolve) => setTimeout(resolve, delay));

    // 10% chance of failure for test stages (to show failure scenarios)
    const shouldFail = stageName.toLowerCase().includes('test') && Math.random() < 0.1;

    if (shouldFail) {
      await prisma.pipelineStage.update({
        where: { id: stageId },
        data: { status: 'FAILED', finishedAt: new Date(), errorMsg: 'Tests failed: 2 assertions failed' },
      });

      await prisma.pipelineRun.update({
        where: { id: runId },
        data: { status: 'FAILED', finishedAt: new Date() },
      });

      io.to(`pipeline-run:${runId}`).emit('stage:failed', { stageId, stageName, errorMsg: 'Tests failed' });
      io.to(`pipeline-run:${runId}`).emit('run:failed', { runId, status: 'FAILED' });
      return;
    }

    await prisma.pipelineStage.update({
      where: { id: stageId },
      data: { status: 'SUCCESS', finishedAt: new Date() },
    });

    io.to(`pipeline-run:${runId}`).emit('stage:completed', { stageId, stageName });
  },

  async _getPipelineOrThrow(pipelineId: string) {
    const pipeline = await prisma.pipeline.findUnique({ where: { id: pipelineId } });
    if (!pipeline) throw new AppError('Pipeline not found', 404);
    return pipeline;
  },

  async _assertMember(workspaceId: string, userId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new AppError('Access denied: not a workspace member', 403);
    return member;
  },

  async _assertRole(workspaceId: string, userId: string, allowedRoles: string[]) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { role: true },
    });
    if (!member) throw new AppError('Access denied: not a workspace member', 403);
    if (!allowedRoles.includes(member.role.name)) {
      throw new AppError(`Access denied: requires ${allowedRoles.join(' or ')} role`, 403);
    }
    return member;
  },
};
