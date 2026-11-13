import { env } from 'cloudflare:workers';

type VoiceEnv = {
  LIVEKIT_URL?: string;
  LIVEKIT_API_KEY?: string;
  LIVEKIT_API_SECRET?: string;
};

export function voiceConfig() {
  let values: VoiceEnv = {};
  try {
    values = (env as unknown as VoiceEnv) || {};
  } catch {}

  const url = values.LIVEKIT_URL || (typeof process !== 'undefined' ? process.env?.LIVEKIT_URL : undefined);
  const key = values.LIVEKIT_API_KEY || (typeof process !== 'undefined' ? process.env?.LIVEKIT_API_KEY : undefined);
  const secret = values.LIVEKIT_API_SECRET || (typeof process !== 'undefined' ? process.env?.LIVEKIT_API_SECRET : undefined);

  return {
    url,
    key,
    secret,
  };
}

export function voiceReady() {
  const config = voiceConfig();
  return Boolean(config.url && config.key && config.secret);
}
