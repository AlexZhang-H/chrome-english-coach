import { getSettings } from '../lib/storage.js';

const els = {
  analyzeCurrent: document.getElementById('analyze-current'),
  analyzeUrl: document.getElementById('analyze-url'),
  urlInput: document.getElementById('url-input'),
  openOptions: document.getElementById('open-options'),
  status: document.getElementById('status'),
  result: document.getElementById('result'),
};

async function applyTheme() {
  const { theme } = await getSettings();
  const resolved =
    theme === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;
  document.documentElement.dataset.theme = resolved;
}

function showStatus(text, kind = 'info') {
  els.status.textContent = text;
  els.status.classList.remove('hidden');
  els.status.dataset.kind = kind;
}

function clearStatus() {
  els.status.classList.add('hidden');
}

async function ensureKeyConfigured() {
  const { provider, openaiApiKey, anthropicApiKey } = await getSettings();
  const key = provider === 'openai' ? openaiApiKey : anthropicApiKey;
  if (!key) {
    showStatus(`请先在设置页填入 ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API Key`);
    return false;
  }
  return true;
}

els.openOptions.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

els.analyzeCurrent.addEventListener('click', async () => {
  if (!(await ensureKeyConfigured())) return;
  showStatus('M1 骨架阶段：AI 调用将在 M2 接入。');
});

els.analyzeUrl.addEventListener('click', async () => {
  const url = els.urlInput.value.trim();
  if (!url) {
    showStatus('请输入有效的 URL');
    return;
  }
  if (!(await ensureKeyConfigured())) return;
  showStatus('M1 骨架阶段：AI 调用将在 M2 接入。');
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'ANALYZE_SELECTION') {
    showStatus(`已收到划词：${msg.payload.text.slice(0, 40)}...`);
  }
});

(async () => {
  await applyTheme();
  const pending = await chrome.storage.session.get('pendingSelection');
  if (pending?.pendingSelection?.text) {
    showStatus(`已收到划词：${pending.pendingSelection.text.slice(0, 40)}...`);
    await chrome.storage.session.remove('pendingSelection');
  }
})();
