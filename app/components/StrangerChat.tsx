'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';

type Message = { id: string; from: 'you' | 'them'; text: string; at: string };

type Props = {
  requestId: string;
  peerName: string;
  onClose: () => void;
  onNotice: (message: string) => void;
};

function storageKey(requestId: string) {
  return `saath-stranger-chat:${requestId}`;
}

export default function StrangerChat({ requestId, peerName, onClose, onNotice }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(requestId));
      if (raw) setMessages(JSON.parse(raw) as Message[]);
    } catch {
      setMessages([]);
    }
  }, [requestId]);

  function persist(next: Message[]) {
    setMessages(next);
    try {
      window.localStorage.setItem(storageKey(requestId), JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
  }

  function send() {
    const text = draft.trim();
    if (!text) return;
    const next = [
      ...messages,
      { id: crypto.randomUUID(), from: 'you' as const, text, at: new Date().toISOString() },
    ];
    persist(next);
    setDraft('');
    onNotice('Message saved in this chat room on your device. The other person sees it when they open the same connection here.');
  }

  return (
    <section className="stranger-chat" aria-labelledby="stranger-chat-title">
      <div className="stranger-chat-head">
        <div>
          <span className="eyebrow">CHAT ROOM · DM</span>
          <h2 id="stranger-chat-title">With {peerName}</h2>
          <p className="small-print">Private to this accepted connection. Stored in this browser for now — not a public channel.</p>
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
          onKeyDown={event => { if (event.key === 'Enter') send(); }}
          maxLength={1000}
          placeholder="Write a message…"
          aria-label="Chat message"
        />
        <button type="button" className="button" disabled={!draft.trim()} onClick={send}>
          Send <Send size={15}/>
        </button>
      </div>
    </section>
  );
}
