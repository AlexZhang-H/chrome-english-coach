import { resolveAnthropicBaseUrl } from '../storage.js';

export async function callAnthropic({ system, user, settings }) {
  const base = resolveAnthropicBaseUrl(settings).replace(/\/$/, '');
  const url = `${base}/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': settings.anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: settings.anthropicModel,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Anthropic ${res.status}: ${body.slice(0, 300)}`);
    err.code = `HTTP_${res.status}`;
    throw err;
  }

  const data = await res.json();
  const out = data?.content?.[0]?.text?.trim();
  if (!out) {
    const err = new Error('Anthropic 响应为空');
    err.code = 'EMPTY_RESPONSE';
    throw err;
  }
  return out;
}
