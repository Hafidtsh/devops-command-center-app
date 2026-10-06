import { RoleName, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { logger } from '../../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateWorkspaceDto {
  name: string;
  description?: string;
  orgId: string;
}

export interface UpdateWorkspaceDto {
  name?: string;
  description?: string;
}

export interface InviteMemberDto {
  email: string;
  role: RoleName;
}

export interface UpdateMemberRoleDto {
  role: RoleName;
}

// ─── Workspace Service ────────────────────────────────────────────────────────

export const workspaceService = {
  /**
   * List all workspaces the user belongs to.
   */
  async listMyWorkspaces(userId: string) {
    return prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            organization: { select: { id: true, name: true, slug: true } },
            _count: { select: { members: true, pipelines: true } },
          },
        },
        role: { select: { name: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
  },

  /**
   * Get a single workspace by ID (must be a member).
   */
  async getWorkspace(workspaceId: string, userId: string) {
    await this._assertMember(workspaceId, userId);

    return prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        organization: { select: { id: true, name: true, slug: true, planType: true } },
        members: {
          include: {
            user: { select: { id: true, email: true, fullName: true, avatarUrl: true, lastLoginAt: true } },
            role: { select: { name: true } },
          },
        },
        environments: { orderBy: { createdAt: 'asc' } },
        integrations: { select: { id: true, type: true, status: true, lastSyncAt: true } },
        _count: { select: { pipelines: true, incidents: true, services: true } },
      },
    });
  },

  /**
   * Create a new workspace inside an organization.
   */
  async createWorkspace(dto: CreateWorkspaceDto, userId: string) {
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    if (!adminRole) throw new AppError('System roles not initialized', 500);

    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: { orgId: dto.orgId, name: dto.name, description: dto.description },
      });

      await tx.workspaceMember.create({
        data: { workspaceId: ws.id, userId, roleId: adminRole.id },
      });

      await tx.userRole.create({
        data: { userId, roleId: adminRole.id, workspaceId: ws.id },
      });

      // Default environments
      await tx.environment.createMany({
        data: [
          { workspaceId: ws.id, name: 'Development', type: 'DEV' },
          { workspaceId: ws.id, name: 'Staging', type: 'STAGING' },
          { workspaceId: ws.id, name: 'Production', type: 'PRODUCTION', isProtected: true },
        ],
      });

      await tx.auditLog.create({
        data: {
          userId,
          workspaceId: ws.id,
          action: 'WORKSPACE_CREATED',
          resourceType: 'Workspace',
          resourceId: ws.id,
          detailsJson: { name: ws.name },
        },
      });

      return ws;
    });

    logger.info(`Workspace created: ${workspace.name} by user ${userId}`);
    return workspace;
  },

  /**
   * Update workspace metadata (admin only).
   */
  async updateWorkspace(workspaceId: string, userId: string, dto: UpdateWorkspaceDto) {
    await this._assertRole(workspaceId, userId, ['ADMIN']);

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: dto,
    });

    await prisma.auditLog.create({
      data: {
        userId,
        workspaceId,
        action: 'WORKSPACE_UPDATED',
        resourceType: 'Workspace',
        resourceId: workspaceId,
        detailsJson: dto as unknown as Prisma.InputJsonValue,
      },
    });

    return workspace;
  },

  /**
   * Delete workspace (admin only).
   */
  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    await this._assertRole(workspaceId, userId, ['ADMIN']);

    await prisma.workspace.delete({ where: { id: workspaceId } });
    logger.info(`Workspace deleted: ${workspaceId} by user ${userId}`);
  },

  // ─── Members ───────────────────────────────────────────────────────────────

  /**
   * Invite a user to the workspace by email.
   */
  async inviteMember(workspaceId: string, inviterId: string, dto: InviteMemberDto) {
    await this._assertRole(workspaceId, inviterId, ['ADMIN']);

    const invitee = await prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!invitee) throw new AppError('User with this email not found. They must register first.', 404);

    const existing = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: invitee.id } },
    });
    if (existing) throw new AppError('User is already a member of this workspace', 409);

    const role = await prisma.role.findUnique({ where: { name: dto.role } });
    if (!role) throw new AppError('Invalid role', 400);

    const member = await prisma.$transaction(async (tx) => {
      const m = await tx.workspaceMember.create({
        data: { workspaceId, userId: invitee.id, roleId: role.id },
        include: {
          user: { select: { id: true, email: true, fullName: true, avatarUrl: true } },
          role: { select: { name: true } },
        },
      });

      // Upsert user role in workspace
      await tx.userRole.upsert({
        where: { userId_workspaceId: { userId: invitee.id, workspaceId } },
        update: { roleId: role.id },
        create: { userId: invitee.id, roleId: role.id, workspaceId, grantedBy: inviterId },
      });

      await tx.auditLog.create({
        data: {
          userId: inviterId,
          workspaceId,
          action: 'MEMBER_INVITED',
          resourceType: 'WorkspaceMember',
          resourceId: invitee.id,
          detailsJson: { email: dto.email, role: dto.role },
        },
      });

      // Send notification to invited user
      await tx.notification.create({
        data: {
          userId: invitee.id,
          type: 'SYSTEM',
          title: 'Workspace Invitation',
          message: `You have been invited to join a workspace as ${dto.role}`,
        },
      });

      return m;
    });

    logger.info(`User ${invitee.email} invited to workspace ${workspaceId}`);
    return member;
  },

  /**
   * Update a member's role.
   */
  async updateMemberRole(workspaceId: string, adminId: string, targetUserId: string, dto: UpdateMemberRoleDto) {
    await this._assertRole(workspaceId, adminId, ['ADMIN']);

    // Cannot change own role
    if (adminId === targetUserId) throw new AppError('Cannot change your own role', 400);

    const role = await prisma.role.findUnique({ where: { name: dto.role } });
    if (!role) throw new AppError('Invalid role', 400);

    const member = await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      data: { roleId: role.id },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        role: { select: { name: true } },
      },
    });

    await prisma.userRole.upsert({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
      update: { roleId: role.id, grantedBy: adminId },
      create: { userId: targetUserId, roleId: role.id, workspaceId, grantedBy: adminId },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        workspaceId,
        action: 'MEMBER_ROLE_UPDATED',
        resourceType: 'WorkspaceMember',
        resourceId: targetUserId,
        detailsJson: { newRole: dto.role },
      },
    });

    return member;
  },

  /**
   * Remove a member from the workspace.
   */
  async removeMember(workspaceId: string, adminId: string, targetUserId: string): Promise<void> {
    await this._assertRole(workspaceId, adminId, ['ADMIN']);

    if (adminId === targetUserId) throw new AppError('Cannot remove yourself from the workspace', 400);

    // Ensure at least one admin remains
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const adminCount = await prisma.workspaceMember.count({
      where: { workspaceId, roleId: adminRole!.id },
    });

    const targetMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      include: { role: true },
    });

    if (targetMember?.role.name === 'ADMIN' && adminCount <= 1) {
      throw new AppError('Cannot remove the last admin from the workspace', 400);
    }

    await prisma.$transaction([
      prisma.workspaceMember.delete({
        where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      }),
      prisma.userRole.deleteMany({
        where: { userId: targetUserId, workspaceId },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        workspaceId,
        action: 'MEMBER_REMOVED',
        resourceType: 'WorkspaceMember',
        resourceId: targetUserId,
      },
    });
  },

  // ─── Environments ──────────────────────────────────────────────────────────

  async listEnvironments(workspaceId: string, userId: string) {
    await this._assertMember(workspaceId, userId);
    return prisma.environment.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
    });
  },

  async createEnvironment(
    workspaceId: string,
    userId: string,
    data: { name: string; type: string; isProtected?: boolean }
  ) {
    await this._assertRole(workspaceId, userId, ['ADMIN', 'EDITOR']);

    return prisma.environment.create({
      data: {
        workspaceId,
        name: data.name,
        type: data.type as any,
        isProtected: data.isProtected ?? false,
      },
    });
  },

  // ─── Audit Logs ────────────────────────────────────────────────────────────

  async listAuditLogs(workspaceId: string, userId: string, page = 1, limit = 50) {
    await this._assertRole(workspaceId, userId, ['ADMIN']);

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { workspaceId },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where: { workspaceId } }),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  // ─── Internal Guards ───────────────────────────────────────────────────────

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
