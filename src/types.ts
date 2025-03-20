export * from './types/protocols.js';

import type { GoogleGenAI } from '@google/genai';

// No additional Models type needed - use GoogleGenAI directly

export interface ServerCapabilities {
  experimental: {
    imageGeneration?: boolean;
    interleaved?: boolean;
    [key: string]: unknown;
  };
  prompts?: {
    listChanged?: boolean;
    [key: string]: unknown;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
    [key: string]: unknown;
  };
  tools?: {
    listChanged?: boolean;
    [key: string]: unknown;
  };
  logging?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ServerInfo {
  name: string;
  version: string;
  [key: string]: unknown;
}

export interface InitializeResult {
  protocolVersion: string;
  serverInfo: ServerInfo;
  capabilities: ServerCapabilities;
  [key: string]: unknown;
}

export interface ProgressParams {
  progressToken: string | number;
  progress: number;
  total?: number;
  [key: string]: unknown;
}

export interface NotificationMessage {
  jsonrpc: '2.0';
  method: string;
  params: Record<string, unknown>;
}

export interface ConnectionState {
  connectedAt: Date;
  lastMessageAt: Date;
  initialized: boolean;
  activeRequests: Set<string | number>;
  ip: string;
}

export interface ErrorNotification extends NotificationMessage {
  method: 'notifications/error';
  params: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface ProgressNotification extends NotificationMessage {
  method: 'notifications/progress';
  params: ProgressParams;
}

// Import MCPRequest directly to avoid circular reference
import type { MCPRequest } from './types/protocols.js';

export interface ShutdownRequest extends MCPRequest {
  method: 'shutdown';
}

export interface ExitNotification extends NotificationMessage {
  method: 'exit';
}

// Protocol manager interface for proper typing
export interface ProtocolManagerInterface {
  isInitialized(): boolean;
  markAsInitialized(): void;
  requestShutdown(): void;
  isShutdownRequested(): boolean;
  createInitializeResult(): InitializeResult;
  createProgressNotification(token: string | number, progress: number, total?: number): ProgressParams;
  validateState(method: string): void;
}
