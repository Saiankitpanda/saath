import { AppError } from './errors.ts';
import type { CallService } from './call-service.ts';
import type { OwnerId, PublicCall, RequestRecord, RequestRepository } from './ports.ts';
import { matchStrangers, type ServerStranger } from '../server/strangers.ts';

export class StrangerService {
  constructor(
    private readonly requests: RequestRepository,
    private readonly calls: CallService,
    private readonly now: () => number = Date.now,
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  list(situation: string) {
    return { strangers: matchStrangers(situation) };
  }

  async autoconnect(ownerId: OwnerId, situation: string): Promise<{
    stranger: ServerStranger;
    strangers: ServerStranger[];
    situation: string;
    call: PublicCall;
  }> {
    if (!ownerId) throw new AppError(401, 'Sign in to connect with a stranger.', 'AUTH_REQUIRED');
    const strangers = matchStrangers(situation);
    const stranger = strangers[0];
    if (!stranger) throw new AppError(404, 'No stranger is available right now.');
    const situationText = situation.trim() || stranger.situation;
    const request: RequestRecord = {
      id: this.createId(),
      ownerId,
      providerId: stranger.id,
      providerName: stranger.name,
      topic: 'Voice with a stranger',
      context: situationText,
      mode: 'voice',
      status: 'accepted',
      createdAt: new Date(this.now()).toISOString(),
    };
    await this.requests.create(request);
    const started = await this.calls.startFromRequest(ownerId, request, 'voice');
    return { stranger, strangers, situation: situationText, call: started.call };
  }
}
