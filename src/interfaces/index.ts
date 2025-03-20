export * from './completion.js';
export * from './resources.js';
export * from './prompts.js';

// Import the specific types directly
import type { CompletionArgument, Completion } from './completion.js';

export interface BaseProvider {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getCapabilities(): Record<string, unknown>;
}

export interface CompletionProvider extends BaseProvider {
  complete(argument: CompletionArgument): Promise<Completion>;
}

export interface ContentProvider extends BaseProvider {
  generateContent(prompt: string, options?: unknown): Promise<string>;
  streamContent?(prompt: string, options?: unknown): AsyncIterator<string>;
}