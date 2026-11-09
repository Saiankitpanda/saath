'use client';

import { useState } from 'react';
import { X, Phone, Heart, Globe, AlertTriangle, ShieldAlert } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type Hotline = {
  name: string;
  number: string;
  tel: string;
  available: string;
  description: string;
  badge?: string;
};

const HOTLINES_BY_REGION: Record<string, { label: string; resources: Hotline[] }> = {
  in: {
    label: 'India (भारत)',
    resources: [
      {
        name: 'Tele-MANAS (Govt. of India)',
        number: '14416 / 1800 891 4416',
        tel: 'tel:14416',
        available: '24/7 · Toll-free · 20+ languages',
        description: 'National tele-mental health programme run by NIMHANS with certified clinical psychologists.',
        badge: 'Official Govt',
      },
      {
        name: 'Vandrevala Foundation',
        number: '+91 9999 666 555',
        tel: 'tel:+919999666555',
        available: '24/7 · Free & Confidential',
        description: 'Immediate counseling for deep distress, panic, grief, and crisis intervention via phone or WhatsApp.',
      },
      {
        name: 'KIRAN (Govt. Helpline)',
        number: '1800 599 0019',
        tel: 'tel:18005990019',
        available: '24/7 · Toll-free',
        description: 'Dedicated psychological support, crisis management, and emotional well-being helpline.',
      },
      {
        name: 'AASRA Helpline',
        number: '+91 98204 66726',
        tel: 'tel:+919820466726',
        available: '24/7 · Confidential',
        description: 'Compassionate, non-judgmental crisis intervention and suicide prevention service.',
      },
    ],
  },
  us: {
    label: 'United States & Canada',
    resources: [
      {
        name: '988 Suicide & Crisis Lifeline',
        number: '988',
        tel: 'tel:988',
        available: '24/7 · Call or Text',
        description: 'Free and confidential support for anyone in suicidal crisis or emotional distress.',
        badge: 'Official 988',
      },
      {
        name: 'Crisis Text Line',
        number: 'Text HOME to 741741',
        tel: 'sms:741741?body=HOME',
        available: '24/7 · Free SMS Support',
        description: 'Connect with a trained volunteer crisis counselor via text message.',
      },
      {
        name: 'The Trevor Project (LGBTQ+ Youth)',
        number: '1-866-488-7386',
        tel: 'tel:18664887386',
        available: '24/7 · Call or Text START to 678-678',
        description: 'Confidential suicide prevention and crisis intervention for LGBTQ young people.',
      },
    ],
  },
  uk: {
    label: 'United Kingdom',
    resources: [
      {
        name: 'Samaritans',
        number: '116 123',
        tel: 'tel:116123',
        available: '24/7 · Free from any phone',
        description: 'Whatever you are going through, a Samaritan will face it with you.',
      },
      {
        name: 'NHS Urgent Mental Health',
        number: '111',
        tel: 'tel:111',
        available: '24/7',
        description: 'Advice and support for mental health emergencies from medical professionals.',
      },
    ],
  },
};

export default function CrisisModal({ isOpen, onClose }: Props) {
  const [region, setRegion] = useState<'in' | 'us' | 'uk'>('in');

  if (!isOpen) return null;

  const currentGroup = HOTLINES_BY_REGION[region];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
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
      aria-labelledby="crisis-modal-title"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Urgent Alert Banner */}
        <div
          style={{
            background: '#fee2e2',
            borderBottom: '1px solid #fecaca',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <ShieldAlert size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <h2
              id="crisis-modal-title"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: '1.25rem',
                color: '#991b1b',
                margin: 0,
                fontWeight: 700,
              }}
            >
              You do not have to carry this alone.
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#b91c1c', margin: '4px 0 0', lineHeight: 1.45 }}>
              If you or someone you know is in immediate danger, experiencing acute distress, or thinking about self-harm, please connect with a free, confidential professional right now.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              border: 'none',
              background: 'transparent',
              padding: 6,
              borderRadius: '50%',
              cursor: 'pointer',
              color: '#991b1b',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Region Selector */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            background: '#fafaf9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={14} /> Select your country:
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['in', 'us', 'uk'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                style={{
                  fontSize: '0.78rem',
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: region === r ? '1px solid #dc2626' : '1px solid #cbd5e1',
                  background: region === r ? '#dc2626' : '#ffffff',
                  color: region === r ? '#ffffff' : '#334155',
                  fontWeight: region === r ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {HOTLINES_BY_REGION[r].label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Hotlines List */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {currentGroup.resources.map((item, idx) => (
            <div
              key={idx}
              style={{
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                transition: 'box-shadow 0.2s',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>
                    {item.name}
                  </span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: '#dcfce7',
                        color: '#15803d',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 600, marginTop: 2 }}>
                  {item.available}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>
                  {item.description}
                </div>
              </div>

              <a
                href={item.tel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 14px',
                  borderRadius: 10,
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  flexShrink: 0,
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
                }}
              >
                <Phone size={14} /> Call
              </a>
            </div>
          ))}
        </div>

        {/* Legal Disclaimer Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            fontSize: '0.72rem',
            color: '#64748b',
            lineHeight: 1.5,
          }}
        >
          <strong>Please Note:</strong> Saath is a gentle, community-oriented companion and active-listening space. It is not an emergency medical facility, psychiatric hospital, or substitute for professional medical care.
        </div>
      </div>
    </div>
  );
}

