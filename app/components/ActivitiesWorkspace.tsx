'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Leaf } from 'lucide-react';
import { activityTemplates } from '@/lib/fixtures';
import { FIXTURE_NOTICE, type ActivityRecord, type ActivityStatus, type InterestId, type IntroAnswers, type MoodKind } from '@/lib/domain';
import { suggestActivities, transitionActivity, upsertActivity } from '@/lib/client/store';

type Props = {
  activities: ActivityRecord[];
  answers: IntroAnswers | null;
  mood?: MoodKind | null;
  interests?: InterestId[];
  hasAcceptedConnection: boolean;
  onChange: (activities: ActivityRecord[]) => void;
  flash: (message: string) => void;
};

const filters = [
  { id: 'mine', label: 'My activities' },
  { id: 'guided', label: 'Guided (Rootd-like)' },
  { id: 'shared', label: 'Shared with me' },
  { id: 'done', label: 'Completed' },
] as const;

export default function ActivitiesWorkspace({ activities, answers, mood, interests, hasAcceptedConnection, onChange, flash }: Props) {
  const [tab, setTab] = useState<(typeof filters)[number]['id']>('mine');
  const [openId, setOpenId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepNotes, setStepNotes] = useState<Record<number, string>>({});
  const [now, setNow] = useState(() => Date.now());
  const suggestions = useMemo(() => suggestActivities(answers, { mood, interests }), [answers, mood, interests]);
  const guidedTemplates = useMemo(() => activityTemplates.filter(item => item.kind === 'rootd-like'), []);

  useEffect(() => {
    const ticking = activities.some(item => item.syncEndsAt && Date.parse(item.syncEndsAt) > Date.now());
    if (!ticking) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activities]);

  const visible = activities.filter(item => {
    if (tab === 'done') return item.status === 'done';
    if (tab === 'shared') return item.invitationStatus !== 'none' || item.visibility !== 'private';
    if (tab === 'guided') {
      const template = activityTemplates.find(entry => entry.id === item.templateId);
      return template?.kind === 'rootd-like';
    }
    return item.visibility === 'private' || item.invitationStatus === 'none';
  });

  function startFromTemplate(templateId: string) {
    const template = activityTemplates.find(item => item.id === templateId);
    if (!template) return;
    const record: ActivityRecord = {
      id: crypto.randomUUID(),
      templateId: template.id,
      title: template.title,
      purpose: template.purpose,
      instructions: template.instructions,
      estimatedMinutes: template.estimatedMinutes,
      visibility: 'private',
      dueDate: '',
      status: 'in-progress',
      response: '',
      publishedResponse: '',
      sharedWith: '',
      invitationStatus: 'none',
      syncKind: 'solo',
      syncEndsAt: '',
      updatedAt: new Date().toISOString(),
    };
    onChange(upsertActivity(record));
    setOpenId(record.id);
    setStepIndex(0);
    setStepNotes({});
    setTab(template.kind === 'rootd-like' ? 'guided' : 'mine');
  }

  const current = activities.find(item => item.id === openId);
  const currentTemplate = current ? activityTemplates.find(item => item.id === current.templateId) : null;
  const steps = currentTemplate?.steps || [];
  const isGuided = Boolean(steps.length);

  function saveStepNote(value: string) {
    if (!current) return;
    const nextNotes = { ...stepNotes, [stepIndex]: value };
    setStepNotes(nextNotes);
    const compiled = steps
      .map((step, index) => {
        const note = nextNotes[index]?.trim();
        return note ? `Step ${index + 1} · ${step.title}\n${note}` : null;
      })
      .filter(Boolean)
      .join('\n\n');
    onChange(upsertActivity({ ...current, response: compiled, updatedAt: new Date().toISOString() }));
  }

  function completeStep() {
    if (!current) return;
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }
    onChange(transitionActivity(current.id, 'done'));
    flash('Guided exercise complete. You can reopen it anytime.');
  }

  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">AT YOUR PACE</div>
        <h1>Activities.</h1>
        <p>
          Small personal or shared exercises, plus Rootd-style guided paths you complete step by step.
          Nothing here is required. Shared timing only starts when you start it.
        </p>
      </div>
      <p className="sample-notice"><Leaf size={17}/> {FIXTURE_NOTICE}</p>
      <div className="plain-panel">
        <h2>Suggested for you</h2>
        <p>Suggestions use only the preferences you wrote. You can choose something else.</p>
        <div className="choice-grid">
          {suggestions.map(item => {
            const template = activityTemplates.find(entry => entry.id === item.templateId);
            return (
              <button type="button" key={item.templateId} onClick={() => startFromTemplate(item.templateId)}>
                <strong>{template?.title}</strong>
                <span>{item.reason}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="plain-panel guided-panel">
        <h2>Guided exercises</h2>
        <p>Stepped paths inspired by calm tools like Rootd — finish each step, then move ahead.</p>
        <div className="people-grid activity-grid">
          {guidedTemplates.map(template => (
            <article className="person-card" key={template.id}>
              <span className="eyebrow">{template.estimatedMinutes} MIN · GUIDED</span>
              <h2>{template.title}</h2>
              <p>{template.purpose}</p>
              <button type="button" className="text-button" onClick={() => startFromTemplate(template.id)}>
                Begin steps <ArrowRight size={16}/>
              </button>
            </article>
          ))}
        </div>
      </div>

      <div className="workspace-tabs" aria-label="Activity lists">
        {filters.map(item => (
          <button type="button" key={item.id} className={tab === item.id ? 'selected' : ''} onClick={() => setTab(item.id)}>{item.label}</button>
        ))}
      </div>
      <div className="people-grid activity-grid">
        {activityTemplates.filter(item => tab !== 'guided' || item.kind === 'rootd-like').map(template => (
          <article className="person-card" key={template.id}>
            <span className="eyebrow">{template.estimatedMinutes} MIN{template.kind === 'rootd-like' ? ' · GUIDED' : ''}</span>
            <h2>{template.title}</h2>
            <p>{template.purpose}</p>
            <button type="button" className="text-button" onClick={() => startFromTemplate(template.id)}>Begin <ArrowRight size={16}/></button>
          </article>
        ))}
      </div>
      {visible.length ? visible.map(item => (
        <article className="request-row" key={item.id}>
          <div>
            <strong>{item.title}</strong>
            <span>{item.status.replace('-', ' ')} · {item.visibility}</span>
          </div>
          <button type="button" className="quiet" onClick={() => { setOpenId(item.id); setStepIndex(0); }}>Open</button>
        </article>
      )) : <p className="small-print">{tab === 'shared' ? 'No shared activities yet. Only accepted connections can send invitations.' : 'No activities in this list yet.'}</p>}
      {current && (
        <section className="plain-panel">
          <h2>{current.title}</h2>
          <p>{current.purpose}</p>
          <p className="small-print">{current.instructions}</p>

          {isGuided ? (
            <div className="guided-steps">
              <div className="guided-progress" aria-hidden="true">
                {steps.map((_, index) => (
                  <span key={index} className={index <= stepIndex ? 'done' : ''} />
                ))}
              </div>
              <p className="eyebrow">STEP {stepIndex + 1} OF {steps.length}</p>
              <h3>{steps[stepIndex].title}</h3>
              <p>{steps[stepIndex].body}</p>
              <label>
                {steps[stepIndex].prompt || 'Your note'}
                <textarea
                  value={stepNotes[stepIndex] || ''}
                  onChange={event => saveStepNote(event.target.value)}
                  maxLength={800}
                  rows={4}
                  placeholder="Write what you notice…"
                />
              </label>
              <div className="chair-controls">
                <button type="button" className="outline-button" disabled={stepIndex === 0} onClick={() => setStepIndex(stepIndex - 1)}>
                  Back
                </button>
                <button type="button" className="button" onClick={completeStep}>
                  {stepIndex < steps.length - 1 ? <>Next step <ArrowRight size={15}/></> : <><Check size={15}/> Complete</>}
                </button>
                <button type="button" className="quiet" onClick={() => setOpenId(null)}>Close</button>
              </div>
            </div>
          ) : (
            <>
              <label>Optional due date<input type="date" value={current.dueDate} onChange={event => onChange(upsertActivity({ ...current, dueDate: event.target.value, updatedAt: new Date().toISOString() }))}/></label>
              <label>Private draft<textarea value={current.response} onChange={event => onChange(upsertActivity({ ...current, response: event.target.value, updatedAt: new Date().toISOString() }))} maxLength={4000} placeholder="Write privately first…"/></label>
              <p className="small-print">Private drafts stay separate from anything shared. Preview before sharing.</p>
              <div className="chair-controls">
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => {
                    const ends = new Date(Date.now() + current.estimatedMinutes * 60 * 1000).toISOString();
                    onChange(upsertActivity({ ...current, syncKind: 'same-device', syncEndsAt: ends, updatedAt: new Date().toISOString() }));
                    flash('Same-device timer started. Anyone at this screen can follow the same written activity.');
                  }}
                >
                  Start same-device timer
                </button>
                <button
                  type="button"
                  className="outline-button"
                  disabled={!hasAcceptedConnection}
                  onClick={() => {
                    if (!hasAcceptedConnection) {
                      flash('Paired sync needs an accepted human connection. None exist yet.');
                      return;
                    }
                    const ends = new Date(Date.now() + current.estimatedMinutes * 60 * 1000).toISOString();
                    onChange(upsertActivity({
                      ...current,
                      syncKind: 'paired',
                      syncEndsAt: ends,
                      visibility: 'shared-draft',
                      invitationStatus: 'pending',
                      updatedAt: new Date().toISOString(),
                    }));
                    flash('Paired activity recorded as pending in this browser. The other person is contacted only after they have actually accepted.');
                  }}
                >
                  Sync with an accepted person
                </button>
              </div>
              {current.syncEndsAt && (
                <p className="small-print">
                  {(current.syncKind || 'solo') === 'solo' ? 'Solo' : current.syncKind === 'same-device' ? 'Same-device' : 'Paired'} timer:
                  {' '}
                  {Date.parse(current.syncEndsAt) > now
                    ? `${Math.ceil((Date.parse(current.syncEndsAt) - now) / 1000)} seconds left`
                    : 'ended'}
                </p>
              )}
              {current.response && (
                <div className="wording-preview">
                  <span className="eyebrow">PREVIEW</span>
                  <pre className="intro-preview">{current.response}</pre>
                  <button
                    type="button"
                    className="outline-button"
                    disabled={!hasAcceptedConnection}
                    onClick={() => {
                      if (!hasAcceptedConnection) {
                        flash('Only an accepted connection can receive a shared-activity invitation. None exist yet.');
                        return;
                      }
                      onChange(upsertActivity({ ...current, visibility: 'shared-draft', invitationStatus: 'pending', updatedAt: new Date().toISOString() }));
                      flash('Invitation recorded as pending in this browser fixture. The other person has not been contacted.');
                    }}
                  >
                    Preview and invite an accepted connection
                  </button>
                </div>
              )}
              <div className="chair-controls">
                {(['in-progress', 'done', 'skipped', 'archived'] as ActivityStatus[]).map(status => (
                  <button type="button" key={status} className="outline-button" onClick={() => onChange(transitionActivity(current.id, status))}>{status.replace('-', ' ')}</button>
                ))}
                <button type="button" className="quiet" onClick={() => setOpenId(null)}>Close</button>
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
