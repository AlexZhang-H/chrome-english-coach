import { getSettings } from '../lib/storage.js';
import { summarize } from '../lib/llm/index.js';

const els = {
  analyzeCurrent: document.getElementById('analyze-current'),
  analyzeUrl: document.getElementById('analyze-url'),
  urlInput: document.getElementById('url-input'),
  openOptions: document.getElementById('open-options'),
  status: document.getElementById('status'),
  result: document.getElementById('result'),
};

const ERROR_MESSAGES = {
  MISSING_KEY: '请先在设置页填入 API Key',
  NETWORK: '网络请求失败，请检查网络或 Base URL 配置',
  EMPTY_RESPONSE: 'AI 返回为空，请重试',
  HTTP_400: '请求格式错误，请检查模型名称是否正确',
  HTTP_401: 'API Key 无效或已过期',
  HTTP_403: '没有权限访问该模型',
  HTTP_404: 'API 路径未找到，请检查 Base URL 是否正确',
  HTTP_429: '请求频率超限，请稍后再试',
  PAGE_RESTRICTED: '当前页面无法分析（浏览器内部页或受限页）',
  EMPTY_PAGE: '未能从当前页提取到正文，请换一个页面',
};

const PARSE_ERROR_HINTS = {
  NO_DELIMITERS: 'AI 未按分段格式返回，已把整段当主旨显示',
  VOCAB_NOT_ARRAY: '词汇 JSON 不是数组，已忽略',
  VOCAB_INVALID_JSON: '词汇 JSON 解析失败，已忽略',
  EMPTY: 'AI 返回为空',
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
  els.status.dataset.kind = kind;
  els.status.classList.remove('hidden');
}

function clearStatus() {
  els.status.classList.add('hidden');
  els.status.textContent = '';
  delete els.status.dataset.kind;
}

function hideResult() {
  els.result.classList.add('hidden');
  els.result.innerHTML = '';
}

function showResult(title, parsed) {
  els.result.innerHTML = '';
  if (title) {
    const h = document.createElement('p');
    h.className = 'result-title';
    h.textContent = title;
    els.result.appendChild(h);
  }

  if (parsed.summary) {
    const sec = document.createElement('section');
    sec.className = 'result-section';
    const label = document.createElement('p');
    label.className = 'section-label';
    label.textContent = '主旨';
    const body = document.createElement('p');
    body.className = 'summary-text';
    body.textContent = parsed.summary;
    sec.append(label, body);
    els.result.appendChild(sec);
  }

  if (parsed.mindmap) {
    const sec = document.createElement('section');
    sec.className = 'result-section';
    const label = document.createElement('p');
    label.className = 'section-label';
    label.textContent = '思维导图（原始 Markdown）';
    const pre = document.createElement('pre');
    pre.className = 'raw-block';
    pre.textContent = parsed.mindmap;
    sec.append(label, pre);
    els.result.appendChild(sec);
  }

  if (parsed.vocab?.length) {
    const sec = document.createElement('section');
    sec.className = 'result-section';
    const label = document.createElement('p');
    label.className = 'section-label';
    label.textContent = `重点词汇（JSON，${parsed.vocab.length} 条）`;
    const pre = document.createElement('pre');
    pre.className = 'raw-block';
    pre.textContent = JSON.stringify(parsed.vocab, null, 2);
    sec.append(label, pre);
    els.result.appendChild(sec);
  }

  els.result.classList.remove('hidden');
}

function showError(err) {
  let msg = ERROR_MESSAGES[err.code];
  if (!msg && typeof err.code === 'string' && /^HTTP_5\d\d$/.test(err.code)) {
    msg = 'AI 服务暂时不可用，请稍后再试';
  }
  if (!msg) msg = err.message || '未知错误';
  console.error('[AI Coach]', err);
  showStatus(msg, 'error');
}

function setLoading(loading) {
  els.analyzeCurrent.disabled = loading;
  if (loading) {
    showStatus('AI 正在阅读，请稍候…', 'info');
    hideResult();
  }
}

async function ensureKeyConfigured() {
  const { provider, openaiApiKey, anthropicApiKey } = await getSettings();
  const key = provider === 'openai' ? openaiApiKey : anthropicApiKey;
  if (!key) {
    showError({ code: 'MISSING_KEY' });
    return false;
  }
  return true;
}

async function extractCurrentTabContent() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url ?? '';
  if (
    !tab?.id ||
    !url ||
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:')
  ) {
    const e = new Error('受限页面');
    e.code = 'PAGE_RESTRICTED';
    throw e;
  }

  let injection;
  try {
    [injection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content/reader.js'],
    });
  } catch (err) {
    const e = new Error(err?.message || '无法注入内容脚本');
    e.code = 'PAGE_RESTRICTED';
    throw e;
  }

  const article = injection?.result;
  if (!article?.textContent || article.textContent.trim().length < 50) {
    const e = new Error('正文为空');
    e.code = 'EMPTY_PAGE';
    throw e;
  }
  return { title: article.title || '', text: article.textContent };
}

async function runAnalyzeCurrent() {
  if (!(await ensureKeyConfigured())) return;
  setLoading(true);
  try {
    const settings = await getSettings();
    const { title, text } = await extractCurrentTabContent();
    const parsed = await summarize({ title, text, settings });
    showResult(title || '文章分析', parsed);
    if (parsed.parseError && PARSE_ERROR_HINTS[parsed.parseError]) {
      showStatus(PARSE_ERROR_HINTS[parsed.parseError], 'info');
    } else {
      clearStatus();
    }
  } catch (err) {
    showError(err);
  } finally {
    els.analyzeCurrent.disabled = false;
  }
}

els.openOptions.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

els.analyzeCurrent.addEventListener('click', runAnalyzeCurrent);

els.analyzeUrl.disabled = true;
els.urlInput.disabled = true;
els.urlInput.placeholder = 'M3 将支持，敬请期待';
els.analyzeUrl.title = '该功能将在 M3 上线';

els.analyzeUrl.addEventListener('click', () => {
  showStatus('「分析 URL」功能将在 M3 上线，当前请使用「分析当前页」', 'info');
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'ANALYZE_SELECTION') {
    showStatus(`已收到划词：${msg.payload.text.slice(0, 40)}...`, 'info');
  }
});

(async () => {
  await applyTheme();
  const pending = await chrome.storage.session.get('pendingSelection');
  if (pending?.pendingSelection?.text) {
    showStatus(`已收到划词：${pending.pendingSelection.text.slice(0, 40)}...`, 'info');
    await chrome.storage.session.remove('pendingSelection');
  }
})();
