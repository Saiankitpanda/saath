import { NextResponse } from 'next/server';
import { user } from '@/lib/server/http';
import { getSecretComments, createSecretComment } from '@/lib/server/circles-service';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const circleId = url.searchParams.get('circleId') || '';
    const secretId = url.searchParams.get('secretId') || '';

    if (!circleId || !secretId) {
      return NextResponse.json(
        { error: 'circleId and secretId are required.' },
        { status: 400 }
      );
    }

    const comments = getSecretComments(circleId, secretId);
    return NextResponse.json({ success: true, comments });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to list comments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = await user();
    const body = (await request.json()) as any;
    const { circleId, secretId, comment } = body || {};

    if (!circleId || !secretId || !comment || !comment.trim()) {
      return NextResponse.json(
        { error: 'circleId, secretId, and comment are required.' },
        { status: 400 }
      );
    }

    const newComment = createSecretComment(
      circleId,
      secretId,
      actor.userId,
      actor.displayName || 'You',
      comment
    );

    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Authentication required to comment' },
      { status: 401 }
    );
  }
}

