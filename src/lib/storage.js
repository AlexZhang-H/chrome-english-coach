const KEYS = {
  PROVIDER: 'provider',
  OPENAI_KEY: 'openaiApiKey',
  OPENAI_BASE_URL: 'openaiBaseUrl',
  ANTHROPIC_KEY: 'anthropicApiKey',
  ANTHROPIC_BASE_URL: 'anthropicBaseUrl',
  OPENAI_MODEL: 'openaiModel',
  ANTHROPIC_MODEL: 'anthropicModel',
  THEME: 'theme',
};

export const StorageKeys = KEYS;

export const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
export const DEFAULT_ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1';

export async function getSettings() {
  const result = await chrome.storage.local.get(Object.values(KEYS));
  return {
    provider: result[KEYS.PROVIDER] ?? 'anthropic',
    openaiApiKey: result[KEYS.OPENAI_KEY] ?? '',
    openaiBaseUrl: result[KEYS.OPENAI_BASE_URL] ?? '',
    anthropicApiKey: result[KEYS.ANTHROPIC_KEY] ?? '',
    anthropicBaseUrl: result[KEYS.ANTHROPIC_BASE_URL] ?? '',
    openaiModel: result[KEYS.OPENAI_MODEL] ?? 'gpt-4o-mini',
    anthropicModel: result[KEYS.ANTHROPIC_MODEL] ?? 'claude-haiku-4-5-20251001',
    theme: result[KEYS.THEME] ?? 'auto',
  };
}

export async function saveSettings(patch) {
  const mapped = {};
  if ('provider' in patch) mapped[KEYS.PROVIDER] = patch.provider;
  if ('openaiApiKey' in patch) mapped[KEYS.OPENAI_KEY] = patch.openaiApiKey;
  if ('openaiBaseUrl' in patch) mapped[KEYS.OPENAI_BASE_URL] = patch.openaiBaseUrl;
  if ('anthropicApiKey' in patch) mapped[KEYS.ANTHROPIC_KEY] = patch.anthropicApiKey;
  if ('anthropicBaseUrl' in patch) mapped[KEYS.ANTHROPIC_BASE_URL] = patch.anthropicBaseUrl;
  if ('openaiModel' in patch) mapped[KEYS.OPENAI_MODEL] = patch.openaiModel;
  if ('anthropicModel' in patch) mapped[KEYS.ANTHROPIC_MODEL] = patch.anthropicModel;
  if ('theme' in patch) mapped[KEYS.THEME] = patch.theme;
  await chrome.storage.local.set(mapped);
}

export function resolveOpenAIBaseUrl(settings) {
  const v = (settings.openaiBaseUrl ?? '').trim();
  return v || DEFAULT_OPENAI_BASE_URL;
}

export function resolveAnthropicBaseUrl(settings) {
  const v = (settings.anthropicBaseUrl ?? '').trim();
  return v || DEFAULT_ANTHROPIC_BASE_URL;
}
