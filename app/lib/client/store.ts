import {
  FIXTURE_NOTICE,
  canTransitionActivity,
  type ActivityRecord,
  type ActivityStatus,
  type CircleSecretComment,
  type ConversationMessage,
  type ConversationRecord,
  type DailyCheckIn,
  type InterestId,
  type IntroAnswers,
  type IntroductionCard,
  type JoinedSessionMessage,
  type MoodEntry,
  type MoodKind,
  type ProviderDraft,
  type CircleMembership,
  type CirclePost,
  type CircleStoryReply,
  type StrangerPref,
} from '@/lib/domain';

const KEY = 'saath-dev-fixtures-v1';
const DAY_MS = 24 * 60 * 60 * 1000;

export type FixtureState = {
  notice: string;
  intro: IntroductionCard | null;
  reflections: string;
  blocks: string[];
  activities: ActivityRecord[];
  conversations: ConversationRecord[];
  providerDraft: ProviderDraft | null;
  circleMembership: Record<string, CircleMembership>;
  circleInterest: string[];
  circlePosts: CirclePost[];
  circleStoryReplies: CircleStoryReply[];
  moods: MoodEntry[];
  interests: InterestId[];
  quietThoughts: string;
  dailyCheckIns: DailyCheckIn[];
  checkInSnoozeUntil: string | null;
  checkInDisabled: boolean;
  secretComments: CircleSecretComment[];
  sessionMessages: JoinedSessionMessage[];
  strangerPref: StrangerPref | null;
};

const emptyIntro = (): IntroAnswers => ({
  beforeTalking: '',
  supportStyle: '',
  pace: '',
  offLimits: '',
  readiness: '',
});

function blank(): FixtureState {
  return {
    notice: FIXTURE_NOTICE,
    intro: null,
    reflections: '',
    blocks: [],
    activities: [],
    conversations: [demoConversation()],
    providerDraft: null,
    circleMembership: {},
    circleInterest: [],
    circlePosts: [],
    circleStoryReplies: [],
    moods: [],
    interests: [],
    quietThoughts: '',
    dailyCheckIns: [],
    checkInSnoozeUntil: null,
    checkInDisabled: false,
    secretComments: [],
    sessionMessages: [],
    strangerPref: null,
  };
}

function demoConversation(): ConversationRecord {
  return {
    id: 'fixture-conversation-preview',
    requestId: 'fixture-request-preview',
    title: 'Development fixture conversation',
    fixture: true,
    paused: false,
    left: false,
    blocked: false,
    messages: [
      {
        id: 'fixture-msg-1',
        clientKey: 'fixture-msg-1',
        sender: 'system',
        content: `${FIXTURE_NOTICE} There is no live participant on the other side.`,
        createdAt: new Date().toISOString(),
        status: 'sent',
      },
    ],
  };
}

function read(): FixtureState {
  if (typeof window === 'undefined') return blank();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw) as FixtureState & { apiKeys?: unknown };
    // Strip any legacy client-stored API keys — secrets belong in server env only.
    const { apiKeys: _legacyKeys, ...rest } = parsed;
    void _legacyKeys;
    const cleaned: FixtureState = {
      ...blank(),
      ...rest,
      notice: FIXTURE_NOTICE,
      conversations: rest.conversations?.length ? rest.conversations : blank().conversations,
      moods: rest.moods ?? [],
      interests: rest.interests ?? [],
      quietThoughts: rest.quietThoughts ?? '',
      circlePosts: rest.circlePosts ?? [],
      circleStoryReplies: rest.circleStoryReplies ?? [],
      dailyCheckIns: rest.dailyCheckIns ?? [],
      checkInSnoozeUntil: rest.checkInSnoozeUntil ?? null,
      checkInDisabled: Boolean(rest.checkInDisabled),
      secretComments: rest.secretComments ?? [],
      sessionMessages: rest.sessionMessages ?? [],
      strangerPref: rest.strangerPref ?? null,
      activities: (rest.activities ?? []).map(item => ({
        ...item,
        syncKind: item.syncKind ?? 'solo',
        syncEndsAt: item.syncEndsAt ?? '',
      })),
    };
    if ('apiKeys' in parsed) write(cleaned);
    return cleaned;
  } catch {
    return blank();
  }
}

