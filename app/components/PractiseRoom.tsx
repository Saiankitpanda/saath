'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Heart,
  Loader2,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
  Settings,
  Smile,
  Sparkles,
  User,
  Video,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { SaathCharacter } from '@/components/SaathCharacter';
import { samplePeople } from '@/lib/fixtures';
import type { Person } from '@/lib/domain';
import {
  speakTextWithFishAudio,
  stopAnySpeech,
  type SpeechStatus,
} from '@/lib/client/fish-audio';
import {
  formatTimeNow,
  getInitialGreeting,
  generateEmpatheticResponse,
  type ChatMessage,
} from '@/lib/client/ai-companion-dialogue';
import './whatsapp-chat.css';

type Props = {
  auth: boolean;
  aiConfigured: boolean;
  privateContext: string;
  onPrivateContextChange: (value: string) => void;
  onNotice: (message: string) => void;
  onOpenAuth?: () => void;
  seed?: {
    situation?: string;
    story?: string;
    goal?: string;
  } | null;
};

const QUICK_FEELING_PROMPTS = [
  { label: 'Anxious & Overwhelmed', prompt: "I've been feeling really anxious and overwhelmed today, like everything is piling up." },
  { label: 'Practice Tough Talk', prompt: "I have a difficult conversation coming up and I need to practice how to say what I feel." },
  { label: 'Feeling Lonely', prompt: "I've been feeling quite lonely lately, even when surrounded by people." },
  { label: 'Work & Study Stress', prompt: "Work and deadlines are putting immense pressure on me and I feel burned out." },
  { label: 'Family Tension', prompt: "There is some family tension and expectations that feel very heavy right now." },
  { label: 'Need a Safe Space', prompt: "I don't know where to start, but I just needed a quiet space to put my thoughts into words." },
];

