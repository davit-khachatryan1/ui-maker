export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatArgs {
  model: string;
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
}
