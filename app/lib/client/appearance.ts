import type { AppearanceState, DoodleMotif, ThemePreset, ThemeTokens } from '@/lib/domain';
import {
  DEFAULT_THEME_ID,
  SAATH_DEFAULT_TOKENS,
  STARTER_PALETTES,
  THEME_SCHEMA_VERSION,
  applyThemeToDocument,
  clearThemeFromDocument,
  defaultAppearance,
  findStarterPalette,
  sanitizeMotif,
  sanitizeTokens,
  saathDefaultPreset,
} from '@/lib/theme';

/**
 * Appearance is stored in this browser only for now.
 * No authenticated appearance API exists yet — label UI accordingly.
 */
export const APPEARANCE_STORAGE_LABEL =
  'Saved in this browser only. Not synced to your account yet.';

const KEY = 'saath-appearance-v1';

function blank(): AppearanceState {
  return defaultAppearance();
}

function readRaw(): AppearanceState {
  if (typeof window === 'undefined') return blank();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw) as AppearanceState;
    if (parsed?.schemaVersion !== THEME_SCHEMA_VERSION) return blank();
    const presets = Array.isArray(parsed.presets)
      ? parsed.presets
          .map(item => {
            const tokens = sanitizeTokens(item?.tokens);
            if (!tokens || !item?.id || !item?.name) return null;
            return {
              id: String(item.id),
              name: String(item.name).slice(0, 48),
              tokens,
              motif: sanitizeMotif(item.motif),
              updatedAt: String(item.updatedAt || new Date().toISOString()),
            } satisfies ThemePreset;
          })
          .filter(Boolean) as ThemePreset[]
      : [];
    // Light-only platform: ignore any legacy dark mode preference.
    let activeThemeId = typeof parsed.activeThemeId === 'string' ? parsed.activeThemeId : DEFAULT_THEME_ID;
    if (activeThemeId === 'saath-dark-default' || String(activeThemeId).startsWith('night-')) {
      activeThemeId = DEFAULT_THEME_ID;
    }
    return {
      schemaVersion: THEME_SCHEMA_VERSION,
      activeThemeId,
      presets,
      motionEnabled: parsed.motionEnabled !== false,
      colorMode: 'light',
    };
  } catch {
    return blank();
  }
}

function write(state: AppearanceState): AppearanceState {
  const value: AppearanceState = {
    schemaVersion: THEME_SCHEMA_VERSION,
    activeThemeId: state.activeThemeId,
    presets: state.presets.slice(0, 24),
    motionEnabled: state.motionEnabled !== false,
    colorMode: 'light',
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
  return value;
}

export function loadAppearance(_accountId?: string | null): AppearanceState {
  return readRaw();
}

export function saveAppearance(state: AppearanceState, _accountId?: string | null): AppearanceState {
  return write({ ...state, colorMode: 'light' });
}

function builtInStarter(id: string | null | undefined): ThemePreset | null {
  const starter = findStarterPalette(id);
  if (!starter) return null;
  return {
    id: starter.id,
    name: starter.name,
    tokens: { ...starter.tokens },
    motif: starter.motif,
    updatedAt: new Date(0).toISOString(),
  };
}

export function resolveActiveTheme(state: AppearanceState): ThemePreset {
  if (!state.activeThemeId || state.activeThemeId === DEFAULT_THEME_ID) {
    return saathDefaultPreset();
  }
  const fromPresets = state.presets.find(item => item.id === state.activeThemeId);
  if (fromPresets) return fromPresets;
  const fromStarter = builtInStarter(state.activeThemeId);
  if (fromStarter) return fromStarter;
  return saathDefaultPreset();
}

export function wearTheme(
  state: AppearanceState,
  input: { id: string; name: string; tokens: ThemeTokens; motif: DoodleMotif },
): AppearanceState {
  if (input.id === DEFAULT_THEME_ID) {
    return { ...state, colorMode: 'light', activeThemeId: DEFAULT_THEME_ID };
  }
  const preset: ThemePreset = {
    id: input.id,
    name: input.name.trim().slice(0, 48) || 'My colours',
    tokens: { ...input.tokens },
    motif: input.motif,
    updatedAt: new Date().toISOString(),
  };
  const presets = [preset, ...state.presets.filter(item => item.id !== input.id)].slice(0, 24);
  return { ...state, colorMode: 'light', activeThemeId: input.id, presets };
}

export function applyAppearance(state: AppearanceState): ThemePreset {
  const active = resolveActiveTheme(state);
  applyThemeToDocument(active.tokens, active.motif, state.motionEnabled);
  return active;
}

export function previewTokens(
  tokens: ThemeTokens,
  motif: DoodleMotif,
  motionEnabled: boolean,
): void {
  applyThemeToDocument(tokens, motif, motionEnabled);
}

export function restoreAppliedAppearance(accountId?: string | null): ThemePreset {
  return applyAppearance(loadAppearance(accountId));
}

export function clearAppearanceCache(_accountId?: string | null): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  clearThemeFromDocument();
}

export function createPreset(
  state: AppearanceState,
  input: { name: string; tokens: ThemeTokens; motif: DoodleMotif },
): AppearanceState {
  const preset: ThemePreset = {
    id: `theme-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: input.name.trim().slice(0, 48) || 'Untitled colours',
    tokens: { ...input.tokens },
    motif: input.motif,
    updatedAt: new Date().toISOString(),
  };
  return {
    ...state,
    presets: [preset, ...state.presets].slice(0, 24),
  };
}

export function updatePreset(
  state: AppearanceState,
  id: string,
  input: { name: string; tokens: ThemeTokens; motif: DoodleMotif },
): AppearanceState {
  return {
    ...state,
    presets: state.presets.map(item =>
      item.id === id
        ? {
            ...item,
            name: input.name.trim().slice(0, 48) || item.name,
            tokens: { ...input.tokens },
            motif: input.motif,
            updatedAt: new Date().toISOString(),
          }
        : item,
    ),
  };
}

export function duplicatePreset(state: AppearanceState, id: string): AppearanceState {
  const source = state.presets.find(item => item.id === id);
  if (!source) return state;
  const copy: ThemePreset = {
    ...source,
    id: `theme-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: `${source.name} copy`.slice(0, 48),
    updatedAt: new Date().toISOString(),
  };
  return { ...state, presets: [copy, ...state.presets].slice(0, 24) };
}

export function deletePreset(state: AppearanceState, id: string): AppearanceState {
  const presets = state.presets.filter(item => item.id !== id);
  const activeThemeId = state.activeThemeId === id ? DEFAULT_THEME_ID : state.activeThemeId;
  return { ...state, presets, activeThemeId };
}

export function applyPreset(state: AppearanceState, id: string | null): AppearanceState {
  if (!id || id === DEFAULT_THEME_ID) {
    return { ...state, activeThemeId: DEFAULT_THEME_ID, colorMode: 'light' };
  }
  if (state.presets.some(item => item.id === id) || builtInStarter(id) || STARTER_PALETTES.some(item => item.id === id)) {
    return { ...state, activeThemeId: id, colorMode: 'light' };
  }
  return state;
}

export function resetAppearance(state: AppearanceState): AppearanceState {
  return {
    ...state,
    activeThemeId: DEFAULT_THEME_ID,
    colorMode: 'light',
  };
}

export { SAATH_DEFAULT_TOKENS, DEFAULT_THEME_ID, STARTER_PALETTES };