export default function PractiseRoom({
  auth,
  aiConfigured: _aiConfigured,
  privateContext,
  onPrivateContextChange: _onPrivateContextChange,
  onNotice,
  seed = null,
  onOpenAuth: _onOpenAuth,
}: Props) {
  // 1. Selected AI Personality state
  const [selectedPersona, setSelectedPersona] = useState<Person | null>(() => {
    if (seed?.story) {
      const match = samplePeople.find(p => seed.story?.toLowerCase().includes(p.name.toLowerCase()));
      if (match) return match;
    }
    return null;
  });

  // 2. Chat messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // 3. Fish Audio voice state
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>('idle');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [fishKey, setFishKey] = useState('');
  const [fishVoiceId, setFishVoiceId] = useState('');
  const [tempFishKey, setTempFishKey] = useState('');
  const [tempFishVoiceId, setTempFishVoiceId] = useState('');

  // 4. Category filter for personalities gallery
  const [activeFilter, setActiveFilter] = useState<'all' | 'relationships' | 'work' | 'slow' | 'family'>('all');

  // Load saved voice settings
  useEffect(() => {
    try {
      const savedAuto = localStorage.getItem('saath_fish_audio_autospeak');
      if (savedAuto) setAutoSpeak(savedAuto === '1');
      const savedKey = localStorage.getItem('saath_fish_audio_key') || '';
      setFishKey(savedKey);
      setTempFishKey(savedKey);
      const savedVoice = localStorage.getItem('saath_fish_audio_voice_id') || '';
      setFishVoiceId(savedVoice);
      setTempFishVoiceId(savedVoice);
    } catch {}
    return () => {
      stopAnySpeech();
    };
  }, []);

  // When persona changes, initialize conversation
  useEffect(() => {
    if (!selectedPersona) {
      setMessages([]);
      return;
    }

    const initialGreeting = getInitialGreeting(selectedPersona);
    const greetingMsg: ChatMessage = {
      id: `ai-init-${Date.now()}`,
      sender: 'ai',
      text: initialGreeting,
      time: formatTimeNow(),
    };

    setMessages([greetingMsg]);

    // If autoSpeak is on, play initial greeting
    if (autoSpeak) {
      void playVoice(greetingMsg.text, greetingMsg.id);
    }
  }, [selectedPersona]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  function handleSelectPersona(persona: Person) {
    setSelectedPersona(persona);
    onNotice(`Connected with ${persona.name}. WhatsApp-style safe conversation is ready.`);
  }

  function handleToggleAutoSpeak() {
    const next = !autoSpeak;
    setAutoSpeak(next);
    try {
      localStorage.setItem('saath_fish_audio_autospeak', next ? '1' : '0');
    } catch {}
    if (next) {
      onNotice('Fish Audio auto-voice enabled. Replies will be spoken aloud.');
    } else {
      stopAnySpeech();
      setSpeakingMsgId(null);
      setSpeechStatus('idle');
      onNotice('Voice muted.');
    }
  }

  function handleSaveVoiceSettings() {
    setFishKey(tempFishKey.trim());
    setFishVoiceId(tempFishVoiceId.trim());
    try {
      if (tempFishKey.trim()) localStorage.setItem('saath_fish_audio_key', tempFishKey.trim());
      else localStorage.removeItem('saath_fish_audio_key');
      if (tempFishVoiceId.trim()) localStorage.setItem('saath_fish_audio_voice_id', tempFishVoiceId.trim());
      else localStorage.removeItem('saath_fish_audio_voice_id');
    } catch {}
    setShowVoiceSettings(false);
    onNotice('Fish Audio voice settings saved.');
  }

  async function playVoice(text: string, msgId: string) {
    if (speakingMsgId === msgId && speechStatus === 'playing') {
      stopAnySpeech();
      setSpeakingMsgId(null);
      setSpeechStatus('idle');
      return;
    }

    setSpeakingMsgId(msgId);
    setSpeechStatus('loading');

    try {
      await speakTextWithFishAudio(text, {
        customKey: fishKey.trim() || undefined,
        voiceId: fishVoiceId.trim() || undefined,
        onStatusChange: (status: SpeechStatus) => setSpeechStatus(status),
      });
    } catch {
      setSpeechStatus('idle');
      setSpeakingMsgId(null);
      onNotice('Voice playback completed or browser audio used.');
    }
  }

  async function handleSendMessage(textToSend?: string) {
    const text = (textToSend || inputText).trim();
    if (!text || !selectedPersona || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: formatTimeNow(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Simulate realistic typing pause (700ms - 1300ms) for natural feel
      await new Promise(r => setTimeout(r, 900));

      const aiReplyText = await generateEmpatheticResponse(text, messages, selectedPersona);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReplyText,
        time: formatTimeNow(),
      };

      setMessages(prev => [...prev, aiMsg]);

      // If auto-voice is active, speak the reply
      if (autoSpeak) {
        void playVoice(aiReplyText, aiMsg.id);
      }
    } catch {
      onNotice('Could not generate response. Please try again.');
    } finally {
      setIsTyping(false);
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    void handleSendMessage();
  }

  // Filter companions
  const filteredPeople = samplePeople.filter(p => {
    if (activeFilter === 'all') return true;
    return p.category === activeFilter;
  });

  // ==========================================
  // VIEW 1: SELECT AI PERSONALITY
  // ==========================================
  if (!selectedPersona) {
    return (
      <div className="wa-persona-gallery">
        <div className="wa-persona-hero">
          <div className="eyebrow" style={{ color: '#00a884', fontWeight: 600, letterSpacing: '0.08em' }}>
            WHATSAPP-STYLE AI COMPANIONS
          </div>
          <h2>Choose a Companion to Talk or Practise With</h2>
          <p>
            Connect directly with an empathetic AI personality. Describe your feelings, unpack your emotions,
            or practice a difficult conversation in a natural, judgment-free WhatsApp chat.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['all', 'relationships', 'work', 'slow', 'family'] as const).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveFilter(cat)}
              className={activeFilter === cat ? 'button small' : 'outline-button small'}
              style={{
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 13,
                textTransform: 'capitalize',
                background: activeFilter === cat ? '#00a884' : undefined,
                borderColor: activeFilter === cat ? '#00a884' : undefined,
              }}
            >
              {cat === 'all' ? 'All Companions' : cat === 'slow' ? 'Slow & Gentle' : cat === 'work' ? 'Work & Studies' : cat}
            </button>
          ))}
        </div>

        {/* Companions Grid */}
        <div className="wa-persona-grid">
          {filteredPeople.map(person => (
            <div key={person.id} className="wa-persona-card">
              <div className="wa-card-header">
                <div className="wa-card-avatar">
                  <SaathCharacter name={person.characterKey || 'mira'} size={64} alt={person.name} />
                </div>
                <div className="wa-card-title-group">
                  <h3>{person.name}</h3>
                  <span className="wa-card-specialty">{person.specialty}</span>
                </div>
              </div>

              <p className="wa-card-quote">"{person.quote}"</p>
              <p className="wa-card-intro">{person.intro}</p>

              <div className="wa-card-languages">
                {person.languages.map(lang => (
                  <span key={lang} className="wa-lang-tag">
                    {lang === 'Hindi' ? 'हिन्दी' : lang}
                  </span>
                ))}
              </div>

              <button
                type="button"
                className="wa-connect-btn"
                onClick={() => handleSelectPersona(person)}
              >
                <MessageCircle size={17} /> Start Chat on WhatsApp
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: WHATSAPP-STYLE CONVERSATION
  // ==========================================
  return (
    <div className="wa-container">
      {/* WhatsApp Header */}
      <header className="wa-header">
        <div className="wa-header-left">
          <button
            type="button"
            className="wa-back-btn"
            onClick={() => {
              stopAnySpeech();
              setSelectedPersona(null);
            }}
            title="Switch companion"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="wa-avatar-wrap">
            <SaathCharacter
              name={selectedPersona.characterKey || 'mira'}
              size={44}
              alt={selectedPersona.name}
              className="wa-avatar-img"
            />
            <span className="wa-online-dot" />
          </div>
          <div className="wa-header-info">
            <span className="wa-header-name">{selectedPersona.name}</span>
            <span className={`wa-header-status ${isTyping ? 'typing' : ''}`}>
              {isTyping ? 'typing…' : 'online · empathetic companion'}
            </span>
          </div>
        </div>

        <div className="wa-header-actions">
          {/* Fish Audio Auto-Voice Toggle */}
          <button
            type="button"
            className={`wa-header-icon-btn ${autoSpeak ? 'active' : ''}`}
            onClick={handleToggleAutoSpeak}
            title={autoSpeak ? 'Auto-voice is ON (Fish Audio)' : 'Turn ON Auto-voice (Fish Audio)'}
          >
            {autoSpeak ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>

          {/* Voice Settings Gear */}
          <button
            type="button"
            className="wa-header-icon-btn"
            onClick={() => setShowVoiceSettings(true)}
            title="AI Voice & Fish Audio Settings"
          >
            <Settings size={18} />
          </button>

          {/* Reset / Clear Chat */}
          <button
            type="button"
            className="wa-header-icon-btn"
            onClick={() => {
              stopAnySpeech();
              const init = getInitialGreeting(selectedPersona);
              setMessages([
                {
                  id: `ai-init-${Date.now()}`,
                  sender: 'ai',
                  text: init,
                  time: formatTimeNow(),
                },
              ]);
              onNotice('Chat restarted fresh.');
            }}
            title="Restart conversation"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </header>

      {/* WhatsApp Chat Canvas */}
      <div className="wa-chat-canvas" ref={chatScrollRef}>
        {/* Security & Privacy Banner */}
        <div className="wa-badge-row">
          <div className="wa-security-pill">
            🔒 <strong>Private & Confidential.</strong> Your words with {selectedPersona.name} stay safe in this
            session. Describe feelings, unpack emotions, or rehearse freely.
          </div>
        </div>

        {/* Date Pill */}
        <div className="wa-badge-row">
          <span className="wa-date-pill">Today</span>
        </div>

        {/* Messages List */}
        {messages.map(msg => (
          <div key={msg.id} className={`wa-msg-row ${msg.sender === 'ai' ? 'incoming' : 'outgoing'}`}>
            <div className={`wa-msg-bubble ${msg.sender === 'ai' ? 'incoming' : 'outgoing'}`}>
              {msg.sender === 'ai' && (
                <div className="wa-sender-label">{selectedPersona.name}</div>
              )}
              <div className="wa-msg-text">{msg.text}</div>
              <div className={`wa-msg-footer ${msg.sender === 'ai' ? 'with-audio' : ''}`}>
                {msg.sender === 'ai' ? (
                  <>
                    <button
                      type="button"
                      className="wa-tts-btn"
                      onClick={() => void playVoice(msg.text, msg.id)}
                      title="Speak with Fish Audio voice"
                    >
                      {speakingMsgId === msg.id && speechStatus === 'loading' ? (
                        <>
                          <Loader2 size={11} className="spin" /> Loading…
                        </>
                      ) : speakingMsgId === msg.id && speechStatus === 'playing' ? (
                        <>
                          <VolumeX size={11} /> Stop
                        </>
                      ) : (
                        <>
                          <Volume2 size={11} /> Speak
                        </>
                      )}
                    </button>
                    <span>{msg.time}</span>
                  </>
                ) : (
                  <>
                    <span>{msg.time}</span>
                    <span className="wa-ticks">✓✓</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Animated Typing Indicator */}
        {isTyping && (
          <div className="wa-msg-row incoming">
            <div className="wa-typing-bubble">
              <span className="wa-dot" />
              <span className="wa-dot" />
              <span className="wa-dot" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Feeling Chips Bar */}
      <div className="wa-feelings-strip">
        {QUICK_FEELING_PROMPTS.map(p => (
          <button
            key={p.label}
            type="button"
            className="wa-feeling-chip"
            onClick={() => void handleSendMessage(p.prompt)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* WhatsApp Message Input Footer */}
      <form className="wa-input-footer" onSubmit={handleFormSubmit}>
        <input
          type="text"
          className="wa-input-pill"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={`Message ${selectedPersona.name} or describe how you feel…`}
          disabled={isTyping}
        />
        <button
          type="submit"
          className="wa-send-btn"
          disabled={!inputText.trim() || isTyping}
          title="Send message"
        >
          {isTyping ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
        </button>
      </form>

      {/* Fish Audio Voice Settings Modal */}
      {showVoiceSettings && (
        <div className="modal-backdrop" onClick={() => setShowVoiceSettings(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 440 }}
          >
            <button className="modal-close" onClick={() => setShowVoiceSettings(false)}>
              <X size={18} />
            </button>
            <div className="eyebrow" style={{ color: '#00a884', fontWeight: 600 }}>
              AI VOICE & FISH AUDIO
            </div>
            <h2 style={{ fontSize: 18, marginTop: 4, marginBottom: 8 }}>Companion Voice Settings</h2>
            <p className="small-print" style={{ marginBottom: 16 }}>
              Fish Audio delivers expressive, neural voice synthesis. Leave blank to use server environment key
              or browser voice.
            </p>

            <label style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
              Fish Audio API Key
              <input
                type="password"
                value={tempFishKey}
                onChange={e => setTempFishKey(e.target.value)}
                placeholder="Paste your Fish Audio API Key"
                style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
              Reference Voice ID (optional)
              <input
                type="text"
                value={tempFishVoiceId}
                onChange={e => setTempFishVoiceId(e.target.value)}
                placeholder="e.g. 7f92f8afb8ec43bf81429cc1c9199cb1"
                style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
              <span className="small-print" style={{ color: '#64748b' }}>
                Select or clone any voice ID from the fish.audio dashboard.
              </span>
            </label>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                type="button"
                className="outline-button"
                onClick={() =>
                  void playVoice('Hello, this is Fish Audio speaking with your chosen companion voice.', 'test')
                }
              >
                <Volume2 size={13} /> Test Voice
              </button>
              <button
                type="button"
                className="button"
                style={{ background: '#00a884', borderColor: '#00a884' }}
                onClick={handleSaveVoiceSettings}
              >
                Save Settings
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
