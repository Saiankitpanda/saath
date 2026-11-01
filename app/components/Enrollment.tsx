'use client';

import { ArrowRight, Ear, HeartHandshake, ShieldCheck } from 'lucide-react';
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
        <h1>One ChatGPT sign-in.<br/><em>Enroll as a client, a listener, or both.</em></h1>
        <p>
          The same signed-in identity can be a client, a listener, or both. Enrollment is saved on the server and stays in sync when you return.
          Signing in uses the existing ChatGPT account on this site. Saath does not create a second password.
        </p>
      </div>
      {!auth && (
        <div className="sample-notice">
          <ShieldCheck size={18}/>
          <span>Choose client or listener, then continue with ChatGPT. Your role is stored after sign-in.</span>
        </div>
      )}
      <div className="enroll-grid">
        <article className="enroll-card">
          <span className="eyebrow">CLIENT</span>
          <HeartHandshake size={28} strokeWidth={1.4}/>
          <h2>I am looking for a listener.</h2>
          <p>This first visit is for the person who wants to express themselves. Save private context, mark a mood, and decide what to share. You can still enroll as a listener later on the same account.</p>
          <ul className="simple-list">
            <li>Private notes can be encrypted at rest when the server key is configured.</li>
            <li>Pair with an enrolled listener using their six-character code.</li>
            <li>After you enroll, you land in one shared home. A live person is used only if someone has actually accepted. Otherwise you can talk with a fictional AI personality.</li>
          </ul>
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
            <a className="button full" href="/signin-with-chatgpt?return_to=/?enroll=client">Continue as a client <ArrowRight size={16}/></a>
          )}
        </article>
        <article className="enroll-card listener">
          <span className="eyebrow">LISTENER</span>
          <Ear size={28} strokeWidth={1.4}/>
          <h2>I can sit with someone.</h2>
          <p>Receive paired requests, accept or decline them, and keep the same account if you also need support. Enrollment is not a credential.</p>
          <ul className="simple-list">
            <li>You receive a pairing code. Only people you share it with can request you.</li>
            <li>Accepting a request is done by you, not by the client.</li>
            <li>A listener is not automatically a therapist or a verified counsellor.</li>
          </ul>
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
            <a className="button full" href="/signin-with-chatgpt?return_to=/?enroll=listener">Continue as a listener <ArrowRight size={16}/></a>
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
            <p className="pairing-code">Listener pairing code <strong>{profile.pairingCode}</strong></p>
          )}
          <p className="small-print">Switching roles updates the same saved profile. It does not create a second login.</p>
        </section>
      )}
    </>
  );
}
