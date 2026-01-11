import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ConversationAnalysis } from '@/lib/types';
import { Prisma } from '@/generated/prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single conversation
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// PATCH - Update conversation (e.g., add/update analysis)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, analysis, aiProvider } = body as {
      title?: string;
      analysis?: ConversationAnalysis;
      aiProvider?: string;
    };

    const updateData: Prisma.ConversationUpdateInput = {};

    if (title !== undefined) {
      updateData.title = title;
    }
    if (analysis !== undefined) {
      updateData.analysis = analysis as unknown as Prisma.InputJsonValue;
    }
    if (aiProvider !== undefined) {
      updateData.aiProvider = aiProvider;
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

// DELETE - Delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    await prisma.conversation.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
