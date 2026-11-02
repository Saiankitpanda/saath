'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Armchair, ArrowRight, ArrowUpRight, Plus, Send, Sparkles } from 'lucide-react';
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
  const [goal, setGoal] = useState(seed?.goal || 'Say the first sentence clearly');
  const [style, setStyle] = useState('Receptive');
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
      `Goal: ${goal}`,
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
      onNotice('Tell the AI a little about the situation first.');
      return;
    }
    if (!aiConsent) {
      onNotice('Please allow AI processing before unpacking the scenario.');
      return;
    }
    if (!aiConfigured) {
      setPhase('explore');
      setExploreMessages([
        { role: 'user', content: scenarioStory.trim() },
        {
          role: 'assistant',
          content: 'AI is not connected yet, so here are quiet prompts you can answer yourself:\n1) Who is this conversation with?\n2) What do you most need them to understand?\n3) What feels hardest to say?\nWrite your answers below, then start rehearsal when ready.',
        },
      ]);
      return;
    }
    const opening: Message[] = [{
      role: 'user',
      content: `Here is the situation I want to practise:\n${scenarioStory.trim()}\n\nMy goal: ${goal}`,
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
      onNotice('Describe the scenario before rehearsing.');
      return;
    }
    setMessages([]);
    setDraft('');
    setPhase('rehearse');
    onNotice('Scenario is linked. Practise the first sentence with a fictional counterpart.');
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
        <div className="eyebrow">UNDER TWO CHAIRS · PRACTISE</div>
        <h1>Tell the scene.<br/><em>Then rehearse it.</em></h1>
        <p>Describe what is going on, let the AI ask questions to understand, then practise with a fictional counterpart linked to that scenario — before you sit with a real person.</p>
      </div>

      <nav className="practise-steps" aria-label="Practise steps">
        <button type="button" className={phase === 'describe' ? 'active' : ''} onClick={() => setPhase('describe')}>1 · Describe</button>
        <button type="button" className={phase === 'explore' ? 'active' : ''} disabled={!scenarioStory.trim()} onClick={() => scenarioStory.trim() && setPhase('explore')}>2 · Understand</button>
        <button type="button" className={phase === 'rehearse' ? 'active' : ''} disabled={!scenarioStory.trim()} onClick={() => scenarioStory.trim() && startLinkedRehearsal()}>3 · Rehearse</button>
      </nav>

      {phase === 'describe' && (
        <section className="practise-card practise-describe">
          <div className="practise-describe-grid">
            <div>
              <div className="eyebrow">YOUR SITUATION</div>
              <h2>What is going on?</h2>
              <p>Mention who this is with, what you need to say, and why it feels hard. The AI will ask questions next.</p>
              <label>Situation type
                <select value={scenario} onChange={event => setScenario(event.target.value)}>
                  {['Setting a boundary', 'Asking for support', 'Talking to a partner', 'A conversation at work', 'Making an apology'].map(item => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label htmlFor="scenario-story">Describe the scenario</label>
              <textarea
                id="scenario-story"
                value={scenarioStory}
                onChange={event => setScenarioStory(event.target.value)}
                maxLength={2000}
                placeholder="Example: I need to tell my manager that the workload is too much, without sounding ungrateful…"
              />
              <span className="field-count">{scenarioStory.length}/2000</span>
              <label>What would a good outcome sound like?
                <input value={goal} onChange={event => setGoal(event.target.value)} maxLength={160} placeholder="Say the first sentence clearly"/>
              </label>
              <label>Fictional response style
                <select value={style} onChange={event => setStyle(event.target.value)}>
                  {['Receptive', 'Hesitant', 'Defensive'].map(item => <option key={item}>{item}</option>)}
                </select>
              </label>
              <p className="small-print">Private context is never appended automatically.</p>
              <label className="checkbox-label">
                <input type="checkbox" checked={includeContext} onChange={event => setIncludeContext(event.target.checked)}/>
                Include private context from My space
              </label>
              {includeContext && (
                <textarea
                  value={privateContext}
                  onChange={event => onPrivateContextChange(event.target.value)}
                  maxLength={2000}
                  placeholder="Only the context you choose to send…"
                />
              )}
              <label className="checkbox-label">
                <input type="checkbox" checked={aiConsent} onChange={event => setAiConsent(event.target.checked)}/>
                I agree to send this practice conversation to the configured AI provider.
              </label>
              <div className="inline-actions practise-actions">
                <button className="button" type="button" disabled={busy || !scenarioStory.trim()} onClick={() => void beginScenarioExplore()}>
                  Unpack with AI <ArrowRight size={16}/>
                </button>
                <button className="outline-button" type="button" disabled={!scenarioStory.trim()} onClick={startLinkedRehearsal}>
                  Skip to rehearsal
                </button>
              </div>
              <span className="integration-state">
                <span className={aiConfigured ? 'status-dot ready' : 'status-dot'}/>
                {aiConfigured ? 'AI provider configured' : 'AI provider not connected yet'}
              </span>
              {!auth && (
                <p className="small-print">
                  <a href="/signin-with-chatgpt?return_to=/?view=chairs&focus=practise">Sign in</a> to use AI coaching and rehearsal.
                </p>
              )}
            </div>
            <aside className="practise-side-art">
              <img src="/assets/saath-rehearsal.png" alt="Two empty chairs in a rehearsal room"/>
              <p>Fictional practice only. It cannot know or predict what a real person will say.</p>
            </aside>
          </div>
        </section>
      )}

      {phase === 'explore' && (
        <div className="rehearsal-layout practise-layout">
          <aside className="settings-panel practise-scenario-card">
            <div className="eyebrow">LINKED SCENARIO</div>
            <h2>{scenario}</h2>
            <p className="practise-story">{scenarioStory}</p>
            <p className="small-print"><strong>Goal:</strong> {goal}</p>
            <button className="text-button" type="button" onClick={() => setPhase('describe')}>Edit scenario</button>
            <button className="button" type="button" onClick={startLinkedRehearsal}>Start rehearsal <ArrowRight size={16}/></button>
            {busy && <button className="outline-button" type="button" onClick={() => abortRef.current?.abort()}>Cancel pending reply</button>}
            <button className="text-button" type="button" onClick={resetFlow}>Restart and clear <Plus size={15}/></button>
          </aside>
          <section className="chat-panel">
            <div className="chat-header">
              <span className="ai-symbol"><Sparkles size={20}/></span>
              <div><strong>Understand the scene</strong><span>AI asks questions · not roleplay yet</span></div>
              <span className="quiet-tag">COACH</span>
            </div>
            <div className="chat-messages" aria-live="polite">
              {!exploreMessages.length ? (
                <div className="chat-empty">
                  <span className="empty-chair"><Sparkles size={36} strokeWidth={1}/></span>
                  <h2>Let’s unpack this together.</h2>
                  <p>Answer a few questions so the rehearsal stays linked to your real situation.</p>
                </div>
              ) : exploreMessages.map((message, index) => (
                <div key={index} className={'message ' + message.role}>
                  <span>{message.role === 'user' ? 'YOU' : 'SCENARIO COACH'}</span>
                  <p>{message.content}</p>
                </div>
              ))}
              {busy && <div className="thinking">Listening and asking…</div>}
            </div>
            <form className="chat-input" onSubmit={sendExplore}>
              <textarea
                aria-label="Answer the scenario question"
                placeholder="Answer the question, or add another detail…"
                value={exploreDraft}
                onChange={event => setExploreDraft(event.target.value)}
                maxLength={2000}
              />
              <button className="round-button" aria-label="Send answer" disabled={busy || !exploreDraft.trim()}><Send size={18}/></button>
            </form>
            <div className="chat-footer">The coach learns your scenario first. Rehearsal starts only when you choose.</div>
          </section>
        </div>
      )}

      {phase === 'rehearse' && (
        <div className="rehearsal-layout practise-layout">
          <aside className="settings-panel practise-scenario-card">
            <div className="eyebrow">LINKED SCENARIO</div>
            <h2>{scenario}</h2>
            <p className="practise-story">{scenarioStory}</p>
            <p className="small-print"><strong>Goal:</strong> {goal}</p>
            <p className="small-print"><strong>Style:</strong> {style}</p>
            {exploreMessages.length > 0 && (
              <p className="small-print">Includes what you clarified with the coach.</p>
            )}
            <button className="text-button" type="button" onClick={() => setPhase('explore')}>Back to questions</button>
            <button className="text-button" type="button" onClick={() => setPhase('describe')}>Edit scenario</button>
            <button className="text-button" type="button" onClick={resetFlow}>Restart and clear <Plus size={15}/></button>
            {busy && <button className="outline-button" type="button" onClick={() => abortRef.current?.abort()}>Cancel pending reply</button>}
            {!aiConfigured && (
              <div>
                <p className="small-print">No fabricated AI replies. Static writing prompts remain available.</p>
                {staticWritingPrompts.map(item => (
                  <button type="button" key={item} className="quiet" onClick={() => setDraft(item)}>{item}</button>
                ))}
              </div>
            )}
          </aside>
          <section className="chat-panel">
            <div className="chat-header">
              <span className="ai-symbol"><Sparkles size={20}/></span>
              <div><strong>Your rehearsal room</strong><span>Fictional counterpart · {style.toLowerCase()} · linked to your scenario</span></div>
              <span className="quiet-tag">AI</span>
            </div>
            <div className="chat-messages" aria-live="polite">
              {!messages.length ? (
                <div className="chat-empty">
                  <span className="empty-chair"><Armchair size={43} strokeWidth={1}/></span>
                  <h2>Take a breath.<br/>Practise the first line.</h2>
                  <p>The counterpart will stay inside your scenario and may ask short questions in character.</p>
                  <button type="button" onClick={() => setDraft('I care about this, but I need to talk about something that has been difficult for me.')}>
                    Help me start <ArrowUpRight size={15}/>
                  </button>
                </div>
              ) : messages.map((message, index) => (
                <div key={index} className={'message ' + message.role}>
                  <span>{message.role === 'user' ? 'YOU' : 'FICTIONAL COUNTERPART'}</span>
                  <p>{message.content}</p>
                </div>
              ))}
              {busy && <div className="thinking">Preparing a response…</div>}
            </div>
            <form className="chat-input" onSubmit={sendRehearsal}>
              <textarea aria-label="Your rehearsal message" placeholder="What would you like to say?" value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000}/>
              <button className="round-button" aria-label="Send rehearsal message" disabled={busy || !draft.trim()}><Send size={18}/></button>
            </form>
            <div className="chat-footer">
              Text rehearsal linked to your scenario.
              {!auth && <> <a href="/signin-with-chatgpt?return_to=/?view=chairs&focus=practise">Sign in to use AI.</a></>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
