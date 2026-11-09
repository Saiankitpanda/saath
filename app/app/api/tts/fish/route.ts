import { fail, json } from '@/lib/server/http';

type FishEnv = {
  FISH_AUDIO_API_KEY?: string;
  FISH_AUDIO_VOICE_ID?: string;
};

async function getCfEnv(): Promise<FishEnv | undefined> {
  try {
    const mod = await import('cloudflare:workers' as string);
    return mod.env as FishEnv;
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      text?: string;
      voiceId?: string;
      customKey?: string;
    };

    const text = (body.text || '').trim();
    if (!text) {
      return json({ error: 'Text is required for speech synthesis' }, 400);
    }

    // Limit text length to prevent abuse / unexpected credit burn
    const sanitizedText = text.slice(0, 1500);

    const cfEnv = await getCfEnv();
    const apiKey =
      body.customKey?.trim() ||
      (typeof process !== 'undefined' ? process.env?.FISH_AUDIO_API_KEY : undefined) ||
      cfEnv?.FISH_AUDIO_API_KEY;

    const voiceId =
      body.voiceId?.trim() ||
      (typeof process !== 'undefined' ? process.env?.FISH_AUDIO_VOICE_ID : undefined) ||
      cfEnv?.FISH_AUDIO_VOICE_ID;

    if (!apiKey) {
      // Clean fallback indicator: tell client to use Web Speech API fallback
      return json({
        fallback: true,
        reason: 'NO_API_KEY',
        message: 'No Fish Audio API key configured on server. Browser voice will be used.',
      });
    }

    // Call Fish Audio TTS REST API
    const fishResponse = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: sanitizedText,
        reference_id: voiceId || undefined,
        format: 'mp3',
        mp3_bitrate: 128,
        latency: 'normal',
        normalize: true,
      }),
    });

    if (!fishResponse.ok) {
      const errText = await fishResponse.text().catch(() => '');
      return json(
        {
          fallback: true,
          reason: 'UPSTREAM_ERROR',
          status: fishResponse.status,
          message: `Fish Audio API error (${fishResponse.status}): ${errText.slice(0, 200)}`,
        },
        200
      );
    }

    const audioBuffer = await fishResponse.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return fail(error);
  }
}
