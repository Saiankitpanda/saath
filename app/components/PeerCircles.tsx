'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, HeartHandshake, Leaf, MessageCircle, RefreshCw, Send, ShieldCheck, Users } from 'lucide-react';
import {
  addCirclePost,
  addSecretComment,
  addSessionMessage,
  listCirclePosts,
  listSecretComments,
  listSessionMessages,
  loadFixtures,
  setCircleMembership,
} from '@/lib/client/store';
import { circleFixtures, circleSecrets, sampleCirclePosts } from '@/lib/fixtures';
import type { CircleMembership, CirclePost, CircleRecord, CircleSecretComment, JoinedSessionMessage } from '@/lib/domain';

type Props = {
  auth: boolean;
  displayName: string;
  onNotice: (message: string) => void;
};

const themes = [
  { id: 'all', label: 'All' },
  { id: 'hardship', label: 'Lived hardship' },
  { id: 'grief', label: 'Grief' },
  { id: 'family', label: 'Family' },
  { id: 'transitions', label: 'Starting over' },
  { id: 'work', label: 'Work & study' },
] as const;

type RoomTab = 'secrets' | 'discussion' | 'session';

function mergePosts(circleId: string, local: CirclePost[]): CirclePost[] {
  const fixtures = sampleCirclePosts.filter(item => item.circleId === circleId);
  const ids = new Set(local.map(item => item.id));
  return [...local, ...fixtures.filter(item => !ids.has(item.id))].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export default function PeerCircles({ auth, displayName, onNotice }: Props) {
  const initialMembership = loadFixtures().circleMembership;
  const [membership, setMembership] = useState<Record<string, CircleMembership>>(initialMembership);
  const [theme, setTheme] = useState<(typeof themes)[number]['id']>('all');
  const [activeId, setActiveId] = useState(circleFixtures[0]?.id || '');
  const [roomTab, setRoomTab] = useState<RoomTab>('secrets');
  const [secretId, setSecretId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [sessionDraft, setSessionDraft] = useState('');
  const [sessionMessages, setSessionMessages] = useState<JoinedSessionMessage[]>([]);
  const [secretComments, setSecretComments] = useState<CircleSecretComment[]>([]);
  const [postsByCircle, setPostsByCircle] = useState<Record<string, CirclePost[]>>(() => {
    const map: Record<string, CirclePost[]> = {};
    for (const circle of circleFixtures) {
      map[circle.id] = mergePosts(circle.id, listCirclePosts(circle.id));
    }
    return map;
  });

  const circles = useMemo(
    () => circleFixtures.filter(item => theme === 'all' || item.theme === theme),
    [theme],
  );
  const active = circles.find(item => item.id === activeId) || circles[0] || circleFixtures[0];
  const status = active ? membership[active.id] || active.membership : 'none';
  const posts = active ? postsByCircle[active.id] || [] : [];
  const canPost = status === 'approved' || status === 'requested';
  const secrets = active ? circleSecrets[active.id] || [] : [];
  const activeSecret = secrets.find(item => item.id === secretId) || secrets[0] || null;

  function openCircle(circle: CircleRecord) {
    setActiveId(circle.id);
    setSecretId(null);
    setRoomTab('secrets');
    setSessionMessages(listSessionMessages(circle.id));
  }

  function joinCircle(circle: CircleRecord) {
    const next = setCircleMembership(circle.id, 'approved');
    setMembership(next);
    setActiveId(circle.id);
    setRoomTab('session');
    setSessionMessages(listSessionMessages(circle.id));
    onNotice(`Joined session for ${circle.name}. Share thoughts in the discussion window.`);
  }

  function leaveCircle(circle: CircleRecord) {
    const next = setCircleMembership(circle.id, 'left');
    setMembership(next);
    onNotice(`You left ${circle.name}.`);
  }

  function publish() {
    if (!active || !draft.trim()) return;
    if (!canPost) {
      onNotice('Join this circle before posting.');
      return;
    }
    const rows = addCirclePost({
      circleId: active.id,
      body: draft,
      authorLabel: displayName || (auth ? 'You' : 'Anonymous peer'),
    });
    setPostsByCircle(current => ({ ...current, [active.id]: mergePosts(active.id, rows) }));
    setDraft('');
    onNotice('Thought saved in this browser. Live peer sync needs signup.');
  }

  function openSecret(id: string) {
    if (!active) return;
    setSecretId(id);
    setSecretComments(listSecretComments(active.id, id));
  }

  function publishComment() {
    if (!active || !activeSecret || !commentDraft.trim()) return;
    if (!canPost) {
      onNotice('Join the circle to leave a thought on a secret.');
      return;
    }
    const rows = addSecretComment({
      circleId: active.id,
      secretId: activeSecret.id,
      body: commentDraft,
      authorLabel: displayName || (auth ? 'You' : 'Anonymous peer'),
    });
    setSecretComments(rows);
    setCommentDraft('');
    onNotice('Comment saved with this secret.');
  }

  function publishSession() {
    if (!active || !sessionDraft.trim()) return;
    if (status !== 'approved') {
      onNotice('Join the circle to use Joined session.');
      return;
    }
    const rows = addSessionMessage({
      circleId: active.id,
      body: sessionDraft,
      authorLabel: displayName || (auth ? 'You' : 'Anonymous peer'),
    });
    setSessionMessages(rows);
    setSessionDraft('');
  }

  function refreshSession() {
    if (!active) return;
    setSessionMessages(listSessionMessages(active.id));
    onNotice('Joined session refreshed.');
  }

  return (
    <div className="peers-shell">
      <header className="peers-hero">
        <div>
          <div className="eyebrow">PEER CIRCLES</div>
          <h1>Find people who have<br/>been through <em>something like it.</em></h1>
          <p>
            Open a circle, read Secrets with care, leave a thought, then use Joined session for live discussion.
            Peer support — not therapy, not trauma bonding, not an emergency service.
          </p>
          <div className="peers-pill-row">
            <span><Users size={14}/> Same lived theme</span>
            <span><MessageCircle size={14}/> Secrets & thoughts</span>
            <span><ShieldCheck size={14}/> Share only what you choose</span>
          </div>
        </div>
        <aside className="peers-hero-note">
          <HeartHandshake size={22} strokeWidth={1.5}/>
          <h2>How it works</h2>
          <ol>
            <li>Pick a circle that matches what you carry.</li>
            <li>Read Secrets — gentle stories and conflict tips.</li>
            <li>Join for discussion and a Joined session window.</li>
          </ol>
          <p className="small-print">Preview stays in this browser until signup sync lands.</p>
        </aside>
      </header>

      <div className="peers-filters" role="tablist" aria-label="Circle themes">
        {themes.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={theme === item.id}
            className={theme === item.id ? 'selected' : ''}
            onClick={() => {
              setTheme(item.id);
              const first = circleFixtures.find(circle => item.id === 'all' || circle.theme === item.id);
              if (first) openCircle(first);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="peers-layout">
        <div className="peers-list">
          {circles.map(circle => {
            const joined = (membership[circle.id] || circle.membership) === 'approved';
            return (
              <button
                key={circle.id}
                type="button"
                className={'peers-card' + (active?.id === circle.id ? ' active' : '')}
                onClick={() => openCircle(circle)}
              >
                <div className="peers-card-top">
                  <span className="eyebrow">{circle.topic}</span>
                  {joined && <span className="peers-joined">Joined</span>}
                </div>
                <h3>{circle.name}</h3>
                <p>{circle.description}</p>
                <div className="peers-card-meta">
                  <span>{circle.language}</span>
                  <span>{circle.schedule}</span>
                </div>
              </button>
            );
          })}
          {!circles.length && (
            <div className="peers-empty">
              <Leaf size={22}/>
              <p>No circles in this theme yet.</p>
            </div>
          )}
        </div>

        {active && (
          <section className="peers-room">
            <header className="peers-room-head">
              <div>
                <div className="eyebrow">{active.topic}</div>
                <h2>{active.name}</h2>
                <p>{active.description}</p>
              </div>
              <div className="peers-room-actions">
                {status === 'approved' ? (
                  <button className="outline-button" type="button" onClick={() => leaveCircle(active)}>Leave circle</button>
                ) : (
                  <button className="button" type="button" onClick={() => joinCircle(active)}>
                    Join peers <ArrowRight size={16}/>
                  </button>
                )}
              </div>
            </header>

            <ul className="peers-guidelines">
              {active.guidelines.map(item => <li key={item}>{item}</li>)}
            </ul>

            <div className="peers-room-tabs" role="tablist" aria-label="Circle room">
              {([
                { id: 'secrets' as const, label: 'Secrets' },
                { id: 'discussion' as const, label: 'Discussion' },
                { id: 'session' as const, label: 'Joined session' },
              ]).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={roomTab === tab.id}
                  className={roomTab === tab.id ? 'selected' : ''}
                  onClick={() => {
                    setRoomTab(tab.id);
                    if (tab.id === 'session' && active) setSessionMessages(listSessionMessages(active.id));
                    if (tab.id === 'secrets' && activeSecret) setSecretComments(listSecretComments(active.id, activeSecret.id));
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {roomTab === 'secrets' && (
              <div className="peers-secrets">
                <div className="peers-secret-list">
                  {secrets.map(secret => (
                    <button
                      key={secret.id}
                      type="button"
                      className={activeSecret?.id === secret.id ? 'selected' : ''}
                      onClick={() => openSecret(secret.id)}
                    >
                      <strong>{secret.title}</strong>
                      <span>Read secretly</span>
                    </button>
                  ))}
                  {!secrets.length && <p className="small-print">No secrets in this circle yet.</p>}
                </div>
                {activeSecret && (
                  <article className="peers-secret-detail">
                    <div className="eyebrow">SECRET</div>
                    <h3>{activeSecret.title}</h3>
                    <p>{activeSecret.body}</p>
                    <div className="peers-guidance">
                      <div>
                        <h4>What helps</h4>
                        <ul>{activeSecret.guidance.do.map(item => <li key={item}>{item}</li>)}</ul>
                      </div>
                      <div>
                        <h4>What not to escalate</h4>
                        <ul>{activeSecret.guidance.dont.map(item => <li key={item}>{item}</li>)}</ul>
                      </div>
                    </div>
                    <div className="peers-composer">
                      <label htmlFor="secret-comment">Share a thought or comment</label>
                      <textarea
                        id="secret-comment"
                        value={commentDraft}
                        onChange={event => setCommentDraft(event.target.value)}
                        maxLength={1200}
                        placeholder={canPost ? 'What feels true, kind, or useful here…' : 'Join to leave a thought…'}
                        disabled={!canPost}
                      />
                      <div className="peers-composer-foot">
                        <span className="small-print">{commentDraft.length}/1200</span>
                        <button className="button" type="button" disabled={!canPost || !commentDraft.trim()} onClick={publishComment}>
                          Comment <Send size={15}/>
                        </button>
                      </div>
                    </div>
                    <div className="peers-feed" aria-live="polite">
                      {(secretComments.length ? secretComments : listSecretComments(active.id, activeSecret.id)).map(comment => (
                        <article key={comment.id} className="peers-post">
                          <header>
                            <strong>{comment.authorLabel}</strong>
                            <span>{new Date(comment.createdAt).toLocaleString()}</span>
                          </header>
                          <p>{comment.body}</p>
                        </article>
                      ))}
                    </div>
                  </article>
                )}
              </div>
            )}

            {roomTab === 'discussion' && (
              <>
                <div className="peers-composer">
                  <label htmlFor="circle-post">Share with this circle</label>
                  <textarea
                    id="circle-post"
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                    maxLength={2000}
                    placeholder={canPost ? 'Write something true and gentle…' : 'Join this circle to post…'}
                    disabled={!canPost}
                  />
                  <div className="peers-composer-foot">
                    <span className="small-print">{draft.length}/2000 · Peer support, not clinical advice</span>
                    <button className="button" type="button" disabled={!canPost || !draft.trim()} onClick={publish}>
                      Post <Send size={15}/>
                    </button>
                  </div>
                </div>
                <div className="peers-feed" aria-live="polite">
                  <div className="eyebrow">THIS IS THE DISCUSSION</div>
                  {posts.length ? posts.map(post => (
                    <article key={post.id} className="peers-post">
                      <header>
                        <strong>{post.authorLabel}</strong>
                        <span>{new Date(post.createdAt).toLocaleString()}</span>
                      </header>
                      <p>{post.body}</p>
                      {post.fixture && <span className="peers-fixture">Illustrative preview post</span>}
                    </article>
                  )) : (
                    <div className="peers-empty">
                      <MessageCircle size={22}/>
                      <p>No posts yet. Be the first gentle voice here.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {roomTab === 'session' && (
              <div className="peers-session">
                <header className="peers-session-head">
                  <div>
                    <div className="eyebrow">JOINED SESSION</div>
                    <h3>This is the discussion</h3>
                    <p className="small-print">Write freely. Refresh to pull the latest messages from this browser.</p>
                  </div>
                  <button type="button" className="outline-button" onClick={refreshSession}>
                    <RefreshCw size={14}/> Refresh
                  </button>
                </header>
                {status !== 'approved' ? (
                  <div className="peers-empty">
                    <p>Join this circle to open the session window.</p>
                    <button className="button" type="button" onClick={() => joinCircle(active)}>Join session</button>
                  </div>
                ) : (
                  <>
                    <div className="peers-session-feed" aria-live="polite">
                      {sessionMessages.length ? sessionMessages.map(message => (
                        <article key={message.id} className="peers-post">
                          <header>
                            <strong>{message.authorLabel}</strong>
                            <span>{new Date(message.createdAt).toLocaleString()}</span>
                          </header>
                          <p>{message.body}</p>
                        </article>
                      )) : (
                        <p className="small-print">Session is quiet. Say hello when you are ready.</p>
                      )}
                    </div>
                    <div className="peers-composer">
                      <label htmlFor="session-post">Your message</label>
                      <textarea
                        id="session-post"
                        value={sessionDraft}
                        onChange={event => setSessionDraft(event.target.value)}
                        maxLength={2000}
                        placeholder="Thoughts, questions, or how to stay kind in conflict…"
                      />
                      <div className="peers-composer-foot">
                        <span className="small-print">{sessionDraft.length}/2000</span>
                        <button className="button" type="button" disabled={!sessionDraft.trim()} onClick={publishSession}>
                          Send <Send size={15}/>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
