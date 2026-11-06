'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Armchair, ArrowRight, ArrowUpRight, Plus, Send, Sparkles } from 'lucide-react';
import CharacterWait from '@/components/CharacterWait';
import { staticWritingPrompts } from '@/lib/fixtures';

type Message = { role: 'user' | 'assistant'; content: string };
type Phase = 'describe' | 'explore' | 'rehearse';

type Props = {
  auth: boolean;
  aiConfigured: boolean;
  privateContext: string;
  onPrivateContextChange: (value: string) => void;
  onNotice: (message: string) => void;
  seed?: {
    situation?: string;
    story?: string;
    goal?: string;
  } | null;
};

export default function PractiseRoom({
  auth,
  aiConfigured,
  privateContext,
  onPrivateContextChange,
  onNotice,
  seed = null,
}: Props) {
  const [scenario, setScenario] = useState(seed?.situation || 'Setting a boundary');
  const [scenarioStory, setScenarioStory] = useState(seed?.story || '');
  const [goal, setGoal] = useState(seed?.goal || '');
  const [style, setStyle] = useState('Receptive');

  const styleHints: Record<string, string> = {
    Receptive: 'They listen and stay open.',
    Hesitant: 'They pause, worry, or need time.',
    Defensive: 'They push back a little — still safe, not cruel.',
  };
  const [aiConsent, setAiConsent] = useState(false);
  const [includeContext, setIncludeContext] = useState(false);
  const [phase, setPhase] = useState<Phase>('describe');
  const [exploreMessages, setExploreMessages] = useState<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [exploreDraft, setExploreDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!seed) return;
    if (seed.situation) setScenario(seed.situation);
    if (seed.story) setScenarioStory(seed.story);
    if (seed.goal) setGoal(seed.goal);
    setPhase('describe');
  }, [seed?.situation, seed?.story, seed?.goal]);

  function linkedScenario(extra = '') {
    const parts = [
      `Situation type: ${scenario}`,
      `Hoped-for outcome: ${goal.trim() || 'Say the first sentence clearly and stay true to myself'}`,
      scenarioStory.trim() ? `What the user described: ${scenarioStory.trim()}` : '',
      exploreMessages.length
        ? `What was clarified:\n${exploreMessages.map(item => `${item.role === 'user' ? 'User' : 'Coach'}: ${item.content}`).join('\n')}`
        : '',
      includeContext && privateContext.trim()
        ? `Optional private context the user chose to include: ${privateContext.trim()}`
        : '',
      extra.trim(),
    ].filter(Boolean);
    return parts.join('\n\n').slice(0, 4000);
  }

  async function callRehearseApi(mode: 'explore' | 'rehearse', nextMessages: Message[], scenarioText: string) {
    const result = await fetch('/api/rehearse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: abortRef.current?.signal,
      body: JSON.stringify({
        messages: nextMessages.slice(-15),
        scenario: scenarioText,
        style: style.toLowerCase(),
        mode,
        consent: true,
      }),
    });
    const data = await result.json() as { reply?: string; error?: string };
    if (!result.ok) throw new Error(data.error || 'The rehearsal could not continue.');
    return data.reply || '';
  }

  async function beginScenarioExplore() {
    if (!scenarioStory.trim()) {
      onNotice('Write a little about the situation first — even a rough draft helps.');
      return;
    }
    if (!aiConsent) {
      onNotice('Tick the AI consent box when you are ready to clarify with the coach.');
      return;
    }
    if (!aiConfigured) {
      setPhase('explore');
      setExploreMessages([
        { role: 'user', content: scenarioStory.trim() },
        {
          role: 'assistant',
          content: 'AI is offline right now, so answer these quietly for yourself:\n1) Who is this with?\n2) What do you most need them to understand?\n3) What feels hardest to say out loud?\nWhen you are ready, start practise with what you wrote.',
        },
      ]);
      return;
    }
    const opening: Message[] = [{
      role: 'user',
      content: `Here is the situation I want to practise:\n${scenarioStory.trim()}\n\nIf it goes well, I hope: ${goal.trim() || 'to say the first sentence clearly and stay true to myself'}`,
    }];
    setExploreMessages(opening);
    setPhase('explore');
    setBusy(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const reply = await callRehearseApi('explore', opening, linkedScenario());
      if (reply) setExploreMessages([...opening, { role: 'assistant', content: reply }]);
    } catch (error) {
      if ((error as Error).name === 'AbortError') onNotice('Scenario coaching cancelled.');
      else onNotice((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function sendExplore(event: FormEvent) {
    event.preventDefault();
    if (!exploreDraft.trim() || busy) return;
    if (!aiConsent) {
      onNotice('Please allow AI processing before continuing.');
      return;
    }
    const next: Message[] = [...exploreMessages, { role: 'user', content: exploreDraft.trim() }];
    setExploreMessages(next);
    setExploreDraft('');
    if (!aiConfigured) return;
    setBusy(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const reply = await callRehearseApi('explore', next, linkedScenario());
      if (reply) setExploreMessages([...next, { role: 'assistant', content: reply }]);
    } catch (error) {
      if ((error as Error).name === 'AbortError') onNotice('Scenario coaching cancelled.');
      else onNotice((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function startLinkedRehearsal() {
    if (!scenarioStory.trim()) {
      onNotice('Add your scene first, then practise.');
      return;
    }
    setMessages([]);
    setDraft('');
    setPhase('rehearse');
    onNotice('Your scene is linked. Try the first sentence with a fictional person.');
  }

  async function sendRehearsal(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || busy) return;
    if (!aiConsent) {
      onNotice('Please allow AI processing before sending your practice conversation.');
      return;
    }
    const next: Message[] = [...messages, { role: 'user', content: draft.trim() }];
    setMessages(next);
    setDraft('');
    setBusy(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const reply = await callRehearseApi('rehearse', next, linkedScenario());
      if (reply) setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (error) {
      if ((error as Error).name === 'AbortError') onNotice('Rehearsal cancelled. Nothing extra was added.');
      else onNotice((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function resetFlow() {
    abortRef.current?.abort();
    setMessages([]);
    setExploreMessages([]);
    setDraft('');
    setExploreDraft('');
    setPhase('describe');
  }

  return (
    <div className="practise-shell chairs-practise">
      <div className="page-heading practise-heading">
        <div className="eyebrow">TWO CHAIRS · PRACTISE</div>
        <h1>Say it here first.<br/><em>Safer than saying it cold.</em></h1>
        <p>Write what is hard to say. The AI helps you understand the moment, then you rehearse with a fictional person — before the real conversation.</p>
      </div>

      <nav className="practise-steps" aria-label="Practise steps">
        {([
          { id: 'describe' as Phase, label: '1 · Your scene', ready: true },
          { id: 'explore' as Phase, label: '2 · Clarify', ready: Boolean(scenarioStory.trim()) },
          { id: 'rehearse' as Phase, label: '3 · Practise', ready: Boolean(scenarioStory.trim()) },
        ]).map(step => {
          const order: Phase[] = ['describe', 'explore', 'rehearse'];
          const currentIndex = order.indexOf(phase);
          const stepIndex = order.indexOf(step.id);
          const status = phase === step.id ? 'current' : stepIndex < currentIndex ? 'completed' : 'upcoming';
          return (
            <button
              key={step.id}
              type="button"
              className={`practise-step practise-step-${status}${phase === step.id ? ' active' : ''}`}
              aria-current={phase === step.id ? 'step' : undefined}
              disabled={!step.ready}
              onClick={() => {
                if (step.id === 'describe') setPhase('describe');
                else if (step.id === 'explore' && scenarioStory.trim()) setPhase('explore');
                else if (step.id === 'rehearse' && scenarioStory.trim()) startLinkedRehearsal();
              }}
            >
              {status === 'completed' ? `✓ ${step.label}` : step.label}
            </button>
          );
        })}
      </nav>

      {phase === 'describe' && (
        <section className="practise-card practise-describe">
          <div className="practise-describe-grid">
            <div>
              <div className="eyebrow">STEP 1</div>
              <h2>Who is this for?</h2>
              <p>Name the person, what you need to say, and why it feels stuck. Messy notes are fine — the AI will ask gentle questions next.</p>

              <div className="practise-field">
                <label htmlFor="situation-type">Kind of conversation</label>
                <select id="situation-type" value={scenario} onChange={event => setScenario(event.target.value)}>
                  {['Setting a boundary', 'Asking for support', 'Talking to a partner', 'A conversation at work', 'Making an apology'].map(item => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <span className="practise-hint">A rough category helps the coach ask better questions.</span>
              </div>

              <div className="practise-field">
                <label htmlFor="scenario-story">Your situation, in your words</label>
                <textarea
                  id="scenario-story"
                  value={scenarioStory}
                  onChange={event => setScenarioStory(event.target.value)}
                  maxLength={2000}
                  placeholder={'Try something like:\n“I need to tell my manager the workload is too much — without sounding ungrateful.”\n\nOr: “I want to tell my partner I’ve been shutting down, and I don’t know how to start.”'}
                />
                <div className="practise-field-meta">
                  <span className="practise-hint">Who · what you need · what feels hard</span>
                  <span className="field-count">{scenarioStory.length}/2000</span>
                </div>
              </div>

              <div className="practise-field">
                <label htmlFor="practise-goal">If this goes well, what would that sound like?</label>
                <input
                  id="practise-goal"
                  value={goal}
                  onChange={event => setGoal(event.target.value)}
                  maxLength={160}
                  placeholder="e.g. They hear me without me having to over-explain"
                />
                <span className="practise-hint">Optional. One sentence is enough.</span>
              </div>

              <div className="practise-field">
                <label htmlFor="practise-style">How should the fictional person respond?</label>
                <select id="practise-style" value={style} onChange={event => setStyle(event.target.value)}>
                  <option value="Receptive">Warm and open</option>
                  <option value="Hesitant">Quiet and unsure</option>
                  <option value="Defensive">A little guarded</option>
                </select>
                <span className="practise-hint">{styleHints[style]}</span>
              </div>

              <div className="practise-privacy">
                <p className="small-print">Nothing from My space is added unless you choose it below.</p>
                <label className="checkbox-label">
                  <input type="checkbox" checked={includeContext} onChange={event => setIncludeContext(event.target.checked)}/>
                  Also include notes I saved in My space
                </label>
                {includeContext && (
                  <textarea
                    value={privateContext}
                    onChange={event => onPrivateContextChange(event.target.value)}
                    maxLength={2000}
                    placeholder="Only the lines you want the coach to see…"
                  />
                )}
                <label className="checkbox-label">
                  <input type="checkbox" checked={aiConsent} onChange={event => setAiConsent(event.target.checked)}/>
                  I’m okay sending this practice chat to the AI provider
                </label>
              </div>

              <div className="inline-actions practise-actions">
                <button className="button" type="button" disabled={busy || !scenarioStory.trim()} onClick={() => void beginScenarioExplore()}>
                  Help me clarify this <ArrowRight size={16}/>
                </button>
                <button className="outline-button" type="button" disabled={!scenarioStory.trim()} onClick={startLinkedRehearsal}>
                  Jump to practise
                </button>
              </div>
              <span className="integration-state">
                <span className={aiConfigured ? 'status-dot ready' : 'status-dot'}/>
                {aiConfigured ? 'AI is ready for practise' : 'AI is not connected yet — you can still write your scene'}
              </span>
              {!auth && (
                <p className="small-print">
                  <a href="/signin-with-chatgpt?return_to=/?view=chairs&focus=practise">Sign in</a> when you want live AI replies.
                </p>
              )}
            </div>
            <aside className="practise-side-art">
              <img src="/assets/saath-two-chairs.jpg" alt="Two people sitting across from each other in a thoughtful conversation"/>
              <p>This is practise with a fictional person. It cannot know what a real person will say — and that is the point.</p>
            </aside>
          </div>
        </section>
      )}

      {phase === 'explore' && (
        <div className="rehearsal-layout practise-layout">
          <aside className="settings-panel practise-scenario-card">
            <div className="eyebrow">YOUR SCENE</div>
            <h2>{scenario}</h2>
            <p className="practise-story">{scenarioStory}</p>
            <p className="small-print"><strong>Hoping for:</strong> {goal.trim() || 'Not set yet'}</p>
            <button className="text-button" type="button" onClick={() => setPhase('describe')}>Edit scene</button>
            <button className="button" type="button" onClick={startLinkedRehearsal}>Ready to practise <ArrowRight size={16}/></button>
            {busy && <button className="outline-button" type="button" onClick={() => abortRef.current?.abort()}>Cancel reply</button>}
            <button className="text-button" type="button" onClick={resetFlow}>Start over <Plus size={15}/></button>
          </aside>
          <section className="chat-panel">
            <div className="chat-header">
              <span className="ai-symbol"><Sparkles size={20}/></span>
              <div><strong>Clarify the moment</strong><span>Gentle questions · not roleplay yet</span></div>
              <span className="quiet-tag">COACH</span>
            </div>
            <div className="chat-messages" aria-live="polite">
              {!exploreMessages.length ? (
                <div className="chat-empty">
                  <span className="empty-chair"><Sparkles size={36} strokeWidth={1}/></span>
                  <h2>Let’s understand this together.</h2>
                  <p>A few short answers help the practise stay true to your situation.</p>
                </div>
              ) : exploreMessages.map((message, index) => (
                <div key={index} className={'message ' + message.role}>
                  <span>{message.role === 'user' ? 'YOU' : 'COACH'}</span>
                  <p>{message.content}</p>
                </div>
              ))}
              {busy && <CharacterWait kind="ai" companion="noor" message="Preparing a reply…" />}
            </div>
            <form className="chat-input" onSubmit={sendExplore}>
              <textarea
                aria-label="Answer the scenario question"
                placeholder="Answer in your own words — or add one more detail…"
                value={exploreDraft}
                onChange={event => setExploreDraft(event.target.value)}
                maxLength={2000}
              />
              <button className="round-button" aria-label="Send answer" disabled={busy || !exploreDraft.trim()}><Send size={18}/></button>
            </form>
            <div className="chat-footer">When it feels clear enough, start practise. You can come back and edit anytime.</div>
          </section>
        </div>
      )}

      {phase === 'rehearse' && (
        <div className="rehearsal-layout practise-layout">
          <aside className="settings-panel practise-scenario-card">
            <div className="eyebrow">LINKED TO YOUR SCENE</div>
            <h2>{scenario}</h2>
            <p className="practise-story">{scenarioStory}</p>
            <p className="small-print"><strong>Hoping for:</strong> {goal.trim() || 'Not set yet'}</p>
            <p className="small-print"><strong>Their tone:</strong> {style}</p>
            {exploreMessages.length > 0 && (
              <p className="small-print">Includes what you clarified with the coach.</p>
            )}
            <button className="text-button" type="button" onClick={() => setPhase('explore')}>Back to questions</button>
            <button className="text-button" type="button" onClick={() => setPhase('describe')}>Edit scene</button>
            <button className="text-button" type="button" onClick={resetFlow}>Start over <Plus size={15}/></button>
            {busy && <button className="outline-button" type="button" onClick={() => abortRef.current?.abort()}>Cancel reply</button>}
            {!aiConfigured && (
              <div>
                <p className="small-print">AI replies are offline. You can still draft lines with these prompts:</p>
                {staticWritingPrompts.map(item => (
                  <button type="button" key={item} className="quiet" onClick={() => setDraft(item)}>{item}</button>
                ))}
              </div>
            )}
          </aside>
          <section className="chat-panel">
            <div className="chat-header">
              <span className="ai-symbol"><Sparkles size={20}/></span>
              <div><strong>Practise room</strong><span>Fictional person · {style.toLowerCase()} · tied to your scene</span></div>
              <span className="quiet-tag">AI</span>
            </div>
            <div className="chat-messages" aria-live="polite">
              {!messages.length ? (
                <div className="chat-empty">
                  <span className="empty-chair"><Armchair size={43} strokeWidth={1}/></span>
                  <h2>Breathe.<br/>Try the first line.</h2>
                  <p>They stay inside your scene. If something is unclear, they may ask — still as fiction.</p>
                  <button type="button" onClick={() => setDraft('I care about this, and I need to talk about something that has been hard for me.')}>
                    Suggest an opening <ArrowUpRight size={15}/>
                  </button>
                </div>
              ) : messages.map((message, index) => (
                <div key={index} className={'message ' + message.role}>
                  <span>{message.role === 'user' ? 'YOU' : 'FICTIONAL PERSON'}</span>
                  <p>{message.content}</p>
                </div>
              ))}
              {busy && <CharacterWait kind="ai" companion="mira" message="Preparing a reply…" />}
            </div>
            <form className="chat-input" onSubmit={sendRehearsal}>
              <textarea aria-label="Your rehearsal message" placeholder="What do you want to try saying?" value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000}/>
              <button className="round-button" aria-label="Send rehearsal message" disabled={busy || !draft.trim()}><Send size={18}/></button>
            </form>
            <div className="chat-footer">
              Practise only — not a real person.
              {!auth && <> <a href="/signin-with-chatgpt?return_to=/?view=chairs&focus=practise">Sign in for AI replies.</a></>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
