import { GenerativeModel } from '@google/generative-ai';
import type { 
  GenerateRequest, 
  GenerateResponse, 
  MCPRequest, 
  MCPResponse,
  StreamRequest,
  StreamResponse,
  CancelRequest,
  ConfigureRequest
} from './types.js';
import { ERROR_CODES } from './protocol.js';
import EventEmitter from 'node:events';
import type { ContentPart } from './types/protocols.js';

export class MCPHandlers extends EventEmitter {
  private activeRequests: Map<string | number, AbortController>;
  private currentModel = 'gemini-pro'; // Default model

  constructor(
    private models: Record<string, GenerativeModel>,
    private protocol: unknown,
    private debug = false
  ) {
    super();
    this.activeRequests = new Map();
  }

  private log(...args: unknown[]) {
    if (this.debug) {
      console.log('[MCP Debug]', ...args);
    }
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    this.log('Handling request:', request.method, request.id);
    
    try {
      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request);
        case 'shutdown':
          return this.handleShutdown(request);
        case 'generate':
          return this.handleGenerate(request as GenerateRequest);
        case 'stream':
          // Start streaming and return initial response
          this.handleStream(request as StreamRequest).catch(error => {
            this.log('Stream error:', error);
          });
          return { jsonrpc: '2.0', id: request.id, result: { started: true } };
        case 'cancel':
          return this.handleCancel(request as CancelRequest);
        case 'configure':
          return this.handleConfigure(request as ConfigureRequest);
        default:
          throw this.createError(ERROR_CODES.METHOD_NOT_FOUND, `Method not found: ${request.method}`);
      }
    } catch (error) {
      this.log('Request error:', error);
      throw error;
    }
  }

  handleInitialize(request: MCPRequest): MCPResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        ...this.protocol.createInitializeResult(),
        capabilities: {
          ...this.protocol.createInitializeResult().capabilities,
          experimental: {
            imageGeneration: true, // Add image generation capability
            interleaved: true      // Add interleaved content capability
          }
        }
      }
    };
  }

  handleShutdown(request: MCPRequest): MCPResponse {
    this.protocol.requestShutdown();
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: null
    };
  }

  async handleGenerate(request: GenerateRequest): Promise<GenerateResponse> {
    this.log('Handling generate request:', request.params);
    
    if (!validateRequest(request, ['prompt'])) {
      throw this.createError(ERROR_CODES.INVALID_PARAMS, 'Invalid or missing parameters');
    }

    // Determine which model to use
    const modelName = request.params.model || this.currentModel;
    const model = this.models[modelName];
    
    if (!model) {
      throw this.createError(ERROR_CODES.INVALID_PARAMS, `Unsupported model: ${modelName}`);
    }

    const abortController = new AbortController();
    this.activeRequests.set(request.id, abortController);

    try {
      // Configure generation options
      const genConfig: Record<string, unknown> = {
        temperature: request.params.temperature,
        maxOutputTokens: request.params.maxTokens,
        stopSequences: request.params.stopSequences,
      };
      
      // Add responseModalities if specified or if using image generation model
      if (request.params.responseModalities) {
        genConfig.responseModalities = request.params.responseModalities;
      } else if (modelName === 'gemini-2.0-flash-exp-image-generation') {
        genConfig.responseModalities = ['Text', 'Image'];
      }

      const result = await model.generateContent(
        request.params.prompt,
        genConfig
      );
      
      const response = await result.response;
      this.activeRequests.delete(request.id);

      // Handle mixed content (text + images)
      if (modelName === 'gemini-2.0-flash-exp-image-generation') {
        const parts: ContentPart[] = [];
        
        // Process the response parts
        if (response.candidates && response.candidates.length > 0 && 
            response.candidates[0].content && response.candidates[0].content.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.text) {
              parts.push({ text: part.text });
            } else if (part.inlineData) {
              parts.push({
                inlineData: {
                  mimeType: part.inlineData.mimeType,
                  data: part.inlineData.data
                }
              });
            }
          }
        }
        
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            type: 'completion',
            content: parts,
            contentType: 'mixed',
            metadata: {
              model: modelName,
              provider: 'google',
              temperature: request.params.temperature,
              maxTokens: request.params.maxTokens,
              stopSequences: request.params.stopSequences,
            }
          }
        };
      }
      
      // Handle text-only content (backwards compatible)
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          type: 'completion',
          content: response.text(),
          contentType: 'text',
          metadata: {
            model: modelName,
            provider: 'google',
            temperature: request.params.temperature,
            maxTokens: request.params.maxTokens,
            stopSequences: request.params.stopSequences,
          }
        }
      };
    } catch (error) {
      this.log('Generation error:', error);
      this.activeRequests.delete(request.id);
      throw error;
    }
  }

  async handleStream(request: StreamRequest): Promise<void> {
    if (!validateRequest(request, ['prompt'])) {
      throw this.createError(ERROR_CODES.INVALID_PARAMS, 'Invalid or missing parameters');
    }

    // Determine which model to use
    const modelName = request.params.model || this.currentModel;
    const model = this.models[modelName];
    
    if (!model) {
      throw this.createError(ERROR_CODES.INVALID_PARAMS, `Unsupported model: ${modelName}`);
    }

    const abortController = new AbortController();
    this.activeRequests.set(request.id, abortController);

    try {
      // Configure generation options
      const genConfig: Record<string, unknown> = {
        temperature: request.params.temperature,
        maxOutputTokens: request.params.maxTokens,
        stopSequences: request.params.stopSequences,
      };
      
      // Add responseModalities if specified or if using image generation model
      if (request.params.responseModalities) {
        genConfig.responseModalities = request.params.responseModalities;
      } else if (modelName === 'gemini-2.0-flash-exp-image-generation') {
        genConfig.responseModalities = ['Text', 'Image'];
      }

      const streamResult = await model.generateContentStream(
        request.params.prompt,
        genConfig
      );

      // Handle streaming response
      for await (const chunk of streamResult.stream) {
        // Exit if request is canceled
        if (!this.activeRequests.has(request.id)) {
          break;
        }

        if (chunk.candidates && chunk.candidates.length > 0) {
          // For image generation model with interleaved content
          if (modelName === 'gemini-2.0-flash-exp-image-generation' && 
              chunk.candidates[0].content && 
              chunk.candidates[0].content.parts) {
            
            for (const part of chunk.candidates[0].content.parts) {
              const contentPart: ContentPart = {};
              
              if (part.text) {
                contentPart.text = part.text;
              } else if (part.inlineData) {
                contentPart.inlineData = {
                  mimeType: part.inlineData.mimeType,
                  data: part.inlineData.data
                };
              }
              
              if (Object.keys(contentPart).length > 0) {
                const response: StreamResponse = {
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    type: 'stream',
                    content: contentPart,
                    contentType: 'mixed',
                    done: false,
                    metadata: {
                      timestamp: Date.now(),
                      model: modelName
                    }
                  }
                };
                this.emit('streamChunk', response);
              }
            }
          } else {
            // For text-only models (backwards compatible)
            const text = chunk.text();
            if (text) {
              const response: StreamResponse = {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                  type: 'stream',
                  content: text,
                  contentType: 'text',
                  done: false,
                  metadata: {
                    timestamp: Date.now(),
                    model: modelName
                  }
                }
              };
              this.emit('streamChunk', response);
            }
          }
        }
      }

      // Send final message
      const finalResponse: StreamResponse = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          type: 'stream',
          content: '',
          contentType: modelName === 'gemini-2.0-flash-exp-image-generation' ? 'mixed' : 'text',
          done: true,
          metadata: {
            timestamp: Date.now(),
            model: modelName
          }
        }
      };
      this.emit('streamChunk', finalResponse);
      this.activeRequests.delete(request.id);
    } catch (error) {
      this.log('Stream error:', error);
      this.activeRequests.delete(request.id);
      
      // Send error response
      const errorResponse = {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: error instanceof Error ? error.message : 'Stream processing error'
        }
      };
      this.emit('streamChunk', errorResponse);
      throw error;
    }
  }

  handleCancel(request: CancelRequest): MCPResponse {
    const { requestId } = request.params;
    
    if (this.activeRequests.has(requestId)) {
      const controller = this.activeRequests.get(requestId);
      controller?.abort();
      this.activeRequests.delete(requestId);
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: { cancelled: true }
      };
    }
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { cancelled: false }
    };
  }

  handleConfigure(request: ConfigureRequest): MCPResponse {
    const config = request.params?.configuration;
    
    if (config) {
      // Update default model if specified
      if (config.model && this.models[config.model]) {
        this.currentModel = config.model;
      }
      
      // ... handle other configuration options ...
    }
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        // Return current configuration
        model: this.currentModel,
        // ... other config properties ...
      }
    };
  }

  cancelRequest(requestId: string | number): void {
    if (this.activeRequests.has(requestId)) {
      const controller = this.activeRequests.get(requestId);
      controller?.abort();
      this.activeRequests.delete(requestId);
    }
  }

  createError(code: number, message: string): Error {
    const error = new Error(message) as Error & { code: number };
    error.code = code;
    return error;
  }
}

export function validateRequest(request: MCPRequest, requiredParams: string[]): boolean {
  if (!request.params) return false;
  
  for (const param of requiredParams) {
    if (request.params[param] === undefined) {
      return false;
    }
  }
  
  return true;
}