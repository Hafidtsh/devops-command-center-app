'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { pipelineKeys } from './usePipeline';
import type { PipelineRun, PipelineStage, RunStatus } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

export interface LogLine {
  stageId: string;
  line: string;
  timestamp: string;
}

interface UseRunSocketOptions {
  runId: string;
  onLog?: (log: LogLine) => void;
  onStageUpdate?: (stageId: string, status: RunStatus, name: string) => void;
  onRunComplete?: (status: RunStatus) => void;
  onAwaitingApproval?: (stageId: string, stageName: string) => void;
}

export function usePipelineSocket({
  runId,
  onLog,
  onStageUpdate,
  onRunComplete,
  onAwaitingApproval,
}: UseRunSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (!runId) return;

    const socket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:pipeline-run', runId);
    });

    // ─── Stage events ──────────────────────────────────────────────────
    socket.on('stage:started', ({ stageId, stageName }: { stageId: string; stageName: string }) => {
      onStageUpdate?.(stageId, 'RUNNING', stageName);
      qc.invalidateQueries({ queryKey: pipelineKeys.run(runId) });
    });

    socket.on('stage:completed', ({ stageId, stageName }: { stageId: string; stageName: string }) => {
      onStageUpdate?.(stageId, 'SUCCESS', stageName);
      qc.invalidateQueries({ queryKey: pipelineKeys.run(runId) });
    });

    socket.on('stage:failed', ({ stageId, stageName }: { stageId: string; stageName: string }) => {
      onStageUpdate?.(stageId, 'FAILED', stageName);
      qc.invalidateQueries({ queryKey: pipelineKeys.run(runId) });
    });

    socket.on('stage:awaiting-approval', ({ stageId, stageName }: { stageId: string; stageName: string }) => {
      onAwaitingApproval?.(stageId, stageName);
      qc.invalidateQueries({ queryKey: pipelineKeys.run(runId) });
    });

    socket.on('stage:approved', () => {
      qc.invalidateQueries({ queryKey: pipelineKeys.run(runId) });
    });

    // ─── Log streaming ─────────────────────────────────────────────────
    socket.on('stage:log', (log: LogLine) => {
      onLog?.(log);
    });

    // ─── Run-level events ──────────────────────────────────────────────
    socket.on('run:started', () => {
      qc.invalidateQueries({ queryKey: pipelineKeys.run(runId) });
    });

    socket.on('run:completed', ({ status }: { runId: string; status: RunStatus }) => {
      onRunComplete?.(status);
      qc.invalidateQueries({ queryKey: pipelineKeys.run(runId) });
    });

    socket.on('run:failed', ({ status }: { runId: string; status?: RunStatus }) => {
      onRunComplete?.(status ?? 'FAILED');
      qc.invalidateQueries({ queryKey: pipelineKeys.run(runId) });
    });

    socket.on('run:cancelled', () => {
      onRunComplete?.('CANCELLED');
      qc.invalidateQueries({ queryKey: pipelineKeys.run(runId) });
    });

    return () => {
      socket.emit('leave:pipeline-run', runId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [runId]); // eslint-disable-line react-hooks/exhaustive-deps

  return socketRef;
}
