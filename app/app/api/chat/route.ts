import { NextResponse } from 'next/server';
import { user } from '@/lib/server/http';
import { appendChatMessage, listChatMessages } from '@/lib/server/chat-service';

export async function GET(request: Request) {
  try {
    const actor = await user();
    const url = new URL(request.url);
    const requestId = url.searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const messages = listChatMessages(requestId);
    return NextResponse.json({
      success: true,
      currentUserId: actor.userId,
      messages,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Authentication required' },
      { status: 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = await user();
    const body = (await request.json()) as any;
    const { requestId, text } = body || {};

    if (!requestId || !text || !text.trim()) {
      return NextResponse.json(
        { error: 'requestId and message text are required' },
        { status: 400 }
      );
    }

    const message = appendChatMessage(
      requestId,
      actor.userId,
      actor.displayName || 'User',
      text
    );

    return NextResponse.json(
      {
        success: true,
        message,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to send message' },
      { status: 401 }
    );
  }
}

