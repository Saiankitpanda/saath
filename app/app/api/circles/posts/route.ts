import { NextResponse } from 'next/server';
import { user } from '@/lib/server/http';
import { getCirclePosts, createCirclePost } from '@/lib/server/circles-service';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const circleId = url.searchParams.get('circleId') || 'c-grief';
    const posts = getCirclePosts(circleId);
    return NextResponse.json({ success: true, posts });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to list posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = await user();
    const body = (await request.json()) as any;
    const { circleId, mention, draft, explanation } = body || {};

    if (!circleId || !mention || !draft || !explanation) {
      return NextResponse.json(
        { error: 'All fields (circleId, mention, draft, explanation) are required.' },
        { status: 400 }
      );
    }

    const post = createCirclePost(
      circleId,
      actor.userId,
      actor.displayName || 'You',
      mention,
      draft,
      explanation
    );

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Authentication required to post' },
      { status: 401 }
    );
  }
}

