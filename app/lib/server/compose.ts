import { env } from 'cloudflare:workers';
import { CallService } from '../application/call-service.ts';
import { ChairService } from '../application/chair-service.ts';
import { ContextService } from '../application/context-service.ts';
import { ProfileService } from '../application/profile-service.ts';
import { RehearsalService } from '../application/rehearsal-service.ts';
import { ReportService } from '../application/report-service.ts';
import { RequestService } from '../application/request-service.ts';
import { StrangerService } from '../application/stranger-service.ts';
import { WordingService } from '../application/wording-service.ts';
import { createFieldCipher } from '../infrastructure/aes-gcm-cipher.ts';
import { D1CallRepository } from '../infrastructure/d1-call-repository.ts';
import { D1ChairRepository } from '../infrastructure/d1-chair-repository.ts';
import { D1ContextRepository } from '../infrastructure/d1-context-repository.ts';
import { D1ProfileRepository } from '../infrastructure/d1-profile-repository.ts';
import { D1ReportRepository } from '../infrastructure/d1-report-repository.ts';
import { D1RequestRepository } from '../infrastructure/d1-request-repository.ts';
import { D1UsageRepository } from '../infrastructure/d1-usage-repository.ts';
import { EncryptedContextRepository, EncryptedRequestRepository } from '../infrastructure/encrypted-repositories.ts';
import { OpenAICompatibleGateway } from '../infrastructure/openai-compatible-gateway.ts';
import {
  MemoryCallRepository,
  MemoryChairRepository,
  MemoryContextRepository,
  MemoryProfileRepository,
  MemoryReportRepository,
  MemoryRequestRepository,
  MemoryUsageRepository,
} from '../infrastructure/memory.ts';
import type {
  CallRepository,
  ChairRepository,
  ContextRepository,
  ProfileRepository,
  ReportRepository,
  RequestRepository,
  UsageRepository,
} from '../application/ports.ts';
import { aiReady } from './ai.ts';
import { voiceConfig, voiceReady } from './voice.ts';

type EncryptionEnv = { CONTEXT_ENCRYPTION_KEY?: string };

// Shared fallback memory repositories for local development and non-Cloudflare environments
const memoryContext = new MemoryContextRepository();
const memoryRequests = new MemoryRequestRepository();
const memoryProfiles = new MemoryProfileRepository();
const memoryReports = new MemoryReportRepository();
const memoryUsage = new MemoryUsageRepository();
const memoryChairs = new MemoryChairRepository();
const memoryCalls = new MemoryCallRepository();

export function createCipher() {
  return createFieldCipher((env as unknown as EncryptionEnv).CONTEXT_ENCRYPTION_KEY);
}

export function encryptionStatus() {
  const atRest = createCipher().configured();
  return {
    atRest,
    endToEnd: false,
    algorithm: atRest ? 'AES-256-GCM' : null,
    detail: atRest
      ? 'Private context, request notes, and Two Chairs notes are encrypted at rest with AES-256-GCM. The server decrypts them for the signed-in owner. This is not end-to-end encryption.'
      : 'CONTEXT_ENCRYPTION_KEY is not configured. Private text is stored as written. This is not end-to-end encryption.',
  };
}

export function backendCapabilities() {
  const encryption = encryptionStatus();
  return {
    persistence: 'd1' as const,
    pairing: true,
    twoChairs: true,
    calling: true,
    aiConfigured: aiReady(),
    voiceConfigured: voiceReady(),
    encryption,
  };
}

export function createServices() {
  const cipher = createCipher();
  let profiles: ProfileRepository;
  let requestRepository: RequestRepository;
  let contextRepository: ContextRepository;
  let callRepository: CallRepository;
  let chairRepository: ChairRepository;
  let reportRepository: ReportRepository;
  let usageRepository: UsageRepository;

  try {
    profiles = new D1ProfileRepository();
    requestRepository = new EncryptedRequestRepository(new D1RequestRepository(), cipher);
    contextRepository = new EncryptedContextRepository(new D1ContextRepository(), cipher);
    callRepository = new D1CallRepository();
    chairRepository = new D1ChairRepository();
    reportRepository = new D1ReportRepository();
    usageRepository = new D1UsageRepository();
  } catch {
    profiles = memoryProfiles;
    requestRepository = new EncryptedRequestRepository(memoryRequests, cipher);
    contextRepository = new EncryptedContextRepository(memoryContext, cipher);
    callRepository = memoryCalls;
    chairRepository = memoryChairs;
    reportRepository = memoryReports;
    usageRepository = memoryUsage;
  }

  const model = new OpenAICompatibleGateway();
  const rehearsal = new RehearsalService(model, usageRepository);
  const calls = new CallService(callRepository, voiceConfig());

  return {
    context: new ContextService(contextRepository),
    requests: new RequestService(
      requestRepository,
      Date.now,
      () => crypto.randomUUID(),
      profiles,
    ),
    strangers: new StrangerService(requestRepository, calls),
    reports: new ReportService(reportRepository),
    rehearsal,
    wording: new WordingService(model),
    profiles: new ProfileService(profiles),
    chairs: new ChairService(
      chairRepository,
      cipher,
      profiles,
      rehearsal,
      Date.now,
      Math.random,
      () => crypto.randomUUID(),
      voiceReady(),
      calls,
    ),
    calls,
    encryption: encryptionStatus(),
  };
}
