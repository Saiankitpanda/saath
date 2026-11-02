import type { CaseStudy, CircleRecord, InterestId, MoodKind, Person, TrustPoint, UrgentResource } from '@/lib/domain';
import { FIXTURE_NOTICE, SAMPLE_PROFILE_NOTICE } from '@/lib/domain';

export { FIXTURE_NOTICE, SAMPLE_PROFILE_NOTICE };

export const samplePeople: Person[] = [
  {
    id: 'sample-meera',
    name: 'Vespera',
    role: 'Peer listener',
    kind: 'ai-persona',
    domain: 'Relationships and feeling less alone',
    specialty: 'Relationships & feeling alone',
    tag: 'Relationships & feeling alone',
    quote: "I've been feeling a bit alone lately, and I'm not sure why…",
    category: 'relationships',
    intro: 'Warm and thoughtful. A gentle space to talk about relationships, loneliness, and the emotions in between.',
    languages: ['English', 'Hindi'],
    topics: ['Relationships', 'Feeling alone'],
    price: 0,
    initials: 'M',
    color: 'peach',
    modes: ['chat'],
    availabilityLabel: 'AI companion — not a live person',
    actuallyAvailable: false,
    sample: true,
  },
  {
    id: 'sample-arjun',
    name: 'Soren',
    role: 'Peer listener',
    kind: 'ai-persona',
    domain: 'Work, studies, and starting over',
    specialty: 'Work & studies',
    tag: 'Work & studies',
    quote: "I'm feeling a bit overwhelmed with everything on my plate…",
    category: 'work',
    intro: 'Focused and supportive. A steady space to talk about study pressure, work stress, motivation, and finding balance.',
    languages: ['English', 'Hinglish'],
    topics: ['Work & studies', 'Feeling alone'],
    price: 0,
    initials: 'A',
    color: 'sage',
    modes: ['chat'],
    availabilityLabel: 'AI companion — not a live person',
    actuallyAvailable: false,
    sample: true,
  },
  {
    id: 'sample-isha',
    name: 'Elowen',
    role: 'Peer listener',
    kind: 'ai-persona',
    domain: 'Finding words at a slower pace',
    specialty: 'A slower pace',
    tag: 'A slower pace',
    quote: 'I just want to slow down a little and make sense of how I am feeling…',
    category: 'slow',
    intro: 'Calm and unhurried. A kind space to slow down, reflect, process your thoughts, and simply be, without any rush.',
    languages: ['English', 'Hindi'],
    topics: ['Relationships', 'Work & studies'],
    price: 0,
    initials: 'I',
    color: 'yellow',
    modes: ['chat'],
    availabilityLabel: 'AI companion — not a live person',
    actuallyAvailable: false,
    sample: true,
  },
  {
    id: 'sample-kabir',
    name: 'Orrin',
    role: 'Peer listener',
    kind: 'ai-persona',
    domain: 'Family, spiritual life, and quiet sitting',
    specialty: 'Family & quiet sitting',
    tag: 'Family & quiet sitting',
    quote: "There's something I've been carrying with my family, and I need a quiet place to say it…",
    category: 'family',
    intro: 'Grounded and soft-spoken. A quiet companion for family tension, faith, and sitting with what you carry — not a priest, guru, or therapist.',
    languages: ['Hindi', 'Hinglish'],
    topics: ['Family', 'Feeling alone'],
    price: 0,
    initials: 'K',
    color: 'blue',
    modes: ['chat'],
    availabilityLabel: 'AI companion — not a live person',
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

export const activityTemplates = [
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
];

export const circleFixtures: CircleRecord[] = [
  {
    id: 'circle-starting-over',
    name: 'Starting over',
    topic: 'Life transitions',
    description: 'New city, new job, or an unfamiliar chapter. Shared-experience support for the in-between.',
    facilitator: 'Facilitator place held — not assigned',
    capacity: 8,
    language: 'English',
    schedule: 'Example · Sunday, 6 pm',
    timezone: 'Asia/Kolkata',
    guidelines: [
      'Share only what you choose.',
      'Listen without fixing.',
      'You may speak, listen, or pass.',
      'Respect privacy outside the circle.',
    ],
    operating: false,
    membership: 'none',
  },
  {
    id: 'circle-things-we-carry',
    name: 'The things we carry',
    topic: 'Family and relationships',
    description: 'For complicated feelings that do not fit into a quick “I’m fine”. Shared-experience support, not trauma bonding.',
    facilitator: 'Facilitator place held — not assigned',
    capacity: 8,
    language: 'Hindi',
    schedule: 'Example · Wednesday, 8 pm',
    timezone: 'Asia/Kolkata',
    guidelines: [
      'Ask before offering advice.',
      'You can pass at any time.',
      'Do not share another person’s story.',
      'Report concerns to a facilitator when live circles open.',
    ],
    operating: false,
    membership: 'none',
  },
  {
    id: 'circle-after-work',
    name: 'After the workday',
    topic: 'Work and studies',
    description: 'Leave the performance at the door. Talk about pressure, doubt, and finding your way.',
    facilitator: 'Facilitator place held — not assigned',
    capacity: 10,
    language: 'Hinglish',
    schedule: 'Example · Friday, 7 pm',
    timezone: 'Asia/Kolkata',
    guidelines: [
      'No attendance pressure.',
      'Membership stays private by default.',
      'Facilitator actions will require authorisation when circles operate.',
      'This circle is not currently operating.',
    ],
    operating: false,
    membership: 'none',
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
