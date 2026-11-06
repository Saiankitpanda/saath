'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPin, MessageCircle, Phone, PhoneOff, RefreshCw, Sparkles, Users } from 'lucide-react';
import { nearbyStrangerFixtures } from '@/lib/fixtures';
import { loadStrangerPref, saveStrangerPref } from '@/lib/client/store';
import { labelMood, type MoodKind } from '@/lib/domain';

type Props = {
  auth: boolean;
  onBack: () => void;
  onNotice: (message: string) => void;
  onConnect: (input: {
    peerId: string;
    peerName: string;
    mode: 'voice' | 'chat';
    note: string;
    situation: string;
  }) => void;
};

const radii = [2, 5, 10] as const;
type Phase = 'browse' | 'dialing' | 'connected';

export default function StrangersNearby({ auth, onBack, onNotice, onConnect }: Props) {
  const pref = loadStrangerPref();
  const [radiusKm, setRadiusKm] = useState<(typeof radii)[number]>(5);
  const [situation, setSituation] = useState(pref?.situation || '');
  const [selectedId, setSelectedId] = useState<string | null>(pref?.lastPeerId || null);
  const [mode, setMode] = useState<'voice' | 'chat'>('voice');
  const [autoPicked, setAutoPicked] = useState(false);
  const [phase, setPhase] = useState<Phase>('browse');
  const [ringSeconds, setRingSeconds] = useState(0);

  const nearby = useMemo(() => {
    const base = nearbyStrangerFixtures.filter(item => item.distanceKm <= radiusKm && item.available);
    if (!situation.trim()) return base;
    return [...base].sort((a, b) => {
      const aHit = a.situation.toLowerCase().includes(situation.toLowerCase().split(/\s+/).find(w => w.length > 3) || '') ? 0 : 1;
      const bHit = b.situation.toLowerCase().includes(situation.toLowerCase().split(/\s+/).find(w => w.length > 3) || '') ? 0 : 1;
      if (aHit !== bHit) return aHit - bHit;
      return a.distanceKm - b.distanceKm;
    });
  }, [radiusKm, situation]);

  const sameSituation = useMemo(() => {
    if (!situation.trim()) return nearby.slice(0, 2);
    const words = situation.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    return nearby.filter(item => words.some(word => item.situation.toLowerCase().includes(word))).slice(0, 3);
  }, [nearby, situation]);

  const selected = nearby.find(item => item.id === selectedId)
    || nearbyStrangerFixtures.find(item => item.id === selectedId)
    || null;

  useEffect(() => {
    if (phase !== 'dialing' || !selected) return undefined;
    setRingSeconds(0);
    const peer = selected;
    const dialMode = mode;
    const tick = window.setInterval(() => setRingSeconds(n => n + 1), 1000);
    const done = window.setTimeout(() => {
      setPhase('connected');
      saveStrangerPref({ lastPeerId: peer.id, lastPeerName: peer.name, situation });
      onNotice(
        dialMode === 'voice'
          ? `Connected with ${peer.name}. Open the call when you are ready.`
          : `Connected with ${peer.name}. Open chat when you are ready.`,
      );
    }, 2800);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(done);
    };
    // Intentionally only re-run when dialing starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function autoMatch() {
    const pool = sameSituation.length ? sameSituation : nearby;
    if (!pool.length) {
      onNotice('No strangers in this radius right now. Widen the circle or try again shortly.');
      return;
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setSelectedId(pick.id);
    setAutoPicked(true);
    setPhase('browse');
    saveStrangerPref({ lastPeerId: pick.id, lastPeerName: pick.name, situation });
    onNotice(`${pick.name} is ready nearby. Dial when you want to connect.`);
  }

  function reconnect() {
    if (!pref?.lastPeerId) {
      onNotice('No previous stranger to reconnect with yet.');
      return;
    }
    const found = nearbyStrangerFixtures.find(item => item.id === pref.lastPeerId);
    if (!found || !found.available) {
      onNotice('That person is not available right now. Pick someone new.');
      return;
    }
    setSelectedId(found.id);
    setPhase('browse');
    onNotice(`Ready to dial ${found.name} again.`);
  }

  function startDial(nextMode: 'voice' | 'chat') {
    if (!selected) {
      onNotice('Choose someone from the list first.');
      return;
    }
    if (!auth) {
      onNotice('Sign in to place a live request. Preview dial still shows how the line opens.');
    }
    setMode(nextMode);
    setPhase('dialing');
  }

  function hangUp() {
    setPhase('browse');
    setRingSeconds(0);
    onNotice('Call ended. You can dial again anytime.');
  }

  return (
    <div className="strangers-shell">
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={14} /> Back to Listen
      </button>

      <header className="strangers-hero">
        <div>
          <div className="eyebrow">NEARBY · DIAL TO CONNECT</div>
          <h1>Talk to a stranger<br/>within <em>reach.</em></h1>
          <p>
            Choose someone nearby — or auto-match the same situation — then dial voice or open chat.
            No waiting lobby: the line rings, then connects.
          </p>
        </div>
        <aside className="strangers-aside">
          <Users size={20} strokeWidth={1.5} />
          <h2>How it works</h2>
          <ol>
            <li>Name what you are going through.</li>
            <li>Pick a person in radius (or auto-match).</li>
            <li>Dial voice or chat — reconnect later if you liked them.</li>
          </ol>
        </aside>
      </header>

      {(phase === 'dialing' || phase === 'connected') && selected ? (
        <section className={'strangers-dial' + (phase === 'dialing' ? ' ringing' : ' live')}>
          <div className="strangers-dial-rings" aria-hidden="true">
            <span /><span /><span />
          </div>
          <div className="strangers-dial-avatar">{selected.name.slice(0, 1)}</div>
          <h2>{selected.name}</h2>
          <p>{selected.situation}</p>
          <p className="strangers-dial-status">
            {phase === 'dialing'
              ? `Dialing ${mode === 'voice' ? 'voice' : 'chat'}… ${ringSeconds}s`
              : mode === 'voice'
                ? 'Connected · voice line ready'
                : 'Connected · chat line ready'}
          </p>
          <div className="strangers-dial-actions">
            {phase === 'dialing' ? (
              <button type="button" className="strangers-hangup" onClick={hangUp}>
                <PhoneOff size={18} /> Cancel
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    saveStrangerPref({ lastPeerId: selected.id, lastPeerName: selected.name, situation });
                    onConnect({
                      peerId: selected.id,
                      peerName: selected.name,
                      mode,
                      note: situation || selected.situation,
                      situation: situation || selected.situation,
                    });
                  }}
                >
                  {mode === 'voice' ? <><Phone size={16} /> Open call</> : <><MessageCircle size={16} /> Open chat</>}
                </button>
                <button type="button" className="strangers-hangup" onClick={hangUp}>
                  <PhoneOff size={18} /> End
                </button>
              </>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="strangers-controls plain-panel">
            <label htmlFor="situation">
              What are you going through?
              <textarea
                id="situation"
                value={situation}
                onChange={event => setSituation(event.target.value)}
                maxLength={400}
                rows={3}
                placeholder="e.g. family pressure after work, starting over in a new city…"
              />
            </label>
            <div className="strangers-radius" role="radiogroup" aria-label="Search radius">
              {radii.map(km => (
                <button
                  key={km}
                  type="button"
                  role="radio"
                  aria-checked={radiusKm === km}
                  className={radiusKm === km ? 'selected' : ''}
                  onClick={() => setRadiusKm(km)}
                >
                  <MapPin size={14} /> {km} km
                </button>
              ))}
            </div>
            <div className="strangers-actions">
              <button className="button" type="button" onClick={autoMatch}>
                <Sparkles size={15} /> Auto-match nearby
              </button>
              <button className="outline-button" type="button" onClick={reconnect} disabled={!pref?.lastPeerId}>
                <RefreshCw size={15} /> Reconnect with {pref?.lastPeerName || 'last person'}
              </button>
            </div>
          </section>

          {sameSituation.length > 0 && situation.trim() && (
            <section className="strangers-same plain-panel">
              <div className="eyebrow">SAME SITUATION</div>
              <h2>People carrying something like yours</h2>
              <div className="strangers-same-row">
                {sameSituation.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className={selectedId === item.id ? 'selected' : ''}
                    onClick={() => { setSelectedId(item.id); setAutoPicked(false); }}
                  >
                    <strong>{item.name}</strong>
                    <span>{item.situation}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="strangers-list" aria-label="Strangers in radius">
            <div className="eyebrow">IN RADIUS · {nearby.length} AVAILABLE</div>
            {nearby.map(item => (
              <article
                key={item.id}
                className={'strangers-card' + (selectedId === item.id ? ' selected' : '')}
              >
                <button type="button" className="strangers-card-main" onClick={() => { setSelectedId(item.id); setAutoPicked(false); }}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.distanceKm} km · {labelMood(item.mood as MoodKind)}</span>
                  </div>
                  <p>{item.situation}</p>
                  <div className="strangers-langs">
                    {item.languages.map(lang => <span key={lang}>{lang}</span>)}
                  </div>
                </button>
                <div className="strangers-card-dial">
                  <button type="button" className="strangers-dial-btn voice" onClick={() => { setSelectedId(item.id); startDial('voice'); }} aria-label={`Dial ${item.name}`}>
                    <Phone size={16} /> Dial
                  </button>
                  <button type="button" className="strangers-dial-btn chat" onClick={() => { setSelectedId(item.id); startDial('chat'); }} aria-label={`Chat ${item.name}`}>
                    <MessageCircle size={16} /> Chat
                  </button>
                </div>
              </article>
            ))}
            {!nearby.length && (
              <p className="small-print">No available strangers in this radius. Try 10 km or come back later.</p>
            )}
          </section>

          {selected && (
            <section className="strangers-confirm plain-panel">
              <h2>{autoPicked ? 'Matched' : 'Selected'}: {selected.name}</h2>
              <p>{selected.situation}</p>
              <div className="strangers-confirm-dial">
                <button type="button" className="button" onClick={() => startDial('voice')}>
                  <Phone size={16} /> Dial voice
                </button>
                <button type="button" className="outline-button" onClick={() => startDial('chat')}>
                  <MessageCircle size={16} /> Open chat
                </button>
              </div>
              <p className="small-print">The line rings briefly, then connects. Live pairing needs signup; preview works now.</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