function write(next: FixtureState): FixtureState {
  const value = { ...next, notice: FIXTURE_NOTICE };
  window.localStorage.setItem(KEY, JSON.stringify(value));
  return value;
}

export function loadFixtures(): FixtureState {
  return read();
}

export function saveIntro(answers: IntroAnswers, completed: boolean): IntroductionCard {
  const state = read();
  const card: IntroductionCard = {
    answers,
    visibility: 'private',
    wordingApproved: false,
    updatedAt: new Date().toISOString(),
    completed,
  };
  write({ ...state, intro: card });
  return card;
}

export function emptyIntroAnswers(): IntroAnswers {
  return emptyIntro();
}

export function saveReflections(value: string): void {
  write({ ...read(), reflections: value });
}

export function toggleBlock(targetId: string): string[] {
  const state = read();
  const blocks = state.blocks.includes(targetId)
    ? state.blocks.filter(id => id !== targetId)
    : [...state.blocks, targetId];
  write({ ...state, blocks });
  return blocks;
}

export function isBlocked(targetId: string): boolean {
  return read().blocks.includes(targetId);
}

export function upsertActivity(record: ActivityRecord): ActivityRecord[] {
  const state = read();
  const activities = state.activities.some(item => item.id === record.id)
    ? state.activities.map(item => (item.id === record.id ? record : item))
    : [record, ...state.activities];
  write({ ...state, activities });
  return activities;
}

export function transitionActivity(id: string, status: ActivityStatus): ActivityRecord[] {
  const state = read();
  const activities = state.activities.map(item => {
    if (item.id !== id) return item;
    if (!canTransitionActivity(item.status, status)) return item;
    return { ...item, status, updatedAt: new Date().toISOString() };
  });
  write({ ...state, activities });
  return activities;
}

export function saveProviderDraft(draft: ProviderDraft): ProviderDraft {
  write({ ...read(), providerDraft: draft });
  return draft;
}

export function setCircleMembership(id: string, membership: CircleMembership): Record<string, CircleMembership> {
  const state = read();
  const circleMembership = { ...state.circleMembership, [id]: membership };
  write({ ...state, circleMembership });
  return circleMembership;
}

export function addCircleInterest(name: string): string[] {
  const state = read();
  const circleInterest = state.circleInterest.includes(name) ? state.circleInterest : [...state.circleInterest, name];
  write({ ...state, circleInterest });
  return circleInterest;
}

export function listCirclePosts(circleId?: string): CirclePost[] {
  const posts = read().circlePosts;
  return circleId ? posts.filter(item => item.circleId === circleId) : posts;
}

export function addCirclePost(input: {
  circleId: string;
  body: string;
  mention?: string;
  explanation?: string;
  authorLabel?: string;
}): CirclePost[] {
  const state = read();
  const post: CirclePost = {
    id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    circleId: input.circleId,
    authorLabel: input.authorLabel?.trim() || 'You',
    mention: input.mention?.trim().slice(0, 80) || undefined,
    body: input.body.trim().slice(0, 2000),
    explanation: input.explanation?.trim().slice(0, 800) || undefined,
    createdAt: new Date().toISOString(),
  };
  const circlePosts = [post, ...state.circlePosts].slice(0, 200);
  write({ ...state, circlePosts });
  return circlePosts.filter(item => item.circleId === input.circleId);
}

export function listStoryReplies(postId: string): CircleStoryReply[] {
  return read().circleStoryReplies.filter(item => item.postId === postId);
}

