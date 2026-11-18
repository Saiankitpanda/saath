type AIEnv = { AI_API_KEY?: string; AI_BASE_URL?: string; AI_MODEL?: string };

export function aiConfig() {
  let values: AIEnv = {};
  try {
    const mod = require('cloudflare:workers');
    values = (mod?.env || {}) as AIEnv;
  } catch {}

  const key =
    values.AI_API_KEY ||
    (typeof process !== 'undefined'
      ? process.env?.AI_API_KEY || process.env?.OPENAI_API_KEY
      : undefined);
  const base =
    values.AI_BASE_URL ||
    (typeof process !== 'undefined'
      ? process.env?.AI_BASE_URL || 'https://api.openai.com/v1'
      : 'https://api.openai.com/v1');
  const model =
    values.AI_MODEL ||
    (typeof process !== 'undefined'
      ? process.env?.AI_MODEL || 'gpt-4o-mini'
      : 'gpt-4o-mini');

  return { key, base, model };
}

export function aiReady() {
  const c = aiConfig();
  return Boolean(c.key);
}
