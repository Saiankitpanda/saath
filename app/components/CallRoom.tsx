'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Monitor,
  Phone,
  PhoneOff,
  Video,
} from 'lucide-react';
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
  const [videoTab, setVideoTab] = useState<'daily' | 'webrtc' | 'meet'>('daily');
  const [copiedLink, setCopiedLink] = useState(false);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peer = useRef<RTCPeerConnection | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const seenIce = useRef(new Set<string>());
  const isVideo = call.media === 'video';

  const dailyRoomUrl =
    call.dailyUrl || `https://meet.jit.si/saath-${call.code.toLowerCase()}`;
  const googleMeetUrl = call.meetLink || 'https://meet.google.com/new';

  function copyMeetingLink(url: string, label: string) {
    try {
      void navigator.clipboard.writeText(url);
      setCopiedLink(true);
      onNotice(`${label} copied to clipboard! Share it with the other person.`);
      window.setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      onNotice('Could not copy automatically. Please copy the link manually.');
    }
  }

  function openPopupRoom(url: string, title: string) {
    const width = 1100;
    const height = 750;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(
      url,
      title,
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
    );
    onNotice(`${title} launched in a clean dedicated window.`);
  }

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
          . {isVideo ? 'Encrypted Video Room with Daily.co / Google Meet / WebRTC' : 'Browser WebRTC through Saath. Nothing is recorded.'}
        </p>

        {isVideo && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
              marginTop: 12,
              marginBottom: 8,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              className={"outline-button " + (videoTab === 'daily' ? 'active' : '')}
              onClick={() => setVideoTab('daily')}
              style={{
                fontSize: 12,
                padding: '5px 12px',
                borderRadius: 20,
                background: videoTab === 'daily' ? '#f0fdf4' : 'transparent',
                borderColor: videoTab === 'daily' ? '#22c55e' : '#cbd5e1',
                color: videoTab === 'daily' ? '#15803d' : 'inherit',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🎥 Daily.co HD Room
            </button>
            <button
              type="button"
              className={"outline-button " + (videoTab === 'webrtc' ? 'active' : '')}
              onClick={() => setVideoTab('webrtc')}
              style={{
                fontSize: 12,
                padding: '5px 12px',
                borderRadius: 20,
                background: videoTab === 'webrtc' ? '#eff6ff' : 'transparent',
                borderColor: videoTab === 'webrtc' ? '#3b82f6' : '#cbd5e1',
                color: videoTab === 'webrtc' ? '#1d4ed8' : 'inherit',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🌐 In-Browser WebRTC
            </button>
            <button
              type="button"
              className={"outline-button " + (videoTab === 'meet' ? 'active' : '')}
              onClick={() => setVideoTab('meet')}
              style={{
                fontSize: 12,
                padding: '5px 12px',
                borderRadius: 20,
                background: videoTab === 'meet' ? '#fefce8' : 'transparent',
                borderColor: videoTab === 'meet' ? '#eab308' : '#cbd5e1',
                color: videoTab === 'meet' ? '#a16207' : 'inherit',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🟢 Google Meet
            </button>
          </div>
        )}
      </div>

      {isVideo ? (
        <>
          {videoTab === 'daily' && (
            <div style={{ marginTop: 12, marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>
                  Daily.co Embedded HD Video Stage
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="outline-button"
                    onClick={() => copyMeetingLink(dailyRoomUrl, 'Daily Video Room Link')}
                    style={{ fontSize: 11, padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    {copiedLink ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    type="button"
                    className="outline-button"
                    onClick={() => openPopupRoom(dailyRoomUrl, 'Daily HD Video Room')}
                    style={{ fontSize: 11, padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <ExternalLink size={12} /> Pop out
                  </button>
                </div>
              </div>

              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '520px',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#0f172a',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                }}
              >
                <iframe
                  src={dailyRoomUrl}
                  title="Daily.co Video Session"
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {videoTab === 'meet' && (
            <div
              style={{
                marginTop: 16,
                marginBottom: 16,
                padding: '28px 20px',
                borderRadius: 12,
                background: '#fafafa',
                border: '1px solid #e5e7eb',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#fef2f2',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Video size={28} color="#ea4335" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
                Google Meet Video Calling
              </h3>
              <p style={{ fontSize: 13, color: '#4b5563', maxWidth: 460, margin: '0 auto 18px' }}>
                Launch a high-definition meeting directly on Google Meet with real-time video, captions, and screen sharing.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="button"
                  onClick={() => openPopupRoom(googleMeetUrl, 'Google Meet Call')}
                  style={{
                    background: '#1a73e8',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 18px',
                    fontSize: 13,
                  }}
                >
                  <ExternalLink size={14} /> Open in Google Meet
                </button>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => copyMeetingLink(googleMeetUrl, 'Google Meet link')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
                >
                  {copiedLink ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Meet Link'}</span>
                </button>
              </div>
            </div>
          )}

          {videoTab === 'webrtc' && (
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
          )}
        </>
      ) : (
        <div className="meet-voice-stage">
          <div className="meet-voice-orb"><Phone size={28}/></div>
          <p>Voice only. Camera stays off.</p>
          <audio ref={localAudioRef} autoPlay muted />
          <audio ref={remoteAudioRef} autoPlay />
        </div>
      )}

      <div className="inline-actions meet-actions">
        {(!joined || (isVideo && videoTab === 'webrtc')) && call.status !== 'ended' && (
          <button type="button" className="button" disabled={busy} onClick={() => void join()}>
            {isVideo ? <Video size={16}/> : <Phone size={16}/>} {isVideo ? 'Turn on WebRTC Camera' : 'Join Voice Line'}
          </button>
        )}
        <button type="button" className="outline-button" disabled={busy} onClick={() => void hangup()}>
          <PhoneOff size={16}/> End Session
        </button>
      </div>
      <p className="small-print">
        {isVideo
          ? 'Use Daily.co embedded player above, Google Meet in new window, or WebRTC tiles.'
          : 'Microphone is requested only after Join. A person has to be on the other side.'}
      </p>
    </section>
  );
}
