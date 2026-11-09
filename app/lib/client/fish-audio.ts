'use client';

export type SpeechStatus = 'idle' | 'loading' | 'playing' | 'error';

export type SpeechController = {
  stop: () => void;
  pause: () => void;
  resume: () => void;
};

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

export function stopAnySpeech() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = '';
    } catch {}
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    currentUtterance = null;
  }
}

export async function speakTextWithFishAudio(
  text: string,
  options?: {
    voiceId?: string;
    customKey?: string;
    onStatusChange?: (status: SpeechStatus) => void;
    onNotice?: (msg: string) => void;
  }
): Promise<SpeechController> {
  const clean = text.trim();
  if (!clean) return { stop: () => {}, pause: () => {}, resume: () => {} };

  stopAnySpeech();
  options?.onStatusChange?.('loading');

  try {
    const res = await fetch('/api/tts/fish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: clean,
        voiceId: options?.voiceId,
        customKey: options?.customKey,
      }),
    });

    const contentType = res.headers.get('content-type') || '';

    // If binary audio returned: Fish Audio worked!
    if (res.ok && contentType.includes('audio')) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudio = audio;

      audio.onplay = () => {
        options?.onStatusChange?.('playing');
      };

      audio.onended = () => {
        options?.onStatusChange?.('idle');
        URL.revokeObjectURL(url);
        currentAudio = null;
      };

      audio.onerror = () => {
        options?.onStatusChange?.('error');
        URL.revokeObjectURL(url);
        currentAudio = null;
        // Fall back to browser speech on audio element failure
        fallbackBrowserSpeech(clean, options);
      };

      await audio.play();

      return {
        stop: () => {
          stopAnySpeech();
          options?.onStatusChange?.('idle');
        },
        pause: () => {
          audio.pause();
          options?.onStatusChange?.('idle');
        },
        resume: () => {
          void audio.play();
          options?.onStatusChange?.('playing');
        },
      };
    }

    // Otherwise JSON response received (e.g. fallback or no API key set)
    const json = (await res.json().catch(() => ({}))) as {
      fallback?: boolean;
      message?: string;
    };

    if (json.message && options?.onNotice) {
      options.onNotice(json.message);
    }

    return fallbackBrowserSpeech(clean, options);
  } catch {
    return fallbackBrowserSpeech(clean, options);
  }
}

function fallbackBrowserSpeech(
  text: string,
  options?: {
    onStatusChange?: (status: SpeechStatus) => void;
  }
): SpeechController {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options?.onStatusChange?.('error');
    return { stop: () => {}, pause: () => {}, resume: () => {} };
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    // Pick a warm, calm voice if available
    const voices = window.speechSynthesis.getVoices();
    const calmVoice =
      voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google'))) ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0];

    if (calmVoice) utterance.voice = calmVoice;
    utterance.rate = 0.92; // Slightly gentler pace for mental health / reflective context
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      options?.onStatusChange?.('playing');
    };

    utterance.onend = () => {
      options?.onStatusChange?.('idle');
      currentUtterance = null;
    };

    utterance.onerror = () => {
      options?.onStatusChange?.('idle');
      currentUtterance = null;
    };

    window.speechSynthesis.speak(utterance);

    return {
      stop: () => {
        try {
          window.speechSynthesis.cancel();
        } catch {}
        options?.onStatusChange?.('idle');
      },
      pause: () => {
        try {
          window.speechSynthesis.pause();
        } catch {}
        options?.onStatusChange?.('idle');
      },
      resume: () => {
        try {
          window.speechSynthesis.resume();
        } catch {}
        options?.onStatusChange?.('playing');
      },
    };
  } catch {
    options?.onStatusChange?.('error');
    return { stop: () => {}, pause: () => {}, resume: () => {} };
  }
}
