import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { sendError } from '../utils/apiResponse';

export interface JwtPayload {
  userId: string;
  email: string;
  workspaceId?: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName: string;
        avatarUrl: string | null;
      };
      workspaceId?: string;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'No token provided', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.jwt.secret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, fullName: true, avatarUrl: true },
    });

    if (!user) {
      sendError(res, 'User not found', 401);
      return;
    }

    req.user = user;
    if (payload.workspaceId) req.workspaceId = payload.workspaceId;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      sendError(res, 'Token expired', 401);
      return;
    }
    sendError(res, 'Invalid token', 401);
  }
};

/** Requires the request to carry a workspaceId query/header and validates membership */
export const requireWorkspaceMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const workspaceId = (req.params.workspaceId as string) || (req.headers['x-workspace-id'] as string);

  if (!workspaceId) {
    sendError(res, 'Workspace ID required', 400);
    return;
  }

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: req.user!.id } },
    include: { role: true },
  });

  if (!member) {
    sendError(res, 'Access denied: not a workspace member', 403);
    return;
  }

  req.workspaceId = workspaceId as string;
  next();
};
