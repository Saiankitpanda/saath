'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';

type Message = { id: string; from: 'you' | 'them'; text: string; at: string };

type Props = {
  requestId: string;
  peerName: string;
  onClose: () => void;
  onNotice: (message: string) => void;
  onOpenAuth?: () => void;
};

export default function StrangerChat({ requestId, peerName, onClose, onNotice, onOpenAuth }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const currentUserIdRef = useRef<string | null>(null);

  const fetchLiveMessages = async () => {
    try {
      const res = await fetch(`/api/chat?requestId=${encodeURIComponent(requestId)}`);
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.currentUserId) currentUserIdRef.current = data.currentUserId;
        if (Array.isArray(data.messages)) {
          const mapped: Message[] = data.messages.map((m: any) => ({
            id: m.id,
            from: currentUserIdRef.current && m.senderId === currentUserIdRef.current ? 'you' : 'them',
            text: m.text,
            at: m.at,
          }));
          setMessages(mapped);
        }
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    void fetchLiveMessages();
    const interval = setInterval(() => {
      void fetchLiveMessages();
    }, 2500);
    return () => clearInterval(interval);
  }, [requestId]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, text }),
      });

      if (res.status === 401) {
        onNotice('Please sign in to send messages.');
        onOpenAuth?.();
        setSending(false);
        return;
      }

      if (res.ok) {
        setDraft('');
        await fetchLiveMessages();
        onNotice('Message delivered.');
      } else {
        const err = (await res.json().catch(() => ({}))) as any;
        onNotice(err.error || 'Failed to deliver message.');
      }
    } catch {
      onNotice('Network issue while sending message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="stranger-chat" aria-labelledby="stranger-chat-title">
      <div className="stranger-chat-head">
        <div>
          <span className="eyebrow">CHAT ROOM · DM</span>
          <h2 id="stranger-chat-title">With {peerName}</h2>
          <p className="small-print">Private, real-time companion connection. Messages are synchronized live between both participants.</p>
        </div>
        <button type="button" className="quiet" onClick={onClose}>Close chat</button>
      </div>
      <div className="stranger-chat-log" aria-live="polite">
        {!messages.length ? (
          <div className="stranger-chat-empty">
            <MessageCircle size={28} strokeWidth={1.3}/>
            <p>Say hello when you are ready. Keep it kind.</p>
          </div>
        ) : messages.map(item => (
          <div key={item.id} className={"stranger-bubble " + item.from}>
            <span>{item.from === 'you' ? 'You' : peerName}</span>
            <p>{item.text}</p>
          </div>
        ))}
      </div>
      <div className="stranger-chat-compose">
        <input
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter') void send(); }}
          maxLength={1000}
          placeholder="Write a message…"
          aria-label="Chat message"
          disabled={sending}
        />
        <button type="button" className="button" disabled={!draft.trim() || sending} onClick={() => void send()}>
          {sending ? 'Sending...' : <>Send <Send size={15}/></>}
        </button>
      </div>
    </section>
  );
}
