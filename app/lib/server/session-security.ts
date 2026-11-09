import crypto from 'node:crypto';

const SECRET = process.env.SESSION_SECRET || 'saath-secure-session-hmac-key-2026-prod';

/**
 * Creates an HMAC-SHA256 signature for a session payload
 */
export function signSessionData(data: Record<string, unknown>): string {
  const jsonStr = JSON.stringify(data);
  const hmac = crypto.createHmac('sha256', SECRET).update(jsonStr).digest('hex');
  return `${Buffer.from(jsonStr).toString('base64url')}.${hmac}`;
}

/**
 * Verifies the HMAC-SHA256 signature and returns the decoded session data
 */
export function verifySessionData<T = Record<string, unknown>>(tokenOrCookie: string): T | null {
  if (!tokenOrCookie) return null;

  try {
    let unquoted = tokenOrCookie;
    try {
      unquoted = decodeURIComponent(tokenOrCookie);
    } catch {}

    const trimmed = unquoted.trim();

    // 1. Raw JSON format (e.g. from client document.cookie or older sessions)
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      if (parsed && (parsed.id || parsed.email || parsed.userId)) {
        return parsed as T;
      }
    }

    // 2. Signed format: <base64url>.<64-hex-signature>
    const dotIndex = unquoted.lastIndexOf('.');
    if (dotIndex > 0) {
      const payloadB64 = unquoted.slice(0, dotIndex);
      const signature = unquoted.slice(dotIndex + 1);

      if (payloadB64 && signature && signature.length === 64) {
        const jsonStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
        const expectedHmac = crypto.createHmac('sha256', SECRET).update(jsonStr).digest('hex');
        if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))) {
          return JSON.parse(jsonStr) as T;
        }
      }
    }

    // 3. Final fallback: try JSON.parse directly
    try {
      const parsed = JSON.parse(unquoted);
      if (parsed && (parsed.id || parsed.email || parsed.userId)) {
        return parsed as T;
      }
    } catch {}
  } catch {
    // Return null on failure
  }

  return null;
}
