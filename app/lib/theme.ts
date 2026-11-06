import type { AppearanceState, DoodleMotif, ThemePreset, ThemeTokens } from '@/lib/domain';

export const THEME_SCHEMA_VERSION = 1 as const;
export const DEFAULT_THEME_ID = 'saath-default';

/** Restrained sage-and-ivory default — calm, warm, readable. */
export const SAATH_DEFAULT_TOKENS: ThemeTokens = {
  pageBg: '#f3f6f2',
  cardSurface: '#fffcf8',
  accent: '#5f7a64',
  onAccent: '#ffffff',
  text: '#24312a',
  muted: '#5d6e64',
  border: '#d2ddd4',
};

export const STARTER_PALETTES: {
  id: string;
  name: string;
  tokens: ThemeTokens;
  motif: DoodleMotif;
  blurb: string;
  feeling: string;
}[] = [
  {
    id: 'sage-morning',
    name: 'Sage morning',
    blurb: 'Soft green calm',
    feeling: 'Like early garden light',
    motif: 'leaf',
    tokens: {
      pageBg: '#eef5f0',
      cardSurface: '#ffffff',
      accent: '#5f7a64',
      onAccent: '#ffffff',
      text: '#24312a',
      muted: '#5d6e64',
      border: '#c9d6cc',
    },
  },
  {
    id: 'sandstone',
    name: 'Sandstone',
    blurb: 'Warm ivory stone',
    feeling: 'Quiet courtyard warmth',
    motif: 'hill',
    tokens: {
      pageBg: '#f7f1ea',
      cardSurface: '#fffdf9',
      accent: '#8a6b52',
      onAccent: '#ffffff',
      text: '#2f261f',
      muted: '#6e5d50',
      border: '#e0d3c4',
    },
  },
  {
    id: 'soft-sky',
    name: 'Soft sky',
    blurb: 'Cool open air',
    feeling: 'Clear morning sky',
    motif: 'river',
    tokens: {
      pageBg: '#eef3f8',
      cardSurface: '#ffffff',
      accent: '#4f6f8f',
      onAccent: '#ffffff',
      text: '#1f2a36',
      muted: '#5c6b78',
      border: '#d0dae4',
    },
  },
  {
    id: 'peach-garden',
    name: 'Peach garden',
    blurb: 'Gentle peach light',
    feeling: 'Soft evening peach',
    motif: 'leaf',
    tokens: {
      pageBg: '#f8efe8',
      cardSurface: '#fffaf7',
      accent: '#8f5f42',
      onAccent: '#ffffff',
      text: '#32261f',
      muted: '#746356',
      border: '#e5d4c7',
    },
  },
  {
    id: 'rose-clay',
    name: 'Rose clay',
    blurb: 'Soft rose earth',
    feeling: 'Tender clay and dusk',
    motif: 'moon',
    tokens: {
      pageBg: '#f6ecee',
      cardSurface: '#fffbfb',
      accent: '#9a5f6e',
      onAccent: '#ffffff',
      text: '#332328',
      muted: '#74555d',
      border: '#e2cdd2',
    },
  },
];

export const MIXED_EXAMPLE_TOKENS: ThemeTokens = {
  pageBg: '#eef3f8',
  cardSurface: '#fffaf7',
  accent: '#5f7a64',
  onAccent: '#ffffff',
  text: '#2f261f',
  muted: '#5c6b78',
  border: '#e0d3c4',
};

