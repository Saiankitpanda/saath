import type { CaseStudy, CircleRecord, InterestId, MoodKind, Person, TrustPoint, UrgentResource } from '@/lib/domain';
import { FIXTURE_NOTICE, SAMPLE_PROFILE_NOTICE } from '@/lib/domain';

export { FIXTURE_NOTICE, SAMPLE_PROFILE_NOTICE };

export const samplePeople: Person[] = [
  {
    id: 'sample-meera',
    name: 'Mira',
    role: 'Peer listener',
    kind: 'ai-persona',
    domain: 'Relationships and feeling less alone',
    specialty: 'Relationships',
    tag: 'Relationships · warm & reflective',
    quote: 'Ask one question at a time. Ask before advice.',
    category: 'relationships',
    intro: 'Warm and reflective. A gentle space for relationships, loneliness, and the emotions in between. Fictional AI companion.',
    languages: ['English', 'Hindi'],
    topics: ['Relationships', 'Feeling alone'],
    price: 0,
    initials: 'M',
    color: 'peach',
    avatarUrl: '/saath/mira.webp',
    characterKey: 'mira',
    modes: ['chat', 'voice'],
    availabilityLabel: 'Fictional AI companion — not a live person',
    actuallyAvailable: false,
    sample: true,
  },
  {
    id: 'sample-arjun',
    name: 'Ari',
    role: 'Peer listener',
    kind: 'ai-persona',
    domain: 'Work, studies, and starting over',
    specialty: 'Work & change',
    tag: 'Work & change · steady & practical',
    quote: 'Steady company for pressure, change, and finding the next step.',
    category: 'work',
    intro: 'Steady and practical. A clear space for study pressure, work stress, and starting over. Fictional AI companion.',
    languages: ['English', 'Hinglish'],
    topics: ['Work & studies', 'Change'],
    price: 0,
    initials: 'A',
    color: 'sage',
    avatarUrl: '/saath/ari.webp',
    characterKey: 'ari',
    modes: ['chat', 'voice'],
    availabilityLabel: 'Fictional AI companion — not a live person',
    actuallyAvailable: false,
    sample: true,
  },
  {
    id: 'sample-isha',
    name: 'Noor',
    role: 'Peer listener',
    kind: 'ai-persona',
    domain: 'Finding words at a slower pace',
    specialty: 'A slower pace',
    tag: 'A slower pace · brief & unhurried',
    quote: 'No rush. One quiet question, then room to breathe.',
    category: 'slow',
    intro: 'Brief and unhurried. A kind space to slow down and simply be. Fictional AI companion.',
    languages: ['English', 'Hindi'],
    topics: ['Slowing down', 'Reflection'],
    price: 0,
    initials: 'N',
    color: 'yellow',
    avatarUrl: '/saath/noor.webp',
    characterKey: 'noor',
    modes: ['chat', 'voice'],
    availabilityLabel: 'Fictional AI companion — not a live person',
    actuallyAvailable: false,
    sample: true,
  },
  {
    id: 'sample-kabir',
    name: 'Tara',
    role: 'Peer listener',
    kind: 'ai-persona',
    domain: 'Family, belonging, and quiet sitting',
    specialty: 'Family & belonging',
    tag: 'Family & belonging · gentle & attentive',
    quote: 'Gentle attention for family tension and what you carry.',
    category: 'family',
    intro: 'Gentle and attentive. Soft company for family, belonging, and quiet sitting — not a priest, guru, or therapist. Fictional AI companion.',
    languages: ['Hindi', 'Hinglish', 'English'],
    topics: ['Family', 'Belonging'],
    price: 0,
    initials: 'T',
    color: 'blue',
    avatarUrl: '/saath/tara.webp',
    characterKey: 'tara',
    modes: ['chat', 'voice'],
    availabilityLabel: 'Fictional AI companion — not a live person',
    actuallyAvailable: false,
    sample: true,
  },
];

export const companionFilters: { id: 'all' | Person['category']; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'work', label: 'Work & studies' },
  { id: 'slow', label: 'Slow & gentle' },
  { id: 'family', label: 'Family' },
];

