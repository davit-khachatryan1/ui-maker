import type { AiProviderId } from '../api/ai';

export interface AiProviderInfo {
  id: AiProviderId;
  label: string;
  models: string[];
  allowCustomModel: boolean;
}
