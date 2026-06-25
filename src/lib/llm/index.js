import { callAnthropic } from './anthropic.js';
import { callOpenAI } from './openai.js';
import { buildSummaryPrompt } from './prompts.js';

export async function summarize({ title, text, settings }) {
  const key =
    settings.provider === 'openai'
      ? settings.openaiApiKey
      : settings.anthropicApiKey;
  if (!key) {
    const err = new Error('API Key 未配置');
    err.code = 'MISSING_KEY';
    throw err;
  }

  const { system, user } = buildSummaryPrompt({ title, text });

  try {
    if (settings.provider === 'openai') {
      return await callOpenAI({ system, user, settings });
    }
    return await callAnthropic({ system, user, settings });
  } catch (err) {
    if (err.code) throw err;
    err.code = 'NETWORK';
    throw err;
  }
}
