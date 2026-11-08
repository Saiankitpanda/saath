import { strangerConnectSchema } from '@/lib/server/validation';
import { user, json, fail, sameOrigin, body } from '@/lib/server/http';
import { createServices } from '@/lib/server/compose';
import { matchStrangers } from '@/lib/server/strangers';

export async function GET(request: Request) {
  try {
    const situation = new URL(request.url).searchParams.get('situation') || '';
    return json({ strangers: matchStrangers(situation) });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const actor = await user();
    const data = await body(request, strangerConnectSchema);
    return json(await createServices().strangers.autoconnect(actor.userId, data.situation || ''), 201);
  } catch (error) {
    return fail(error);
  }
}
