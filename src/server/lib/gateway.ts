import { OpenAIStream, StreamingTextResponse } from 'ai';
import { OpenAI } from '@ai-sdk/openai';

// We'll create a provider-agnostic gateway that can switch between OpenRouter, Ollama, and HuggingFace.
// However, note that the Vercel AI SDK provides a unified interface for OpenAI-compatible APIs.
// Ollama and HuggingFace (with the right endpoint) can be made to look like OpenAI.

// We'll read the provider from environment variables.
const provider = process.env.AI_PROVIDER ?? 'openrouter'; // openrouter, ollama, huggingface

let openai: OpenAI;

if (provider === 'openrouter') {
  openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  });
} else if (provider === 'ollama') {
  openai = new OpenAI({
    baseURL: process.env.OLLAMA_HOST ?? 'http://localhost:11434/v1',
    apiKey: 'ollama', // required but unused
  });
} else if (provider === 'huggingface') {
  openai = new OpenAI({
    baseURL: 'https://api-inference.huggingface.co/v1',
    apiKey: process.env.HF_API_KEY,
  });
} else {
  throw new Error(`Unknown AI provider: ${provider}`);
}

export const gateway = openai;

// Helper to get the model name based on provider
export function getModel() {
  switch (provider) {
    case 'openrouter':
      return process.env.OPENROUTER_MODEL ?? 'google/gemma-2-9b-it:free';
    case 'ollama':
      return process.env.OLLAMA_MODEL ?? 'llama3.1';
    case 'huggingface':
      return process.env.HF_MODEL ?? 'meta-llama/Meta-Llama-3-8B-Instruct';
    default:
      return 'google/gemma-2-9b-it:free';
  }
}
