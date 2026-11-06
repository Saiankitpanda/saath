'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowRight, Leaf, MessageCircle, Pause, Phone, Users, X } from 'lucide-react';
import { momentPhrases, samplePeople, urgentResources } from '@/lib/fixtures';
import { useAmbient } from '@/components/AmbientSound';
import BreathingExercise from '@/components/BreathingExercise';
import type { Person, View } from '@/lib/domain';

type Props = {
  go: (view: View) => void;
  enrolled: boolean;
  onPhrasePreview: (phrase: string, person: Person | null) => void;
};

type Step = 'ground' | 'steady' | 'connect' | 'breathe' | 'words';

type Size = { width: number; height: number };

const SIZE_KEY = 'saath-moment-size-v1';
const MIN_W = 340;
const MIN_H = 420;
const DEFAULT_SIZE: Size = { width: 420, height: 560 };

function readSize(): Size {
  if (typeof window === 'undefined') return DEFAULT_SIZE;
  try {
    const raw = window.localStorage.getItem(SIZE_KEY);
    if (!raw) return DEFAULT_SIZE;
    const parsed = JSON.parse(raw) as Size;
    return {
      width: Math.min(Math.max(Number(parsed.width) || DEFAULT_SIZE.width, MIN_W), window.innerWidth - 24),
      height: Math.min(Math.max(Number(parsed.height) || DEFAULT_SIZE.height, MIN_H), window.innerHeight - 24),
    };
  } catch {
    return DEFAULT_SIZE;
  }
}

