'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Copy, Palette, RotateCcw, Save, Trash2, X } from 'lucide-react';
import { SaathCharacter } from '@/components/SaathCharacter';
import {
  APPEARANCE_STORAGE_LABEL,
  applyPreset,
  createPreset,
  deletePreset,
  duplicatePreset,
  loadAppearance,
  previewTokens,
  resetAppearance,
  resolveActiveTheme,
  restoreAppliedAppearance,
  saveAppearance,
  updatePreset,
  wearTheme,
} from '@/lib/client/appearance';
import type { AppearanceState, DoodleMotif, ThemeTokens } from '@/lib/domain';
import {
  DEFAULT_THEME_ID,
  MIXED_EXAMPLE_TOKENS,
  SAATH_DEFAULT_TOKENS,
  SOOTHING_SWATCHES,
  STARTER_PALETTES,
  essentialContrastFails,
  validateThemeTokens,
} from '@/lib/theme';
import { isCheckInDisabled, setCheckInDisabled } from '@/lib/client/store';

type Props = {
  accountId?: string | null;
  onNotice: (message: string) => void;
};

const tokenFields: { key: keyof ThemeTokens; label: string; hint: string }[] = [
  { key: 'pageBg', label: 'Page wash', hint: 'The soft colour behind everything' },
  { key: 'cardSurface', label: 'Cards', hint: 'Surfaces for writing and resting' },
  { key: 'accent', label: 'Accent', hint: 'Buttons and quiet highlights' },
  { key: 'onAccent', label: 'On accent', hint: 'Text sitting on the accent' },
  { key: 'text', label: 'Main text', hint: 'Headlines and body' },
  { key: 'muted', label: 'Soft text', hint: 'Hints and quieter lines' },
  { key: 'border', label: 'Edges', hint: 'Gentle boundaries' },
];

const motifs: { id: DoodleMotif; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'leaf', label: 'Leaf' },
  { id: 'river', label: 'River' },
  { id: 'hill', label: 'Hill' },
  { id: 'moon', label: 'Moon' },
];

function tokensMatch(a: ThemeTokens, b: ThemeTokens): boolean {
  return (Object.keys(a) as (keyof ThemeTokens)[]).every(key => a[key].toLowerCase() === b[key].toLowerCase());
}

