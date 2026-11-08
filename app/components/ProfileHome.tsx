'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Armchair,
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  Info,
  Leaf,
  Moon,
  Palette,
  Phone,
  Send,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import AppearanceEditor from '@/components/AppearanceEditor';
import CallRoom from '@/components/CallRoom';
import { loadAppearance } from '@/lib/client/appearance';
import type { PublicCall } from '@/lib/application/ports';
import { ROLE_LABELS, type EnrollmentProfile, type EnrollmentRole, type SessionRequest } from '@/lib/domain';

type Props = {
  auth: boolean;
  displayName: string;
  profile: EnrollmentProfile | null;
  onNotice: (message: string) => void;
  onMotionChange: (enabled: boolean) => void;
  onEnroll: () => void;
  onSwitchRole: (role: EnrollmentRole) => void;
  context: string;
  onContextChange: (value: string) => void;
  shareMode: 'private' | 'ask-first';
  onShareModeChange: (value: 'private' | 'ask-first') => void;
  shareTarget: string;
  onShareTargetChange: (value: string) => void;
  reflections: string;
  onReflectionsChange: (value: string) => void;
  onSaveContext: () => void;
  onSaveNote: () => void;
  requests: SessionRequest[];
  connectionTab: 'pending' | 'accepted';
  onConnectionTab: (tab: 'pending' | 'accepted') => void;
  busy: boolean;
  encryptionAtRest: boolean;
  pairingCode: string;
  onPairingCodeChange: (value: string) => void;
  onConnect: () => void;
  onCancelRequest: (id: string) => void;
  onStartCall: (id: string) => void;
  onWorkTogether: () => void;
  onOpenIntro: () => void;
  onOpenQuiet: () => void;
  activeCall: PublicCall | null;
  onCallChange: (call: PublicCall) => void;
  onCallEnded: () => void;
};

