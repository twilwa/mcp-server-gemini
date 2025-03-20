// Type definitions for @google/genai version 0.4.0
declare module '@google/genai' {
  export interface GoogleGenAIOptions {
    apiKey: string;
    vertexai?: boolean;
    project?: string;
    location?: string;
  }

  export class GoogleGenAI {
    constructor(options: GoogleGenAIOptions);
    models: Models;
  }

  export interface Models {
    generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse>;
    generateContentStream(request: GenerateContentRequest): Promise<AsyncIterable<GenerateContentResponse>>;
  }

  export interface GenerateContentRequest {
    model: string;
    contents: string | ContentItem;
    generationConfig?: GenerationConfig;
  }

  export interface ContentItem {
    role?: string;
    parts?: ContentPart[];
  }

  export interface ContentPart {
    text?: string;
    inlineData?: {
      mimeType: string;
      data: string;
    };
  }

  export interface GenerationConfig {
    temperature?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
    responseModalities?: string[];
    candidateCount?: number;
    topP?: number;
    topK?: number;
  }

  export interface GenerateContentResponse {
    text?: string;
    candidates?: Candidate[];
  }

  export interface Candidate {
    content?: {
      parts?: ContentPart[];
    };
  }
} 