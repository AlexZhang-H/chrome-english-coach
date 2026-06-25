import { callAnthropic } from './anthropic.js';
import { callOpenAI } from './openai.js';
import { buildSummaryPrompt, MINDMAP_TAG, VOCAB_TAG } from './prompts.js';

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

  let raw;
  try {
    raw =
      settings.provider === 'openai'
        ? await callOpenAI({ system, user, settings })
        : await callAnthropic({ system, user, settings });
  } catch (err) {
    if (err.code) throw err;
    err.code = 'NETWORK';
    throw err;
  }

  return { ...parseStructured(raw), raw };
}

export function parseStructured(raw) {
  const text = (raw || '').trim();
  if (!text) {
    return { summary: '', mindmap: '', vocab: [], parseError: 'EMPTY' };
  }

  const mIdx = text.indexOf(MINDMAP_TAG);
  const vIdx = text.indexOf(VOCAB_TAG);

  if (mIdx === -1 && vIdx === -1) {
    return { summary: text, mindmap: '', vocab: [], parseError: 'NO_DELIMITERS' };
  }

  let summary = '';
  let mindmap = '';
  let vocabRaw = '';

  if (mIdx !== -1 && vIdx !== -1 && vIdx > mIdx) {
    summary = text.slice(0, mIdx).trim();
    mindmap = text.slice(mIdx + MINDMAP_TAG.length, vIdx).trim();
    vocabRaw = text.slice(vIdx + VOCAB_TAG.length).trim();
  } else if (mIdx !== -1) {
    summary = text.slice(0, mIdx).trim();
    mindmap = text.slice(mIdx + MINDMAP_TAG.length).trim();
  } else {
    summary = text.slice(0, vIdx).trim();
    vocabRaw = text.slice(vIdx + VOCAB_TAG.length).trim();
  }

  let vocab = [];
  let parseError = null;
  if (vocabRaw) {
    const cleaned = stripCodeFence(vocabRaw);
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        vocab = parsed.filter(
          (item) => item && typeof item === 'object' && typeof item.word === 'string'
        );
      } else {
        parseError = 'VOCAB_NOT_ARRAY';
      }
    } catch {
      parseError = 'VOCAB_INVALID_JSON';
    }
  }

  return { summary, mindmap, vocab, parseError };
}

function stripCodeFence(s) {
  return s
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}
