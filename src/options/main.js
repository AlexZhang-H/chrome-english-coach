import { getSettings, saveSettings } from '../lib/storage.js';

const els = {
  provider: document.getElementById('provider'),
  anthropicKey: document.getElementById('anthropic-key'),
  anthropicBaseUrl: document.getElementById('anthropic-base-url'),
  anthropicModel: document.getElementById('anthropic-model'),
  openaiKey: document.getElementById('openai-key'),
  openaiBaseUrl: document.getElementById('openai-base-url'),
  openaiModel: document.getElementById('openai-model'),
  theme: document.getElementById('theme'),
  save: document.getElementById('save'),
  toast: document.getElementById('toast'),
};

async function applyTheme(theme) {
  const resolved =
    theme === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;
  document.documentElement.dataset.theme = resolved;
}

async function load() {
  const settings = await getSettings();
  els.provider.value = settings.provider;
  els.anthropicKey.value = settings.anthropicApiKey;
  els.anthropicBaseUrl.value = settings.anthropicBaseUrl;
  els.anthropicModel.value = settings.anthropicModel;
  els.openaiKey.value = settings.openaiApiKey;
  els.openaiBaseUrl.value = settings.openaiBaseUrl;
  els.openaiModel.value = settings.openaiModel;
  els.theme.value = settings.theme;
  await applyTheme(settings.theme);
}

function showToast() {
  els.toast.classList.add('show');
  setTimeout(() => els.toast.classList.remove('show'), 1500);
}

function normalizeBaseUrl(raw) {
  const v = raw.trim();
  if (!v) return '';
  return v.replace(/\/+$/, '');
}

els.save.addEventListener('click', async () => {
  await saveSettings({
    provider: els.provider.value,
    anthropicApiKey: els.anthropicKey.value.trim(),
    anthropicBaseUrl: normalizeBaseUrl(els.anthropicBaseUrl.value),
    anthropicModel: els.anthropicModel.value.trim(),
    openaiApiKey: els.openaiKey.value.trim(),
    openaiBaseUrl: normalizeBaseUrl(els.openaiBaseUrl.value),
    openaiModel: els.openaiModel.value.trim(),
    theme: els.theme.value,
  });
  await applyTheme(els.theme.value);
  showToast();
});

els.theme.addEventListener('change', () => applyTheme(els.theme.value));

load();
