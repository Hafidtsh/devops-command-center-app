import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { logger } from './utils/logger';

const httpServer = createServer(app);

// ─── WebSocket Setup ──────────────────────────────────────────────────────────
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  logger.debug(`WebSocket client connected: ${socket.id}`);

  // Join pipeline run room for real-time log streaming
  socket.on('join:pipeline-run', (runId: string) => {
    socket.join(`pipeline-run:${runId}`);
    logger.debug(`Socket ${socket.id} joined room pipeline-run:${runId}`);
  });

  socket.on('leave:pipeline-run', (runId: string) => {
    socket.leave(`pipeline-run:${runId}`);
  });

  socket.on('disconnect', () => {
    logger.debug(`WebSocket client disconnected: ${socket.id}`);
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    // Test DB connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    httpServer.listen(env.port, () => {
      logger.info(`🚀 DCC Backend running on http://localhost:${env.port}`);
      logger.info(`🌍 Environment: ${env.nodeEnv}`);
      logger.info(`📡 WebSocket ready`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  httpServer.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  httpServer.close(() => process.exit(0));
});

bootstrap();
