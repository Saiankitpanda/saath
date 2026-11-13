'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, HeartHandshake, Leaf, MessageCircle, RefreshCw, Send, ShieldCheck, Users } from 'lucide-react';
import {
  addCirclePost,
  addSecretComment,
  addSessionMessage,
  addStoryReply,
  listCirclePosts,
  listSecretComments,
  listSessionMessages,
  listStoryReplies,
  loadFixtures,
  setCircleMembership,
} from '@/lib/client/store';
import { circleFixtures, circleSecrets, sampleCirclePosts } from '@/lib/fixtures';
import type { CircleMembership, CirclePost, CircleRecord, CircleSecretComment, CircleStoryReply, JoinedSessionMessage } from '@/lib/domain';

type Props = {
  auth: boolean;
  displayName: string;
  onNotice: (message: string) => void;
  onOpenAuth?: () => void;
};

const themes = [
  { id: 'all', label: 'All' },
  { id: 'hardship', label: 'Lived hardship' },
  { id: 'grief', label: 'Grief' },
  { id: 'family', label: 'Family' },
  { id: 'transitions', label: 'Starting over' },
  { id: 'work', label: 'Work & study' },
] as const;

type RoomTab = 'secrets' | 'stories' | 'session';

function mergePosts(circleId: string, local: CirclePost[]): CirclePost[] {
  const fixtures = sampleCirclePosts.filter(item => item.circleId === circleId);
  const ids = new Set(local.map(item => item.id));
  return [...local, ...fixtures.filter(item => !ids.has(item.id))].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export default function PeerCircles({ auth, displayName, onNotice, onOpenAuth }: Props) {
  const initialMembership = loadFixtures().circleMembership;
  const [membership, setMembership] = useState<Record<string, CircleMembership>>(initialMembership);
  const [theme, setTheme] = useState<(typeof themes)[number]['id']>('all');
  const [activeId, setActiveId] = useState(circleFixtures[0]?.id || '');
  const [roomTab, setRoomTab] = useState<RoomTab>('stories');
  const [secretId, setSecretId] = useState<string | null>(null);
  const [mention, setMention] = useState('');
  const [draft, setDraft] = useState('');
  const [explanation, setExplanation] = useState('');
  const [replyPostId, setReplyPostId] = useState<string | null>(null);
  const [understandDraft, setUnderstandDraft] = useState('');
  const [similarDraft, setSimilarDraft] = useState('');
  const [repliesByPost, setRepliesByPost] = useState<Record<string, CircleStoryReply[]>>({});
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
  const joinedCircles = circleFixtures.filter(item => (membership[item.id] || item.membership) === 'approved');
  const active = circles.find(item => item.id === activeId) || circles[0] || circleFixtures[0];
  const status = active ? membership[active.id] || active.membership : 'none';
  const posts = active ? postsByCircle[active.id] || [] : [];
  const canPost = Boolean(auth) && (status === 'approved' || status === 'requested');
  const secrets = active ? circleSecrets[active.id] || [] : [];
  const activeSecret = secrets.find(item => item.id === secretId) || secrets[0] || null;

  useEffect(() => {
    if (!active?.id) return;
    fetch(`/api/circles/posts?circleId=${encodeURIComponent(active.id)}`)
      .then(res => res.json() as Promise<any>)
      .then(data => {
        if (data.posts && Array.isArray(data.posts)) {
          const mapped: CirclePost[] = data.posts.map((p: any) => ({
            id: p.id,
            circleId: p.circleId,
            mention: p.mention,
            body: p.body,
            explanation: p.explanation,
            authorLabel: p.authorName,
            createdAt: p.createdAt,
          }));
          setPostsByCircle(curr => ({ ...curr, [active.id]: mapped }));
        }
      })
      .catch(() => {});
  }, [active?.id]);

  function openCircle(circle: CircleRecord) {
    setActiveId(circle.id);
    setSecretId(null);
    setRoomTab('stories');
    setReplyPostId(null);
    setSessionMessages(listSessionMessages(circle.id));
  }

  function joinCircle(circle: CircleRecord) {
    if (!auth) {
      onNotice('Please sign in to join a circle and share with peers.');
      onOpenAuth?.();
      return;
    }
    const next = setCircleMembership(circle.id, 'approved');
    setMembership(next);
    setActiveId(circle.id);
    setRoomTab('stories');
    setSessionMessages(listSessionMessages(circle.id));
    onNotice(`Joined ${circle.name}. Share a story when you are ready — what it is about, the story, and what you want understood.`);
  }

  function leaveCircle(circle: CircleRecord) {
    const next = setCircleMembership(circle.id, 'left');
    setMembership(next);
    onNotice(`You left ${circle.name}.`);
  }

  async function publish() {
    if (!auth) {
      onNotice('Please sign in to share a story in this circle.');
      onOpenAuth?.();
      return;
    }
    if (!active || !mention.trim() || !draft.trim() || !explanation.trim()) return;
    if (!canPost) {
      onNotice('Join this circle before posting a story.');
      return;
    }

    try {
      const res = await fetch('/api/circles/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circleId: active.id,
          mention,
          draft,
          explanation,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const newPost: CirclePost = {
          id: data.post.id,
          circleId: data.post.circleId,
          mention: data.post.mention,
          body: data.post.body,
          explanation: data.post.explanation,
          authorLabel: data.post.authorName,
          createdAt: data.post.createdAt,
        };
        setPostsByCircle(curr => ({
          ...curr,
          [active.id]: [newPost, ...(curr[active.id] || [])],
        }));
        setMention('');
        setDraft('');
        setExplanation('');
        onNotice('Story published to the circle.');
        return;
      }
    } catch {}

    const rows = addCirclePost({
      circleId: active.id,
      mention,
      body: draft,
      explanation,
      authorLabel: displayName || 'You',
    });
    setPostsByCircle(current => ({ ...current, [active.id]: mergePosts(active.id, rows) }));
    setMention('');
    setDraft('');
    setExplanation('');
    onNotice('Story saved in this circle.');
  }

  function repliesFor(post: CirclePost): CircleStoryReply[] {
    const local = repliesByPost[post.id] ?? listStoryReplies(post.id);
    const samples = post.sampleReplies ?? [];
    const ids = new Set(local.map(item => item.id));
    return [...local, ...samples.filter(item => !ids.has(item.id))].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
    );
  }

  function openReply(postId: string) {
    setReplyPostId(current => current === postId ? null : postId);
    setUnderstandDraft('');
    setSimilarDraft('');
  }

  async function publishReply(postId: string) {
    if (!auth) {
      onNotice('Please sign in to answer a story.');
      onOpenAuth?.();
      return;
    }
    if (!understandDraft.trim()) return;
    if (!canPost) {
      onNotice('Join this circle to answer a story.');
      return;
    }

    try {
      const res = await fetch('/api/circles/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          understanding: understandDraft,
          similarStory: similarDraft,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const newReply: CircleStoryReply = {
          id: data.reply.id,
          postId: data.reply.postId,
          understanding: data.reply.understanding,
          similarStory: data.reply.similarStory,
          authorLabel: data.reply.authorName,
          createdAt: data.reply.createdAt,
        };
        setRepliesByPost(curr => ({
          ...curr,
          [postId]: [newReply, ...(curr[postId] || [])],
        }));
        setUnderstandDraft('');
        setSimilarDraft('');
        setReplyPostId(null);
        onNotice('The circle can see what you understood.');
        return;
      }
    } catch {}

    const rows = addStoryReply({
      postId,
      understanding: understandDraft,
      similarStory: similarDraft,
      authorLabel: displayName || 'You',
    });
    setRepliesByPost(current => ({ ...current, [postId]: rows }));
    setUnderstandDraft('');
    setSimilarDraft('');
    setReplyPostId(null);
    onNotice('The circle can see what you understood.');
  }

  async function openSecret(id: string) {
    if (!active) return;
    setSecretId(id);
    try {
      const res = await fetch(`/api/circles/comments?circleId=${encodeURIComponent(active.id)}&secretId=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = (await res.json()) as any;
        if (Array.isArray(data.comments)) {
          const mapped = data.comments.map((c: any) => ({
            id: c.id,
            circleId: c.circleId,
            secretId: c.secretId,
            body: c.body,
            authorLabel: c.authorName,
            createdAt: c.createdAt,
          }));
          setSecretComments(mapped);
          return;
        }
      }
    } catch {}
    setSecretComments(listSecretComments(active.id, id));
  }

  async function publishComment() {
    if (!auth) {
      onNotice('Please sign in to leave a comment on this secret.');
      onOpenAuth?.();
      return;
    }
    if (!active || !activeSecret || !commentDraft.trim()) return;
    if (!canPost) {
      onNotice('Join the circle to leave a thought on a secret.');
      return;
    }

    try {
      const res = await fetch('/api/circles/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circleId: active.id,
          secretId: activeSecret.id,
          comment: commentDraft,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const newComment = {
          id: data.comment.id,
          circleId: data.comment.circleId,
          secretId: data.comment.secretId,
          body: data.comment.body,
          authorLabel: data.comment.authorName,
          createdAt: data.comment.createdAt,
        };
        setSecretComments(curr => [newComment, ...curr]);
        setCommentDraft('');
        onNotice('Comment saved with this secret.');
        return;
      }
    } catch {}

    const rows = addSecretComment({
      circleId: active.id,
      secretId: activeSecret.id,
      body: commentDraft,
      authorLabel: displayName || 'You',
    });
    setSecretComments(rows);
    setCommentDraft('');
    onNotice('Comment saved with this secret.');
  }

  function publishSession() {
    if (!auth) {
      onNotice('Please sign in to join the conversation.');
      onOpenAuth?.();
      return;
    }
    if (!active || !sessionDraft.trim()) return;
    if (status !== 'approved') {
      onNotice('Join the circle to use Joined session.');
      return;
    }
    const rows = addSessionMessage({
      circleId: active.id,
      body: sessionDraft,
      authorLabel: displayName || 'You',
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
            Share a story in three parts: mention what it is about, tell it, then explain what you want understood.
            Read the circle the same way, and answer when you recognise it. Peer support — not therapy, not an emergency service.
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
            <li>Read stories: the mention, the story, the explanation.</li>
            <li>Post your own the same way, or say what you understood.</li>
          </ol>
          <p className="small-print">Preview stays in this browser until signup sync lands.</p>
        </aside>
      </header>

      <section className="peers-joined-board" aria-label="Communities you have joined">
        <div className="peers-joined-head">
          <div>
            <div className="eyebrow">YOUR COMMUNITIES</div>
            <h2>Joined circles</h2>
            <p>Every peer community you join stays here, so you can return without searching again.</p>
          </div>
          <span className="story-count">{joinedCircles.length} joined</span>
        </div>
        {joinedCircles.length ? (
          <div className="peers-joined-list">
            {joinedCircles.map(circle => (
              <button
                key={circle.id}
                type="button"
                className={active?.id === circle.id ? 'selected' : ''}
                onClick={() => openCircle(circle)}
              >
                <strong>{circle.name}</strong>
                <span>{circle.topic}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="small-print">None yet. Join a circle below and it will appear in this list.</p>
        )}
      </section>

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
                { id: 'stories' as const, label: 'Stories' },
                { id: 'secrets' as const, label: 'Secrets' },
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
                    {!auth && (
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: 12,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 14,
                        marginBottom: 6,
                        gap: 12
                      }}>
                        <span style={{ fontSize: '0.86rem', color: '#475569' }}>
                          Sign in to leave a comment on this secret.
                        </span>
                        <button
                          type="button"
                          className="button"
                          style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                          onClick={() => onOpenAuth?.()}
                        >
                          Sign in
                        </button>
                      </div>
                    )}
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

            {roomTab === 'stories' && (
              <>
                <div className="story-community-head">
                  <div>
                    <div className="eyebrow">THE CIRCLE</div>
                    <h3>Stories people are sharing</h3>
                    <p>Each story names what it is about, tells it, then explains what to understand. You can answer the same way.</p>
                  </div>
                  <span className="story-count">{posts.length} {posts.length === 1 ? 'story' : 'stories'}</span>
                </div>

                {!auth && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                    gap: 12
                  }}>
                    <span style={{ fontSize: '0.86rem', color: '#475569' }}>
                      Sign in to share your story or answer others in this circle.
                    </span>
                    <button
                      type="button"
                      className="button"
                      style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                      onClick={() => onOpenAuth?.()}
                    >
                      Sign in
                    </button>
                  </div>
                )}

                <div className="peers-composer story-composer">
                  <h3>Share a story</h3>
                  <label htmlFor="story-mention">Mention what it is about</label>
                  <input
                    id="story-mention"
                    value={mention}
                    onChange={event => setMention(event.target.value)}
                    maxLength={80}
                    placeholder={canPost ? 'A short name for this story…' : 'Join this circle to share…'}
                    disabled={!canPost}
                  />
                  <label htmlFor="circle-post">The story</label>
                  <textarea
                    id="circle-post"
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                    maxLength={2000}
                    placeholder={canPost ? 'Tell it in your own words…' : 'Join this circle to post…'}
                    disabled={!canPost}
                  />
                  <label htmlFor="story-explain">Explain what you want understood</label>
                  <textarea
                    id="story-explain"
                    value={explanation}
                    onChange={event => setExplanation(event.target.value)}
                    maxLength={800}
                    placeholder={canPost ? 'What should this circle take from it?' : 'Join to explain…'}
                    disabled={!canPost}
                  />
                  <div className="peers-composer-foot">
                    <span className="small-print">{draft.length}/2000 · Peer support, not clinical advice</span>
                    <button
                      className="button"
                      type="button"
                      disabled={!canPost || !mention.trim() || !draft.trim() || !explanation.trim()}
                      onClick={publish}
                    >
                      Post story <Send size={15}/>
                    </button>
                  </div>
                </div>

                <div className="peers-feed story-feed" aria-live="polite">
                  {posts.length ? posts.map(post => {
                    const replies = repliesFor(post);
                    const replying = replyPostId === post.id;
                    return (
                      <article key={post.id} className="story-card">
                        <header>
                          <strong>{post.authorLabel}</strong>
                          <span>{new Date(post.createdAt).toLocaleString()}</span>
                        </header>
                        {post.mention && <p className="story-mention">{post.mention}</p>}
                        <div className="story-block">
                          <h4>The story</h4>
                          <p>{post.body}</p>
                        </div>
                        {post.explanation && (
                          <div className="story-block">
                            <h4>What to understand</h4>
                            <p>{post.explanation}</p>
                          </div>
                        )}
                        {post.fixture && <span className="peers-fixture">Illustrative preview — a sample voice in this circle</span>}
                        <div className="story-reply-bar">
                          <button type="button" className="text-button" disabled={!canPost} onClick={() => openReply(post.id)}>
                            {replying ? 'Close' : 'I understand'}
                          </button>
                          {replies.length > 0 && (
                            <span className="small-print">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
                          )}
                        </div>
                        {replying && (
                          <div className="story-reply-form">
                            <label htmlFor={`understand-${post.id}`}>What you understand</label>
                            <textarea
                              id={`understand-${post.id}`}
                              value={understandDraft}
                              onChange={event => setUnderstandDraft(event.target.value)}
                              maxLength={800}
                              placeholder="Say back what you heard — not advice."
                            />
                            <label htmlFor={`similar-${post.id}`}>A story like yours, if you want</label>
                            <textarea
                              id={`similar-${post.id}`}
                              value={similarDraft}
                              onChange={event => setSimilarDraft(event.target.value)}
                              maxLength={1200}
                              placeholder="Optional. Only if it helps them feel less alone."
                            />
                            <button
                              className="button"
                              type="button"
                              disabled={!understandDraft.trim()}
                              onClick={() => publishReply(post.id)}
                            >
                              Share with the circle <Send size={15}/>
                            </button>
                          </div>
                        )}
                        {replies.length > 0 && (
                          <div className="story-replies">
                            {replies.map(reply => (
                              <article key={reply.id} className="story-reply">
                                <header>
                                  <strong>{reply.authorLabel}</strong>
                                  <span>{new Date(reply.createdAt).toLocaleString()}</span>
                                </header>
                                <div className="story-block">
                                  <h4>Understood as</h4>
                                  <p>{reply.understanding}</p>
                                </div>
                                {reply.similarStory && (
                                  <div className="story-block">
                                    <h4>A story like theirs</h4>
                                    <p>{reply.similarStory}</p>
                                  </div>
                                )}
                              </article>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  }) : (
                    <div className="peers-empty">
                      <MessageCircle size={22}/>
                      <p>No stories yet. Be the first gentle voice here.</p>
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
                {status !== 'approved' || !auth ? (
                  <div className="peers-empty">
                    <p>{!auth ? 'Sign in to join this circle and open the discussion.' : 'Join this circle to open the session window.'}</p>
                    <button className="button" type="button" onClick={() => !auth ? onOpenAuth?.() : joinCircle(active)}>
                      {!auth ? 'Sign in to join' : 'Join session'}
                    </button>
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
