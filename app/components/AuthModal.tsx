'use client';

import { useState, useEffect } from 'react';
import { X, Lock, Mail, User, AlertCircle, CheckCircle2, Sparkles, HeartHandshake, Ear, Check } from 'lucide-react';
import type { EnrollmentRole, MoodKind } from '@/lib/domain';

type Props = {
  isOpen: boolean;
  initialRole?: EnrollmentRole;
  onClose: () => void;
  onAuthSuccess: (user: {
    id: string;
    email: string;
    fullName?: string;
    displayName?: string;
    activeRole?: EnrollmentRole;
    clientEnrolled?: boolean;
    listenerEnrolled?: boolean;
    pairingCode?: string;
    initialMood?: MoodKind;
    initialReflection?: string;
  }) => void;
};

const MOOD_DATA: Record<
  MoodKind,
  {
    icon: string;
    label: string;
    calmQuestion: string;
    reassurance: string;
  }
> = {
  heavy: {
    icon: '🌧️',
    label: 'Heavy',
    calmQuestion: 'What is one burden you can gently put aside for just the next ten minutes?',
    reassurance: 'You have been carrying a lot. You do not have to solve anything in this moment.',
  },
  restless: {
    icon: '⚡',
    label: 'Restless',
    calmQuestion: 'Notice three physical things around you right now that are completely still.',
    reassurance: 'When your thoughts speed up, your breath can anchor you back to the ground.',
  },
  tender: {
    icon: '🌸',
    label: 'Tender',
    calmQuestion: 'What is one kind, gentle reminder you wish someone would say to you today?',
    reassurance: 'Feeling vulnerable is not a flaw. You are safe here, exactly as you are.',
  },
  unsure: {
    icon: '🌫️',
    label: 'Unsure',
    calmQuestion: 'Forget the big picture for a second. What is the single smallest next step right now?',
    reassurance: 'Clarity does not come from forcing thoughts. It comes from resting first.',
  },
  steady: {
    icon: '🍃',
    label: 'Steady',
    calmQuestion: 'What brought a quiet moment of peace or gratitude into your day?',
    reassurance: 'Cherish this steady ground. When you are centered, your presence is a gift to others.',
  },
};

