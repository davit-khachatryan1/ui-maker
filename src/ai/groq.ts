import type { AiProviderInfo } from './types';

export const groqProvider: AiProviderInfo = {
  id: 'groq',
  label: 'Groq',
  models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant'],
  allowCustomModel: true
};