/** Curated soothing swatches — tap, don’t type */
export const SOOTHING_SWATCHES: Record<keyof ThemeTokens, { hex: string; label: string }[]> = {
  pageBg: [
    { hex: '#f3f6f2', label: 'Sage ivory' },
    { hex: '#eef5f0', label: 'Sage wash' },
    { hex: '#f7f1ea', label: 'Sand' },
    { hex: '#eef3f8', label: 'Sky mist' },
    { hex: '#f8efe8', label: 'Peach mist' },
    { hex: '#f6ecee', label: 'Rose mist' },
    { hex: '#f5f7fa', label: 'Cool mist' },
  ],
  cardSurface: [
    { hex: '#fffcf8', label: 'Warm white' },
    { hex: '#ffffff', label: 'Pure white' },
    { hex: '#fffdf9', label: 'Cream card' },
    { hex: '#fffaf7', label: 'Peach card' },
    { hex: '#fffbfb', label: 'Rose card' },
    { hex: '#f7faf8', label: 'Sage card' },
    { hex: '#f5f8fb', label: 'Sky card' },
  ],
  accent: [
    { hex: '#5f7a64', label: 'Sage' },
    { hex: '#8a6b52', label: 'Clay' },
    { hex: '#4f6f8f', label: 'Sky' },
    { hex: '#8f5f42', label: 'Peach' },
    { hex: '#9a5f6e', label: 'Rose' },
    { hex: '#526b86', label: 'Steel' },
    { hex: '#6b8f71', label: 'Leaf' },
  ],
  onAccent: [
    { hex: '#ffffff', label: 'White' },
    { hex: '#fff8f2', label: 'Warm white' },
    { hex: '#f4f7fa', label: 'Cool white' },
  ],
  text: [
    { hex: '#24312a', label: 'Forest ink' },
    { hex: '#2f261f', label: 'Earth ink' },
    { hex: '#1f2a36', label: 'Night ink' },
    { hex: '#32261f', label: 'Clay ink' },
    { hex: '#332328', label: 'Rose ink' },
    { hex: '#293440', label: 'Slate ink' },
  ],
  muted: [
    { hex: '#5d6e64', label: 'Soft sage' },
    { hex: '#6e5d50', label: 'Soft clay' },
    { hex: '#5c6b78', label: 'Soft slate' },
    { hex: '#74555d', label: 'Soft rose' },
    { hex: '#746356', label: 'Soft peach' },
  ],
  border: [
    { hex: '#d2ddd4', label: 'Sage line' },
    { hex: '#c9d6cc', label: 'Garden line' },
    { hex: '#e0d3c4', label: 'Sand line' },
    { hex: '#d0dae4', label: 'Sky line' },
    { hex: '#e5d4c7', label: 'Peach line' },
    { hex: '#e2cdd2', label: 'Rose line' },
  ],
};

const HEX = /^#([0-9a-fA-F]{6})$/;

export function isValidHex(value: string): boolean {
  return HEX.test(value.trim());
}

function channel(hex: string, index: number): number {
  return parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
}

