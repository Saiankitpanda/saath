import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CallService} from './call-service.ts';
import {MemoryCallRepository} from '../infrastructure/memory.ts';

function calls() {
  const store = new MemoryCallRepository();
  return {
    store,
    service: new CallService(store, {}, () => Date.parse('2026-11-01T00:00:00.000Z'), () => 0.2, () => 'call-1'),
  };
}

test('a paired chair can start a browser call after the other person exists', async () => {
  const {service} = calls();
  const started = await service.startFromChair('host-1', {
    id: 'chair-1',
    code: 'ABC234',
    hostId: 'host-1',
    guestId: 'guest-1',
    hostName: 'Riya',
    guestName: 'Asha',
    mode: 'paired',
    status: 'active',
    stage: 'agree',
    paused: false,
    guestJoined: true,
    note: '',
    aiReply: '',
    updatedAt: '2026-11-01T00:00:00.000Z',
  });
  assert.equal(started.call.provider, 'webrtc');
  assert.equal(started.call.you, 'host');
  assert.equal(started.call.recording, false);
  const guest = await service.read('guest-1', 'call-1');
  assert.equal(guest.call.you, 'guest');
  await assert.rejects(() => service.read('stranger', 'call-1'), /not found/);
});

test('same-device and sample requests cannot become live calls', async () => {
  const {service} = calls();
  await assert.rejects(() => service.startFromChair('host-1', {
    id: 'chair-1',
    code: 'ABC234',
    hostId: 'host-1',
    guestId: null,
    hostName: 'Riya',
    guestName: null,
    mode: 'same-device',
    status: 'active',
    stage: 'agree',
    paused: false,
    guestJoined: false,
    note: '',
    aiReply: '',
    updatedAt: '2026-11-01T00:00:00.000Z',
  }), /two people/);
  await assert.rejects(() => service.startFromRequest('user-1', {
    id: 'req-1',
    ownerId: 'user-1',
    providerId: 'sample-meera',
    providerName: 'Meera',
    topic: 'Talk',
    context: 'Hello',
    mode: 'voice',
    status: 'accepted',
    createdAt: '2026-11-01T00:00:00.000Z',
  }), /cannot take a live call/);
});
