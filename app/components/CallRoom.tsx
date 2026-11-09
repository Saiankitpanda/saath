'use client';

import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { api } from '@/lib/client/api';
import type { PublicCall } from '@/lib/application/ports';

type Props = {
  call: PublicCall;
  onChange: (call: PublicCall) => void;
  onEnded: () => void;
  onNotice: (message: string) => void;
};

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
  { urls: ['stun:stun.cloudflare.com:3478'] },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelay',
    credential: 'openrelay',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelay',
    credential: 'openrelay',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelay',
    credential: 'openrelay',
  },
];

export default function CallRoom({ call, onChange, onEnded, onNotice }: Props) {
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peer = useRef<RTCPeerConnection | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const seenIce = useRef(new Set<string>());
  const isVideo = call.media === 'video';

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
        video: isVideo,
      });
      stream.current = media;
      if (isVideo) {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = media;
          void localVideoRef.current.play().catch(() => {});
        }
      } else if (localAudioRef.current) {
        localAudioRef.current.srcObject = media;
      }
      if (call.livekit) {
        onNotice('LiveKit is configured. This preview still uses the browser Meet-style path if the SDK is not loaded.');
      }
      const connection = new RTCPeerConnection({ iceServers: DEFAULT_ICE_SERVERS });
      peer.current = connection;
      media.getTracks().forEach(track => connection.addTrack(track, media));
      connection.ontrack = event => {
        const remote = event.streams[0];
        if (isVideo && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remote;
          void remoteVideoRef.current.play().catch(() => {});
        } else if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remote;
        }
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
      onNotice(isVideo
        ? 'Camera and microphone are on only for this call. Hang up anytime.'
        : 'Microphone is on only for this call. You can hang up at any time.');
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
    <section className={"call-room meet-room " + (isVideo ? 'video' : 'voice')} aria-labelledby="call-title">
      <div className="meet-room-head">
        <span className="eyebrow">{isVideo ? 'VIDEO CALL · MEET STYLE' : 'VOICE CALL · MEET STYLE'}</span>
        <h2 id="call-title">{call.status === 'ended' ? 'Call ended' : call.status === 'ringing' ? 'Calling…' : 'You are in the room.'}</h2>
        <p>
          {call.you === 'host' ? call.guestName : call.hostName}
          . Browser WebRTC through Saath. Nothing is recorded by Saath.
        </p>
      </div>
      {isVideo ? (
        <div className="meet-stage">
          <div className="meet-tile remote">
            <video ref={remoteVideoRef} autoPlay playsInline />
            <span>{call.you === 'host' ? call.guestName : call.hostName}</span>
          </div>
          <div className="meet-tile local">
            <video ref={localVideoRef} autoPlay playsInline muted />
            <span>You</span>
          </div>
        </div>
      ) : (
        <div className="meet-voice-stage">
          <div className="meet-voice-orb"><Phone size={28}/></div>
          <p>Voice only. Camera stays off.</p>
          <audio ref={localAudioRef} autoPlay muted />
          <audio ref={remoteAudioRef} autoPlay />
        </div>
      )}
      <div className="inline-actions meet-actions">
        {!joined && call.status !== 'ended' && (
          <button type="button" className="button" disabled={busy} onClick={() => void join()}>
            {isVideo ? <Video size={16}/> : <Phone size={16}/>} Join
          </button>
        )}
        <button type="button" className="outline-button" disabled={busy} onClick={() => void hangup()}>
          <PhoneOff size={16}/> Hang up
        </button>
      </div>
      <p className="small-print">Mic{isVideo ? ' and camera' : ''} are requested only after Join. A person has to be on the other side.</p>
    </section>
  );
}
