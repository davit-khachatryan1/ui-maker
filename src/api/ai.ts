export type AiProviderId = 'ollama' | 'groq' | 'xai' | 'openai' | 'anthropic';
export type Aggressiveness = 'conservative' | 'balanced' | 'aggressive';
export type Goal = 'clean-html' | 'react-tsx';

export interface AiTransformPayload {
  provider: AiProviderId;
  model: string;
  goal: Goal;
  aggressiveness: Aggressiveness;
  inputCode: string;
  extraRules?: string;
}

export async function aiTransform(payload: AiTransformPayload): Promise<{ code: string }> {
  const res = await fetch('/api/ai/transform', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `AI request failed: ${res.status}`);
  }

  return res.json() as Promise<{ code: string }>;
}
