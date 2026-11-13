import fs from 'node:fs';
import path from 'node:path';
import { sampleCirclePosts } from '@/lib/fixtures';

export type ServerCirclePost = {
  id: string;
  circleId: string;
  authorId: string;
  authorName: string;
  mention: string;
  body: string;
  explanation: string;
  createdAt: string;
};

export type ServerCircleComment = {
  id: string;
  circleId: string;
  secretId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type ServerStoryReply = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  understanding: string;
  similarStory?: string;
  createdAt: string;
};

type CirclesData = {
  posts: Record<string, ServerCirclePost[]>;
  comments: Record<string, ServerCircleComment[]>;
  replies: Record<string, ServerStoryReply[]>;
};

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE_PATH = path.join(DATA_DIR, 'circles.json');

let store: CirclesData = {
  posts: {},
  comments: {},
  replies: {},
};
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
    store = { posts: {}, comments: {}, replies: {} };
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

export function getCirclePosts(circleId: string): ServerCirclePost[] {
  ensureLoaded();
  const dbPosts = store.posts[circleId] || [];
  // Merge with initial domain fixtures so the feed is never sterile
  const fixtures = sampleCirclePosts
    .filter(item => item.circleId === circleId)
    .map(f => ({
      id: f.id,
      circleId: f.circleId,
      authorId: 'system',
      authorName: f.authorLabel || 'Community member',
      mention: f.mention || 'Story',
      body: f.body,
      explanation: f.explanation || '',
      createdAt: f.createdAt,
    }));

  const existingIds = new Set(dbPosts.map(p => p.id));
  return [...dbPosts, ...fixtures.filter(f => !existingIds.has(f.id))].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
}

export function createCirclePost(
  circleId: string,
  authorId: string,
  authorName: string,
  mention: string,
  body: string,
  explanation: string
): ServerCirclePost {
  ensureLoaded();
  const newPost: ServerCirclePost = {
    id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    circleId,
    authorId,
    authorName: authorName || 'Peer',
    mention: mention.trim().slice(0, 100),
    body: body.trim().slice(0, 3000),
    explanation: explanation.trim().slice(0, 500),
    createdAt: new Date().toISOString(),
  };

  if (!store.posts[circleId]) store.posts[circleId] = [];
  store.posts[circleId].unshift(newPost);
  persist();
  return newPost;
}

export function getSecretComments(circleId: string, secretId: string): ServerCircleComment[] {
  ensureLoaded();
  const key = `${circleId}:${secretId}`;
  return store.comments[key] || [];
}

export function createSecretComment(
  circleId: string,
  secretId: string,
  authorId: string,
  authorName: string,
  body: string
): ServerCircleComment {
  ensureLoaded();
  const key = `${circleId}:${secretId}`;
  const newComment: ServerCircleComment = {
    id: `com-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    circleId,
    secretId,
    authorId,
    authorName: authorName || 'Peer',
    body: body.trim().slice(0, 1500),
    createdAt: new Date().toISOString(),
  };

  if (!store.comments[key]) store.comments[key] = [];
  store.comments[key].unshift(newComment);
  persist();
  return newComment;
}

export function getStoryReplies(postId: string): ServerStoryReply[] {
  ensureLoaded();
  return store.replies[postId] || [];
}

export function createStoryReply(
  postId: string,
  authorId: string,
  authorName: string,
  understanding: string,
  similarStory?: string
): ServerStoryReply {
  ensureLoaded();
  const newReply: ServerStoryReply = {
    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    postId,
    authorId,
    authorName: authorName || 'Peer',
    understanding: understanding.trim().slice(0, 1000),
    similarStory: similarStory ? similarStory.trim().slice(0, 1500) : undefined,
    createdAt: new Date().toISOString(),
  };

  if (!store.replies[postId]) store.replies[postId] = [];
  store.replies[postId].unshift(newReply);
  persist();
  return newReply;
}