export default function AppearanceEditor({ accountId, onNotice }: Props) {
  const [state, setState] = useState<AppearanceState>(() => loadAppearance(accountId));
  const initial = loadAppearance(accountId);
  const initialActive = resolveActiveTheme(initial);
  const [draftName, setDraftName] = useState(initialActive.name);
  const [tokens, setTokens] = useState<ThemeTokens>(() => ({ ...initialActive.tokens }));
  const [motif, setMotif] = useState<DoodleMotif>(initialActive.motif);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [acceptedFixes, setAcceptedFixes] = useState<string[]>([]);
  const [checkInOff, setCheckInOff] = useState(() => isCheckInDisabled());
  const [activePart, setActivePart] = useState<keyof ThemeTokens>('pageBg');
  const [showFineTune, setShowFineTune] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(
    () => initial.activeThemeId || DEFAULT_THEME_ID,
  );

  const issues = useMemo(() => validateThemeTokens(tokens), [tokens]);
  const essentialFails = useMemo(() => essentialContrastFails(tokens), [tokens]);
  const softIssues = issues.filter(item => !essentialFails.some(fail => fail.pair === item.pair));
  const blockingSoft = softIssues.filter(item => !acceptedFixes.includes(item.pair));
  const canApply = essentialFails.length === 0 && blockingSoft.length === 0;
  const activeField = tokenFields.find(item => item.key === activePart) || tokenFields[0];
  const swatches = SOOTHING_SWATCHES[activePart];

  function livePreview(nextTokens = tokens, nextMotif = motif) {
    previewTokens(nextTokens, nextMotif, state.motionEnabled);
  }

  function persistApplied(next: AppearanceState, notice?: string) {
    const saved = saveAppearance(next, accountId);
    setState(saved);
    restoreAppliedAppearance(accountId);
    if (notice) onNotice(notice);
  }

  function previewPalette(nextTokens: ThemeTokens, nextMotif: DoodleMotif, name: string, paletteId: string) {
    setTokens(nextTokens);
    setMotif(nextMotif);
    setDraftName(name);
    setEditingId(null);
    setAcceptedFixes([]);
    setSelectedPaletteId(paletteId);
    livePreview(nextTokens, nextMotif);
    onNotice(`${name} preview — Apply to keep it across Saath, or Cancel to restore.`);
  }

  function setToken(key: keyof ThemeTokens, value: string) {
    const nextTokens = { ...tokens, [key]: value };
    setTokens(nextTokens);
    setAcceptedFixes([]);
    setSelectedPaletteId(null);
    livePreview(nextTokens, motif);
  }

  function loadStarter(id: string) {
    const starter = STARTER_PALETTES.find(item => item.id === id);
    if (!starter) return;
    previewPalette({ ...starter.tokens }, starter.motif, starter.name, starter.id);
  }

  function loadDefault() {
    previewPalette({ ...SAATH_DEFAULT_TOKENS }, 'none', 'Saath default', DEFAULT_THEME_ID);
  }

  function loadMixedExample() {
    previewPalette({ ...MIXED_EXAMPLE_TOKENS }, 'leaf', 'Mixed soft sky + sage', 'mixed');
  }

  function cancel() {
    const applied = restoreAppliedAppearance(accountId);
    const current = loadAppearance(accountId);
    setState(current);
    setTokens({ ...applied.tokens });
    setMotif(applied.motif);
    setEditingId(null);
    setAcceptedFixes([]);
    setSelectedPaletteId(
      STARTER_PALETTES.find(item => tokensMatch(item.tokens, applied.tokens))?.id
      || (tokensMatch(SAATH_DEFAULT_TOKENS, applied.tokens) ? DEFAULT_THEME_ID : current.activeThemeId),
    );
    onNotice('Preview cancelled. Your applied colours are back.');
  }

  function saveDraft() {
    if (essentialFails.length) {
      onNotice('Fix essential contrast issues before saving a preset.');
      return;
    }
    if (blockingSoft.length) {
      onNotice('Fix or accept readability suggestions before saving.');
      return;
    }
    const next = editingId
      ? updatePreset(state, editingId, { name: draftName, tokens, motif })
      : createPreset(state, { name: draftName, tokens, motif });
    const saved = saveAppearance(next, accountId);
    setState(saved);
    if (!editingId && saved.presets[0]) setEditingId(saved.presets[0].id);
    onNotice(editingId ? 'Preset updated (not applied yet).' : 'Preset saved. Use Apply to wear it across Saath.');
  }

  function applyCurrentDraft() {
    if (essentialFails.length) {
      onNotice('Apply is blocked — essential text or controls fail contrast. Fix colours first.');
      return;
    }
    if (blockingSoft.length) {
      onNotice('Apply is blocked until readability issues are fixed or accepted.');
      return;
    }

    if (selectedPaletteId === DEFAULT_THEME_ID || tokensMatch(tokens, SAATH_DEFAULT_TOKENS)) {
      persistApplied(resetAppearance(state), 'Saath default colours applied across the app.');
      setSelectedPaletteId(DEFAULT_THEME_ID);
      return;
    }

    const starter = STARTER_PALETTES.find(item => item.id === selectedPaletteId);
    if (starter && tokensMatch(tokens, starter.tokens)) {
      const next = wearTheme(state, {
        id: starter.id,
        name: starter.name,
        tokens: starter.tokens,
        motif: starter.motif,
      });
      persistApplied(next, `${starter.name} is on across Saath.`);
      return;
    }

    if (editingId) {
      const next = applyPreset(updatePreset(state, editingId, { name: draftName, tokens, motif }), editingId);
      persistApplied(saveAppearance(next, accountId), 'Colours applied across Saath.');
      return;
    }

    const created = createPreset(state, { name: draftName || 'My colours', tokens, motif });
    const withApply = applyPreset(created, created.presets[0].id);
    setEditingId(created.presets[0].id);
    persistApplied(saveAppearance(withApply, accountId), 'Saved and applied. This is your colour home for now.');
  }

  function applyId(id: string | null) {
    if (id && id !== DEFAULT_THEME_ID) {
      const preset = state.presets.find(item => item.id === id) || STARTER_PALETTES.find(item => item.id === id);
      const checkTokens = preset && 'tokens' in preset ? preset.tokens : null;
      if (checkTokens) {
        const fails = essentialContrastFails(checkTokens);
        if (fails.length) {
          onNotice('That preset fails essential contrast. Edit it before applying.');
          return;
        }
      }
    }
    const next = applyPreset(state, id);
    persistApplied(
      next,
      !id || id === DEFAULT_THEME_ID ? 'Saath default colours applied.' : 'These colours are on — only for your view.',
    );
    const active = resolveActiveTheme(next);
    setTokens({ ...active.tokens });
    setMotif(active.motif);
    setSelectedPaletteId(next.activeThemeId);
  }

  const paletteOptions = [
    {
      id: DEFAULT_THEME_ID,
      name: 'Saath default',
      feeling: 'Sage and ivory',
      tokens: SAATH_DEFAULT_TOKENS,
      onPick: loadDefault,
    },
    ...STARTER_PALETTES.map(item => ({
      id: item.id,
      name: item.name,
      feeling: item.feeling,
      tokens: item.tokens,
      onPick: () => loadStarter(item.id),
    })),
    {
      id: 'mixed',
      name: 'Mix & match',
      feeling: 'Sky, peach, sage',
      tokens: MIXED_EXAMPLE_TOKENS,
      onPick: loadMixedExample,
    },
  ];

  return (
    <section className="space-card appearance-card">
      <header className="appearance-head">
        <div className="appearance-head-copy">
          <span className="space-card-icon appearance-head-icon"><Palette size={18} strokeWidth={1.6} /></span>
          <div>
            <h2>Your colours</h2>
            <p>Choose a palette, preview it, then Apply.</p>
          </div>
        </div>
        <p className="appearance-storage-note">{APPEARANCE_STORAGE_LABEL}</p>
      </header>

      <div className="appearance-stage" style={{ background: tokens.pageBg, borderColor: tokens.border, color: tokens.text }}>
        <article className="appearance-stage-card" style={{ background: tokens.cardSurface, borderColor: tokens.border }}>
          <div className="appearance-preview-art">
            <SaathCharacter name="mira" size={88} alt="" />
          </div>
          <div className="appearance-stage-meta">
            <strong style={{ color: tokens.text }}>Sample card</strong>
            <span style={{ color: tokens.muted }}>How text and buttons will feel</span>
            <div className="appearance-preview-controls">
              <button type="button" style={{ background: tokens.accent, color: tokens.onAccent }}>Primary</button>
              <button type="button" className="outline-button" style={{ borderColor: tokens.border, color: tokens.text }}>Secondary</button>
            </div>
          </div>
        </article>
        <div className="appearance-token-row" aria-label="Current colours">
          {(Object.keys(tokens) as (keyof ThemeTokens)[]).map(key => (
            <button
              key={key}
              type="button"
              className={activePart === key ? 'selected' : ''}
              style={{ background: tokens[key] }}
              title={tokenFields.find(item => item.key === key)?.label}
              onClick={() => {
                setActivePart(key);
                setShowAdvanced(true);
              }}
            />
          ))}
        </div>
      </div>

      <div className="appearance-section">
        <div className="appearance-section-head">
          <h3>Palettes</h3>
          <p>Tap to preview. Nothing sticks until you Apply.</p>
        </div>
        <div className="appearance-palette-grid" role="listbox" aria-label="Colour palettes">
          {paletteOptions.map(item => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={selectedPaletteId === item.id}
              className={'appearance-palette-card' + (selectedPaletteId === item.id ? ' selected' : '')}
              onClick={item.onPick}
              style={{ background: item.tokens.pageBg, color: item.tokens.text }}
            >
              <div className="appearance-palette-swatch-row" aria-hidden="true">
                <i style={{ background: item.tokens.pageBg }} />
                <i style={{ background: item.tokens.cardSurface }} />
                <i style={{ background: item.tokens.accent }} />
                <i style={{ background: item.tokens.text }} />
              </div>
              <strong>{item.name}</strong>
              <span style={{ color: item.tokens.muted }}>{item.feeling}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="appearance-actions">
        <button type="button" className="button" disabled={!canApply} onClick={applyCurrentDraft}>
          <Check size={15} /> Apply
        </button>
        <button type="button" className="outline-button" onClick={saveDraft}><Save size={15} /> Save</button>
        <button type="button" className="outline-button" onClick={cancel}><X size={15} /> Cancel</button>
        <button
          type="button"
          className="outline-button"
          onClick={() => {
            const next = resetAppearance(state);
            persistApplied(next, 'Reset to Saath default. Saved presets were kept.');
            setTokens({ ...SAATH_DEFAULT_TOKENS });
            setMotif('none');
            setSelectedPaletteId(DEFAULT_THEME_ID);
          }}
        >
          <RotateCcw size={15} /> Reset
        </button>
      </div>

      {issues.length > 0 && (
        <div className="appearance-issues" role="alert">
          <h3>Readability</h3>
          <ul>
            {issues.map(item => {
              const isEssential = essentialFails.some(fail => fail.pair === item.pair);
              return (
                <li key={item.pair}>
                  <strong>{item.pair}{isEssential ? ' · required' : ''}</strong>
                  <span> {item.ratio}:1 (need {item.required}:1)</span>
                  <p>{item.suggestion}</p>
                  {!isEssential && !acceptedFixes.includes(item.pair) && (
                    <button type="button" className="outline-button" onClick={() => setAcceptedFixes(current => [...current, item.pair])}>
                      Keep anyway
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        type="button"
        className="appearance-fine-toggle"
        aria-expanded={showAdvanced}
        onClick={() => setShowAdvanced(value => !value)}
      >
        Customise further <ChevronDown size={16} className={showAdvanced ? 'open' : ''} />
      </button>

      {showAdvanced && (
        <div className="appearance-advanced">
          <div className="appearance-mix-panel">
            <div className="appearance-section-head">
              <h3>Mix one colour</h3>
              <p>{activeField.hint}</p>
            </div>
            <div className="appearance-part-tabs" role="tablist" aria-label="Colour parts">
              {tokenFields.map(field => (
                <button
                  key={field.key}
                  type="button"
                  role="tab"
                  aria-selected={activePart === field.key}
                  className={activePart === field.key ? 'selected' : ''}
                  onClick={() => setActivePart(field.key)}
                >
                  <i style={{ background: tokens[field.key] }} aria-hidden="true" />
                  {field.label}
                </button>
              ))}
            </div>
            <div className="appearance-swatch-board" role="listbox" aria-label={`${activeField.label} colours`}>
              {swatches.map(swatch => {
                const selected = tokens[activePart].toLowerCase() === swatch.hex.toLowerCase();
                return (
                  <button
                    key={swatch.hex + swatch.label}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={'appearance-swatch' + (selected ? ' selected' : '')}
                    onClick={() => setToken(activePart, swatch.hex)}
                    title={swatch.label}
                  >
                    <span className="appearance-swatch-chip" style={{ background: swatch.hex }} />
                    <strong>{swatch.label}</strong>
                    {selected && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="appearance-motifs" role="radiogroup" aria-label="Doodle motif">
            <div className="appearance-section-head">
              <h3>Motif</h3>
              <p>Optional soft mark in the corner.</p>
            </div>
            <div>
              {motifs.map(item => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={motif === item.id}
                  className={motif === item.id ? 'selected' : ''}
                  onClick={() => {
                    setMotif(item.id);
                    livePreview(tokens, item.id);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label className="checkbox-label appearance-motion">
            <input
              type="checkbox"
              checked={state.motionEnabled}
              onChange={event => {
                const next = { ...state, motionEnabled: event.target.checked };
                setState(next);
                saveAppearance(next, accountId);
                livePreview(tokens, motif);
              }}
            />
            Gentle character motion
          </label>

          <button
            type="button"
            className="appearance-fine-toggle"
            aria-expanded={showFineTune}
            onClick={() => setShowFineTune(value => !value)}
          >
            Hex values <ChevronDown size={16} className={showFineTune ? 'open' : ''} />
          </button>
          {showFineTune && (
            <div className="appearance-fine-tune">
              <label>
                Preset name
                <input value={draftName} onChange={event => setDraftName(event.target.value)} maxLength={48} />
              </label>
              {tokenFields.map(field => (
                <label key={field.key} className="appearance-color-field">
                  {field.label}
                  <span>
                    <input
                      type="color"
                      value={tokens[field.key]}
                      onChange={event => setToken(field.key, event.target.value)}
                      aria-label={`${field.label} picker`}
                    />
                    <input
                      type="text"
                      value={tokens[field.key]}
                      onChange={event => setToken(field.key, event.target.value)}
                      spellCheck={false}
                      aria-label={`${field.label} hex`}
                    />
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="appearance-presets">
            <div className="appearance-section-head">
              <h3>Saved presets</h3>
              <p>Named themes kept in this browser.</p>
            </div>
            <button
              type="button"
              className={state.activeThemeId === DEFAULT_THEME_ID || !state.activeThemeId ? 'selected' : ''}
              onClick={() => applyId(DEFAULT_THEME_ID)}
            >
              Saath default
              {(state.activeThemeId === DEFAULT_THEME_ID || !state.activeThemeId) ? ' · applied' : ''}
            </button>
            {state.presets.map(preset => (
              <article key={preset.id} className={state.activeThemeId === preset.id ? 'selected' : ''}>
                <header>
                  <strong>{preset.name}</strong>
                  <span>{state.activeThemeId === preset.id ? 'Applied' : 'Saved'}</span>
                </header>
                <div className="appearance-swatches" aria-hidden="true">
                  {Object.values(preset.tokens).map((color, index) => (
                    <i key={index} style={{ background: color }} />
                  ))}
                </div>
                <div className="appearance-preset-actions">
                  <button type="button" className="quiet" onClick={() => {
                    setEditingId(preset.id);
                    setDraftName(preset.name);
                    setTokens({ ...preset.tokens });
                    setMotif(preset.motif);
                    setSelectedPaletteId(null);
                    livePreview(preset.tokens, preset.motif);
                  }}>Edit</button>
                  <button type="button" className="quiet" onClick={() => applyId(preset.id)}>Apply</button>
                  <button type="button" className="quiet" onClick={() => {
                    const next = duplicatePreset(state, preset.id);
                    const saved = saveAppearance(next, accountId);
                    setState(saved);
                    onNotice('Preset duplicated.');
                  }}><Copy size={14} /></button>
                  <button
                    type="button"
                    className="quiet"
                    onClick={() => {
                      const next = deletePreset(state, preset.id);
                      const saved = saveAppearance(next, accountId);
                      setState(saved);
                      if (state.activeThemeId === preset.id) {
                        restoreAppliedAppearance(accountId);
                        setTokens({ ...SAATH_DEFAULT_TOKENS });
                        setMotif('none');
                        setSelectedPaletteId(DEFAULT_THEME_ID);
                        onNotice('Preset deleted. Returned to Saath default.');
                      } else {
                        onNotice('Preset deleted.');
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            ))}
            {!state.presets.length && <p className="small-print">No saved presets yet.</p>}
          </div>

          <div className="appearance-checkin-toggle">
            <div className="appearance-section-head">
              <h3>Patta check-in</h3>
              <p>Separate from colours.</p>
            </div>
            <button
              type="button"
              className="outline-button"
              onClick={() => {
                const next = !checkInOff;
                setCheckInDisabled(next);
                setCheckInOff(next);
                onNotice(next ? 'Patta check-in turned off on this device.' : 'Patta check-in turned back on.');
              }}
            >
              {checkInOff ? 'Turn check-in back on' : 'Check-in is on'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
