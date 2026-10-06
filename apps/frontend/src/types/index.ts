// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  mfaEnabled: boolean;
  provider?: string;
  lastLoginAt?: string;
  createdAt: string;
  workspaceMembers?: WorkspaceMemberWithDetails[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Pick<User, 'id' | 'email' | 'fullName' | 'avatarUrl' | 'mfaEnabled'>;
}

// ─── Organization & Workspace ─────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  planType: 'FREE' | 'PRO' | 'ENTERPRISE';
}

export interface Workspace {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  createdAt: string;
  organization?: Organization;
  members?: WorkspaceMemberWithDetails[];
  environments?: Environment[];
  _count?: { pipelines: number; incidents: number; services: number };
}

export interface WorkspaceMemberWithDetails {
  id: string;
  workspaceId: string;
  userId: string;
  roleId: string;
  joinedAt: string;
  workspace: Workspace;
  user?: Pick<User, 'id' | 'email' | 'fullName' | 'avatarUrl'>;
  role: { name: RoleName };
}

export type RoleName = 'ADMIN' | 'EDITOR' | 'VIEWER';

// ─── Environment ──────────────────────────────────────────────────────────────

export interface Environment {
  id: string;
  workspaceId: string;
  name: string;
  type: 'DEV' | 'STAGING' | 'PRODUCTION' | 'CUSTOM';
  isProtected: boolean;
  createdAt: string;
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

export type PipelineStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type TriggerType = 'PUSH' | 'PULL_REQUEST' | 'SCHEDULE' | 'MANUAL';
export type RunStatus = 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type StageType = 'BUILD' | 'TEST' | 'DEPLOY' | 'RELEASE' | 'CUSTOM';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface Pipeline {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  configYaml: string | null;
  triggerType: TriggerType;
  status: PipelineStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: Pick<User, 'id' | 'fullName' | 'avatarUrl'>;
  runs?: PipelineRun[];
  _count?: { runs: number };
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  runNumber: number;
  status: RunStatus;
  triggeredBy: string | null;
  branch: string | null;
  commitSha: string | null;
  commitMsg: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  createdAt: string;
  pipeline?: Pick<Pipeline, 'id' | 'name' | 'workspaceId'>;
  stages?: PipelineStage[];
  deployments?: Deployment[];
}

export interface PipelineStage {
  id: string;
  runId: string;
  name: string;
  type: StageType;
  status: RunStatus;
  orderIndex: number;
  startedAt: string | null;
  finishedAt: string | null;
  logUrl: string | null;
  errorMsg: string | null;
  approvals?: StageApproval[];
}

export interface StageApproval {
  id: string;
  stageId: string;
  approverId: string;
  status: ApprovalStatus;
  comment: string | null;
  decidedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  approver?: Pick<User, 'id' | 'fullName' | 'email' | 'avatarUrl'>;
}

export interface Deployment {
  id: string;
  pipelineRunId: string;
  environmentId: string;
  version: string;
  artifactUrl: string | null;
  status: RunStatus;
  deployedBy: string;
  deployedAt: string;
  rolledBack: boolean;
  rollbackTo: string | null;
  environment?: Pick<Environment, 'id' | 'name' | 'type'>;
  deployedByUser?: Pick<User, 'id' | 'fullName'>;
}

// ─── Pipeline Stats ───────────────────────────────────────────────────────────

export interface PipelineStats {
  totalPipelines: number;
  totalRuns: number;
  successRuns: number;
  failedRuns: number;
  runningRuns: number;
  successRate: number;
  avgDurationMs: number;
  recentRuns: Array<{ status: RunStatus; startedAt: string }>;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: 'ALERT' | 'DEPLOYMENT' | 'APPROVAL' | 'INCIDENT' | 'SYSTEM';
  title: string;
  message: string;
  channel: string | null;
  isRead: boolean;
  createdAt: string;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  userId: string | null;
  workspaceId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  detailsJson: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'email' | 'fullName'>;
}