export function addStoryReply(input: {
  postId: string;
  understanding: string;
  similarStory?: string;
  authorLabel?: string;
}): CircleStoryReply[] {
  const state = read();
  const reply: CircleStoryReply = {
    id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    postId: input.postId,
    authorLabel: input.authorLabel?.trim() || 'You',
    understanding: input.understanding.trim().slice(0, 800),
    similarStory: input.similarStory?.trim().slice(0, 1200) || undefined,
    createdAt: new Date().toISOString(),
  };
  const circleStoryReplies = [reply, ...state.circleStoryReplies].slice(0, 400);
  write({ ...state, circleStoryReplies });
  return circleStoryReplies.filter(item => item.postId === input.postId);
}

export function appendConversationMessage(conversationId: string, message: ConversationMessage): ConversationRecord | null {
  const state = read();
  let found: ConversationRecord | null = null;
  const conversations = state.conversations.map(item => {
    if (item.id !== conversationId) return item;
    if (item.left || item.blocked || item.paused) return item;
    if (item.messages.some(existing => existing.clientKey === message.clientKey)) {
      found = item;
      return item;
    }
    found = { ...item, messages: [...item.messages, message] };
    return found;
  });
  write({ ...state, conversations });
  return found;
}

export function updateConversation(conversationId: string, patch: Partial<ConversationRecord>): ConversationRecord | null {
  const state = read();
  let found: ConversationRecord | null = null;
  const conversations = state.conversations.map(item => {
    if (item.id !== conversationId) return item;
    found = { ...item, ...patch, id: item.id, fixture: true };
    return found;
  });
  write({ ...state, conversations });
  return found;
}

export function addMood(mood: MoodKind, note = ''): MoodEntry[] {
  const state = read();
  const entry: MoodEntry = {
    id: crypto.randomUUID(),
    mood,
    note: note.trim().slice(0, 400),
    createdAt: new Date().toISOString(),
  };
  const moods = [entry, ...state.moods].slice(0, 40);
  write({ ...state, moods });
  return moods;
}

export function saveInterests(interests: InterestId[]): InterestId[] {
  const unique = Array.from(new Set(interests));
  write({ ...read(), interests: unique });
  return unique;
}

export function saveQuietThoughts(value: string): void {
  write({ ...read(), quietThoughts: value.slice(0, 4000) });
}

export function getActiveDailyCheckIn(now = Date.now()): DailyCheckIn | null {
  const active = (read().dailyCheckIns || []).find(item => Date.parse(item.expiresAt) > now);
  return active ?? null;
}

export function isCheckInDisabled(): boolean {
  return Boolean(read().checkInDisabled);
}

export function setCheckInDisabled(disabled: boolean): void {
  write({ ...read(), checkInDisabled: disabled });
}

export function isCheckInNudgeDue(now = Date.now()): boolean {
  if (isCheckInDisabled()) return false;
  if (getActiveDailyCheckIn(now)) return false;
  const snooze = read().checkInSnoozeUntil;
  if (snooze && Date.parse(snooze) > now) return false;
  return true;
}

export function snoozeCheckInNudge(hours = 4): void {
  const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  write({ ...read(), checkInSnoozeUntil: until });
}

export function saveDailyCheckIn(input: {
  mood: MoodKind;
  dayStory: string;
  doodleId: string;
}): DailyCheckIn {
  const state = read();
  const now = Date.now();
  const entry: DailyCheckIn = {
    id: crypto.randomUUID(),
    mood: input.mood,
    dayStory: input.dayStory.trim().slice(0, 2000),
    doodleId: input.doodleId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + DAY_MS).toISOString(),
  };
  const moodEntry: MoodEntry = {
    id: crypto.randomUUID(),
    mood: input.mood,
    note: input.dayStory.trim().slice(0, 400),
    createdAt: entry.createdAt,
  };
  const dailyCheckIns = [entry, ...(state.dailyCheckIns || []).filter(item => Date.parse(item.expiresAt) > now)].slice(0, 14);
  const moods = [moodEntry, ...state.moods].slice(0, 40);
  write({ ...state, dailyCheckIns, moods });
  return entry;
}

