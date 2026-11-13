import { NextResponse } from 'next/server';
import { user } from '@/lib/server/http';
import { getStoryReplies, createStoryReply } from '@/lib/server/circles-service';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const postId = url.searchParams.get('postId') || '';

    if (!postId) {
      return NextResponse.json({ error: 'postId is required.' }, { status: 400 });
    }

    const replies = getStoryReplies(postId);
    return NextResponse.json({ success: true, replies });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to list replies' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = await user();
    const body = (await request.json()) as any;
    const { postId, understanding, similarStory } = body || {};

    if (!postId || !understanding || !understanding.trim()) {
      return NextResponse.json(
        { error: 'postId and understanding are required.' },
        { status: 400 }
      );
    }

    const reply = createStoryReply(
      postId,
      actor.userId,
      actor.displayName || 'You',
      understanding,
      similarStory
    );

    return NextResponse.json({ success: true, reply }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Authentication required to answer' },
      { status: 401 }
    );
  }
}

