'use client';

import { useState } from 'react';
import type { CaseStudy } from '@/lib/domain';

type Props = {
  stories: CaseStudy[];
};

export default function StoryMoments({ stories }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="listen-block cases-block story-moments" aria-labelledby="story-moments-title">
      <div className="section-head listen-head">
        <div>
          <div className="eyebrow">A SMALL BEGINNING CAN MEAN A LOT</div>
          <h2 id="story-moments-title">Stories that sound like a person.</h2>
        </div>
        <p className="small-print">
          Illustrative stories showing how someone might use Saath. These are fictional examples, not user testimonials.
        </p>
      </div>
      <div className="story-grid">
        {stories.map(item => {
          const open = openId === item.id;
          return (
            <article key={item.id} className={"story-card" + (open ? " open" : "")}>
              <h3 className="story-headline">“{item.headline}”</h3>
              <p className="story-opening">{item.opening}</p>
              {open && (
                <div className="story-body">
                  {item.body.map(paragraph => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <p className="story-highlight">“{item.highlight}”</p>
                </div>
              )}
              <button
                type="button"
                className="text-button story-toggle"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : item.id)}
              >
                {open ? 'Close story' : 'Read the story'}
              </button>
              <footer className="story-meta">
                <span>{item.attribution}</span>
                <span>{item.featureUsed}</span>
              </footer>
            </article>
          );
        })}
      </div>
      <p className="story-collect small-print">
        If you later share a real story with us, we will keep your wording, ask for your approval before publishing, and show a consented first name or “Shared anonymously.”
      </p>
    </section>
  );
}