export function listSecretComments(circleId: string, secretId: string): CircleSecretComment[] {
  return (read().secretComments || [])
    .filter(item => item.circleId === circleId && item.secretId === secretId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function addSecretComment(input: {
  circleId: string;
  secretId: string;
  body: string;
  authorLabel?: string;
}): CircleSecretComment[] {
  const state = read();
  const comment: CircleSecretComment = {
    id: `sec-c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    circleId: input.circleId,
    secretId: input.secretId,
    authorLabel: input.authorLabel?.trim() || 'You',
    body: input.body.trim().slice(0, 1200),
    createdAt: new Date().toISOString(),
  };
  const secretComments = [comment, ...(state.secretComments || [])].slice(0, 300);
  write({ ...state, secretComments });
  return listSecretComments(input.circleId, input.secretId);
}

export function listSessionMessages(circleId: string): JoinedSessionMessage[] {
  return (read().sessionMessages || [])
    .filter(item => item.circleId === circleId)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

export function addSessionMessage(input: {
  circleId: string;
  body: string;
  authorLabel?: string;
}): JoinedSessionMessage[] {
  const state = read();
  const message: JoinedSessionMessage = {
    id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    circleId: input.circleId,
    authorLabel: input.authorLabel?.trim() || 'You',
    body: input.body.trim().slice(0, 2000),
    createdAt: new Date().toISOString(),
  };
  const sessionMessages = [...(state.sessionMessages || []), message].slice(-200);
  write({ ...state, sessionMessages });
  return listSessionMessages(input.circleId);
}

export function saveStrangerPref(input: {
  lastPeerId: string | null;
  lastPeerName: string | null;
  situation: string;
}): StrangerPref {
  const strangerPref: StrangerPref = {
    lastPeerId: input.lastPeerId,
    lastPeerName: input.lastPeerName,
    situation: input.situation.trim().slice(0, 400),
    updatedAt: new Date().toISOString(),
  };
  write({ ...read(), strangerPref });
  return strangerPref;
}

export function loadStrangerPref(): StrangerPref | null {
  return read().strangerPref;
}

export function suggestActivities(
  answers: IntroAnswers | null,
  extras?: { mood?: MoodKind | null; interests?: InterestId[] },
): { templateId: string; reason: string }[] {
  const suggestions: { templateId: string; reason: string }[] = [];
  if (extras?.mood === 'heavy' || extras?.mood === 'tender') {
    suggestions.push({
      templateId: 'ground-five',
      reason: 'A stepped grounding path can steady a heavy or tender day.',
    });
    suggestions.push({
      templateId: 'shared-quiet-minute',
      reason: 'A short shared pause can sit beside a heavy or tender day.',
    });
  }
  if (extras?.mood === 'restless' || extras?.mood === 'unsure') {
    suggestions.push({
      templateId: 'face-or-comfort',
      reason: 'A guided path helps when the mind will not settle.',
    });
    suggestions.push({
      templateId: 'what-i-carry',
      reason: 'One written thought can hold what is still unnamed.',
    });
  }
  if (extras?.interests?.includes('spiritual-life') || extras?.interests?.includes('quiet-sitting')) {
    suggestions.push({
      templateId: 'sit-together',
      reason: 'You marked quiet or spiritual sitting. This keeps two people on the same page.',
    });
  }
  if (answers?.readiness) {
    suggestions.push({
      templateId: 'one-small-step',
      reason: 'You named something you would like to feel more ready to do.',
    });
  }
  if (answers?.supportStyle) {
    suggestions.push({
      templateId: 'understand-my-support',
      reason: 'You already started describing the kind of support that helps.',
    });
  }
  if (answers?.beforeTalking) {
    suggestions.push({
      templateId: 'a-little-about-me',
      reason: 'You wrote something you might want someone to know.',
    });
  }
  if (!suggestions.length) {
    suggestions.push({
      templateId: 'find-the-words',
      reason: 'A short private draft is a gentle place to begin.',
    });
  }
  const seen = new Set<string>();
  return suggestions.filter(item => {
    if (seen.has(item.templateId)) return false;
    seen.add(item.templateId);
    return true;
  }).slice(0, 3);
}
