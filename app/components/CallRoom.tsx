'use client';

import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { api } from '@/lib/client/api';
import type { PublicCall } from '@/lib/application/ports';

type Props = {
  call: PublicCall;
  onChange: (call: PublicCall) => void;
  onEnded: () => void;
  onNotice: (message: string) => void;
};

export default function CallRoom({ call, onChange, onEnded, onNotice }: Props) {
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const localRef = useRef<HTMLAudioElement>(null);
  const remoteRef = useRef<HTMLAudioElement>(null);
  const peer = useRef<RTCPeerConnection | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const seenIce = useRef(new Set<string>());

  useEffect(() => {
    if (call.status === 'ended') return undefined;
    const timer = window.setInterval(() => {
      api<{ call: PublicCall }>(`/api/calls?id=${encodeURIComponent(call.id)}`).then(result => {
        onChange(result.call);
        if (result.call.status === 'ended') {
          teardown();
          onEnded();
        }
      }).catch(() => {});
    }, 2000);
    return () => window.clearInterval(timer);
  }, [call.id, call.status]);

  useEffect(() => () => teardown(), []);

  function teardown() {
    peer.current?.close();
    peer.current = null;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
    setJoined(false);
  }

  async function signal(action: 'join' | 'offer' | 'answer' | 'ice' | 'hangup', extra: { sdp?: string; candidate?: PublicCall['remoteIce'][number] } = {}) {
    const result = await api<{ call: PublicCall }>('/api/calls', 'PATCH', { id: call.id, action, ...extra });
    onChange(result.call);
    return result.call;
  }

  async function join() {
    setBusy(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: call.media === 'video',
      });
      stream.current = media;
      if (localRef.current) localRef.current.srcObject = media;
      if (call.livekit) {
        onNotice('LiveKit is configured. Open that room from a LiveKit client with the issued token. This preview still uses the browser path if the SDK is not loaded.');
      }
      const connection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peer.current = connection;
      media.getTracks().forEach(track => connection.addTrack(track, media));
      connection.ontrack = event => {
        if (remoteRef.current) remoteRef.current.srcObject = event.streams[0];
      };
      connection.onicecandidate = event => {
        if (event.candidate) {
          void signal('ice', {
            candidate: {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
            },
          });
        }
      };
      await signal('join');
      if (call.you === 'host') {
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        await signal('offer', { sdp: offer.sdp });
      } else if (call.offer) {
        await connection.setRemoteDescription({ type: 'offer', sdp: call.offer });
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        await signal('answer', { sdp: answer.sdp });
      }
      setJoined(true);
      onNotice('Microphone is on only for this call. You can hang up at any time.');
    } catch (error) {
      teardown();
      onNotice(error instanceof Error ? error.message : 'The call could not start.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const connection = peer.current;
    if (!connection || !joined) return;
    if (call.you === 'host' && call.answer && !connection.currentRemoteDescription) {
      void connection.setRemoteDescription({ type: 'answer', sdp: call.answer });
    }
    if (call.you === 'guest' && call.offer && !connection.currentRemoteDescription) {
      void (async () => {
        await connection.setRemoteDescription({ type: 'offer', sdp: call.offer });
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        await signal('answer', { sdp: answer.sdp });
      })();
    }
    for (const item of call.remoteIce) {
      if (seenIce.current.has(item.candidate)) continue;
      seenIce.current.add(item.candidate);
      void connection.addIceCandidate(item).catch(() => {});
    }
  }, [call.answer, call.offer, call.remoteIce, joined, call.you]);

  async function hangup() {
    setBusy(true);
    try {
      await signal('hangup');
    } catch (error) {
      onNotice(error instanceof Error ? error.message : 'The call could not end cleanly.');
    } finally {
      teardown();
      onEnded();
      setBusy(false);
    }
  }

  return (
    <section className="plain-panel call-room" aria-labelledby="call-title">
      <span className="eyebrow">{call.media === 'video' ? 'VIDEO CALL' : 'VOICE CALL'}</span>
      <h2 id="call-title">{call.status === 'ended' ? 'Call ended' : call.status === 'ringing' ? 'Calling…' : 'You are in the call.'}</h2>
      <p>
        {call.you === 'host' ? call.guestName : call.hostName} · {call.provider === 'livekit' ? 'LiveKit room when configured' : 'Browser call through Saath'}
        . Nothing is recorded by Saath.
      </p>
      <audio ref={localRef} autoPlay muted />
      <audio ref={remoteRef} autoPlay />
      <div className="inline-actions">
        {!joined && call.status !== 'ended' && (
          <button type="button" className="button" disabled={busy} onClick={() => void join()}>
            <Phone size={16}/> Join this call
          </button>
        )}
        <button type="button" className="outline-button" disabled={busy} onClick={() => void hangup()}>
          <PhoneOff size={16}/> Hang up
        </button>
      </div>
      <p className="small-print">The microphone is requested only after you join. A person has to be on the other side. This is not emergency dispatch.</p>
    </section>
  );
}
