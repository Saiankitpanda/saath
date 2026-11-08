'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { SaathCharacter, type SaathCharacterName } from '@/components/SaathCharacter';
import {
  getActiveDailyCheckIn,
  isCheckInDisabled,
  isCheckInNudgeDue,
  saveDailyCheckIn,
  setCheckInDisabled,
  snoozeCheckInNudge,
} from '@/lib/client/store';
import { labelMood, type DailyCheckIn, type MoodKind } from '@/lib/domain';

type Props = {
  enabled?: boolean;
  motionEnabled?: boolean;
  onSaved?: (entry: DailyCheckIn) => void;
  onNotice?: (message: string) => void;
};

const moods: { id: MoodKind; mark: string; label: string }[] = [
  { id: 'steady', mark: '○', label: 'Steady' },
  { id: 'heavy', mark: '●', label: 'Heavy' },
  { id: 'restless', mark: '◌', label: 'Restless' },
  { id: 'tender', mark: '◦', label: 'Tender' },
  { id: 'unsure', mark: '·', label: 'Unsure' },
];

const prompts = [
  'What is one true thing about how you arrived?',
  'What would feel kinder for the next hour?',
  'Is there something you want company with today?',
];

type Step = 'hello' | 'mood' | 'ask' | 'done' | 'bye';

export default function CheckInNudge({ enabled = true, motionEnabled = true, onSaved, onNotice }: Props) {
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [step, setStep] = useState<Step>('hello');
  const [mood, setMood] = useState<MoodKind | null>(null);
  const [answer, setAnswer] = useState('');
  const [prompt] = useState(() => prompts[Math.floor(Math.random() * prompts.length)]);

  useEffect(() => {
    if (!enabled || isCheckInDisabled() || !isCheckInNudgeDue()) return undefined;
    const show = window.setTimeout(() => {
      setVisible(true);
      window.requestAnimationFrame(() => setEntered(true));
    }, 1600);
    return () => window.clearTimeout(show);
  }, [enabled]);

  const pose: SaathCharacterName =
    step === 'hello' ? 'patta-greeting'
      : step === 'mood' || step === 'ask' ? 'patta-listening'
        : step === 'done' ? 'patta-thanks'
          : 'patta-goodbye';

  function hideSoon() {
    setEntered(false);
    window.setTimeout(() => setVisible(false), 320);
  }

  function dismiss(hours = 4) {
    setStep('bye');
    snoozeCheckInNudge(hours);
    window.setTimeout(hideSoon, 700);
  }

  function turnOff() {
    setCheckInDisabled(true);
    setStep('bye');
    onNotice?.('Check-in turned off on this device. You can re-enable it later from your profile.');
    window.setTimeout(hideSoon, 700);
  }

  function finish(skipWords = false) {
    if (!mood) return;
    if (getActiveDailyCheckIn()) {
      dismiss(24);
      return;
    }
    const entry = saveDailyCheckIn({
      mood,
      dayStory: skipWords || !answer.trim() ? `Feeling ${labelMood(mood).toLowerCase()} today.` : answer.trim(),
      doodleId: 'leaf',
    });
    onSaved?.(entry);
    onNotice?.('Thanks — private check-in held for 24 hours (this browser).');
    setStep('done');
    window.setTimeout(() => {
      snoozeCheckInNudge(24);
      hideSoon();
    }, 1400);
  }

  if (!visible) return null;

  return (
    <div className={'checkin-nudge' + (entered ? ' in' : '')} role="dialog" aria-label="Gentle check-in from Patta">
      <button type="button" className="checkin-nudge-close" aria-label="Not now" onClick={() => dismiss(4)}>
        <X size={16} />
      </button>

      <div className="checkin-nudge-character" aria-hidden="true">
        <SaathCharacter name={pose} size={108} animate={motionEnabled && step !== 'bye'} className="checkin-patta" />
      </div>

      <div className="checkin-nudge-bubble">
        {step === 'hello' && (
          <>
            <p className="checkin-nudge-kicker">Patta</p>
            <h2>May I check in with you?</h2>
            <p>Optional and private. Mood, then one soft question. Saved in this browser for 24 hours.</p>
            <div className="checkin-nudge-actions">
              <button type="button" className="button" onClick={() => setStep('mood')}>Yes, gently</button>
              <button type="button" className="quiet" onClick={() => dismiss(8)}>Not now</button>
              <button type="button" className="quiet" onClick={turnOff}>Turn off</button>
            </div>
          </>
        )}

        {step === 'mood' && (
          <>
            <p className="checkin-nudge-kicker">Step 1</p>
            <h2>How are you feeling right now?</h2>
            <div className="checkin-nudge-moods" role="radiogroup" aria-label="Mood">
              {moods.map(item => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={mood === item.id}
                  className={mood === item.id ? 'selected' : ''}
                  onClick={() => setMood(item.id)}
                >
                  <span aria-hidden="true">{item.mark}</span>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="checkin-nudge-actions">
              <button type="button" className="button" disabled={!mood} onClick={() => setStep('ask')}>Continue</button>
              <button type="button" className="quiet" onClick={() => dismiss(4)}>Dismiss</button>
            </div>
          </>
        )}

        {step === 'ask' && (
          <>
            <p className="checkin-nudge-kicker">Step 2 · optional</p>
            <h2>{prompt}</h2>
            <textarea
              value={answer}
              onChange={event => setAnswer(event.target.value)}
              maxLength={400}
              rows={3}
              placeholder="A sentence is enough…"
            />
            <div className="checkin-nudge-actions">
              <button type="button" className="button" onClick={() => finish(false)}>Save for today</button>
              <button type="button" className="quiet" onClick={() => finish(true)}>Skip words</button>
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <p className="checkin-nudge-kicker">Held for 24 hours</p>
            <h2>Thank you for pausing.</h2>
            <p>Patta will stay quiet until tomorrow.</p>
          </>
        )}

        {step === 'bye' && (
          <>
            <p className="checkin-nudge-kicker">Until later</p>
            <h2>Rest easy.</h2>
          </>
        )}
      </div>
    </div>
  );
}
