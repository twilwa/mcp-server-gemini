export * from './types/protocols.js';

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
    data?: any;
  };
}

export interface ProgressNotification extends NotificationMessage {
  method: 'notifications/progress';
  params: ProgressParams;
}

export interface ShutdownRequest extends MCPRequest {
  method: 'shutdown';
}

export interface ExitNotification extends NotificationMessage {
  method: 'exit';
}