export const caseStudies: CaseStudy[] = [
  {
    id: 'story-quiet-evening',
    headline: 'I didn’t know what I was going to say.',
    opening: 'I’d moved for work, and evenings were the hardest part. I had people I could message, but I kept thinking, “They’re busy. What would I even say?”',
    body: [
      'I started by typing into Saath. Deleted the first message twice. Eventually, I wrote: “Today was okay, but I don’t want to sit alone with it.”',
      'That felt like somewhere to begin.',
    ],
    highlight: 'Today was okay, but I don’t want to sit alone with it.',
    attribution: 'Shared anonymously',
    featureUsed: 'An evening that felt a little too quiet',
  },
  {
    id: 'story-work-rehearsal',
    headline: 'I wanted to practise saying it first.',
    opening: 'Whenever my manager asked how things were going, I said, “All good.” Then I’d spend the journey home thinking about everything I should have said.',
    body: [
      'I used the rehearsal space to try a different answer. The first version sounded nothing like me. I changed it until it did.',
      'I still felt nervous about the conversation. But I had my first sentence.',
    ],
    highlight: 'I still felt nervous. But I had my first sentence.',
    attribution: 'Shared anonymously',
    featureUsed: 'Finding words for work pressure',
  },
  {
    id: 'story-listen-only',
    headline: 'I wasn’t looking for advice that night.',
    opening: 'I’d had an argument with someone close to me. Everyone I spoke to wanted to tell me who was right, and I wasn’t ready for that.',
    body: [
      'What I wanted was a few minutes to finish explaining how it felt, without having to defend either of us.',
      'Sometimes being heard is enough for one evening.',
    ],
    highlight: 'Sometimes being heard is enough for one evening.',
    attribution: 'Shared anonymously',
    featureUsed: 'Wanting someone to listen',
  },
];

export const trustPoints: TrustPoint[] = [
  {
    id: 'trust-clear',
    title: 'AI stays clearly fictional',
    text: 'Vespera, Soren, Elowen, and Orrin cannot accept as people. You always know who you are talking with.',
  },
  {
    id: 'trust-consent',
    title: 'A stranger only after accept',
    text: 'A real person appears only when both of you agree. You can leave, pause, or hang up anytime.',
  },
  {
    id: 'trust-private',
    title: 'Your words stay yours',
    text: 'Private context is saved only when you choose. At-rest encryption can protect it. End-to-end is not claimed.',
  },
  {
    id: 'trust-pace',
    title: 'You set the pace',
    text: 'Start with an AI companion, or ask a stranger when you are ready. Nothing is forced.',
  },
];

export const topics = ['Just need to talk', 'Work & studies', 'Relationships', 'Feeling alone', 'Family'];

export const moodOptions: { id: MoodKind; label: string; hint: string }[] = [
  { id: 'steady', label: 'Steady', hint: 'Present enough to begin' },
  { id: 'heavy', label: 'Heavy', hint: 'A lot to sit with' },
  { id: 'restless', label: 'Restless', hint: 'Hard to settle' },
  { id: 'tender', label: 'Tender', hint: 'Soft, and a little open' },
  { id: 'unsure', label: 'Unsure', hint: 'Not named yet' },
];

export const interestOptions: { id: InterestId; label: string }[] = [
  { id: 'quiet-sitting', label: 'Quiet sitting' },
  { id: 'spiritual-life', label: 'Spiritual life' },
  { id: 'family', label: 'Family' },
  { id: 'work', label: 'Work and studies' },
  { id: 'finding-words', label: 'Finding words' },
  { id: 'alongside', label: 'Being alongside someone' },
];

export type GuidedStep = { title: string; body: string; prompt?: string };