function linearize(c: number): number {
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  if (!isValidHex(hex)) return 0;
  const r = linearize(channel(hex, 0));
  const g = linearize(channel(hex, 1));
  const b = linearize(channel(hex, 2));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastIssue = {
  pair: string;
  foreground: string;
  background: string;
  ratio: number;
  required: number;
  suggestion: string;
};

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toHex(r: number, g: number, b: number): string {
  return `#${clampByte(r).toString(16).padStart(2, '0')}${clampByte(g).toString(16).padStart(2, '0')}${clampByte(b).toString(16).padStart(2, '0')}`;
}

function parseRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function mix(a: string, b: string, amount: number): string {
  if (!isValidHex(a) || !isValidHex(b)) return a;
  const [ar, ag, ab] = parseRgb(a);
  const [br, bg, bb] = parseRgb(b);
  const t = Math.max(0, Math.min(1, amount));
  return toHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

function darken(hex: string, amount: number): string {
  return mix(hex, '#000000', amount);
}

function lighten(hex: string, amount: number): string {
  return mix(hex, '#ffffff', amount);
}

function suggestDarker(hex: string): string {
  return darken(isValidHex(hex) ? hex : '#24312a', 0.35);
}

function suggestLighter(hex: string): string {
  return lighten(isValidHex(hex) ? hex : '#f3f6f2', 0.45);
}

export function isLightBackground(hex: string): boolean {
  return relativeLuminance(hex) >= 0.72;
}

/** Derive full semantic surface tokens from the seven editable colours. */
export function deriveSemanticTokens(tokens: ThemeTokens) {
  const accentHover = darken(tokens.accent, 0.14);
  const secondaryBg = mix(tokens.pageBg, tokens.border, 0.35);
  const elevated = lighten(tokens.cardSurface, 0.04);
  const inputBg = mix(tokens.cardSurface, tokens.pageBg, 0.28);
  const placeholder = lighten(tokens.muted, 0.22);
  const selected = mix(tokens.cardSurface, tokens.accent, 0.14);
  const disabled = mix(tokens.border, tokens.pageBg, 0.4);
  return {
    pageBg: tokens.pageBg,
    pageBgSecondary: secondaryBg,
    cardSurface: tokens.cardSurface,
    elevated,
    text: tokens.text,
    textSecondary: mix(tokens.text, tokens.muted, 0.35),
    muted: tokens.muted,
    placeholder,
    border: tokens.border,
    inputBg,
    accent: tokens.accent,
    accentHover,
    onAccent: tokens.onAccent,
    selected,
    disabled,
    focus: tokens.accent,
    error: '#a14b3c',
    warning: '#9a7340',
    success: '#4f7a5a',
    artSurface: '#f4f1ea',
    shadow: `0 12px 32px ${mix(tokens.text, '#000000', 0.82)}14`,
  };
}

export function validateThemeTokens(tokens: ThemeTokens): ContrastIssue[] {
  const issues: ContrastIssue[] = [];
  const checks: { pair: string; fg: string; bg: string; required: number }[] = [
    { pair: 'Primary text on page', fg: tokens.text, bg: tokens.pageBg, required: 4.5 },
    { pair: 'Primary text on card', fg: tokens.text, bg: tokens.cardSurface, required: 4.5 },
    { pair: 'Muted text on page', fg: tokens.muted, bg: tokens.pageBg, required: 4.5 },
    { pair: 'Muted text on card', fg: tokens.muted, bg: tokens.cardSurface, required: 4.5 },
    { pair: 'On-accent on accent', fg: tokens.onAccent, bg: tokens.accent, required: 4.5 },
    { pair: 'Accent boundary on page', fg: tokens.accent, bg: tokens.pageBg, required: 3 },
    // Soft decorative borders are intentional; only flag when nearly invisible.
    { pair: 'Border on page', fg: tokens.border, bg: tokens.pageBg, required: 1.15 },
  ];

  for (const check of checks) {
    if (!isValidHex(check.fg) || !isValidHex(check.bg)) {
      issues.push({
        pair: check.pair,
        foreground: check.fg,
        background: check.bg,
        ratio: 0,
        required: check.required,
        suggestion: 'Use a valid 6-digit hex colour like #24312a.',
      });
      continue;
    }
    const ratio = contrastRatio(check.fg, check.bg);
    if (ratio + 0.01 < check.required) {
      issues.push({
        pair: check.pair,
        foreground: check.fg,
        background: check.bg,
        ratio: Math.round(ratio * 100) / 100,
        required: check.required,
        suggestion: `Try text ${suggestDarker(check.fg)} or background ${suggestLighter(check.bg)}.`,
      });
    }
  }

  if (isValidHex(tokens.pageBg) && !isLightBackground(tokens.pageBg)) {
    issues.push({
      pair: 'Light theme direction',
      foreground: tokens.text,
      background: tokens.pageBg,
      ratio: Math.round(relativeLuminance(tokens.pageBg) * 100) / 100,
      required: 0.72,
      suggestion: `Page background should stay light. Try ${suggestLighter(tokens.pageBg)}.`,
    });
  }

  return issues;
}

/** Essential pairs that must pass before Apply (cannot be waived). */
export function essentialContrastFails(tokens: ThemeTokens): ContrastIssue[] {
  const essential = new Set([
    'Primary text on page',
    'Primary text on card',
    'On-accent on accent',
    'Light theme direction',
  ]);
  return validateThemeTokens(tokens).filter(item =>
    essential.has(item.pair) || !isValidHex(item.foreground) || !isValidHex(item.background),
  );
}

export function defaultAppearance(): AppearanceState {
  return {
    schemaVersion: THEME_SCHEMA_VERSION,
    activeThemeId: DEFAULT_THEME_ID,
    presets: [],
    motionEnabled: true,
    colorMode: 'light',
  };
}

export function saathDefaultPreset(): ThemePreset {
  return {
    id: DEFAULT_THEME_ID,
    name: 'Saath default',
    tokens: { ...SAATH_DEFAULT_TOKENS },
    motif: 'none',
    updatedAt: new Date(0).toISOString(),
  };
}

export function applyThemeToDocument(
  tokens: ThemeTokens,
  motif: DoodleMotif,
  motionEnabled: boolean,
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const semantic = deriveSemanticTokens(tokens);

  root.style.setProperty('--page-bg', semantic.pageBg);
  root.style.setProperty('--page-bg-secondary', semantic.pageBgSecondary);
  root.style.setProperty('--card', semantic.cardSurface);
  root.style.setProperty('--elevated', semantic.elevated);
  root.style.setProperty('--ink', semantic.text);
  root.style.setProperty('--text-secondary', semantic.textSecondary);
  root.style.setProperty('--muted', semantic.muted);
  root.style.setProperty('--placeholder', semantic.placeholder);
  root.style.setProperty('--line', semantic.border);
  root.style.setProperty('--input-bg', semantic.inputBg);
  root.style.setProperty('--green', semantic.accent);
  root.style.setProperty('--orange', semantic.accent);
  root.style.setProperty('--accent', semantic.accent);
  root.style.setProperty('--accent-hover', semantic.accentHover);
  root.style.setProperty('--on-accent', semantic.onAccent);
  root.style.setProperty('--selected', semantic.selected);
  root.style.setProperty('--disabled', semantic.disabled);
  root.style.setProperty('--focus', semantic.focus);
  root.style.setProperty('--error', semantic.error);
  root.style.setProperty('--warning', semantic.warning);
  root.style.setProperty('--success', semantic.success);
  root.style.setProperty('--saath-art-surface', semantic.artSurface);
  root.style.setProperty('--shadow-soft', semantic.shadow);

  // Legacy aliases used across the existing stylesheet
  root.style.setProperty('--ivory', semantic.pageBg);
  root.style.setProperty('--sage', semantic.pageBgSecondary);
  root.style.setProperty('--peach', mix(tokens.cardSurface, tokens.accent, 0.12));

  root.dataset.motif = motif;
  root.dataset.motion = motionEnabled ? 'on' : 'off';
  root.dataset.theme = 'light';
  root.style.colorScheme = 'light';
  document.body.style.background = semantic.pageBg;
  document.body.style.color = semantic.text;
}

export function clearThemeFromDocument(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  [
    '--page-bg',
    '--page-bg-secondary',
    '--card',
    '--elevated',
    '--ink',
    '--text-secondary',
    '--muted',
    '--placeholder',
    '--line',
    '--input-bg',
    '--green',
    '--orange',
    '--accent',
    '--accent-hover',
    '--on-accent',
    '--selected',
    '--disabled',
    '--focus',
    '--error',
    '--warning',
    '--success',
    '--saath-art-surface',
    '--shadow-soft',
    '--ivory',
    '--sage',
    '--peach',
  ].forEach(key => root.style.removeProperty(key));
  delete root.dataset.motif;
  delete root.dataset.motion;
  delete root.dataset.theme;
  root.style.colorScheme = '';
  document.body.style.background = '';
  document.body.style.color = '';
}

export function sanitizeTokens(input: Partial<ThemeTokens> | null | undefined): ThemeTokens | null {
  if (!input) return null;
  const next: ThemeTokens = {
    pageBg: String(input.pageBg || '').trim(),
    cardSurface: String(input.cardSurface || '').trim(),
    accent: String(input.accent || '').trim(),
    onAccent: String(input.onAccent || '').trim(),
    text: String(input.text || '').trim(),
    muted: String(input.muted || '').trim(),
    border: String(input.border || '').trim(),
  };
  if (Object.values(next).some(value => !isValidHex(value))) return null;
  return next;
}

export function sanitizeMotif(value: unknown): DoodleMotif {
  return value === 'leaf' || value === 'river' || value === 'hill' || value === 'moon' ? value : 'none';
}

export function findStarterPalette(id: string | null | undefined) {
  if (!id) return null;
  return STARTER_PALETTES.find(item => item.id === id) || null;
}
