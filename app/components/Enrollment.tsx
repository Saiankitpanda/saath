'use client';

import { ArrowRight, Ear, HeartHandshake, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import type { EnrollmentProfile, EnrollmentRole } from '@/lib/domain';

type Props = {
  auth: boolean;
  displayName: string;
  profile: EnrollmentProfile | null;
  busy: boolean;
  onEnroll: (input: { clientEnrolled: boolean; listenerEnrolled: boolean; activeRole: EnrollmentRole; displayName: string }) => void;
};

export default function Enrollment({ auth, displayName, profile, busy, onEnroll }: Props) {
  const enrolled = Boolean(profile?.clientEnrolled || profile?.listenerEnrolled);

  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">CLIENT OR LISTENER. SAME ACCOUNT.</div>
        <h1>One ChatGPT sign-in.<br/><em>Two ways to show up.</em></h1>
        <p>
          Enroll as a client, a listener, or both on the same identity. No second password.
          After enroll you can talk with an AI companion by voice or DM, or ask a stranger for voice or chat — only when both people accept.
        </p>
      </div>
      {!auth && (
        <div className="sample-notice">
          <ShieldCheck size={18}/>
          <span>Choose a role, then continue with ChatGPT. Your enrollment saves after sign-in.</span>
        </div>
      )}
      <div className="enroll-grid">
        <article className="enroll-card client">
          <div className="enroll-card-top">
            <span className="enroll-icon client-icon"><HeartHandshake size={26} strokeWidth={1.4}/></span>
            <span className="eyebrow">CLIENT</span>
          </div>
          <h2>I am looking for a listener.</h2>
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
            <button className="button full" disabled={busy || Boolean(profile?.clientEnrolled)} onClick={() => onEnroll({
              clientEnrolled: true,
              listenerEnrolled: Boolean(profile?.listenerEnrolled),
              activeRole: 'client',
              displayName,
            })}>
              {profile?.clientEnrolled ? 'Enrolled as a client' : 'Enroll as a client'}
              <ArrowRight size={16}/>
            </button>
          ) : (
            <a className="button full" href="/signin-with-chatgpt?return_to=/?enroll=client">Enroll as a client <ArrowRight size={16}/></a>
          )}
        </article>
        <article className="enroll-card listener">
          <div className="enroll-card-top">
            <span className="enroll-icon listener-icon"><Ear size={26} strokeWidth={1.4}/></span>
            <span className="eyebrow">LISTENER</span>
          </div>
          <h2>I can sit with someone.</h2>
          <p>Be available for a stranger who asks. Accept only when you can stay. Enrollment is not a credential.</p>
          <ul className="simple-list">
            <li>You get an invite code to share when you want to be found.</li>
            <li>Accept or decline each request yourself — voice or chat.</li>
            <li>A listener is not a therapist or a verified counsellor.</li>
          </ul>
          <div className="enroll-modes" aria-hidden="true">
            <span><Phone size={14}/> Voice</span>
            <span><MessageCircle size={14}/> DM</span>
          </div>
          {auth ? (
            <button className="button full" disabled={busy || Boolean(profile?.listenerEnrolled)} onClick={() => onEnroll({
              clientEnrolled: Boolean(profile?.clientEnrolled),
              listenerEnrolled: true,
              activeRole: 'listener',
              displayName,
            })}>
              {profile?.listenerEnrolled ? 'Enrolled as a listener' : 'Enroll as a listener'}
              <ArrowRight size={16}/>
            </button>
          ) : (
            <a className="button full" href="/signin-with-chatgpt?return_to=/?enroll=listener">Enroll as a listener <ArrowRight size={16}/></a>
          )}
        </article>
      </div>
      {enrolled && (
        <section className="plain-panel enroll-sync">
          <h2>Saved on this account</h2>
          <p>
            {profile?.displayName || 'You'} ·
            {profile?.clientEnrolled ? ' client' : ''}
            {profile?.clientEnrolled && profile?.listenerEnrolled ? ' and' : ''}
            {profile?.listenerEnrolled ? ' listener' : ''}
            {profile?.activeRole ? ` · using ${profile.activeRole} now` : ''}
          </p>
          {profile?.pairingCode && (
            <p className="pairing-code">Your invite code <strong>{profile.pairingCode}</strong></p>
          )}
          <p className="small-print">Switching roles updates the same saved profile. It does not create a second login.</p>
        </section>
      )}
    </>
  );
}