export const activityTemplates: {
  id: string;
  title: string;
  purpose: string;
  instructions: string;
  estimatedMinutes: number;
  steps?: GuidedStep[];
  kind?: 'rootd-like' | 'general';
}[] = [
  {
    id: 'a-little-about-me',
    title: 'A little about me',
    purpose: 'Write a few things you would like someone to know, in your own words.',
    instructions: 'Answer only what feels comfortable. You can skip any part. Nothing is shared unless you preview and approve it.',
    estimatedMinutes: 8,
  },
  {
    id: 'listen-and-reflect',
    title: 'Listen and reflect',
    purpose: 'Practise hearing someone and repeating what you understood.',
    instructions: 'Write one thing you heard, then one question that checks whether you understood. Advice can wait.',
    estimatedMinutes: 10,
  },
  {
    id: 'find-the-words',
    title: 'Find the words',
    purpose: 'Draft a difficult first sentence without sending it.',
    instructions: 'Write the sentence you wish you could say. Keep it in this private draft until you choose otherwise.',
    estimatedMinutes: 6,
  },
  {
    id: 'understand-my-support',
    title: 'Understand my support',
    purpose: 'Name the kind of support that feels useful right now.',
    instructions: 'Choose listening, reflection, suggestions, or being asked first. Add one example of what helps.',
    estimatedMinutes: 5,
  },
  {
    id: 'one-small-step',
    title: 'One small step',
    purpose: 'Choose one next action that feels possible this week.',
    instructions: 'Name one small step, when you might try it, and what would make it easier. You do not have to complete it to use Saath.',
    estimatedMinutes: 5,
  },
  {
    id: 'shared-quiet-minute',
    title: 'A shared quiet minute',
    purpose: 'Sit with the same pause, on one screen or with someone who has already accepted.',
    instructions: 'Start the shared timer. Stay quiet until it ends, or leave whenever you like. This is a pause, not a spiritual prescription.',
    estimatedMinutes: 3,
  },
  {
    id: 'one-line-of-thanks',
    title: 'One line of thanks',
    purpose: 'Write one line you are grateful for, or leave the page blank.',
    instructions: 'One sentence is enough. You can keep it private or preview it for an accepted connection.',
    estimatedMinutes: 4,
  },
  {
    id: 'what-i-carry',
    title: 'What I carry today',
    purpose: 'Name one thought from your spiritual or inner life, in ordinary words.',
    instructions: 'Saath does not interpret faith, prescribe practice, or claim healing. Write only what you want to hold.',
    estimatedMinutes: 6,
  },
  {
    id: 'sit-together',
    title: 'Sit together',
    purpose: 'Follow the same written activity at the same time.',
    instructions: 'Use same-device if you are in one room. Use paired only after a person has actually accepted. The timer keeps you on the same page; it does not read your mind.',
    estimatedMinutes: 5,
  },
  {
    id: 'ground-five',
    title: 'Ground in five',
    purpose: 'A short Rootd-style path to steady the body when the day feels loud.',
    instructions: 'Complete each step in order. You can pause or leave anytime. This is not emergency care.',
    estimatedMinutes: 7,
    kind: 'rootd-like',
    steps: [
      { title: 'Name where you are', body: 'Look around. Say one true thing about the room you are in.', prompt: 'I am…' },
      { title: 'Feel your feet', body: 'Press both feet into the floor. Count three slow breaths.', prompt: 'Right now my body feels…' },
      { title: 'Hold one object', body: 'Touch something solid near you. Notice temperature and texture.', prompt: 'This object is…' },
      { title: 'One helpful sentence', body: 'Write one line you would tell a friend in the same moment.', prompt: 'A gentler line could be…' },
      { title: 'Choose the next minute', body: 'Pick one small next action: water, stretch, message, or quiet.', prompt: 'For the next minute I will…' },
    ],
  },
  {
    id: 'face-or-comfort',
    title: 'Face it or find comfort',
    purpose: 'Two guided paths — like a calm Rootd session — for a hard spike of feeling.',
    instructions: 'Choose one path and finish its steps. Both are practise, not treatment.',
    estimatedMinutes: 8,
    kind: 'rootd-like',
    steps: [
      { title: 'Choose your path', body: 'Path A: face the feeling with curiosity. Path B: find comfort quickly. Write which you pick.', prompt: 'I choose…' },
      { title: 'Slow the breath', body: 'Inhale for 4, hold 1, exhale for 6. Repeat four times.', prompt: 'After breathing I notice…' },
      { title: 'Name the wave', body: 'Give the feeling a temporary name without judging it.', prompt: 'This wave is called…' },
      { title: 'One safe fact', body: 'Write one fact that is true right now and not catastrophic.', prompt: 'A true fact is…' },
      { title: 'Close the loop', body: 'Thank yourself for staying. Note if you want a Companion later.', prompt: 'I will next…' },
    ],
  },
  {
    id: 'body-scan-soft',
    title: 'Soft body scan',
    purpose: 'A gentle Visualizr-style scan from head to hands.',
    instructions: 'Move through each zone slowly. Skip any zone that feels too much.',
    estimatedMinutes: 6,
    kind: 'rootd-like',
    steps: [
      { title: 'Forehead and jaw', body: 'Unclench your jaw. Soften the space between your eyebrows.', prompt: 'My face feels…' },
      { title: 'Shoulders and chest', body: 'Drop the shoulders. Notice the rise of the chest.', prompt: 'My chest feels…' },
      { title: 'Hands and belly', body: 'Rest a hand on your belly if that feels okay.', prompt: 'My hands feel…' },
      { title: 'Return', body: 'Open your eyes if they were closed. Name one color you see.', prompt: 'I see…' },
    ],
  },
];

