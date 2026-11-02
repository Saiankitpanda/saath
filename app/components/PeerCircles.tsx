'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, HeartHandshake, Leaf, MessageCircle, Send, ShieldCheck, Users } from 'lucide-react';
import { addCirclePost, listCirclePosts, loadFixtures, setCircleMembership } from '@/lib/client/store';
import { circleFixtures, sampleCirclePosts } from '@/lib/fixtures';
import type { CircleMembership, CirclePost, CircleRecord } from '@/lib/domain';

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
  const [draft, setDraft] = useState('');
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

  function joinCircle(circle: CircleRecord) {
    const next = setCircleMembership(circle.id, 'approved');
    setMembership(next);
    setActiveId(circle.id);
    onNotice(`You joined ${circle.name}. Preview membership is saved in this browser only.`);
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
    onNotice('Post saved in this browser. Live peer sync needs signup and server persistence.');
  }

  return (
    <div className="peers-shell">
      <header className="peers-hero">
        <div>
          <div className="eyebrow">PEER CIRCLES</div>
          <h1>Find people who have<br/>been through <em>something like it.</em></h1>
          <p>
            Join a shared-experience circle, read quietly, or post when you are ready.
            This is peer support — not therapy, not trauma bonding, and not an emergency service.
          </p>
          <div className="peers-pill-row">
            <span><Users size={14}/> Same lived theme</span>
            <span><MessageCircle size={14}/> Discuss & post</span>
            <span><ShieldCheck size={14}/> Share only what you choose</span>
          </div>
        </div>
        <aside className="peers-hero-note">
          <HeartHandshake size={22} strokeWidth={1.5}/>
          <h2>How it works</h2>
          <ol>
            <li>Pick a circle that matches what you carry.</li>
            <li>Join to read and post with peers.</li>
            <li>Discuss gently. Leave anytime.</li>
          </ol>
          <p className="small-print">Preview posts stay in this browser until signup sync lands.</p>
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
              if (first) setActiveId(first.id);
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
                onClick={() => setActiveId(circle.id)}
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
              <div className="eyebrow">DISCUSSION</div>
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
          </section>
        )}
      </div>
    </div>
  );
}
