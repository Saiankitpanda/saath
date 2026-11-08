'use client';

import { SaathCharacter, type SaathCharacterName } from '@/components/SaathCharacter';

type Props = {
  kind?: 'app' | 'ai';
  companion?: SaathCharacterName;
  message?: string;
  error?: string | null;
  onRetry?: () => void;
  motionEnabled?: boolean;
};

export default function CharacterWait({
  kind = 'app',
  companion = 'mira',
  message,
  error = null,
  onRetry,
  motionEnabled = true,
}: Props) {
  const name: SaathCharacterName = kind === 'ai' ? companion : 'patta-idle';
  const status = error
    ? error
    : message || (kind === 'ai' ? 'Preparing a reply…' : 'Getting your space ready…');

  return (
    <div className="character-wait" role="status" aria-live="polite">
      <div className="character-wait-stage" aria-hidden="true">
        {kind === 'app' && (
          <svg className="character-wait-doodle" viewBox="0 0 120 160">
            <path d="M18 148 C36 112, 28 78, 58 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            <path d="M46 96 C62 78, 74 70, 92 58" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            <ellipse cx="70" cy="26" rx="22" ry="12" transform="rotate(-32 70 26)" fill="#8fae9a"/>
            <ellipse cx="96" cy="54" rx="16" ry="9" transform="rotate(-18 96 54)" fill="#a8c2b0"/>
            <ellipse cx="48" cy="86" rx="14" ry="8" transform="rotate(-12 48 86)" fill="#7f9a88"/>
            <circle cx="84" cy="42" r="3.2" fill="#d4b49a"/>
          </svg>
        )}
        <div className="character-wait-art">
          <SaathCharacter name={name} size={kind === 'app' ? 180 : 112} animate={motionEnabled && !error} alt="" />
        </div>
      </div>
      <p>{status}</p>
      {error && onRetry && (
        <button type="button" className="outline-button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
