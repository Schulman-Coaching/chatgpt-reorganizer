import { NextRequest, NextResponse } from 'next/server';
import { analyzeConversation } from '@/lib/analyzer';
import { Message, AIProvider } from '@/lib/types';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from project directory explicitly
config({ path: resolve(process.cwd(), '.env'), override: true });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, provider = 'claude' } = body as {
      messages: Message[];
      provider?: AIProvider;
    };

    // Get API key from header (client-provided) or environment (server-side)
    let apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      // Use server-side API key
      if (provider === 'claude') {
        apiKey = process.env.ANTHROPIC_API_KEY || null;
        console.log('Using Claude API key from env:', apiKey ? `${apiKey.substring(0, 20)}... (length: ${apiKey.length})` : 'NOT SET');
      } else {
        apiKey = process.env.OPENAI_API_KEY || null;
        console.log('Using OpenAI API key from env:', apiKey ? `${apiKey.substring(0, 20)}... (length: ${apiKey.length})` : 'NOT SET');
      }
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required. Please configure your API key.' },
        { status: 401 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    if (!['claude', 'openai'].includes(provider)) {
      return NextResponse.json(
        { error: 'Valid provider (claude or openai) is required' },
        { status: 400 }
      );
    }

    const analysis = await analyzeConversation(messages, provider, apiKey);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);

    // Handle API-specific errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('401') || errorMessage.includes('invalid_api_key')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your settings.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: `Analysis failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
