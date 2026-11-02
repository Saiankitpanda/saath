import { callActSchema, callCreateSchema } from '@/lib/server/validation';
import { user, json, fail, sameOrigin, body } from '@/lib/server/http';
import { createServices } from '@/lib/server/compose';

const services = () => createServices();

export async function GET(request: Request) {
  try {
    const actor = await user();
    const id = new URL(request.url).searchParams.get('id');
    if (id) return json(await services().calls.read(actor.userId, id));
    return json(await services().calls.list(actor.userId));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const actor = await user();
    const data = await body(request, callCreateSchema);
    const app = services();
    if (data.source === 'chair') {
      const chair = await app.chairs.read(actor.userId, data.sourceId);
      const raw = await app.chairs.act(actor.userId, { id: chair.session.id, action: 'call' });
      return json({ call: raw.call }, 201);
    }
    const requestRow = await app.requests.requireForCall(actor.userId, data.sourceId);
    return json(await app.calls.startFromRequest(actor.userId, requestRow, data.media), 201);
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const actor = await user();
    const data = await body(request, callActSchema);
    return json(await services().calls.act(actor.userId, data));
  } catch (error) {
    return fail(error);
  }
}