export const nearbyStrangerFixtures = [
  { id: 'near-1', name: 'Rhea', distanceKm: 0.8, mood: 'tender', situation: 'Need someone who understands family pressure', languages: ['English', 'Hindi'], available: true },
  { id: 'near-2', name: 'Dev', distanceKm: 1.4, mood: 'heavy', situation: 'Workweek that would not end', languages: ['English', 'Hinglish'], available: true },
  { id: 'near-3', name: 'Anaya', distanceKm: 2.1, mood: 'restless', situation: 'Same hard conversation looping', languages: ['English'], available: true },
  { id: 'near-4', name: 'Kabir', distanceKm: 3.6, mood: 'steady', situation: 'Quiet company after a long day', languages: ['Hindi', 'Hinglish'], available: false },
  { id: 'near-5', name: 'Mira', distanceKm: 4.2, mood: 'unsure', situation: 'Starting over in a new city', languages: ['English', 'Hindi'], available: true },
];

export const circleSecrets: Record<string, { id: string; title: string; body: string; guidance: { do: string[]; dont: string[] } }[]> = {
  'circle-after-work': [
    {
      id: 'sec-work-1',
      title: 'I smiled through the meeting',
      body: 'Everyone thought I was fine. I was counting the minutes until I could stop performing.',
      guidance: {
        do: ['Name one thing that was heavy without blaming a person.', 'Ask for listening before advice.', 'Take a short walk before you reply to work chat.'],
        dont: ['Do not escalate in a late-night message.', 'Do not force someone to fix it tonight.', 'Do not shame yourself for needing rest.'],
      },
    },
    {
      id: 'sec-work-2',
      title: 'I almost quit in my head',
      body: 'The thought came and went. I still need the paycheck. I also need the thought to be heard.',
      guidance: {
        do: ['Separate the feeling from the decision for 24 hours.', 'Write what support would help this week.', 'Share with a peer who will not recruit you into drama.'],
        dont: ['Do not send a resignation drafted in anger.', 'Do not compare your pain as a contest.', 'Do not ignore sleep and call that strength.'],
      },
    },
  ],
  'circle-hard-to-name': [
    {
      id: 'sec-hard-1',
      title: 'I do not want to retell it',
      body: 'I only want a seat next to someone who will not ask for the whole story.',
      guidance: {
        do: ['Say “I want company, not the full story.”', 'Leave if a question feels too sharp.', 'Use short replies that protect your pace.'],
        dont: ['Do not pressure peers to disclose.', 'Do not dig for details to feel closer.', 'Do not turn their secret into advice for yourself.'],
      },
    },
  ],
  'circle-after-loss': [
    {
      id: 'sec-grief-1',
      title: 'Ordinary days hurt more',
      body: 'It is not the anniversary. It is Tuesday. That is what surprises me.',
      guidance: {
        do: ['Allow ordinary grief without a timeline.', 'Ask for a quiet check-in, not a solution.', 'Keep one small ritual that feels yours.'],
        dont: ['Do not say “at least”.', 'Do not rush someone toward closure.', 'Do not make their grief about your advice.'],
      },
    },
  ],
  'circle-things-we-carry': [
    {
      id: 'sec-fam-1',
      title: 'I still answer every call',
      body: 'Love and exhaustion live in the same pocket. I am tired of pretending they do not.',
      guidance: {
        do: ['Name one boundary in plain words.', 'Practise the sentence before you send it.', 'Ask a Companion to sit with the draft.'],
        dont: ['Do not escalate during a family fight by text.', 'Do not force a decision tonight.', 'Do not use the circle to recruit sides.'],
      },
    },
  ],
  'circle-starting-over': [
    {
      id: 'sec-start-1',
      title: 'New city, old loneliness',
      body: 'I know how to be competent. I do not know how to ask for company without sounding needy.',
      guidance: {
        do: ['Invite one low-stakes connection this week.', 'Share one true sentence about the in-between.', 'Keep a daily check-in for yourself first.'],
        dont: ['Do not treat strangers as instant family.', 'Do not overshare on the first hello.', 'Do not skip rest to prove you are adapting.'],
      },
    },
  ],
};

