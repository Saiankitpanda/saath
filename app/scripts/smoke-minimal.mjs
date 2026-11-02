#!/usr/bin/env node
/**
 * Minimal smoke against a running local preview (pnpm dev).
 * Usage: node scripts/smoke-minimal.mjs
 * Local Sites mock: set SAATH_COOKIE='__sites_local_auth=1' (default on 127.0.0.1).
 */
const base = process.env.SAATH_URL || 'http://127.0.0.1:5173';
const cookie = process.env.SAATH_COOKIE || '__sites_local_auth=1';

async function req(path, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      Origin: base,
      Cookie: cookie,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 200) };
  }
  return { ok: response.ok, status: response.status, data };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const steps = [];
  const status = await req('/api/status');
  assert(status.ok, `status ${status.status}`);
  assert(status.data.calling === true, 'calling capability missing');
  assert(status.data.twoChairs === true, 'twoChairs capability missing');
  steps.push('status');

  if (!status.data.authenticated) {
    steps.push('unauthenticated — open /signin-with-chatgpt in the browser for full CRUD smoke');
    console.log(JSON.stringify({ ok: true, base, steps }, null, 2));
    return;
  }

  const enrolled = await req('/api/profile', {
    method: 'PUT',
    body: {
      clientEnrolled: true,
      listenerEnrolled: true,
      activeRole: 'client',
      displayName: status.data.displayName || 'Smoke',
    },
  });
  assert(enrolled.ok, `enroll failed ${enrolled.status} ${JSON.stringify(enrolled.data)}`);
  steps.push(`enroll ${enrolled.data.profile?.pairingCode || ''}`);

  const chairs = await req('/api/chairs', {
    method: 'POST',
    body: { mode: 'paired', displayName: 'Smoke A' },
  });
  assert(chairs.ok, `chairs create ${chairs.status} ${JSON.stringify(chairs.data)}`);
  const chairId = chairs.data.session?.id;
  assert(chairId, 'chair id missing');
  steps.push(`paired chair ${chairs.data.session?.code}`);

  const callReject = await req('/api/chairs', {
    method: 'PATCH',
    body: { id: chairId, action: 'call' },
  });
  assert(callReject.status === 409, `call without guest should be 409, got ${callReject.status}`);
  steps.push('call refused until guest joins');

  const ctx = await req('/api/context', {
    method: 'PUT',
    body: { content: 'smoke note', shareMode: 'private' },
  });
  assert(ctx.ok, `context put ${ctx.status}`);
  const cleared = await req('/api/context', { method: 'DELETE' });
  assert(cleared.ok, `context delete ${cleared.status}`);
  steps.push('context CRUD');

  console.log(JSON.stringify({ ok: true, base, steps }, null, 2));
}

main().catch(error => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
