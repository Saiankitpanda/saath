'use client';

import { ArrowRight, MessageCircle, Phone, Sparkles, Users } from 'lucide-react';
import { interestOptions, samplePeople } from '@/lib/fixtures';
import {
  ROLE_LABELS,
  SAMPLE_PROFILE_NOTICE,
  type EnrollmentProfile,
  type InterestId,
  type MoodEntry,
  type Person,
  type SessionRequest,
  type View,
} from '@/lib/domain';

type Props = {
  profile: EnrollmentProfile | null;
  incoming: SessionRequest[];
  accepted: SessionRequest[];
  moods: MoodEntry[];
  interests: InterestId[];
  onToggleInterest: (id: InterestId) => void;
  go: (view: View) => void;
  onTalkWithPersona: (person: Person) => void;
  onAskForPerson: () => void;
  onStartCall: (requestId: string) => void;
};

export default function ArriveHome({
  profile,
  incoming,
  accepted,
  moods,
  interests,
  onToggleInterest,
  go,
  onTalkWithPersona,
  onAskForPerson,
  onStartCall,
}: Props) {
  const latest = moods[0] ?? null;
  const pendingIncoming = incoming.filter(item => item.status === 'pending');
  const personReady = accepted[0] ?? null;
  const seeker = ROLE_LABELS.client.short;
  const companion = ROLE_LABELS.listener.short;
  const roleLine = [
    profile?.clientEnrolled ? seeker : null,
    profile?.listenerEnrolled ? companion : null,
  ].filter(Boolean).join(' · ') || 'Enroll when you want saved requests';

  const suggested = samplePeople.find(item => {
    if (interests.includes('spiritual-life') || interests.includes('quiet-sitting')) return item.id === 'sample-kabir';
    if (interests.includes('work')) return item.id === 'sample-arjun';
    if (interests.includes('finding-words')) return item.id === 'sample-isha';
    if (interests.includes('family') || interests.includes('alongside')) return item.id === 'sample-meera';
    return item.id === 'sample-isha';
  }) ?? samplePeople[2];

  const paths = [
    {
      view: 'strangers' as View,
      icon: Phone,
      title: 'Dial a stranger',
      text: 'Nearby people, same situation — voice or chat without a waiting lobby.',
    },
    {
      view: 'circles' as View,
      icon: Users,
      title: 'Peer Circles',
      text: 'Secrets, thoughts, and a Joined session with people who get it.',
    },
    {
      view: 'chairs' as View,
      icon: MessageCircle,
      title: 'Two chairs',
      text: 'Practise the hard conversation, then sit when both people are ready.',
    },
    {
      view: 'connect' as View,
      icon: Sparkles,
      title: 'Listen',
      text: 'AI companions for voice or DM when a live person is not free yet.',
    },
    {
      view: 'activities' as View,
      icon: ArrowRight,
      title: 'Guided exercises',
      text: 'Stepped paths you complete at your own pace.',
    },
    {
      view: 'profile' as View,
      icon: Sparkles,
      title: 'Your profile',
      text: 'Notes, connections, and what you choose to share — open the person icon.',
    },
  ];

  return (
    <div className="arrive-shell">
      <header className="arrive-hero">
        <div className="arrive-hero-copy">
          <div className="eyebrow">YOUR VISIT</div>
          <h1>You arrived.<br/>Start where you <em>are.</em></h1>
          <p>
            Talk with a Companion or stranger, sit with peers, or practise hard words first.
            Nothing has to happen all at once.
          </p>
          <div className="arrive-identity">
            <div>
              <strong>{profile?.displayName || 'Welcome'}</strong>
              <span>{roleLine}</span>
            </div>
            {latest && <span className="arrive-mood-chip">Today feels {latest.mood}</span>}
          </div>
        </div>
      </header>

      <section className="arrive-next" aria-label="What you can do now">
        <span className="eyebrow">RIGHT NOW</span>
        {personReady ? (
          <>
            <h2>Someone accepted — you can talk.</h2>
            <p>{personReady.providerName} is ready. Open a voice call or sit in Two chairs. The mic stays off until you join.</p>
            <div className="inline-actions">
              <button type="button" className="button" onClick={() => onStartCall(personReady.id)}>
                <Phone size={16} /> Start voice call
              </button>
              <button type="button" className="outline-button" onClick={() => go('chairs')}>Open Two chairs</button>
              <button type="button" className="outline-button" onClick={() => go('connect')}>
                <MessageCircle size={16} /> Open chat
              </button>
            </div>
          </>
        ) : pendingIncoming.length ? (
          <>
            <h2>Someone is waiting on you.</h2>
            <p>A request is pending. Accept only if you can stay present.</p>
            <div className="inline-actions">
              <button type="button" className="button" onClick={() => go('connect')}>
                Review requests <ArrowRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>No live person is waiting yet.</h2>
            <p>
              Dial a stranger nearby, or talk with {suggested.name} while you warm up.
              <span className="arrive-ai-note"> {SAMPLE_PROFILE_NOTICE}</span>
            </p>
            <div className="inline-actions">
              <button type="button" className="button" onClick={onAskForPerson}>
                <Users size={16} /> Talk to a stranger
              </button>
              <button type="button" className="outline-button" onClick={() => onTalkWithPersona(suggested)}>
                Talk with {suggested.name}
              </button>
            </div>
          </>
        )}
      </section>

      <section className="arrive-paths">
        <h2>Paths that help you move</h2>
        <p>Pick one. You can always return here.</p>
        <div className="arrive-path-grid">
          {paths.map(path => {
            const Icon = path.icon;
            return (
              <button type="button" key={path.view + path.title} className="arrive-path" onClick={() => go(path.view)}>
                <span className="arrive-path-icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={1.5} />
                </span>
                <strong>{path.title}</strong>
                <span>{path.text}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="arrive-interests">
        <h2>What would help you grow today?</h2>
        <p>Mark interests so suggestions feel closer. Nothing is shared until you preview and approve.</p>
        <div className="arrive-interest-grid">
          {interestOptions.map(item => (
            <button
              type="button"
              key={item.id}
              className={interests.includes(item.id) ? 'selected' : ''}
              onClick={() => onToggleInterest(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
