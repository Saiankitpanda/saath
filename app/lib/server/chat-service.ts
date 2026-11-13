import fs from 'node:fs';
import path from 'node:path';

export type ChatMessage = {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  text: string;
  at: string;
};

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE_PATH = path.join(DATA_DIR, 'chats.json');

// In-memory cache for ultra-fast access
let memoryStore: Record<string, ChatMessage[]> = {};
let loaded = false;

function ensureLoaded() {
  if (loaded) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(FILE_PATH)) {
      const raw = fs.readFileSync(FILE_PATH, 'utf-8');
      memoryStore = JSON.parse(raw);
    }
  } catch {
    memoryStore = {};
  }
  loaded = true;
}

function persistToFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(FILE_PATH, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch {
    // Gracefully handle file system errors in serverless environments
  }
}

export function listChatMessages(requestId: string): ChatMessage[] {
  ensureLoaded();
  return memoryStore[requestId] || [];
}

export function appendChatMessage(
  requestId: string,
  senderId: string,
  senderName: string,
  text: string
): ChatMessage {
  ensureLoaded();
  const cleanText = text.trim().slice(0, 1000);
  const msg: ChatMessage = {
    id: crypto.randomUUID(),
    requestId,
    senderId,
    senderName,
    text: cleanText,
    at: new Date().toISOString(),
  };

  if (!memoryStore[requestId]) {
    memoryStore[requestId] = [];
  }
  memoryStore[requestId].push(msg);

  // Keep last 200 messages per conversation
  if (memoryStore[requestId].length > 200) {
    memoryStore[requestId] = memoryStore[requestId].slice(-200);
  }

  persistToFile();
  return msg;
}

