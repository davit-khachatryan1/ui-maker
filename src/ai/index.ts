export { ollamaProvider } from './ollama';
export { groqProvider } from './groq';
export { openAiProvider } from './openai';
export { anthropicProvider } from './anthropic';
export { xaiProvider } from './xai';
export type { AiProviderInfo } from './types';

import { ollamaProvider } from './ollama';
import { groqProvider } from './groq';
import { openAiProvider } from './openai';
import { anthropicProvider } from './anthropic';
import { xaiProvider } from './xai';

export const aiProviders = [
  ollamaProvider,
  groqProvider,
  openAiProvider,
  anthropicProvider,
  xaiProvider
];
