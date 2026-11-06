'use client';

import type { CSSProperties } from 'react';
import './saath-character.css';

export const saathCharacters = [
  'patta-idle',
  'patta-greeting',
  'patta-listening',
  'patta-thanks',
  'patta-goodbye',
  'mira',
  'ari',
  'noor',
  'tara',
] as const;
export type SaathCharacterName = (typeof saathCharacters)[number];

type Props = {
  name?: SaathCharacterName;
  size?: number;
  animate?: boolean;
  alt?: string;
  basePath?: string;
  className?: string;
};

export function SaathCharacter({
  name = 'patta-idle',
  size = 160,
  animate = false,
  alt = '',
  basePath = '/saath',
  className = '',
}: Props) {
  return (
    <img
      src={`${basePath}/${name}.webp`}
      alt={alt}
      width={size}
      height={size}
      decoding="async"
      className={`saath-character${animate ? ' saath-character--float' : ''}${className ? ` ${className}` : ''}`}
      style={{ '--saath-size': `${size}px` } as CSSProperties}
    />
  );
}

export default SaathCharacter;
