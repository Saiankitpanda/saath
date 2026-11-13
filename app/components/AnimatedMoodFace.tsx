'use client';

import React from 'react';
import type { MoodKind } from '@/lib/domain';

type Props = {
  mood: MoodKind;
  size?: number;
  className?: string;
  animated?: boolean;
};

export default function AnimatedMoodFace({
  mood,
  size = 38,
  className = '',
  animated = true,
}: Props) {
  const idPrefix = React.useId().replace(/:/g, '');

  return (
    <div
      className={`animated-mood-face mood-${mood} ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        style={{
          overflow: 'visible',
          filter: 'drop-shadow(0 2px 6px rgba(217, 119, 6, 0.28))',
        }}
      >
        <defs>
          {/* 3D Yellow Emoji Sphere Radial Gradient */}
          <radialGradient id={`${idPrefix}-yellowFace`} cx="34%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#fff7b8" />
            <stop offset="30%" stopColor="#ffc914" />
            <stop offset="80%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </radialGradient>

          {/* Eye Gradient */}
          <linearGradient id={`${idPrefix}-eyeGrad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#372c1c" />
            <stop offset="100%" stopColor="#1f180f" />
          </linearGradient>

          {/* Teardrop Gradient */}
          <linearGradient id={`${idPrefix}-tearGrad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          {/* Sweat Drop Gradient */}
          <linearGradient id={`${idPrefix}-sweatGrad`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Blush Gradient */}
          <radialGradient id={`${idPrefix}-blushGrad`}>
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Global Keyframes for lively emoji expressions */}
        <style>{`
          @keyframes mood-heavy-sigh {
            0%, 100% { transform: translateY(0) scale(1, 1); }
            50% { transform: translateY(2.5px) scale(1.03, 0.96); }
          }
          @keyframes mood-heavy-tear {
            0% { transform: translateY(-2px) scale(0.6); opacity: 0; }
            20% { transform: translateY(0px) scale(1); opacity: 0.95; }
            75% { transform: translateY(8px) scale(1.1); opacity: 0.9; }
            100% { transform: translateY(12px) scale(0.7); opacity: 0; }
          }
          @keyframes mood-heavy-brow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(1.2px); }
          }

          @keyframes mood-restless-jitter {
            0% { transform: translate(-1px, 0.8px) rotate(-1.5deg); }
            25% { transform: translate(1.2px, -0.6px) rotate(1.2deg); }
            50% { transform: translate(-0.8px, -1px) rotate(-1deg); }
            75% { transform: translate(1px, 0.8px) rotate(1.4deg); }
            100% { transform: translate(0px, 0px) rotate(0deg); }
          }
          @keyframes mood-restless-pupils {
            0%, 100% { transform: translate(0, 0); }
            20% { transform: translate(2.5px, -1px); }
            45% { transform: translate(-2.5px, 0.8px); }
            70% { transform: translate(1.8px, 1.2px); }
            85% { transform: translate(-1.2px, -1px); }
          }
          @keyframes mood-restless-sweat {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.85; }
            50% { transform: translateY(2px) scale(1.15); opacity: 1; }
          }

          @keyframes mood-tender-sway {
            0%, 100% { transform: rotate(-4.5deg) translateY(-1.5px); }
            50% { transform: rotate(4.5deg) translateY(1px); }
          }
          @keyframes mood-tender-blush {
            0%, 100% { transform: scale(1); opacity: 0.65; }
            50% { transform: scale(1.25); opacity: 0.95; }
          }
          @keyframes mood-tender-blink {
            0%, 86%, 100% { transform: scaleY(1); }
            92% { transform: scaleY(0.2); }
          }

          @keyframes mood-unsure-tilt {
            0%, 100% { transform: rotate(-7deg); }
            45% { transform: rotate(5.5deg); }
            55% { transform: rotate(5.5deg); }
            85% { transform: rotate(-7deg); }
          }
          @keyframes mood-unsure-brow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2.8px); }
          }
          @keyframes mood-unsure-eyes {
            0%, 100% { transform: translate(0, 0); }
            35% { transform: translate(2.2px, -1.8px); }
            70% { transform: translate(-1.8px, 0.5px); }
          }

          @keyframes mood-steady-breathe {
            0%, 100% { transform: scale(0.96) translateY(1.5px); }
            50% { transform: scale(1.06) translateY(-2px); }
          }
          @keyframes mood-steady-blink {
            0%, 88%, 100% { transform: scaleY(1); }
            94% { transform: scaleY(0.15); }
          }
        `}</style>

        {/* BASE: Yellow Face Body with dynamic mood animation */}
        <g
          style={{
            transformOrigin: '24px 24px',
            animation: animated
              ? mood === 'heavy'
                ? 'mood-heavy-sigh 2.4s ease-in-out infinite'
                : mood === 'restless'
                ? 'mood-restless-jitter 0.35s ease-in-out infinite'
                : mood === 'tender'
                ? 'mood-tender-sway 2.2s ease-in-out infinite'
                : mood === 'unsure'
                ? 'mood-unsure-tilt 2.4s ease-in-out infinite'
                : 'mood-steady-breathe 2.4s ease-in-out infinite'
              : undefined,
          }}
        >
          {/* Main Face Circle */}
          <circle cx="24" cy="24" r="21" fill={`url(#${idPrefix}-yellowFace)`} />

          {/* Top-left 3D Specular Sheen */}
          <ellipse
            cx="17"
            cy="11"
            rx="11"
            ry="6"
            fill="#ffffff"
            opacity="0.42"
            transform="rotate(-20 17 11)"
          />

          {/* Bottom ambient shadow */}
          <path
            d="M 6 28 C 10 39 38 39 42 28 C 38 42 10 42 6 28 Z"
            fill="#b45309"
            opacity="0.25"
          />

          {/* --- MOOD SPECIFIC FEATURES --- */}

          {/* 1. HEAVY (Sad, dripping teardrop, downturned mouth, drooping brows) */}
          {mood === 'heavy' && (
            <g>
              {/* Eyebrows: Inner corners raised (worried) */}
              <g
                style={{
                  transformOrigin: '24px 14px',
                  animation: animated ? 'mood-heavy-brow 3.2s ease-in-out infinite' : undefined,
                }}
              >
                <path
                  d="M 12 16 Q 16 12 21 15"
                  stroke="#5c3d11"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 36 16 Q 32 12 27 15"
                  stroke="#5c3d11"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>

              {/* Eyes: Curved down sad eyes */}
              <path
                d="M 13 22 Q 17 18 21 22"
                stroke={`url(#${idPrefix}-eyeGrad)`}
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 27 22 Q 31 18 35 22"
                stroke={`url(#${idPrefix}-eyeGrad)`}
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />

              {/* Teardrop under left eye with dripping animation */}
              <g
                style={{
                  transformOrigin: '15px 25px',
                  animation: animated ? 'mood-heavy-tear 2s ease-in infinite' : undefined,
                }}
              >
                <path
                  d="M 15 25 C 13.5 27 13 28.5 13 30 C 13 31.7 14.3 33 16 33 C 17.7 33 19 31.7 19 30 C 19 28.5 18.5 27 17 25 C 16.5 24 15.5 24 15 25 Z"
                  fill={`url(#${idPrefix}-tearGrad)`}
                />
                {/* Tear sparkle */}
                <circle cx="15" cy="28" r="0.8" fill="#ffffff" opacity="0.8" />
              </g>

              {/* Mouth: Soft downturned frown */}
              <path
                d="M 16 35 Q 24 29 32 35"
                stroke="#5c3d11"
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}

          {/* 2. RESTLESS (Wide alert eyes, darting pupils, wavy mouth, sweat bead) */}
          {mood === 'restless' && (
            <g>
              {/* Furrowed angled brows */}
              <path
                d="M 12 14 Q 17 15 21 13"
                stroke="#5c3d11"
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 36 14 Q 31 15 27 13"
                stroke="#5c3d11"
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              />

              {/* Big wide alert whites */}
              <circle cx="16" cy="20" r="5.5" fill="#ffffff" />
              <circle cx="32" cy="20" r="5.5" fill="#ffffff" />

              {/* Darting pupils */}
              <g
                style={{
                  transformOrigin: '24px 20px',
                  animation: animated ? 'mood-restless-pupils 1.2s ease-in-out infinite' : undefined,
                }}
              >
                <circle cx="16" cy="20" r="2.8" fill={`url(#${idPrefix}-eyeGrad)`} />
                <circle cx="17.2" cy="19" r="0.9" fill="#ffffff" />

                <circle cx="32" cy="20" r="2.8" fill={`url(#${idPrefix}-eyeGrad)`} />
                <circle cx="33.2" cy="19" r="0.9" fill="#ffffff" />
              </g>

              {/* Nervous sweat bead on right forehead */}
              <g
                style={{
                  transformOrigin: '40px 14px',
                  animation: animated ? 'mood-restless-sweat 1.5s ease-in-out infinite' : undefined,
                }}
              >
                <path
                  d="M 39 10 C 37.5 12 37 13.5 37 15 C 37 16.5 38.3 17.5 40 17.5 C 41.7 17.5 43 16.5 43 15 C 43 13.5 42.5 12 41 10 C 40.5 9 39.5 9 39 10 Z"
                  fill={`url(#${idPrefix}-sweatGrad)`}
                />
                <circle cx="39.5" cy="14" r="0.8" fill="#ffffff" opacity="0.8" />
              </g>

              {/* Jittery wavy anxious mouth */}
              <path
                d="M 16 32 Q 20 36 24 32 Q 28 28 32 32"
                stroke="#5c3d11"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}

          {/* 3. TENDER (Soft crescent smiling eyes, glowing blush, gentle sweet smile) */}
          {mood === 'tender' && (
            <g>
              {/* Soft rounded eyebrows */}
              <path
                d="M 12 15 Q 16 11 20 14"
                stroke="#5c3d11"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 36 15 Q 32 11 28 14"
                stroke="#5c3d11"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />

              {/* Smiling closed crescent eyes with blinking/fluttering */}
              <g
                style={{
                  transformOrigin: '24px 21px',
                  animation: animated ? 'mood-tender-blink 3s ease-in-out infinite' : undefined,
                }}
              >
                <path
                  d="M 13 21 Q 17 26 21 21"
                  stroke={`url(#${idPrefix}-eyeGrad)`}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 27 21 Q 31 26 35 21"
                  stroke={`url(#${idPrefix}-eyeGrad)`}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>

              {/* Glowing Rosy Blushing Cheeks with pulse */}
              <circle
                cx="11"
                cy="25"
                r="5"
                fill={`url(#${idPrefix}-blushGrad)`}
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  animation: animated ? 'mood-tender-blush 2.2s ease-in-out infinite' : undefined,
                }}
              />
              <circle
                cx="37"
                cy="25"
                r="5"
                fill={`url(#${idPrefix}-blushGrad)`}
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  animation: animated ? 'mood-tender-blush 2.2s ease-in-out infinite' : undefined,
                }}
              />

              {/* Gentle sweet caring smile */}
              <path
                d="M 18 29 Q 24 35 30 29"
                stroke="#5c3d11"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}

          {/* 4. UNSURE (One raised curious eyebrow, skeptical mouth, wandering look) */}
          {mood === 'unsure' && (
            <g>
              {/* Left Eyebrow: Raised high in curiosity with twitch */}
              <g
                style={{
                  transformOrigin: '16px 11px',
                  animation: animated ? 'mood-unsure-brow 1.8s ease-in-out infinite' : undefined,
                }}
              >
                <path
                  d="M 11 11 Q 16 8 21 11"
                  stroke="#5c3d11"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
              {/* Right Eyebrow: Lowered furrow */}
              <path
                d="M 36 16 Q 31 16 27 17"
                stroke="#5c3d11"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />

              {/* Left & Right Eyes with thinking/wandering pupils */}
              <circle cx="16" cy="19" r="4.8" fill="#ffffff" />
              <circle cx="32" cy="21" r="4.2" fill="#ffffff" />

              <g
                style={{
                  transformOrigin: '24px 19px',
                  animation: animated ? 'mood-unsure-eyes 3.6s ease-in-out infinite' : undefined,
                }}
              >
                <circle cx="16" cy="18" r="2.6" fill={`url(#${idPrefix}-eyeGrad)`} />
                <circle cx="17" cy="17.2" r="0.8" fill="#ffffff" />

                <circle cx="31.5" cy="20.5" r="2.2" fill={`url(#${idPrefix}-eyeGrad)`} />
                <circle cx="32.2" cy="19.8" r="0.7" fill="#ffffff" />
              </g>

              {/* Crooked skeptical/hesitant mouth */}
              <path
                d="M 17 32 Q 24 32 32 29"
                stroke="#5c3d11"
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}

          {/* 5. STEADY (Peaceful serene smile, calm closed eyes, relaxed mindful presence) */}
          {mood === 'steady' && (
            <g>
              {/* Relaxed smooth eyebrows */}
              <path
                d="M 13 14 Q 17 11 21 13"
                stroke="#5c3d11"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 35 14 Q 31 11 27 13"
                stroke="#5c3d11"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />

              {/* Peaceful curved eyes with gentle slow blink */}
              <g
                style={{
                  transformOrigin: '24px 21px',
                  animation: animated ? 'mood-steady-blink 3.8s ease-in-out infinite' : undefined,
                }}
              >
                <path
                  d="M 13 21 Q 17 25 21 21"
                  stroke={`url(#${idPrefix}-eyeGrad)`}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 27 21 Q 31 25 35 21"
                  stroke={`url(#${idPrefix}-eyeGrad)`}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>

              {/* Soft gentle peach cheeks */}
              <circle cx="12" cy="25" r="3.8" fill="#fb923c" opacity="0.45" />
              <circle cx="36" cy="25" r="3.8" fill="#fb923c" opacity="0.45" />

              {/* Serene relaxed warm smile */}
              <path
                d="M 17 28 Q 24 35 31 28"
                stroke="#5c3d11"
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
