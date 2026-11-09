import { isSampleProviderId } from '../domain.ts';
import { mintLiveKitToken } from '../infrastructure/livekit-token.ts';
import { AppError } from './errors.ts';
import type {
  CallMedia,
  CallRecord,
  CallRepository,
  CallSource,
  ChairRecord,
  IceCandidate,
  OwnerId,
  PublicCall,
  RequestRecord,
} from './ports.ts';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

type VoiceConfig = { url?: string; key?: string; secret?: string };

export function publicCall(record: CallRecord, actorId: OwnerId, livekit: PublicCall['livekit'] = null): PublicCall {
  const you = record.hostId === actorId ? 'host' : 'guest';
  const roomKey = record.code.toLowerCase();
  const dailyUrl = record.livekitRoom?.startsWith('http')
    ? record.livekitRoom
    : `https://meet.jit.si/saath-${roomKey}`;
  const meetLink = 'https://meet.google.com/new?authuser=0';

  return {
    id: record.id,
    code: record.code,
    status: record.status,
    provider: record.provider,
    media: record.media,
    you,
    hostName: record.hostName,
    guestName: record.guestName,
    peerJoined: Boolean(record.hostSdp && record.guestSdp) || record.status === 'active',
    offer: record.hostSdp,
    answer: record.guestSdp,
    remoteIce: you === 'host' ? record.guestIce : record.hostIce,
    livekit,
    dailyUrl,
    meetLink,
    recording: false,
  };
}

export class CallService {
  private readonly calls: CallRepository;
  private readonly voice: VoiceConfig;
  private readonly now: () => number;
  private readonly random: () => number;
  private readonly createId: () => string;

  constructor(
    calls: CallRepository,
    voice: VoiceConfig = {},
    now: () => number = Date.now,
    random: () => number = Math.random,
    createId: () => string = () => crypto.randomUUID(),
  ) {
    this.calls = calls;
    this.voice = voice;
    this.now = now;
    this.random = random;
    this.createId = createId;
  }

  livekitReady() {
    return Boolean(this.voice.url && this.voice.key && this.voice.secret);
  }

  async list(ownerId: OwnerId): Promise<{ calls: PublicCall[] }> {
    const rows = await this.calls.listByMember(ownerId);
    const calls: PublicCall[] = [];
    for (const row of rows) calls.push(await this.present(row, ownerId));
    return { calls };
  }

  async read(ownerId: OwnerId, id: string): Promise<{ call: PublicCall }> {
    return { call: await this.present(await this.requireMember(ownerId, id), ownerId) };
  }

  async startFromChair(ownerId: OwnerId, chair: ChairRecord, media: CallMedia = 'voice'): Promise<{ call: PublicCall }> {
    if (chair.mode !== 'paired') {
      throw new AppError(409, 'A call needs two people on two devices. Same-device and AI chairs stay on text.', 'CALL_NEEDS_PERSON');
    }
    if (!chair.guestId) {
      throw new AppError(409, 'The other person has not joined this room yet.', 'CALL_WAITING');
    }
    if (chair.status === 'closed') throw new AppError(409, 'This Two Chairs room is closed.');
    return this.open(ownerId, {
      source: 'chair',
      sourceId: chair.id,
      hostId: chair.hostId,
      guestId: chair.guestId,
      hostName: chair.hostName,
      guestName: chair.guestName || 'Person B',
      media,
    });
  }

  async startFromRequest(ownerId: OwnerId, request: RequestRecord, media: CallMedia = 'voice'): Promise<{ call: PublicCall }> {
    if (request.status !== 'accepted') throw new AppError(409, 'A call can start only after the listener accepts.', 'CALL_WAITING');
    if (isSampleProviderId(request.providerId)) {
      throw new AppError(409, 'AI personalities cannot take a live call.', 'CALL_NOT_HUMAN');
    }
    const hostId = request.ownerId;
    const guestId = request.providerId;
    if (ownerId !== hostId && ownerId !== guestId) throw new AppError(404, 'That request was not found.');
    return this.open(ownerId, {
      source: 'request',
      sourceId: request.id,
      hostId,
      guestId,
      hostName: 'Caller',
      guestName: request.providerName,
      media,
    });
  }

