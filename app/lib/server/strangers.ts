import { nearbyStrangerFixtures } from '@/lib/fixtures';

export type ServerStranger = (typeof nearbyStrangerFixtures)[number];

function score(item: ServerStranger, text: string) {
  let value = 0;
  const situation = item.situation.toLowerCase();
  for (const word of text.split(/[^a-z0-9]+/).filter(word => word.length > 3)) {
    if (situation.includes(word)) value += 2;
  }
  if (/famil|parent|home/.test(text) && /famil/.test(situation)) value += 4;
  if (/work|job|study|office/.test(text) && /work/.test(situation)) value += 4;
  if (/quiet|tired|long/.test(text) && /quiet|long/.test(situation)) value += 3;
  if (/city|start|new/.test(text) && /start|city/.test(situation)) value += 4;
  if (/conversation|loop/.test(text) && /conversation/.test(situation)) value += 3;
  return value;
}

export function matchStrangers(situation: string): ServerStranger[] {
  const available = nearbyStrangerFixtures.filter(item => item.available);
  const text = situation.trim().toLowerCase();
  if (!text) return available;
  const ranked = available
    .map(item => ({ item, score: score(item, text) }))
    .sort((a, b) => b.score - a.score || a.item.distanceKm - b.item.distanceKm);
  const hits = ranked.filter(row => row.score > 0);
  return (hits.length ? hits : ranked).map(row => row.item);
}
