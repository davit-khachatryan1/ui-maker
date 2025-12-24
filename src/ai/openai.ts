import type { AiProviderInfo } from './types';

export const openAiProvider: AiProviderInfo = {
  id: 'openai',
  label: 'OpenAI',
  models: ['gpt-4o-mini'],
  allowCustomModel: true
};
