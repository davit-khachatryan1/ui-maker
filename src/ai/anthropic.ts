import type { AiProviderInfo } from './types';

export const anthropicProvider: AiProviderInfo = {
  id: 'anthropic',
  label: 'Anthropic',
  models: ['claude-3-5-haiku-latest'],
  allowCustomModel: true
};
