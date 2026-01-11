import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Message, ConversationAnalysis } from '@/lib/types';
import { Prisma } from '@/generated/prisma/client';

// GET - List all conversations
export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        aiProvider: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, rawInput, messages, analysis, aiProvider } = body as {
      title?: string;
      rawInput: string;
      messages: Message[];
      analysis?: ConversationAnalysis;
      aiProvider?: string;
    };

    if (!rawInput || !messages) {
      return NextResponse.json(
        { error: 'rawInput and messages are required' },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.create({
      data: {
        title,
        rawInput,
        messages: messages as unknown as Prisma.InputJsonValue,
        analysis: analysis as unknown as Prisma.InputJsonValue,
        aiProvider
      }
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
