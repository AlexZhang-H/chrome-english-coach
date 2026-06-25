import { resolveOpenAIBaseUrl } from '../storage.js';

export async function callOpenAI({ system, user, settings }) {
  const base = resolveOpenAIBaseUrl(settings).replace(/\/$/, '');
  const url = `${base}/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${settings.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: settings.openaiModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`OpenAI ${res.status}: ${body.slice(0, 300)}`);
    err.code = `HTTP_${res.status}`;
    throw err;
  }

  const data = await res.json();
  const out = data?.choices?.[0]?.message?.content?.trim();
  if (!out) {
    const err = new Error('OpenAI 响应为空');
    err.code = 'EMPTY_RESPONSE';
    throw err;
  }
  return out;
}