export default function NeedAMoment({ go, enrolled, onPhrasePreview }: Props) {
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [step, setStep] = useState<Step>('ground');
  const [safeNow, setSafeNow] = useState<'yes' | 'unsure' | 'no' | null>(null);
  const [grounded, setGrounded] = useState<'yes' | 'trying' | 'no' | null>(null);
  const [size, setSize] = useState<Size>(DEFAULT_SIZE);
  const first = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const ambient = useAmbient();

  useEffect(() => {
    setSize(readSize());
  }, []);

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function closePanel() {
    setOpen(false);
    setHelp(false);
    setPhrase('');
    setStep('ground');
    setSafeNow(null);
    setGrounded(null);
  }

  function openPanel() {
    setOpen(true);
    setHelp(false);
    setPhrase('');
    setStep('ground');
    setSafeNow(null);
    setGrounded(null);
    setSize(readSize());
  }

  function leaveTo(view: View) {
    closePanel();
    go(view);
  }

  function onResizePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    const panel = panelRef.current;
    if (!panel) return;
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startW: panel.offsetWidth,
      startH: panel.offsetHeight,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onResizePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const next = {
      width: Math.min(Math.max(drag.startW + (event.clientX - drag.startX), MIN_W), window.innerWidth - 24),
      height: Math.min(Math.max(drag.startH + (event.clientY - drag.startY), MIN_H), window.innerHeight - 24),
    };
    setSize(next);
    try {
      window.localStorage.setItem(SIZE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function onResizePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragRef.current) return;
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <button type="button" className="moment-entry" onClick={openPanel}>
        Need a moment?
      </button>
      {open && (
        <div className="moment-backdrop" onClick={closePanel} aria-hidden="true" />
      )}
      {open && (
        <div
          ref={panelRef}
          className="moment-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="moment-title"
          style={{ width: size.width, height: size.height }}
        >
          <header className="moment-panel-head">
            <div>
              <span className="eyebrow">IF YOU FEEL PANIC</span>
              <h2 id="moment-title">You are not alone in this second.</h2>
            </div>
            <button type="button" className="moment-close" onClick={closePanel} aria-label="Close">
              <X size={18} />
            </button>
          </header>

          <div className="moment-panel-body">
            {step === 'ground' && (
              <section className="moment-block">
                <p className="moment-lead">Answer what you can. Skip anything that feels like too much.</p>

                <fieldset className="moment-question">
                  <legend>Are you somewhere safe right now?</legend>
                  <div className="moment-answer-row">
                    {([
                      ['yes', 'Yes'],
                      ['unsure', 'Not sure'],
                      ['no', 'No'],
                    ] as const).map(([id, label]) => (
                      <button
                        key={id}
                        ref={id === 'yes' ? first : undefined}
                        type="button"
                        className={safeNow === id ? 'selected' : ''}
                        onClick={() => setSafeNow(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {safeNow === 'no' && (
                  <div className="moment-urgent-inline" role="status">
                    <p>If you are in immediate danger, use local emergency services. Saath cannot dispatch help.</p>
                    <button type="button" className="outline-button" onClick={() => setHelp(true)}>Show urgent resources</button>
                  </div>
                )}

                <fieldset className="moment-question">
                  <legend>Can you feel something solid — floor, chair, or your hands?</legend>
                  <div className="moment-answer-row">
                    {([
                      ['yes', 'Yes'],
                      ['trying', 'I can try'],
                      ['no', 'Not yet'],
                    ] as const).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        className={grounded === id ? 'selected' : ''}
                        onClick={() => setGrounded(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {(grounded === 'trying' || grounded === 'no') && (
                    <p className="moment-hint">Name one colour you can see, or press your feet gently into the floor for three breaths.</p>
                  )}
                </fieldset>

                <div className="moment-choices">
                  <button type="button" className="button" disabled={!safeNow} onClick={() => setStep('steady')}>
                    Next <ArrowRight size={16} />
                  </button>
                  <button type="button" className="outline-button" onClick={() => setStep('connect')}>
                    I want to talk to someone
                  </button>
                </div>
              </section>
            )}

            {step === 'steady' && (
              <section className="moment-block">
                <p className="moment-lead">What would help your body settle a little?</p>
                <div className="moment-choices">
                  <button type="button" onClick={() => setStep('breathe')}>Guide me through slow breaths</button>
                  <button
                    type="button"
                    onClick={() => {
                      if (ambient.playing) ambient.pause();
                      else void ambient.play('rain');
                    }}
                  >
                    {ambient.playing ? <><Pause size={16} /> Pause sound</> : 'Play a quiet sound'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      ambient.pause();
                    }}
                  >
                    Stay here in silence
                  </button>
                  <button type="button" className="button" onClick={() => setStep('connect')}>
                    Connect with a person <ArrowRight size={16} />
                  </button>
                  <button type="button" className="outline-button" onClick={() => setStep('words')}>
                    Help me find words first
                  </button>
                </div>
                <button type="button" className="quiet" onClick={() => setStep('ground')}>Back</button>
              </section>
            )}

            {step === 'breathe' && (
              <section className="moment-block">
                <BreathingExercise
                  onClose={() => setStep('steady')}
                  onReady={() => setStep('connect')}
                />
                <button type="button" className="outline-button" onClick={() => setStep('connect')}>
                  Ready to connect with someone
                </button>
              </section>
            )}

            {step === 'connect' && (
              <section className="moment-block">
                <p className="moment-lead">Choose how you want company. You can leave this panel anytime.</p>
                <div className="moment-connect-grid">
                  <button type="button" onClick={() => leaveTo('strangers')}>
                    <Phone size={18} strokeWidth={1.5} />
                    <strong>Talk to a stranger</strong>
                    <span>Nearby people, same situation — voice or chat.</span>
                  </button>
                  <button type="button" onClick={() => leaveTo('connect')}>
                    <MessageCircle size={18} strokeWidth={1.5} />
                    <strong>Listen with AI</strong>
                    <span>A companion while a live person is not free yet.</span>
                  </button>
                  <button type="button" onClick={() => leaveTo('circles')}>
                    <Users size={18} strokeWidth={1.5} />
                    <strong>Peer Circles</strong>
                    <span>People who know a similar feeling.</span>
                  </button>
                  <button type="button" onClick={() => leaveTo(enrolled ? 'arrive' : 'enroll')}>
                    <Leaf size={18} strokeWidth={1.5} />
                    <strong>Back to Your visit</strong>
                    <span>Return gently when you are ready.</span>
                  </button>
                </div>
                <button type="button" className="quiet" onClick={() => setStep('steady')}>Back</button>
              </section>
            )}

            {step === 'words' && (
              <section className="moment-block">
                <p className="moment-lead">Pick or edit a short line. Nothing sends until you preview.</p>
                <div className="moment-phrases">
                  {momentPhrases.map(item => (
                    <button
                      type="button"
                      key={item}
                      className={phrase === item ? 'selected' : ''}
                      onClick={() => setPhrase(item)}
                    >
                      {item}
                    </button>
                  ))}
                  <label htmlFor="moment-phrase">Exact message</label>
                  <textarea
                    id="moment-phrase"
                    value={phrase}
                    onChange={event => setPhrase(event.target.value)}
                    maxLength={400}
                    placeholder="I’m overwhelmed and need someone to sit with me…"
                  />
                  <div className="moment-choices">
                    <button
                      type="button"
                      className="button"
                      disabled={!phrase.trim()}
                      onClick={() => {
                        const person = samplePeople.find(item => !item.actuallyAvailable) ?? null;
                        onPhrasePreview(phrase.trim(), person);
                        closePanel();
                      }}
                    >
                      Preview before sending <ArrowRight size={16} />
                    </button>
                    <button type="button" className="outline-button" onClick={() => setStep('connect')}>
                      Skip to connect
                    </button>
                  </div>
                </div>
                <button type="button" className="quiet" onClick={() => setStep('steady')}>Back</button>
              </section>
            )}

            <button type="button" className="quiet moment-urgent-toggle" onClick={() => setHelp(value => !value)}>
              {help ? 'Hide urgent help' : 'Urgent help'}
            </button>
            {help && (
              <div className="urgent-help">
                <h3>If you need urgent help</h3>
                <p>Saath does not dispatch emergency services and does not infer crisis from typing or sound. Use local emergency services if you are in immediate danger.</p>
                {urgentResources.map(resource => (
                  <p key={resource.url}>
                    <a href={resource.url} target="_blank" rel="noreferrer">{resource.name}</a>
                    <span> · {resource.region} · reviewed {resource.reviewedOn}</span>
                  </p>
                ))}
                <p className="small-print">Unreviewed phone numbers are never invented here.</p>
              </div>
            )}
          </div>

          <button
            type="button"
            className="moment-resize"
            aria-label="Resize panel"
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            onPointerCancel={onResizePointerUp}
          />
        </div>
      )}
    </>
  );
}
