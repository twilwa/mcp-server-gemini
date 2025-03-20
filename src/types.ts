// Existing interfaces...

export interface ProgressParams {
  progressToken: string | number;
  progress: number;
  total?: number;
}

export interface NotificationMessage {
  jsonrpc: '2.0';
  method: string;
  params?: any;
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
