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
      <div className="character-wait-art" aria-hidden="true">
        <SaathCharacter name={name} size={112} animate={motionEnabled && !error} />
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
