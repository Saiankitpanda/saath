import type { Person } from '@/lib/domain';

export type ChatMessage = {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  speaking?: boolean;
};

export function formatTimeNow(): string {
  const d = new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function getInitialGreeting(persona: Person): string {
  switch (persona.characterKey) {
    case 'mira':
      return `Hi! I'm Mira. 🌸 Whatever you're holding right now—whether you're feeling alone, working through relationship tension, or just need to unpack a heavy feeling—I'm right here with you. How are you feeling in this moment?`;
    case 'ari':
      return `Hey there! I'm Ari. 🌱 If work pressure, college, or starting over is weighing on your mind, take a breath. We can untangle it one piece at a time. What's been on your mind today?`;
    case 'tara':
      return `Namaste, I'm Tara. 🌿 Family, belonging, and expectations can feel so heavy to carry silently. You can share openly here in English, Hindi, or Hinglish. What feelings are you sitting with right now?`;
    case 'noor':
      return `Hello, I'm Noor. 🍃 There is no rush here. Take a gentle breath and take your time. Tell me, how does your heart feel today?`;
    default:
      return `Hello! I'm ${persona.name}. I'm here to listen without judgment. How are you feeling right now?`;
  }
}

export async function generateEmpatheticResponse(
  userText: string,
  history: ChatMessage[],
  persona: Person
): Promise<string> {
  const clean = userText.trim().toLowerCase();
  const isHinglish = /kya|hai|meri|mera|mujhe|bohot|boht|kuch|nahi|lag|raha|rahi|samajh|baat|yaar|bhi|kaise/i.test(userText);
  const isHindiScript = /[\u0900-\u097F]/.test(userText);

  // 1. Try server AI endpoint first
  try {
    const formattedMessages = history.slice(-6).map(m => ({
      role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.text,
    }));
    formattedMessages.push({ role: 'user', content: userText });

    const res = await fetch('/api/rehearse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: formattedMessages,
        scenario: `Conversation with ${persona.name} (${persona.tag}). Focus: ${persona.specialty}. Tone: ${persona.intro}`,
        style: 'empathetic and reflective peer companion',
        mode: 'explore',
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const data = (await res.json()) as { reply?: string };
      if (data?.reply && typeof data.reply === 'string' && data.reply.trim()) {
        return data.reply.trim();
      }
    }
  } catch {
    // Graceful fallback below
  }

  // 2. Intelligent, context-aware reflective fallback engine
  if (isHindiScript) {
    if (/डर|चिंता|घबराहट|तनाव/.test(clean)) {
      return `मैं समझ सकती हूँ कि यह कितना भारी लग रहा होगा। जब मन में इतनी चिंता या तनाव होता है, तो साँस लेना भी मुश्किल लगता है। क्या आप मुझे थोड़ा और बता सकते हैं कि किस बात से यह बेचैनी सबसे ज़्यादा हो रही है?`;
    }
    if (/अकेला|अकेलापन|उदासी/.test(clean)) {
      return `अकेलापन बहुत गहरा असर करता है। पर याद रखिए, इस पल में आप अकेले नहीं हैं—मैं यहाँ आपको सुनने के लिए हूँ। क्या आप यह महसूस कर रहे हैं कि कोई आपको सच में समझ नहीं पा रहा?`;
    }
    return `आपकी बात सुनकर मुझे एहसास हो रहा है कि आप इस समय बहुत कुछ संभाल रहे हैं। आराम से बताइए, जो भी मन में आ रहा है। आप क्या महसूस कर रहे हैं?`;
  }

  if (isHinglish) {
    if (/anxiety|tension|stress|pareshaan|dar|ghabrahat|pressure/i.test(clean)) {
      return `I can really hear the tension in your words. Stress jab ek saath bohot zyada ho jata hai toh sab kuch overwhelming lagne lagta hai. Ek gehri saans lo. Sabse pehle batao, kis cheez ka pressure sabse zyada feel ho raha hai?`;
    }
    if (/alone|lonely|akela|koi nahi|disconnect/i.test(clean)) {
      return `Loneliness bohot deeply hurt karti hai, especially jab aas-paas log ho phir bhi feel ho ki koi sach mein samajh nahi raha. But you are not alone here. Main sun rahi hoon. Yeh feeling kab se zyada badh gayi hai?`;
    }
    if (/practice|bolna|kehna|confront|boundary|manaa/i.test(clean)) {
      return `Haan, bilkul! Kisi ko manaa karna ya difficult baat kehna sach mein bohot mushkil hota hai. Let's practice it together. Agar main woh insaan banu jisse aapko baat karni hai, toh aap pehli line kya kehna chahoge?`;
    }
    return `Main aapki baat samajh sakti hoon. It takes courage to open up about how you're feeling. Thoda aur share karoge ki aapke andar exactly kya chal raha hai?`;
  }

  // English - Contextual response by intent and persona
  if (/anxious|anxiety|nervous|scared|panic|overwhelmed|racing/i.test(clean)) {
    if (persona.characterKey === 'ari') {
      return `That feeling of being overwhelmed can completely flood your nervous system. Let's pause for just 10 seconds. You don't have to solve everything right now. What is the single biggest thought creating that pressure?`;
    }
    if (persona.characterKey === 'noor') {
      return `I hear how fast everything feels right now. Let's slow down. Place one hand over your chest, take a slow breath in... and let it out. When you're ready, tell me: what does this anxiety feel like in your body?`;
    }
    return `I hear you, and it makes complete sense that you're feeling this weight. Anxiety can make every small thing feel like an emergency. You're in a safe place here. What's the main situation that triggered this feeling today?`;
  }

  if (/lonely|alone|nobody|isolated|disconnected|empty/i.test(clean)) {
    return `Loneliness is such a heavy, quiet ache. Sometimes the hardest part is feeling surrounded by people yet completely unseen. I want you to know: you are seen here, and what you feel matters. Did something happen recently that brought this feeling up?`;
  }

  if (/practice|rehearse|say to|confront|talk to my|boundary|tell him|tell her|tell them/i.test(clean)) {
    return `Practicing hard words beforehand takes away so much of the panic. Let's do it right here. Who is this conversation with, and what is the one honest thing you wish they could truly understand?`;
  }

  if (/family|parents|mom|dad|relative|marriage|relationship|partner/i.test(clean)) {
    if (persona.characterKey === 'tara') {
      return `Family dynamics can be so complex—there's love, but also heavy expectations, guilt, or unspoken tension. It's completely valid to feel torn. What is the hardest part for you to navigate with them right now?`;
    }
    return `Relationships can bring out both our deepest care and our deepest exhaustion. When you feel misunderstood by people close to you, it hurts deeply. How are you holding up through this?`;
  }

  if (/work|job|boss|career|study|exam|fail|college|fired/i.test(clean)) {
    return `Work and study pressure can feel suffocating when so much of your security and self-worth feels tied to it. Take a gentle breath. You are more than your output or deadlines. What feels like the highest hurdle in front of you?`;
  }

  // Natural reflective open inquiry
  const reflections = [
    `Thank you for sharing that with me. It takes real courage to put what you're holding into words. How long have you been carrying this feeling?`,
    `I'm listening closely. What you're experiencing is completely valid, even if it feels messy or hard to explain. What would feel like the most supportive thing right now—talking it through, or practicing what to do next?`,
    `I hear the honesty in what you wrote. When that happens, what is the thought that keeps looping in your mind the most?`,
  ];

  return reflections[Math.floor(Math.random() * reflections.length)];
}
