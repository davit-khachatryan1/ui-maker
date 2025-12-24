import type { ChatArgs, ChatMessage } from './types';

const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1/messages';

export async function runChat(args: ChatArgs): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY');
  }

  const system = args.messages.find((message) => message.role === 'system')?.content ?? '';
  const messages = args.messages
    .filter((message) => message.role !== 'system')
    .map((message) => toAnthropicMessage(message));

  const response = await fetch(ANTHROPIC_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: args.model,
      max_tokens: args.maxTokens,
      temperature: args.temperature,
      system,
      messages
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic error: ${response.status}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ text?: string }>;
  };

  return data.content?.[0]?.text ?? '';
}

function toAnthropicMessage(message: ChatMessage) {
  if (message.role === 'assistant') {
    return { role: 'assistant', content: message.content };
  }
  return { role: 'user', content: message.content };
}
