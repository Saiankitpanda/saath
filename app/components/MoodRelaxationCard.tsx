'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Volume2, Pause, Wind, Heart, RefreshCw, Check, ArrowRight, X } from 'lucide-react';
import { useAmbient } from '@/components/AmbientSound';
import BreathingExercise from '@/components/BreathingExercise';
import type { MoodKind } from '@/lib/domain';
import AnimatedMoodFace from '@/components/AnimatedMoodFace';

type Props = {
  mood: MoodKind;
  userName?: string;
  initialNote?: string;
  onMoodChange: (newMood: MoodKind) => void;
  onSaveReflection?: (note: string, mood: MoodKind) => void;
  onNavigate?: (view: string) => void;
  onDismiss?: () => void;
  asModal?: boolean;
};

const MOOD_DATA: Record<
  MoodKind,
  {
    icon: string;
    label: string;
    headline: string;
    calmQuestion: string;
    reassurance: string;
    suggestedAction: string;
    companionPrompt: string;
    soundPreference: 'rain' | 'brown' | 'stereo';
  }
> = {
  heavy: {
    icon: '🌧️',
    label: 'Heavy',
    headline: 'Room to set the weight down.',
    calmQuestion: 'What is one burden you can gently put aside for just the next ten minutes?',
    reassurance: 'You have been carrying a lot. You do not have to solve anything in this moment.',
    suggestedAction: 'Listen to soft rain and let your shoulders drop.',
    companionPrompt: 'Talk with someone who will simply listen without giving unsolicited advice.',
    soundPreference: 'rain',
  },
  restless: {
    icon: '⚡',
    label: 'Restless',
    headline: 'A pause for racing thoughts.',
    calmQuestion: 'Notice three physical things around you right now that are completely still.',
    reassurance: 'When your thoughts speed up, your breath can anchor you back to the ground.',
    suggestedAction: 'Take 4 slow breaths with the breathing circle below.',
    companionPrompt: 'Step into Two Chairs to practise untangling a difficult conversation.',
    soundPreference: 'brown',
  },
  tender: {
    icon: '🌸',
    label: 'Tender',
    headline: 'Soft company. No expectations.',
    calmQuestion: 'What is one kind, gentle reminder you wish someone would say to you today?',
    reassurance: 'Feeling vulnerable is not a flaw. You are safe here, exactly as you are.',
    suggestedAction: 'Write down a quiet reflection just for yourself.',
    companionPrompt: 'Connect with a gentle companion who holds space with warmth.',
    soundPreference: 'stereo',
  },
  unsure: {
    icon: '🌫️',
    label: 'Unsure',
    headline: 'No rush to figure it all out.',
    calmQuestion: 'Forget the big picture for a second. What is the single smallest next step right now?',
    reassurance: 'Clarity does not come from forcing thoughts. It comes from resting first.',
    suggestedAction: 'Drink a sip of water or look away from the screen for 30 seconds.',
    companionPrompt: 'Explore gentle stories from others who felt lost at first.',
    soundPreference: 'rain',
  },
  steady: {
    icon: '🍃',
    label: 'Steady',
    headline: 'Grounded and present.',
    calmQuestion: 'What brought a quiet moment of peace or gratitude into your day?',
    reassurance: 'Cherish this steady ground. When you are centered, your presence is a gift to others.',
    suggestedAction: 'Capture this feeling in your private journal.',
    companionPrompt: 'Offer a listening ear to someone nearby who needs companion support.',
    soundPreference: 'rain',
  },
};

const ALL_MOODS: MoodKind[] = ['heavy', 'restless', 'tender', 'unsure', 'steady'];

