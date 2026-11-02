import { and, desc, eq, ne, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { callSessions } from '@/db/schema';
import type {
  CallMedia,
  CallProvider,
  CallRecord,
  CallRepository,
  CallSource,
  CallStatus,
  IceCandidate,
  OwnerId,
} from '../application/ports';

function parseIce(value: string): IceCandidate[] {
  try {
    const parsed = JSON.parse(value) as IceCandidate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function asRecord(row: typeof callSessions.$inferSelect): CallRecord {
  return {
    id: row.id,
    code: row.code,
    hostId: row.hostId,
    guestId: row.guestId,
    hostName: row.hostName,
    guestName: row.guestName,
    source: row.source as CallSource,
    sourceId: row.sourceId,
    status: row.status as CallStatus,
    provider: row.provider as CallProvider,
    media: row.media as CallMedia,
    hostSdp: row.hostSdp,
    guestSdp: row.guestSdp,
    hostIce: parseIce(row.hostIce),
    guestIce: parseIce(row.guestIce),
    livekitRoom: row.livekitRoom,
    updatedAt: row.updatedAt,
  };
}

function asValues(record: CallRecord) {
  return {
    id: record.id,
    code: record.code,
    hostId: record.hostId,
    guestId: record.guestId,
    hostName: record.hostName,
    guestName: record.guestName,
    source: record.source,
    sourceId: record.sourceId,
    status: record.status,
    provider: record.provider,
    media: record.media,
    hostSdp: record.hostSdp,
    guestSdp: record.guestSdp,
    hostIce: JSON.stringify(record.hostIce),
    guestIce: JSON.stringify(record.guestIce),
    livekitRoom: record.livekitRoom,
    updatedAt: record.updatedAt,
  };
}

export class D1CallRepository implements CallRepository {
  private readonly db;

  constructor(db = getDb()) {
    this.db = db;
  }

  async findById(id: string): Promise<CallRecord | null> {
    const [row] = await this.db.select().from(callSessions).where(eq(callSessions.id, id));
    return row ? asRecord(row) : null;
  }

  async findByCode(code: string): Promise<CallRecord | null> {
    const [row] = await this.db.select().from(callSessions).where(eq(callSessions.code, code));
    return row ? asRecord(row) : null;
  }

  async findOpenBySource(source: CallSource, sourceId: string): Promise<CallRecord | null> {
    const [row] = await this.db.select().from(callSessions).where(and(
      eq(callSessions.source, source),
      eq(callSessions.sourceId, sourceId),
      ne(callSessions.status, 'ended'),
    ));
    return row ? asRecord(row) : null;
  }

  async listByMember(ownerId: OwnerId): Promise<CallRecord[]> {
    const rows = await this.db
      .select()
      .from(callSessions)
      .where(or(eq(callSessions.hostId, ownerId), eq(callSessions.guestId, ownerId)))
      .orderBy(desc(callSessions.updatedAt))
      .limit(40);
    return rows.map(asRecord);
  }

  async create(record: CallRecord): Promise<CallRecord> {
    await this.db.insert(callSessions).values(asValues(record));
    return record;
  }

  async save(record: CallRecord): Promise<CallRecord> {
    await this.db.update(callSessions).set(asValues(record)).where(eq(callSessions.id, record.id));
    return record;
  }
}
