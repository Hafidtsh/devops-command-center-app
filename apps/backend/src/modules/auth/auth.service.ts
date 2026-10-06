import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../middlewares/errorHandler';
import { hashPassword, verifyPassword, validatePasswordPolicy } from '../../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from '../../utils/jwt';
import { logger } from '../../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginDto {
  email: string;
  password: string;
  totpCode?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    mfaEnabled: boolean;
  };
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Register a new user with email + password.
   * Creates a personal organization and default workspace.
   */
  async register(dto: RegisterDto): Promise<AuthTokens> {
    const policyError = validatePasswordPolicy(dto.password);
    if (policyError) throw new AppError(policyError, 422);

    const existing = await prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new AppError('Email already registered', 409);

    const passwordHash = await hashPassword(dto.password);

    // Fetch default roles
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    if (!adminRole) throw new AppError('System roles not initialized. Run seed first.', 500);

    // Create user, org, workspace in one transaction
    const { user, workspace } = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          fullName: dto.fullName,
          passwordHash,
          provider: 'local',
        },
      });

      const slug = `${dto.fullName.toLowerCase().replace(/\s+/g, '-')}-${uuidv4().slice(0, 6)}`;
      const org = await tx.organization.create({
        data: { name: `${dto.fullName}'s Org`, slug },
      });

      const ws = await tx.workspace.create({
        data: {
          orgId: org.id,
          name: 'Default Workspace',
          description: 'Your first workspace',
        },
      });

      await tx.workspaceMember.create({
        data: { workspaceId: ws.id, userId: newUser.id, roleId: adminRole.id },
      });

      await tx.userRole.create({
        data: { userId: newUser.id, roleId: adminRole.id, workspaceId: ws.id },
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
          userId: newUser.id,
          workspaceId: ws.id,
          action: 'USER_REGISTERED',
          resourceType: 'User',
          resourceId: newUser.id,
        },
      });

      return { user: newUser, workspace: ws };
    });

    logger.info(`New user registered: ${user.email}`);
    return this._issueTokens(user, workspace.id);
  },

  /**
   * Login with email + password. Handles MFA verification if enabled.
   */
  async login(dto: LoginDto, ipAddress?: string): Promise<AuthTokens | { mfaRequired: true; userId: string }> {
    const user = await prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });

    if (!user || !user.passwordHash) {
      throw new AppError('Invalid email or password', 401);
    }

    const valid = await verifyPassword(dto.password, user.passwordHash);
    if (!valid) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          resourceType: 'User',
          resourceId: user.id,
          ipAddress,
          detailsJson: { reason: 'Invalid password' },
        },
      });
      throw new AppError('Invalid email or password', 401);
    }

    // MFA check
    if (user.mfaEnabled) {
      if (!dto.totpCode) {
        return { mfaRequired: true, userId: user.id };
      }

      const isTotpValid = authenticator.verify({
        token: dto.totpCode,
        secret: user.mfaSecret!,
      });

      if (!isTotpValid) {
        throw new AppError('Invalid MFA code', 401);
      }
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Get primary workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      orderBy: { joinedAt: 'asc' },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        workspaceId: membership?.workspaceId,
        action: 'LOGIN_SUCCESS',
        resourceType: 'User',
        resourceId: user.id,
        ipAddress,
      },
    });

    logger.info(`User logged in: ${user.email}`);
    return this._issueTokens(user, membership?.workspaceId);
  },

  /**
   * Refresh access token using a valid refresh token.
   */
  async refreshToken(token: string): Promise<Pick<AuthTokens, 'accessToken'>> {
    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError('Refresh token expired or revoked', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new AppError('User not found', 401);

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      orderBy: { joinedAt: 'asc' },
    });

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      workspaceId: membership?.workspaceId,
    });

    return { accessToken };
  },

  /**
   * Revoke a refresh token (logout).
   */
  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  },

  /**
   * Initiate MFA setup: generate TOTP secret + QR code.
   */
  async setupMfa(userId: string): Promise<{ secret: string; qrCodeUrl: string; otpauthUrl: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (user.mfaEnabled) throw new AppError('MFA already enabled', 400);

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, env.mfa.appName, secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Store secret temporarily (not yet enabled until verified)
    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return { secret, qrCodeUrl, otpauthUrl };
  },

  /**
   * Verify and enable MFA with a TOTP code.
   */
  async verifyAndEnableMfa(userId: string, totpCode: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret) throw new AppError('MFA setup not initiated', 400);

    const isValid = authenticator.verify({ token: totpCode, secret: user.mfaSecret });
    if (!isValid) throw new AppError('Invalid TOTP code', 400);

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    logger.info(`MFA enabled for user: ${user.email}`);
  },

  /**
   * Disable MFA after password confirmation.
   */
  async disableMfa(userId: string, password: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) throw new AppError('User not found', 404);
    if (!user.mfaEnabled) throw new AppError('MFA is not enabled', 400);

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new AppError('Invalid password', 401);

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });
  },

  /**
   * Get the authenticated user's profile.
   */
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        mfaEnabled: true,
        provider: true,
        lastLoginAt: true,
        createdAt: true,
        workspaceMembers: {
          include: {
            workspace: { select: { id: true, name: true, description: true } },
            role: { select: { name: true } },
          },
        },
      },
    });

    if (!user) throw new AppError('User not found', 404);
    return user;
  },

  /**
   * Update user profile.
   */
  async updateProfile(userId: string, data: { fullName?: string; avatarUrl?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, email: true, fullName: true, avatarUrl: true, updatedAt: true,
      },
    });
  },

  /**
   * Change password.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) throw new AppError('User not found', 404);

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) throw new AppError('Current password is incorrect', 401);

    const policyError = validatePasswordPolicy(newPassword);
    if (policyError) throw new AppError(policyError, 422);

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

    // Revoke all refresh tokens on password change
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },

  // ─── Internal ──────────────────────────────────────────────────────────────

  async _issueTokens(
    user: { id: string; email: string; fullName: string; avatarUrl: string | null; mfaEnabled: boolean },
    workspaceId?: string
  ): Promise<AuthTokens> {
    const accessToken = signAccessToken({ userId: user.id, email: user.email, workspaceId });
    const refreshToken = signRefreshToken({ userId: user.id });

    // Persist refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        mfaEnabled: user.mfaEnabled,
      },
    };
  },
};