export default function AuthModal({ isOpen, initialRole = 'client', onClose, onAuthSuccess }: Props) {
  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [modalStep, setModalStep] = useState<'auth' | 'mood'>('auth');
  const [selectedMood, setSelectedMood] = useState<MoodKind>('heavy');
  const [calmAnswer, setCalmAnswer] = useState('');
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [role, setRole] = useState<EnrollmentRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    function handleOAuthMessage(event: MessageEvent) {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data?.user) {
        setPendingUser(event.data.user);
        setSuccessMsg(`Signed in with Google (${event.data.user.email})!`);
        setBusy(false);
        setModalStep('mood');
      }
    }
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  useEffect(() => {
    setRole(initialRole);
    setModalStep('auth');
    setErrorMsg('');
    setSuccessMsg('');
    setCalmAnswer('');
  }, [initialRole, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function finalizeAuth(mood?: MoodKind, answer?: string) {
    const finalMood = mood || selectedMood;
    const finalAnswer = answer !== undefined ? answer : calmAnswer.trim();
    const finalUser = {
      ...(pendingUser || {}),
      initialMood: finalMood,
      initialReflection: finalAnswer || undefined,
    };

    try {
      if (finalMood) {
        localStorage.setItem('saath_current_mood', finalMood);
        document.cookie = `saath_mood=${finalMood}; path=/; max-age=2592000; SameSite=Lax`;
      }
      if (finalAnswer) {
        localStorage.setItem('saath_initial_reflection', finalAnswer);
      }
      document.cookie = `saath_session=${encodeURIComponent(JSON.stringify(finalUser))}; path=/; max-age=2592000; SameSite=Lax`;
    } catch {}

    onAuthSuccess(finalUser);
    onClose();
    setModalStep('auth');
    setCalmAnswer('');
  }

  async function handleSocialSignIn(provider: 'google' | 'facebook' | 'instagram') {
    setBusy(true);
    setErrorMsg('');

    const providerNames: Record<string, string> = {
      google: 'Google',
      facebook: 'Facebook',
      instagram: 'Instagram',
    };

    if (provider === 'google') {
      const activeClientId =
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        (typeof window !== 'undefined' ? localStorage.getItem('saath_google_client_id') : null);

      const w = 500;
      const h = 600;
      const left = typeof window !== 'undefined' ? window.screen.width / 2 - w / 2 : 100;
      const top = typeof window !== 'undefined' ? window.screen.height / 2 - h / 2 : 100;

      let authUrl = `/auth/google-popup?role=${encodeURIComponent(role)}`;
      if (activeClientId) {
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
          activeClientId
        )}&redirect_uri=${encodeURIComponent(
          window.location.origin + '/auth/google/callback'
        )}&response_type=token&scope=openid%20email%20profile&state=${encodeURIComponent(role)}`;
      }

      const popup = window.open(authUrl, 'GoogleSignIn', `width=${w},height=${h},top=${top},left=${left}`);
      if (!popup) {
        window.location.href = authUrl;
      }
      return;
    }

    setTimeout(() => {
      const demoEmail = email.trim() || `user.${provider}@saath.org`;
      const demoName = fullName.trim() || `${providerNames[provider]} User`;
      const userData = {
        id: `social-${provider}-${Date.now()}`,
        email: demoEmail,
        fullName: demoName,
        displayName: demoName,
        activeRole: role,
        clientEnrolled: true,
        listenerEnrolled: role === 'listener',
        pairingCode: role === 'listener' ? `SAATH-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      };

      setPendingUser(userData);
      setSuccessMsg(`Signed in with ${providerNames[provider]}!`);
      setBusy(false);
      setModalStep('mood');
    }, 400);
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setBusy(true);
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanFullName = (fullName.trim() || cleanEmail.split('@')[0]);

    const endpoint = tab === 'signin' ? '/api/auth/login' : '/api/auth/register';
    const payload = tab === 'signin'
      ? { email: cleanEmail, password: cleanPassword }
      : { email: cleanEmail, password: cleanPassword, fullName: cleanFullName, role };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as any;

      if (!res.ok || data.error) {
        if (res.status === 409 || data.error?.toLowerCase().includes('already exists')) {
          setTab('signin');
          setErrorMsg('An account with this email already exists. Please enter your password to sign in.');
          return;
        }
        if (res.status === 404 || data.error?.toLowerCase().includes('no account found')) {
          setTab('register');
          setErrorMsg('No account found with this email. We switched you to Create Account so you can register.');
          return;
        }
        throw new Error(data.error || 'Authentication failed.');
      }

      const user = data.user || {
        id: `user-${Date.now()}`,
        email: cleanEmail,
        fullName: cleanFullName,
        displayName: cleanFullName,
        activeRole: role,
        clientEnrolled: true,
        listenerEnrolled: role === 'listener',
        pairingCode: role === 'listener' ? `SAATH-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      };

      setPendingUser(user);
      setModalStep('mood');
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function quickDemo(demoEmail: string, demoName: string, demoRole: EnrollmentRole) {
    setBusy(true);
    setErrorMsg('');
    const user = {
      id: `demo-${demoRole}-1`,
      email: demoEmail,
      fullName: demoName,
      displayName: demoName,
      activeRole: demoRole,
      clientEnrolled: true,
      listenerEnrolled: demoRole === 'listener',
      pairingCode: demoRole === 'listener' ? 'SAATH-7749' : undefined,
    };
    setPendingUser(user);
    setBusy(false);
    setModalStep('mood');
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 490,
          background: '#ffffff',
          borderRadius: 18,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fafaf9',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>
              {modalStep === 'mood' ? 'WELCOME TO SAATH · CALM SANCTUARY' : 'SAATH SECURE ACCESS'}
            </div>
            <h2 id="auth-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0, marginTop: 2 }}>
              {modalStep === 'mood'
                ? 'How is your heart today?'
                : tab === 'signin'
                ? 'Sign In to Saath'
                : 'Create an Account'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              border: 'none',
              background: 'transparent',
              padding: 8,
              borderRadius: '50%',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {/* STEP 2: MOOD & CALM SANCTUARY QUESTION */}
          {modalStep === 'mood' ? (
            <div>
              <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 0, marginBottom: '1rem', lineHeight: 1.5 }}>
                Choose how you feel right now. You can answer the quiet question below to shape your calm space before entering.
              </p>

              {/* 5 Mood Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: '1.25rem' }}>
                {(['heavy', 'restless', 'tender', 'unsure', 'steady'] as MoodKind[]).map((m) => {
                  const item = MOOD_DATA[m];
                  const isSelected = selectedMood === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMood(m)}
                      style={{
                        padding: '10px 4px',
                        borderRadius: 12,
                        border: isSelected ? '2px solid #526b86' : '1px solid #e2e8f0',
                        background: isSelected ? '#f1f6fa' : '#ffffff',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{item.icon}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#1e293b' : '#64748b' }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* CALM SANCTUARY QUESTION IN POPUP */}
              <div
                style={{
                  background: '#f8faf9',
                  borderRadius: 14,
                  padding: '14px 16px',
                  border: '1px solid rgba(82, 107, 134, 0.18)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', color: '#526b86', textTransform: 'uppercase' }}>
                  <Sparkles size={13} color="#526b86" />
                  <span>Calm Sanctuary Question · {MOOD_DATA[selectedMood].label}</span>
                </div>

                <p
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: '1.02rem',
                    fontStyle: 'italic',
                    color: '#1e293b',
                    margin: '8px 0 6px',
                    lineHeight: 1.4,
                  }}
                >
                  “{MOOD_DATA[selectedMood].calmQuestion}”
                </p>

                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 10px', lineHeight: 1.45 }}>
                  {MOOD_DATA[selectedMood].reassurance}
                </p>

                <textarea
                  value={calmAnswer}
                  onChange={(e) => setCalmAnswer(e.target.value)}
                  placeholder="Take a slow breath and write down whatever comes to mind... (Saved privately in your quiet space)"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    color: '#1e293b',
                    background: '#ffffff',
                    resize: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    lineHeight: 1.45,
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => finalizeAuth(selectedMood, calmAnswer.trim())}
                  className="button full"
                  style={{ padding: '0.85rem', fontWeight: 700, fontSize: '0.92rem' }}
                >
                  {calmAnswer.trim() ? 'Save Answer & Enter Saath' : `Enter Saath (${MOOD_DATA[selectedMood].label})`}
                </button>
                <button
                  type="button"
                  onClick={() => finalizeAuth(selectedMood, '')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    padding: '6px',
                    textAlign: 'center',
                  }}
                >
                  Skip question & enter quietly
                </button>
              </div>
            </div>
          ) : (
            /* STEP 1: AUTHENTICATION */
            <>
              {/* Role Indicator Banner */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '0.75rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {role === 'client' ? (
                    <HeartHandshake size={18} color="#059669" />
                  ) : (
                    <Ear size={18} color="#0284c7" />
                  )}
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                    {role === 'client' ? 'Enrolling as Seeker' : 'Enrolling as Companion'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: 4,
                      border: 'none',
                      background: role === 'client' ? '#059669' : '#e2e8f0',
                      color: role === 'client' ? '#fff' : '#64748b',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Seeker
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('listener')}
                    style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: 4,
                      border: 'none',
                      background: role === 'listener' ? '#0284c7' : '#e2e8f0',
                      color: role === 'listener' ? '#fff' : '#64748b',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Companion
                  </button>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => handleSocialSignIn('google')}
                  disabled={busy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '0.65rem 1rem',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#1e293b',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleSocialSignIn('facebook')}
                    disabled={busy}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '0.65rem 0.75rem',
                      borderRadius: 8,
                      border: '1px solid #1877f2',
                      background: '#1877f2',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: busy ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialSignIn('instagram')}
                    disabled={busy}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '0.65rem 0.75rem',
                      borderRadius: 8,
                      border: '1px solid #e1306c',
                      background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: busy ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    <span>Instagram</span>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
                <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
                <span style={{ padding: '0 0.75rem', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                  or continue with email
                </span>
                <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderRadius: 8, background: '#f1f5f9', padding: 3, marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: tab === 'signin' ? '#ffffff' : 'transparent',
                    color: tab === 'signin' ? '#1e293b' : '#64748b',
                    boxShadow: tab === 'signin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: tab === 'register' ? '#ffffff' : 'transparent',
                    color: tab === 'register' ? '#1e293b' : '#64748b',
                    boxShadow: tab === 'register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  Create Account
                </button>
              </div>

              {/* Notifications */}
              {errorMsg && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '0.6rem 0.75rem',
                    borderRadius: 6,
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fee2e2',
                    color: '#b91c1c',
                    fontSize: '0.82rem',
                    marginBottom: '1rem',
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '0.6rem 0.75rem',
                    borderRadius: 6,
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #d1fae5',
                    color: '#047857',
                    fontSize: '0.82rem',
                    marginBottom: '1rem',
                  }}
                >
                  <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tab === 'register' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                      Full Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#94a3b8' }} />
                      <input
                        type="text"
                        placeholder="e.g. Ankit Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#94a3b8' }} />
                    <input
                      type="email"
                      required
                      placeholder="e.g. you@saath.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#94a3b8' }} />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="button full"
                  style={{ marginTop: '0.4rem', padding: '0.75rem', fontWeight: 700 }}
                >
                  {busy ? 'Processing…' : tab === 'signin' ? 'Sign In & Check In Mood' : 'Next: Check in your mood'}
                </button>
              </form>

              {/* Quick Demo Instant Access */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={13} color="#f59e0b" /> One-Click Demo Access
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="button small quiet"
                    disabled={busy}
                    onClick={() => quickDemo('aarav@saath.org', 'Aarav (Seeker)', 'client')}
                    style={{ flex: 1, fontSize: '0.78rem' }}
                  >
                    Seeker (Aarav)
                  </button>
                  <button
                    type="button"
                    className="button small quiet"
                    disabled={busy}
                    onClick={() => quickDemo('meera@saath.org', 'Meera (Companion)', 'listener')}
                    style={{ flex: 1, fontSize: '0.78rem' }}
                  >
                    Companion (Meera)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