export default function MoodRelaxationCard({
  mood,
  userName,
  initialNote,
  onMoodChange,
  onSaveReflection,
  onNavigate,
  onDismiss,
  asModal = false,
}: Props) {
  const ambient = useAmbient();
  const [reflection, setReflection] = useState(initialNote || '');
  const [saved, setSaved] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);

  useEffect(() => {
    if (initialNote) {
      setReflection(initialNote);
    }
  }, [initialNote]);

  const current = MOOD_DATA[mood] || MOOD_DATA.steady;

  async function handleToggleSound() {
    if (ambient.playing) {
      ambient.pause();
    } else {
      await ambient.play(current.soundPreference);
    }
  }

  function handleSaveNote() {
    if (!reflection.trim()) return;
    if (onSaveReflection) {
      onSaveReflection(reflection.trim(), mood);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const cardContent = (
    <section
      className="mood-relaxation-card"
      style={{
        margin: asModal ? 0 : '28px 5.4% 0',
        padding: asModal ? '24px 28px' : '28px 32px',
        borderRadius: asModal ? 18 : 20,
        background: 'linear-gradient(145deg, #ffffff, #f1f6f1)',
        border: asModal ? 'none' : '1px solid rgba(82, 107, 134, 0.18)',
        boxShadow: asModal ? 'none' : '0 12px 36px rgba(41, 52, 64, 0.06)',
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Banner Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 18,
          borderBottom: '1px solid rgba(82, 107, 134, 0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AnimatedMoodFace mood={mood} size={32} animated={true} />
          <div>
            <div style={{ fontSize: 11, letterSpacing: '1.8px', fontWeight: 600, color: 'var(--accent, #526b86)' }}>
              YOUR CALM SANCTUARY
            </div>
            <h2 style={{ fontSize: 22, margin: '2px 0 0', color: 'var(--ink, #1f2937)' }}>
              {userName ? `${userName}, here is a quiet moment for you.` : current.headline}
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowMoodPicker(!showMoodPicker)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              background: '#e9eff4',
              color: '#334155',
              border: '1px solid rgba(82, 107, 134, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <span>Feeling {current.label}</span>
            <RefreshCw size={12} />
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss calm sanctuary"
              title="Close quiet moment"
              style={{
                background: asModal ? '#f1f5f9' : 'transparent',
                border: asModal ? '1px solid #e2e8f0' : 'none',
                borderRadius: asModal ? '50%' : 4,
                color: '#64748b',
                width: asModal ? 34 : 'auto',
                height: asModal ? 34 : 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                cursor: 'pointer',
                padding: asModal ? 0 : '6px 8px',
              }}
            >
              {asModal ? <X size={17} /> : 'Dismiss'}
            </button>
          )}
        </div>
      </div>

      {/* Mood Picker Dropdown / Bar */}
      {showMoodPicker && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 14,
            padding: 12,
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid rgba(82, 107, 134, 0.15)',
          }}
        >
          <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center', marginRight: 4 }}>
            Update feeling:
          </span>
          {ALL_MOODS.map(m => {
            const item = MOOD_DATA[m];
            const active = m === mood;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onMoodChange(m);
                  setShowMoodPicker(false);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: 999,
                  fontSize: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  border: active ? '1px solid #526b86' : '1px solid #e2e8f0',
                  background: active ? '#526b86' : '#f8fafc',
                  color: active ? '#ffffff' : '#334155',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <AnimatedMoodFace mood={m} size={20} animated={true} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content Grid: Calming Question & Relaxation Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: 24,
          marginTop: 20,
        }}
      >
        {/* Left Column: Thoughtful Question & Note */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: '20px 22px',
            border: '1px solid rgba(82, 107, 134, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#85907b', letterSpacing: '1px' }}>
              CALM QUESTION
            </div>
            <p
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 18,
                color: '#1e293b',
                lineHeight: 1.45,
                margin: '10px 0 12px',
                fontStyle: 'italic',
              }}
            >
              “{current.calmQuestion}”
            </p>
            <p style={{ fontSize: 13, color: '#52606d', lineHeight: 1.5, margin: '0 0 14px' }}>
              {current.reassurance}
            </p>
          </div>

          <div>
            <textarea
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              placeholder="Jot down a few words if you want to... (Saved privately on your device)"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                fontFamily: 'inherit',
                color: '#1e293b',
                background: '#fafbf9',
                resize: 'none',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={!reflection.trim() || saved}
                style={{
                  padding: '7px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  background: saved ? '#10b981' : '#526b86',
                  color: '#ffffff',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: reflection.trim() ? 'pointer' : 'not-allowed',
                  opacity: reflection.trim() ? 1 : 0.6,
                  transition: 'background 0.2s',
                }}
              >
                {saved ? (
                  <>
                    <Check size={13} />
                    <span>Saved quietly</span>
                  </>
                ) : (
                  <span>Save note</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Relaxation Actions */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            justifyContent: 'center',
          }}
        >
          {/* Audio Tool */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              padding: '16px 20px',
              border: '1px solid rgba(82, 107, 134, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
                Quiet Soundscape ({current.soundPreference === 'rain' ? 'Soft Rain' : 'Brown Noise'})
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Gentle audio to soothe racing thoughts.
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleSound}
              style={{
                padding: '9px 18px',
                borderRadius: 20,
                fontSize: 12,
                background: ambient.playing ? '#334155' : 'var(--accent, #526b86)',
                color: '#ffffff',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              {ambient.playing ? (
                <>
                  <Pause size={14} /> Pause
                </>
              ) : (
                <>
                  <Volume2 size={14} /> Play sound
                </>
              )}
            </button>
          </div>

          {/* Breathing Guide Button */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              padding: '16px 20px',
              border: '1px solid rgba(82, 107, 134, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
                4-4 Breathing Circle
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Simple paced breathing to reset your body.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowBreathing(!showBreathing)}
              style={{
                padding: '9px 18px',
                borderRadius: 20,
                fontSize: 12,
                background: showBreathing ? '#334155' : 'var(--accent, #526b86)',
                color: '#ffffff',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Wind size={14} /> {showBreathing ? 'Hide circle' : 'Start breathing'}
            </button>
          </div>

          {/* Connect / Companion Quick Link */}
          {onNavigate && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 14,
                padding: '16px 20px',
                border: '1px solid rgba(82, 107, 134, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
                  Calm Conversation
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {current.companionPrompt}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('connect')}
                style={{
                  padding: '9px 18px',
                  borderRadius: 20,
                  fontSize: 12,
                  background: '#f1f5f9',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                <span>Listen</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Breathing Exercise */}
      {showBreathing && (
        <div
          style={{
            marginTop: 20,
            padding: 20,
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid rgba(82, 107, 134, 0.15)',
          }}
        >
          <BreathingExercise onClose={() => setShowBreathing(false)} />
        </div>
      )}
    </section>
  );

  if (asModal) {
    return (
      <div
        className="modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Calm Sanctuary"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          zIndex: 95,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
          overflowY: 'auto',
        }}
        onClick={onDismiss}
      >
        <div
          className="modal-dialog"
          style={{
            width: '100%',
            maxWidth: 920,
            background: '#ffffff',
            borderRadius: 22,
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(82, 107, 134, 0.2)',
            maxHeight: '92vh',
            overflowY: 'auto',
            position: 'relative',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {cardContent}
          <div
            style={{
              padding: '14px 28px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              borderBottomLeftRadius: 22,
              borderBottomRightRadius: 22,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Your calm sanctuary is private. You can revisit anytime.
            </span>
            <button
              type="button"
              className="button"
              onClick={onDismiss}
              style={{
                minHeight: 40,
                padding: '10px 22px',
                fontSize: '0.88rem',
                fontWeight: 600,
                borderRadius: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Continue to Saath <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return cardContent;
}

