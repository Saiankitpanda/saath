import fs from 'node:fs';
import path from 'node:path';

export type UserMoodRecord = {
  id: string;
  userId: string;
  mood: string;
  note: string;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE_PATH = path.join(DATA_DIR, 'moods.json');

let store: Record<string, UserMoodRecord[]> = {};
let loaded = false;

function ensureLoaded() {
  if (loaded) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(FILE_PATH)) {
      const raw = fs.readFileSync(FILE_PATH, 'utf-8');
      store = JSON.parse(raw);
    }
  } catch {
    store = {};
  }
  loaded = true;
}

function persist() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // Graceful error handle
  }
}

export function listUserMoods(userId: string): UserMoodRecord[] {
  ensureLoaded();
  return store[userId] || [];
}

export function recordUserMood(userId: string, mood: string, note?: string): UserMoodRecord {
  ensureLoaded();
  const entry: UserMoodRecord = {
    id: `mood-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    mood: mood.toLowerCase(),
    note: (note || '').trim().slice(0, 500),
    createdAt: new Date().toISOString(),
  };

  if (!store[userId]) {
    store[userId] = [];
  }
  store[userId].unshift(entry);

  // Keep last 50 check-ins
  if (store[userId].length > 50) {
    store[userId] = store[userId].slice(0, 50);
  }

  persist();
  return entry;
}

