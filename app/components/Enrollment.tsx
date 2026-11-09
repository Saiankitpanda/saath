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
  const seeker = ROLE_LABELS.client;
  const companion = ROLE_LABELS.listener;

  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">SAATH ON THIS ACCOUNT.</div>
        <h1>Saath beside you.<br/><em>Two ways to show up.</em></h1>
        <p>
          Saath stays with you as a {seeker.short}, a {companion.short}, or both. Same account.
          After enroll you can talk with Saath by voice or DM, or ask a stranger for voice or chat — only when both people accept.
        </p>
      </div>
      {!auth && (
        <div className="sample-notice">
          <ShieldCheck size={18}/>
          <span>Choose a role, then continue. Saath and your enrollment save after sign-in.</span>
        </div>
      )}
      <div className="enroll-grid">
        <article className="enroll-card client">
          <div className="enroll-card-top">
            <span className="enroll-icon client-icon"><HeartHandshake size={26} strokeWidth={1.4}/></span>
            <span className="eyebrow">{seeker.short.toUpperCase()}</span>
          </div>
          <h2>{seeker.long}</h2>
          <p>Express yourself first. Save private context, then meet a stranger or Saath when you are ready.</p>
          <ul className="simple-list">
            <li>Private notes can be encrypted at rest when configured.</li>
            <li>Ask a stranger to talk — voice or chat after they accept.</li>
            <li>If no one is free yet, use voice chat or DM with Saath.</li>
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

      {auth && onSignOut && (
        <div className="inline-actions" style={{ marginTop: 18 }}>
          <button type="button" className="text-button" onClick={onSignOut}>
            <LogOut size={15}/> Sign out
          </button>
        </div>
      )}
    </>
  );
}
