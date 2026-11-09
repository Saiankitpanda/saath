import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOrGetVideoRoom } from './video-service.ts';

test('createOrGetVideoRoom provides clean Daily room and Google Meet link', async () => {
  const result = await createOrGetVideoRoom('ROOM12');
  assert.equal(result.provider, 'daily');
  assert.equal(result.roomCode, 'room12');
  assert.ok(result.dailyUrl, 'Must provide a video room url');
  assert.ok(result.meetUrl.includes('meet.google.com'), 'Must provide a Google Meet url');
});

test('createOrGetVideoRoom formats default code when empty', async () => {
  const result = await createOrGetVideoRoom('');
  assert.equal(result.roomCode, 'saath');
  assert.ok(result.dailyUrl);
});
