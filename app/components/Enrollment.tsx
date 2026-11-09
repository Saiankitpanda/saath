'use client';

import { ArrowRight, Ear, HeartHandshake, MessageCircle, Phone, ShieldCheck, LogOut } from 'lucide-react';
import { ROLE_LABELS, type EnrollmentProfile, type EnrollmentRole } from '@/lib/domain';

type Props = {
  auth: boolean;
  displayName: string;
  profile: EnrollmentProfile | null;
  busy: boolean;
  onEnroll: (input: { clientEnrolled: boolean; listenerEnrolled: boolean; activeRole: EnrollmentRole; displayName: string }) => void;
  onOpenAuthModal?: (role: EnrollmentRole) => void;
  onSignOut?: () => void;
};

export default function Enrollment({ auth, displayName, profile, busy, onEnroll, onOpenAuthModal, onSignOut }: Props) {
  const enrolled = Boolean(profile?.clientEnrolled || profile?.listenerEnrolled);
  const seeker = ROLE_LABELS.client;
  const companion = ROLE_LABELS.listener;

  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">SEEKER OR COMPANION · ONE SHARED SANCTUARY</div>
        <h1>One calm account.<br/><em>Two ways to show up.</em></h1>
        <p>
          Enroll as a {seeker.short} to express yourself, a {companion.short} to hold space for others, or both on the same account.
          No second password. Connect securely with an AI companion by voice or DM, or request a verified stranger when you are ready.
        </p>
      </div>
      {!auth && (
        <div className="sample-notice">
          <ShieldCheck size={18}/>
          <span>Choose how you want to show up. You can switch or add the other role anytime after signing in.</span>
        </div>
      )}
      <div className="enroll-grid">
        <article className="enroll-card client">
          <div className="enroll-card-top">
            <span className="enroll-icon client-icon"><HeartHandshake size={26} strokeWidth={1.4}/></span>
            <span className="eyebrow">{seeker.short.toUpperCase()}</span>
          </div>
          <h2>{seeker.long}</h2>
          <p>Express yourself first. Save private context, then meet a stranger or an AI companion when you are ready.</p>
          <ul className="simple-list">
            <li>Private notes can be encrypted at rest when configured.</li>
            <li>Ask a stranger to talk — voice or chat after they accept.</li>
            <li>If no one is free yet, use voice chat or DM with a fictional AI companion.</li>
          </ul>
          <div className="enroll-modes" aria-hidden="true">
            <span><Phone size={14}/> Voice</span>
            <span><MessageCircle size={14}/> DM</span>
          </div>
          {auth ? (
            <button
              type="button"
              className="button full"
              disabled={busy || Boolean(profile?.clientEnrolled)}
              onClick={() => onEnroll({
                clientEnrolled: true,
                listenerEnrolled: Boolean(profile?.listenerEnrolled),
                activeRole: 'client',
                displayName,
              })}
            >
              {profile?.clientEnrolled ? `Enrolled as ${seeker.short}` : `Enroll as ${seeker.short}`}
              <ArrowRight size={16}/>
            </button>
          ) : (
            <button
              type="button"
              className="button full"
              disabled={busy}
              onClick={() => onOpenAuthModal ? onOpenAuthModal('client') : undefined}
            >
              Enroll as {seeker.short} <ArrowRight size={16}/>
            </button>
          )}
        </article>

        <article className="enroll-card listener">
          <div className="enroll-card-top">
            <span className="enroll-icon listener-icon"><Ear size={26} strokeWidth={1.4}/></span>
            <span className="eyebrow">{companion.short.toUpperCase()}</span>
          </div>
          <h2>{companion.long}</h2>
          <p>Be available for a stranger who asks. Accept only when you can stay. Enrollment is not a credential.</p>
          <ul className="simple-list">
            <li>You get an invite code to share when you want to be found.</li>
            <li>Accept or decline each request yourself — voice or chat.</li>
            <li>A {companion.short} is not a therapist or a verified counsellor.</li>
          </ul>
          <div className="enroll-modes" aria-hidden="true">
            <span><Phone size={14}/> Voice</span>
            <span><MessageCircle size={14}/> DM</span>
          </div>
          {auth ? (
            <button
              type="button"
              className="button full"
              disabled={busy || Boolean(profile?.listenerEnrolled)}
              onClick={() => onEnroll({
                clientEnrolled: Boolean(profile?.clientEnrolled),
                listenerEnrolled: true,
                activeRole: 'listener',
                displayName,
              })}
            >
              {profile?.listenerEnrolled ? `Enrolled as ${companion.short}` : `Enroll as ${companion.short}`}
              <ArrowRight size={16}/>
            </button>
          ) : (
            <button
              type="button"
              className="button full"
              disabled={busy}
              onClick={() => onOpenAuthModal ? onOpenAuthModal('listener') : undefined}
            >
              Enroll as {companion.short} <ArrowRight size={16}/>
            </button>
          )}
        </article>
      </div>

      {enrolled && (
        <section className="plain-panel enroll-sync" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>Saved on this account</h2>
            <p>
              {profile?.displayName || 'You'} ·
              {profile?.clientEnrolled ? ` ${seeker.short}` : ''}
              {profile?.clientEnrolled && profile?.listenerEnrolled ? ' and' : ''}
              {profile?.listenerEnrolled ? ` ${companion.short}` : ''}
              {profile?.activeRole ? ` · using ${ROLE_LABELS[profile.activeRole].short} now` : ''}
            </p>
            {profile?.pairingCode && (
              <p className="pairing-code">Your invite code <strong>{profile.pairingCode}</strong></p>
            )}
            <p className="small-print">Switching roles updates the same saved profile. It does not create a second login.</p>
          </div>
          {onSignOut && (
            <button
              type="button"
              className="button small"
              onClick={onSignOut}
              style={{
                color: '#ffffff',
                background: '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <LogOut size={15} color="#ffffff" style={{ color: '#ffffff', stroke: '#ffffff' }} />
              <span style={{ color: '#ffffff', fontWeight: 500 }}>Sign Out</span>
            </button>
          )}
        </section>
      )}
    </>
  );
}
