import { NextRequest, NextResponse } from 'next/server';
import { parseConversation, extractTitle } from '@/lib/parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input } = body as { input: string };

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      );
    }

    const parsed = parseConversation(input);

    // Auto-generate title if not present
    if (!parsed.title) {
      parsed.title = extractTitle(parsed.messages);
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: 'Failed to parse conversation' },
      { status: 500 }
    );
  }
}
