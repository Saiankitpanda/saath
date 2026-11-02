function encode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function mintLiveKitToken(input: {
  apiKey: string;
  apiSecret: string;
  identity: string;
  name: string;
  room: string;
  ttlSeconds?: number;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = encode(JSON.stringify({
    iss: input.apiKey,
    sub: input.identity,
    name: input.name.slice(0, 80),
    nbf: now - 10,
    exp: now + (input.ttlSeconds ?? 3600),
    video: {
      room: input.room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
  }));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(input.apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${payload}`));
  const bytes = new Uint8Array(signature);
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  const sig = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${header}.${payload}.${sig}`;
}
