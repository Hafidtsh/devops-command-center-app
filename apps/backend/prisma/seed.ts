import { PrismaClient, RoleName } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: RoleName.ADMIN },
      update: {},
      create: {
        name: RoleName.ADMIN,
        permissionsJson: {
          workspace: ['create', 'read', 'update', 'delete'],
          pipeline: ['create', 'read', 'update', 'delete', 'run', 'approve'],
          environment: ['create', 'read', 'update', 'delete'],
          incident: ['create', 'read', 'update', 'delete', 'assign'],
          member: ['invite', 'read', 'update', 'remove'],
          secret: ['create', 'read', 'update', 'delete'],
        },
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { name: RoleName.EDITOR },
      update: {},
      create: {
        name: RoleName.EDITOR,
        permissionsJson: {
          workspace: ['read'],
          pipeline: ['create', 'read', 'update', 'run'],
          environment: ['read', 'update'],
          incident: ['create', 'read', 'update'],
          member: ['read'],
          secret: ['read'],
        },
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { name: RoleName.VIEWER },
      update: {},
      create: {
        name: RoleName.VIEWER,
        permissionsJson: {
          workspace: ['read'],
          pipeline: ['read'],
          environment: ['read'],
          incident: ['read'],
          member: ['read'],
          secret: [],
        },
        isSystem: true,
      },
    }),
  ]);

  console.log(`✅ Created ${roles.length} roles`);

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      planType: 'PRO',
    },
  });

  console.log(`✅ Created organization: ${org.name}`);

  // Create demo admin user
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@dcc.dev' },
    update: {},
    create: {
      email: 'admin@dcc.dev',
      fullName: 'DCC Admin',
      passwordHash,
      provider: 'local',
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // Create demo workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: 'demo-workspace-id' },
    update: {},
    create: {
      id: 'demo-workspace-id',
      orgId: org.id,
      name: 'Demo Workspace',
      description: 'Default demo workspace',
    },
  });

  console.log(`✅ Created workspace: ${workspace.name}`);

  // Add admin as workspace member
  const adminRole = roles.find((r) => r.name === RoleName.ADMIN)!;
  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: adminUser.id } },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  // Create demo environments
  const envTypes = ['DEV', 'STAGING', 'PRODUCTION'] as const;
  for (const type of envTypes) {
    await prisma.environment.upsert({
      where: { id: `demo-env-${type.toLowerCase()}` },
      update: {},
      create: {
        id: `demo-env-${type.toLowerCase()}`,
        workspaceId: workspace.id,
        name: type.charAt(0) + type.slice(1).toLowerCase(),
        type,
        isProtected: type === 'PRODUCTION',
      },
    });
  }

  console.log('✅ Created demo environments');

  // Create demo pipeline
  const pipeline = await prisma.pipeline.upsert({
    where: { id: 'demo-pipeline-id' },
    update: {},
    create: {
      id: 'demo-pipeline-id',
      workspaceId: workspace.id,
      name: 'Demo Node.js Pipeline',
      description: 'Sample CI/CD pipeline for a Node.js app',
      triggerType: 'PUSH',
      status: 'ACTIVE',
      createdBy: adminUser.id,
      configYaml: `name: Demo Node.js Pipeline
trigger:
  - push
  - pull_request

stages:
  - name: Build
    type: build
    steps:
      - name: Install dependencies
        command: npm install
      - name: Build
        command: npm run build

  - name: Test
    type: test
    steps:
      - name: Run unit tests
        command: npm test

  - name: Deploy to Staging
    type: deploy
    environment: staging
    requires_approval: false

  - name: Deploy to Production
    type: deploy
    environment: production
    requires_approval: true
    min_approvals: 1
`,
    },
  });

  console.log(`✅ Created demo pipeline: ${pipeline.name}`);

  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Demo credentials:');
  console.log('  Email:    admin@dcc.dev');
  console.log('  Password: Admin@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
