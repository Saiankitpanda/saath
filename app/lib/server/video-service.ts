type VideoEnv = {
  DAILY_API_KEY?: string;
  DAILY_DOMAIN?: string;
  GOOGLE_MEET_DEFAULT_URL?: string;
};

async function getCfEnv(): Promise<VideoEnv | undefined> {
  try {
    const mod = await import('cloudflare:workers' as string);
    return mod.env as VideoEnv;
  } catch {
    return undefined;
  }
}

export type VideoRoomInfo = {
  provider: 'daily' | 'meet' | 'webrtc';
  dailyUrl?: string;
  meetUrl: string;
  roomCode: string;
};

export async function createOrGetVideoRoom(callCode: string): Promise<VideoRoomInfo> {
  const code = (callCode || 'saath').toLowerCase();
  const cfEnv = await getCfEnv();

  const dailyApiKey =
    (typeof process !== 'undefined' ? process.env?.DAILY_API_KEY : undefined) ||
    cfEnv?.DAILY_API_KEY;

  const dailyDomain =
    (typeof process !== 'undefined' ? process.env?.DAILY_DOMAIN : undefined) ||
    cfEnv?.DAILY_DOMAIN;

  const defaultMeet =
    (typeof process !== 'undefined' ? process.env?.GOOGLE_MEET_DEFAULT_URL : undefined) ||
    cfEnv?.GOOGLE_MEET_DEFAULT_URL ||
    'https://meet.google.com/new';

  let dailyUrl: string | undefined;

  if (dailyApiKey) {
    try {
      const roomName = `saath-${code}-${Date.now().toString(36)}`;
      const res = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${dailyApiKey}`,
        },
        body: JSON.stringify({
          name: roomName,
          properties: {
            enable_chat: true,
            enable_screenshare: true,
            start_video_off: false,
            start_audio_off: false,
            exp: Math.floor(Date.now() / 1000) + 7200, // 2 hour duration
          },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        dailyUrl = data.url;
      }
    } catch {
      // Fallback below if API call fails
    }
  }

  // If Daily API key not set or call failed, provide working Daily room URL if domain exists,
  // or Jitsi Meet/Daily instant room fallback
  if (!dailyUrl) {
    if (dailyDomain) {
      dailyUrl = `https://${dailyDomain}.daily.co/saath-${code}`;
    } else {
      // Zero-config real web video room fallback so thousands of users can video call without crashing
      dailyUrl = `https://meet.jit.si/saath-${code}`;
    }
  }

  return {
    provider: 'daily',
    dailyUrl,
    meetUrl: defaultMeet,
    roomCode: code,
  };
}
