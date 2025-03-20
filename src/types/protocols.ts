export interface MCPMessage {
  jsonrpc: '2.0';
  id: string | number;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: MCPError;
}

export interface MCPRequest extends MCPMessage {
  method: string;
  params: Record<string, unknown>;
}

export interface MCPResponse extends MCPMessage {
  result?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface InlineData {
  mimeType: string;
  data: string; // base64 encoded data
}

export interface ContentPart {
  text?: string;
  inlineData?: InlineData;
}

export interface StreamRequest extends MCPRequest {
  params: {
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
    streamEvents?: boolean;
    model?: string;
    responseModalities?: string[];
  };
}

export interface StreamResponse extends MCPResponse {
  result: {
    type: 'stream';
    content: string | ContentPart;
    contentType?: 'text' | 'mixed';
    done: boolean;
    metadata?: {
      timestamp: number;
      model: string;
      tokens?: number;
    };
  };
}

export interface GenerateRequest extends MCPRequest {
  params: {
    prompt: string | {
      text?: string;
      images?: Array<{
        data: string;  // base64 encoded image data
        mimeType: string;
      }>
    };
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
    model?: string;
    responseModalities?: string[];
  };
}

export interface GenerateResponse extends MCPResponse {
  result: {
    type: 'completion';
    content: string | ContentPart[];
    contentType?: 'text' | 'mixed';
    metadata: {
      model: string;
      provider: string;
      temperature?: number;
      maxTokens?: number;
      stopSequences?: string[];
    };
  };
}

export interface CancelRequest extends MCPRequest {
  params: {
    requestId: string | number;
  };
}

export interface ConfigureRequest extends MCPRequest {
  params: {
    configuration: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stopSequences?: string[];
      timeout?: number;
    };
  };
}