  async act(
    ownerId: OwnerId,
    input: { id: string; action: 'join' | 'offer' | 'answer' | 'ice' | 'hangup'; sdp?: string; candidate?: IceCandidate },
  ): Promise<{ call: PublicCall }> {
    const row = await this.requireMember(ownerId, input.id);
    if (input.action === 'hangup') {
      return { call: await this.present(await this.calls.save({
        ...row,
        status: 'ended',
        updatedAt: new Date(this.now()).toISOString(),
      }), ownerId) };
    }
    if (row.status === 'ended') throw new AppError(409, 'This call has ended.');
    const you = row.hostId === ownerId ? 'host' : 'guest';
    const next: CallRecord = { ...row, updatedAt: new Date(this.now()).toISOString() };
    if (input.action === 'join') {
      next.status = 'active';
    } else if (input.action === 'offer') {
      if (you !== 'host') throw new AppError(403, 'Only the caller places the offer.');
      next.hostSdp = (input.sdp ?? '').slice(0, 20000);
      next.status = 'active';
    } else if (input.action === 'answer') {
      if (you !== 'guest') throw new AppError(403, 'Only the other person answers the call.');
      next.guestSdp = (input.sdp ?? '').slice(0, 20000);
      next.status = 'active';
    } else if (input.action === 'ice') {
      if (!input.candidate?.candidate) throw new AppError(400, 'An ICE candidate is required.');
      const list = you === 'host' ? [...next.hostIce] : [...next.guestIce];
      list.push({
        candidate: input.candidate.candidate.slice(0, 2000),
        sdpMid: input.candidate.sdpMid ?? null,
        sdpMLineIndex: input.candidate.sdpMLineIndex ?? null,
      });
      if (you === 'host') next.hostIce = list.slice(-40);
      else next.guestIce = list.slice(-40);
    }
    return { call: await this.present(await this.calls.save(next), ownerId) };
  }

  private async open(
    actorId: OwnerId,
    input: {
      source: CallSource;
      sourceId: string;
      hostId: string;
      guestId: string;
      hostName: string;
      guestName: string;
      media: CallMedia;
    },
  ): Promise<{ call: PublicCall }> {
    if (!actorId) throw new AppError(401, 'Sign in to start a call.', 'AUTH_REQUIRED');
    const existing = await this.calls.findOpenBySource(input.source, input.sourceId);
    if (existing) return { call: await this.present(existing, actorId) };
    const livekit = this.livekitReady();
    const record: CallRecord = {
      id: this.createId(),
      code: await this.uniqueCode(),
      hostId: input.hostId,
      guestId: input.guestId,
      hostName: input.hostName.slice(0, 80),
      guestName: input.guestName.slice(0, 80),
      source: input.source,
      sourceId: input.sourceId,
      status: 'ringing',
      provider: livekit ? 'livekit' : 'webrtc',
      media: input.media,
      hostSdp: '',
      guestSdp: '',
      hostIce: [],
      guestIce: [],
      livekitRoom: livekit ? `saath-${input.sourceId.slice(0, 24)}` : '',
      updatedAt: new Date(this.now()).toISOString(),
    };
    return { call: await this.present(await this.calls.create(record), actorId) };
  }

  private async requireMember(ownerId: OwnerId, id: string): Promise<CallRecord> {
    const row = await this.calls.findById(id);
    if (!row || (row.hostId !== ownerId && row.guestId !== ownerId)) {
      throw new AppError(404, 'That call was not found.');
    }
    return row;
  }

  private async present(record: CallRecord, ownerId: OwnerId): Promise<PublicCall> {
    let livekit: PublicCall['livekit'] = null;
    if (record.provider === 'livekit' && this.livekitReady() && record.status !== 'ended') {
      livekit = {
        url: this.voice.url as string,
        room: record.livekitRoom,
        token: await mintLiveKitToken({
          apiKey: this.voice.key as string,
          apiSecret: this.voice.secret as string,
          identity: ownerId,
          name: record.hostId === ownerId ? record.hostName : record.guestName,
          room: record.livekitRoom,
        }),
      };
    }
    return publicCall(record, ownerId, livekit);
  }

  private async uniqueCode() {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      let code = '';
      for (let index = 0; index < 6; index += 1) {
        code += CODE_ALPHABET[Math.floor(this.random() * CODE_ALPHABET.length)];
      }
      if (!(await this.calls.findByCode(code))) return code;
    }
    throw new AppError(500, 'A call code could not be created. Please try again.');
  }
}
