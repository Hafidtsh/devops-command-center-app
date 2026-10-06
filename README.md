# DevOps Command Center (DCC)

A unified DevOps platform — single pane of glass for CI/CD, infrastructure, monitoring, and incident management.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Zustand, React Query |
| Backend | Node.js, Express, TypeScript, Socket.IO |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (access + refresh tokens), TOTP MFA |
| Real-time | WebSocket (Socket.IO) |

## Project Structure

```
.
├── apps/
│   ├── backend/          # Express API (port 4000)
│   │   ├── prisma/       # Schema + migrations + seed
│   │   └── src/
│   │       ├── modules/  # auth / workspace / pipeline
│   │       ├── middlewares/
│   │       ├── config/
│   │       └── utils/
│   └── frontend/         # Next.js app (port 3000)
│       └── src/
│           ├── app/      # App Router pages
│           ├── components/
│           ├── hooks/    # React Query hooks
│           ├── store/    # Zustand stores
│           └── types/
└── packages/             # Shared packages (future)
```

## Quick Start

### Prerequisites
- Node.js ≥ 18
- PostgreSQL running locally (or Docker)

### 1. Setup Backend

```bash
cd apps/backend

# Copy env and fill in your DATABASE_URL
cp .env.example .env

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create DB schema
npx prisma db push

# Seed demo data (creates admin@dcc.dev / Admin@123)
npx ts-node prisma/seed.ts

# Start dev server (port 4000)
npm run dev
```

### 2. Setup Frontend

```bash
cd apps/frontend

# .env.local is already configured for local dev
npm install

# Start dev server (port 3000)
npm run dev
```

### 3. Open the app

Visit **http://localhost:3000**

Demo login: `admin@dcc.dev` / `Admin@123`

---

## API Endpoints

### Auth  `POST /api/v1/auth/*`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register with email + password |
| POST | `/login` | Login (returns tokens; MFA challenge if enabled) |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Revoke refresh token |
| GET | `/me` | Get current user profile |
| PATCH | `/me` | Update profile |
| POST | `/change-password` | Change password |
| POST | `/mfa/setup` | Initiate TOTP MFA setup |
| POST | `/mfa/verify` | Verify + enable MFA |
| POST | `/mfa/disable` | Disable MFA |

### Workspaces  `GET /api/v1/workspaces/*`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List my workspaces |
| POST | `/` | Create workspace |
| GET | `/:id` | Get workspace details |
| PATCH | `/:id` | Update workspace |
| DELETE | `/:id` | Delete workspace |
| POST | `/:id/members/invite` | Invite member |
| PATCH | `/:id/members/:userId/role` | Update member role |
| DELETE | `/:id/members/:userId` | Remove member |
| GET | `/:id/environments` | List environments |
| POST | `/:id/environments` | Create environment |
| GET | `/:id/audit-logs` | Paginated audit log |

### Pipelines  `GET /api/v1/pipelines/*`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/?workspaceId=` | List pipelines |
| POST | `/` | Create pipeline |
| GET | `/stats?workspaceId=` | Pipeline stats |
| GET | `/:id` | Get pipeline |
| PATCH | `/:id` | Update pipeline |
| DELETE | `/:id` | Delete pipeline |
| GET | `/:id/runs` | List runs |
| POST | `/:id/runs` | Trigger run |
| GET | `/runs/:runId` | Get run detail |
| POST | `/runs/:runId/cancel` | Cancel run |
| GET | `/stages/:stageId` | Stage details |
| GET | `/approvals/pending?workspaceId=` | Pending approvals |
| POST | `/approvals/:id/decide` | Approve/reject |
| GET | `/:id/rollback/:envId/history` | Rollback history |
| POST | `/deployments/:id/rollback` | Trigger rollback |

## WebSocket Events

Connect to `ws://localhost:4000` and emit `join:pipeline-run <runId>`.

| Event (server→client) | Payload |
|----------------------|---------|
| `run:started` | `{ runId }` |
| `run:completed` | `{ runId, status }` |
| `run:failed` | `{ runId, status }` |
| `run:cancelled` | `{ runId }` |
| `stage:started` | `{ stageId, stageName }` |
| `stage:completed` | `{ stageId, stageName }` |
| `stage:failed` | `{ stageId, stageName, errorMsg }` |
| `stage:awaiting-approval` | `{ stageId, stageName }` |
| `stage:approved` | `{ stageId }` |
| `stage:log` | `{ stageId, line, timestamp }` |
