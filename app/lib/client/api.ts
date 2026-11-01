export function localActor(): 'host' | 'guest' {
  if (typeof window === 'undefined') return 'host';
  return window.sessionStorage.getItem('saath-local-actor') === 'guest' ? 'guest' : 'host';
}

export function setLocalActor(actor: 'host' | 'guest') {
  if (typeof window === 'undefined') return;
  if (actor === 'guest') window.sessionStorage.setItem('saath-local-actor', 'guest');
  else window.sessionStorage.removeItem('saath-local-actor');
}

export async function api<T = Record<string, unknown>>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (typeof window !== 'undefined' && localActor() === 'guest') {
    headers['x-saath-local-actor'] = 'guest';
  }
  const response = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}
