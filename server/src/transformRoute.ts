import { Router } from 'express';
import { runChat as runOllama } from './providers/ollama';
import { runChat as runGroq } from './providers/groq';
import { runChat as runXai } from './providers/xai';
import { runChat as runOpenAi } from './providers/openai';
import { runChat as runAnthropic } from './providers/anthropic';
import type { ChatMessage } from './providers/types';

const router = Router();

const PROVIDERS = ['ollama', 'groq', 'xai', 'openai', 'anthropic'] as const;
const GOALS = ['clean-html', 'react-tsx'] as const;
const AGGRESSIVENESS = ['conservative', 'balanced', 'aggressive'] as const;

const TEMPERATURE_MAP: Record<(typeof AGGRESSIVENESS)[number], number> = {
  conservative: 0.1,
  balanced: 0.3,
  aggressive: 0.6
};

router.post('/transform', async (req, res) => {
  try {
    const body = req.body as {
      provider?: string;
      model?: string;
      goal?: string;
      aggressiveness?: string;
      inputCode?: string;
      extraRules?: string;
    };

    if (!body || typeof body !== 'object') {
      return res.status(400).send('Invalid request body.');
    }

    if (!PROVIDERS.includes(body.provider as (typeof PROVIDERS)[number])) {
      return res.status(400).send('Unsupported provider.');
    }

    if (!body.model || typeof body.model !== 'string') {
      return res.status(400).send('Model is required.');
    }

    if (!GOALS.includes(body.goal as (typeof GOALS)[number])) {
      return res.status(400).send('Invalid goal.');
    }

    if (!AGGRESSIVENESS.includes(body.aggressiveness as (typeof AGGRESSIVENESS)[number])) {
      return res.status(400).send('Invalid aggressiveness.');
    }

    if (typeof body.inputCode !== 'string' || body.inputCode.trim().length === 0) {
      return res.status(400).send('Input code is required.');
    }

    const systemMessage: ChatMessage = {
      role: 'system',
      content:
        'Return only the transformed code (HTML or TSX). No commentary, no markdown. No scripts. No event handlers.'
    };

    const rules = [
      'Keep layout intent.',
      'Preserve classes unless asked to rename/remove.',
      'Replace detected figma icon blocks with <img width height alt=""> without src.'
    ];

    if (body.extraRules && body.extraRules.trim().length > 0) {
      rules.push(body.extraRules.trim());
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: `Goal: ${body.goal}. Aggressiveness: ${body.aggressiveness}. Transform rules: ${rules.join(
        ' '
      )}\nHere is the code:\n${body.inputCode}`
    };

    const temperature = TEMPERATURE_MAP[body.aggressiveness as (typeof AGGRESSIVENESS)[number]];

    const response = await runProvider(body.provider as (typeof PROVIDERS)[number], {
      model: body.model,
      messages: [systemMessage, userMessage],
      temperature,
      maxTokens: 4096
    });

    const code = response.trim();
    const validationError = validateOutput(code);
    if (validationError) {
      return res.status(400).send(validationError);
    }

    return res.json({ code });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI request failed.';
    return res.status(500).send(message);
  }
});

function validateOutput(code: string): string | null {
  if (!code) {
    return 'AI returned empty output.';
  }
  if (code.includes('```')) {
    return 'AI output must not include markdown fences.';
  }
  if (/<script/i.test(code)) {
    return 'AI output contains scripts.';
  }
  if (/on[a-z]+\s*=/.test(code)) {
    return 'AI output contains event handlers.';
  }
  if (/javascript:/i.test(code)) {
    return 'AI output contains javascript: URLs.';
  }
  return null;
}

async function runProvider(
  provider: (typeof PROVIDERS)[number],
  args: { model: string; messages: ChatMessage[]; temperature: number; maxTokens: number }
): Promise<string> {
  switch (provider) {
    case 'ollama':
      return runOllama(args);
    case 'groq':
      return runGroq(args);
    case 'xai':
      return runXai(args);
    case 'openai':
      return runOpenAi(args);
    case 'anthropic':
      return runAnthropic(args);
    default:
      throw new Error('Unsupported provider.');
  }
}

export default router;
