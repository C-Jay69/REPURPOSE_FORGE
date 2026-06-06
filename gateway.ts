import { createOpenAI } from "@ai-sdk/openai";

// Uses OpenRouter — free models available at openrouter.ai/models?q=free
export const gateway = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
}).chat;
