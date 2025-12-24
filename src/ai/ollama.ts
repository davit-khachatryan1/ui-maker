import type { AiProviderInfo } from './types';

export const ollamaProvider: AiProviderInfo = {
  id: 'ollama',
  label: 'Ollama (local)',
  models: ['qwen2.5-coder', 'llama3.1', 'gemma3'],
  allowCustomModel: true
};