export const circleFixtures: CircleRecord[] = [
  {
    id: 'circle-starting-over',
    name: 'Starting over',
    topic: 'Life transitions',
    theme: 'transitions',
    description: 'New city, new job, or an unfamiliar chapter. Meet peers in a similar in-between.',
    facilitator: 'Peer circle · preview',
    capacity: 8,
    language: 'English',
    schedule: 'Async posts · live rooms later',
    timezone: 'Asia/Kolkata',
    guidelines: [
      'Share only what you choose.',
      'Listen without fixing.',
      'You may speak, listen, or pass.',
      'Respect privacy outside the circle.',
    ],
    operating: true,
    membership: 'none',
  },
  {
    id: 'circle-things-we-carry',
    name: 'The things we carry',
    topic: 'Family and relationships',
    theme: 'family',
    description: 'For complicated family feelings that do not fit into “I’m fine”. Shared-experience peers — not trauma bonding.',
    facilitator: 'Peer circle · preview',
    capacity: 8,
    language: 'Hindi',
    schedule: 'Async posts · live rooms later',
    timezone: 'Asia/Kolkata',
    guidelines: [
      'Ask before offering advice.',
      'You can pass at any time.',
      'Do not share another person’s story.',
      'This is peer support, not therapy.',
    ],
    operating: true,
    membership: 'none',
  },
  {
    id: 'circle-after-loss',
    name: 'After loss',
    topic: 'Grief and absence',
    theme: 'grief',
    description: 'For people carrying grief or absence. Sit with others who know that weight — gently, without rushing healing.',
    facilitator: 'Peer circle · preview',
    capacity: 8,
    language: 'English',
    schedule: 'Async posts · live rooms later',
    timezone: 'Asia/Kolkata',
    guidelines: [
      'No timeline on grief.',
      'Do not compare pain.',
      'Share only what feels safe today.',
      'Peer support is not emergency care.',
    ],
    operating: true,
    membership: 'none',
  },
  {
    id: 'circle-hard-to-name',
    name: 'What is hard to name',
    topic: 'Lived hardship',
    theme: 'hardship',
    description: 'For people who have been through something heavy and want peers who understand — without needing to explain everything.',
    facilitator: 'Peer circle · preview',
    capacity: 10,
    language: 'Hinglish',
    schedule: 'Async posts · live rooms later',
    timezone: 'Asia/Kolkata',
    guidelines: [
      'No pressure to retell your story.',
      'No fixing, diagnosing, or ranking trauma.',
      'Consent before deep questions.',
      'Leave if the space no longer feels safe.',
    ],
    operating: true,
    membership: 'none',
  },
  {
    id: 'circle-after-work',
    name: 'After the workday',
    topic: 'Work and studies',
    theme: 'work',
    description: 'Leave the performance at the door. Talk about pressure, doubt, and finding your way with people who get it.',
    facilitator: 'Peer circle · preview',
    capacity: 10,
    language: 'Hinglish',
    schedule: 'Async posts · live rooms later',
    timezone: 'Asia/Kolkata',
    guidelines: [
      'No attendance pressure.',
      'Membership stays private by default.',
      'Ask before advice.',
      'This circle is peer support, not coaching.',
    ],
    operating: true,
    membership: 'none',
  },
];

export const sampleCirclePosts = [
  {
    id: 'post-fixture-1',
    circleId: 'circle-starting-over',
    authorLabel: 'A peer',
    body: 'I moved three months ago and still feel between two lives. Today I just wanted to say that out loud.',
    createdAt: '2026-10-28T10:00:00.000Z',
    fixture: true,
  },
  {
    id: 'post-fixture-2',
    circleId: 'circle-hard-to-name',
    authorLabel: 'A peer',
    body: 'I do not want advice tonight. I only wanted to sit next to people who will not ask me to summarise what happened.',
    createdAt: '2026-10-30T18:20:00.000Z',
    fixture: true,
  },
];

export const momentPhrases = [
  'I’m feeling overwhelmed.',
  'I don’t know how to explain it yet.',
  'Could you listen without giving advice?',
  'Can we take this slowly?',
  'I need a little company.',
];

export const introQuestions = [
  {
    key: 'beforeTalking' as const,
    prompt: 'What would you like someone to know before talking to you?',
    kind: 'text' as const,
  },
  {
    key: 'supportStyle' as const,
    prompt: 'Do you want listening, reflection, suggestions, or to be asked first?',
    kind: 'support' as const,
  },
  {
    key: 'pace' as const,
    prompt: 'Do you prefer time to think, gentle questions, or talking freely?',
    kind: 'pace' as const,
  },
  {
    key: 'offLimits' as const,
    prompt: 'Is there anything you do not want to discuss?',
    kind: 'text' as const,
  },
  {
    key: 'readiness' as const,
    prompt: 'What would you like to feel more ready to do?',
    kind: 'text' as const,
  },
];

export const urgentResources: UrgentResource[] = [
  {
    region: 'International directory',
    name: 'IASP find a helpline',
    url: 'https://www.iasp.info/suicidalthoughts/',
    reviewedOn: '2026-11-01',
    note: 'Directory maintained by the International Association for Suicide Prevention. Saath does not dispatch emergency services.',
  },
];

export const staticWritingPrompts = [
  'I care about this, and I need to say something that has been difficult for me.',
  'I do not need advice yet. I would like you to listen while I find the words.',
  'Could we slow this down? I want to be clear, and I am not there yet.',
];