export default function ProfileHome({
  auth,
  displayName,
  profile,
  onNotice,
  onMotionChange,
  onEnroll,
  onSwitchRole,
  context,
  onContextChange,
  shareMode,
  onShareModeChange,
  shareTarget,
  onShareTargetChange,
  reflections,
  onReflectionsChange,
  onSaveContext,
  onSaveNote,
  requests,
  connectionTab,
  onConnectionTab,
  busy,
  encryptionAtRest,
  pairingCode,
  onPairingCodeChange,
  onConnect,
  onCancelRequest,
  onStartCall,
  onWorkTogether,
  onOpenIntro,
  onOpenQuiet,
  activeCall,
  onCallChange,
  onCallEnded,
}: Props) {
  const [coloursOpen, setColoursOpen] = useState(false);
  const enrolled = Boolean(profile?.clientEnrolled || profile?.listenerEnrolled);
  const name = profile?.displayName || displayName || 'You';
  const roles = [
    profile?.clientEnrolled ? ROLE_LABELS.client.short : null,
    profile?.listenerEnrolled ? ROLE_LABELS.listener.short : null,
  ].filter(Boolean).join(' · ');
  const pendingRequests = requests.filter(item => item.status === 'pending');
  const acceptedRequests = requests.filter(item => item.status === 'accepted');
  const shownRequests = connectionTab === 'pending' ? pendingRequests : acceptedRequests;

  return (
    <div className="space-shell profile-shell">
      <header className="space-top">
        <div>
          <h1>Your profile, in <em>one place.</em></h1>
          <p>Who you are, who you are connected with, your notes, and the colours of this space. Open it from the person icon anytime.</p>
        </div>
        <svg className="space-branch" viewBox="0 0 160 120" aria-hidden="true">
          <path d="M18 98 C48 78, 72 62, 118 28" fill="none" stroke="#7f9a88" strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M62 72 C74 58, 86 50, 104 40" fill="none" stroke="#9bb0a2" strokeWidth="1.6" strokeLinecap="round"/>
          <ellipse cx="128" cy="24" rx="14" ry="8" transform="rotate(-28 128 24)" fill="#8fae9a" opacity=".85"/>
          <ellipse cx="108" cy="38" rx="12" ry="7" transform="rotate(-18 108 38)" fill="#a8c2b0" opacity=".9"/>
          <ellipse cx="86" cy="52" rx="11" ry="6.5" transform="rotate(-12 86 52)" fill="#7f9a88" opacity=".8"/>
          <ellipse cx="68" cy="66" rx="10" ry="6" transform="rotate(-8 68 66)" fill="#9bb0a2" opacity=".75"/>
          <circle cx="96" cy="46" r="3.2" fill="#d4b49a"/>
          <circle cx="78" cy="58" r="2.6" fill="#c9a48a"/>
          <circle cx="116" cy="32" r="2.8" fill="#dfc2a8"/>
        </svg>
      </header>

      {!auth && (
        <div className="space-notice">
          <ShieldCheck size={18}/>
          <span>Sign in to save context on the server and to send a real connection request. Until then, writing stays in this browser. <a href="/signin-with-chatgpt?return_to=/?view=profile">Sign in</a></span>
        </div>
      )}
      {encryptionAtRest && (
        <p className="small-print space-encrypt-note">At-rest encryption is on for saved context. End-to-end encryption is not claimed.</p>
      )}

      <section className="space-card profile-identity-card">
        <header className="space-card-head">
          <div className="space-card-title">
            <span className="space-card-icon"><UserRound size={18} strokeWidth={1.6} /></span>
            <div>
              <h2>{name}</h2>
              <p>{enrolled ? roles : auth ? 'Signed in. Enroll when you want saved requests.' : 'Sign in to keep this account.'}</p>
            </div>
          </div>
        </header>
        {profile?.pairingCode && (
          <p className="pairing-code">Your invite code <strong>{profile.pairingCode}</strong></p>
        )}
        {enrolled && profile?.activeRole && (
          <div className="role-switch profile-role-switch" role="group" aria-label="Active role">
            {profile.clientEnrolled && (
              <button type="button" className={profile.activeRole === 'client' ? 'active' : ''} onClick={() => onSwitchRole('client')}>
                {ROLE_LABELS.client.short}
              </button>
            )}
            {profile.listenerEnrolled && (
              <button type="button" className={profile.activeRole === 'listener' ? 'active' : ''} onClick={() => onSwitchRole('listener')}>
                {ROLE_LABELS.listener.short}
              </button>
            )}
          </div>
        )}
        <div className="profile-identity-actions">
          {!auth && (
            <a className="button" href="/signin-with-chatgpt?return_to=/?view=profile">
              <ShieldCheck size={16} /> Sign in
            </a>
          )}
          <button type="button" className={auth ? 'button' : 'outline-button'} onClick={onEnroll}>
            {enrolled ? 'Manage enrollment' : 'Enroll'} <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <div className="space-layout">
        <div className="space-main">
          <section className="space-card space-card-connections">
            <header className="space-card-head compact">
              <div className="space-card-title">
                <span className="space-card-icon"><Users size={18} strokeWidth={1.6}/></span>
                <div>
                  <h2>Connect and work</h2>
                  <p>Enter someone’s invite code. After they accept, call or sit in Two chairs.</p>
                </div>
              </div>
            </header>
            <div className="profile-connect-row">
              <input
                value={pairingCode}
                onChange={event => onPairingCodeChange(event.target.value.toUpperCase())}
                maxLength={6}
                placeholder="Invite code"
                aria-label="Listener invite code"
              />
              <button className="button" type="button" disabled={busy || pairingCode.trim().length !== 6} onClick={onConnect}>
                Connect
              </button>
            </div>
            <div className="space-tabs" role="tablist" aria-label="Connection status">
              <button type="button" role="tab" aria-selected={connectionTab === 'pending'} className={connectionTab === 'pending' ? 'active' : ''} onClick={() => onConnectionTab('pending')}>
                Pending ({pendingRequests.length})
              </button>
              <button type="button" role="tab" aria-selected={connectionTab === 'accepted'} className={connectionTab === 'accepted' ? 'active' : ''} onClick={() => onConnectionTab('accepted')}>
                Accepted ({acceptedRequests.length})
              </button>
            </div>
            {shownRequests.length ? shownRequests.map(item => (
              <div className="request-row" key={item.id}>
                <div>
                  <strong>{item.providerName}</strong>
                  <span>{item.topic} · {item.status}</span>
                </div>
                <div className="profile-request-actions">
                  {item.status === 'pending' && (
                    <button className="quiet" type="button" onClick={() => onCancelRequest(item.id)}>Cancel</button>
                  )}
                  {item.status === 'accepted' && (
                    <>
                      <button className="quiet" type="button" disabled={busy} onClick={() => onStartCall(item.id)}>
                        <Phone size={14}/> Call
                      </button>
                      <button className="quiet" type="button" onClick={onWorkTogether}>
                        <Armchair size={14}/> Two chairs
                      </button>
                    </>
                  )}
                </div>
              </div>
            )) : (
              <div className="space-empty">
                <Armchair size={34} strokeWidth={1.3}/>
                <p>{connectionTab === 'pending'
                  ? 'No pending requests. A code you send will wait here until they accept.'
                  : 'No accepted connections yet. When someone accepts, you can call or sit together.'}</p>
              </div>
            )}
            {activeCall && (
              <CallRoom
                call={activeCall}
                onChange={onCallChange}
                onEnded={onCallEnded}
                onNotice={onNotice}
              />
            )}
          </section>

          <section className="space-card space-card-share">
            <header className="space-card-head">
              <div className="space-card-title">
                <span className="space-card-icon"><FileText size={18} strokeWidth={1.6}/></span>
                <div>
                  <h2>What I’d like to share</h2>
                  <p>Prepare context for a future conversation.</p>
                </div>
              </div>
              <span className="space-chip">{shareMode === 'private' ? 'Not shared' : 'Ask first'}</span>
            </header>
            <textarea
              id="life-context"
              value={context}
              onChange={event => onContextChange(event.target.value)}
              maxLength={4000}
              placeholder="Start with what feels important…"
            />
            <div className="space-card-meta">
              <span className="field-count">{context.length}/4000</span>
              <label className="space-inline-label">Visibility
                <select value={shareMode} onChange={event => onShareModeChange(event.target.value as 'private' | 'ask-first')}>
                  <option value="private">Private — stay with me</option>
                  <option value="ask-first">Ask first before sharing</option>
                </select>
              </label>
            </div>
            <div className="space-card-foot">
              <p className="space-hint"><Info size={14}/> Saved context is not sent automatically.</p>
              <div className="space-card-actions">
                <button className="button" disabled={busy} onClick={onSaveContext}>{busy ? 'Saving…' : 'Save context'}</button>
                <button className="outline-button" type="button" onClick={() => onContextChange('')}>Clear draft</button>
              </div>
            </div>
            <div className="space-share-block">
              <div className="space-share-title"><Send size={15}/> Share only when you choose</div>
              <div className="space-share-row">
                <select
                  value={shareTarget}
                  onChange={event => onShareTargetChange(event.target.value)}
                  disabled={!acceptedRequests.length}
                  aria-label="Choose a connection to share with"
                >
                  <option value="">{acceptedRequests.length ? 'Choose a connection' : 'No accepted connections yet'}</option>
                  {acceptedRequests.map(item => (
                    <option key={item.id} value={item.id}>{item.providerName}</option>
                  ))}
                </select>
                <button
                  className="outline-button"
                  type="button"
                  disabled={!shareTarget || !context.trim()}
                  onClick={() => {
                    const peer = acceptedRequests.find(item => item.id === shareTarget);
                    onNotice(peer
                      ? `Review with ${peer.providerName} in Two chairs. Context is not sent from this button alone.`
                      : 'Choose an accepted connection first.');
                    if (peer) onWorkTogether();
                  }}
                >
                  Review before sharing
                </button>
              </div>
            </div>
          </section>

          <section className="space-card space-card-notes">
            <header className="space-card-head">
              <div className="space-card-title">
                <span className="space-card-icon soft"><BookOpen size={18} strokeWidth={1.6}/></span>
                <div>
                  <h2>Notes for myself</h2>
                  <p>Stored in this browser. Not shared through pairing.</p>
                </div>
              </div>
            </header>
            <textarea
              className="space-notes-field"
              value={reflections}
              onChange={event => onReflectionsChange(event.target.value)}
              maxLength={4000}
              placeholder="A thought, a reminder, something to come back to…"
            />
            <div className="space-card-foot">
              <button className="button" type="button" onClick={onSaveNote}>Save note</button>
              <span className="space-hint muted">Browser data can be cleared.</span>
            </div>
          </section>
        </div>

        <aside className="space-side">
          <section className="space-card space-card-guide">
            <div className="space-guide-head">
              <Leaf size={18} strokeWidth={1.6}/>
              <h3>Before you share</h3>
            </div>
            <ul className="space-checklist">
              <li><Check size={14}/> Choose a recipient</li>
              <li><Check size={14}/> Review the exact context</li>
              <li><Check size={14}/> Confirm each time</li>
            </ul>
            <button className="text-button" type="button" onClick={onOpenIntro}>
              Manage saved details
            </button>
          </section>

          <button className="space-card space-quiet-card" type="button" onClick={onOpenQuiet}>
            <Moon size={18} strokeWidth={1.6}/> Quiet corner
          </button>
        </aside>
      </div>

      <section className="space-card profile-fold">
        <button
          type="button"
          className="profile-fold-toggle"
          aria-expanded={coloursOpen}
          onClick={() => setColoursOpen(open => !open)}
        >
          <span className="space-card-icon"><Palette size={18} strokeWidth={1.6} /></span>
          <span className="profile-fold-copy">
            <strong>Your colours</strong>
            <span>Palettes stay separate. Open them when you want to change how Saath feels.</span>
          </span>
          <ChevronDown size={18} className={coloursOpen ? 'profile-fold-chevron open' : 'profile-fold-chevron'} />
        </button>
      </section>

      {coloursOpen && (
        <AppearanceEditor
          accountId={auth ? displayName || 'signed-in' : null}
          onNotice={message => {
            onNotice(message);
            const appearance = loadAppearance(auth ? displayName || 'signed-in' : null);
            onMotionChange(appearance.motionEnabled);
          }}
        />
      )}
    </div>
  );
}
