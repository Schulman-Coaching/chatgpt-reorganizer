import { NextRequest, NextResponse } from 'next/server';
import { Message } from '@/lib/types';
import puppeteer from 'puppeteer';

export const maxDuration = 60; // Allow up to 60 seconds for this route

export async function POST(request: NextRequest) {
  let browser = null;

  try {
    const body = await request.json();
    const { url } = body as { url: string };

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate it's a ChatGPT share URL
    const shareUrlPattern = /^https?:\/\/(chat\.openai\.com|chatgpt\.com)\/share\/[\w-]+$/;
    if (!shareUrlPattern.test(url)) {
      return NextResponse.json(
        { error: 'Invalid ChatGPT share URL. Expected format: https://chatgpt.com/share/...' },
        { status: 400 }
      );
    }

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to the share page
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for the conversation to load
    await page.waitForSelector('[data-message-author-role]', { timeout: 15000 }).catch(() => null);

    // Extract conversation data from the page
    const conversationData = await page.evaluate(() => {
      const messages: { role: string; content: string }[] = [];

      // Try to get messages from the DOM
      const messageElements = document.querySelectorAll('[data-message-author-role]');

      messageElements.forEach((el) => {
        const role = el.getAttribute('data-message-author-role');
        const contentEl = el.querySelector('.markdown, .whitespace-pre-wrap');
        const content = contentEl?.textContent?.trim() || '';

        if (content && (role === 'user' || role === 'assistant')) {
          messages.push({ role, content });
        }
      });

      // Try to get title
      const titleEl = document.querySelector('h1, title');
      const title = titleEl?.textContent?.trim() || 'Imported Conversation';

      return { messages, title };
    });

    await browser.close();
    browser = null;

    if (!conversationData.messages || conversationData.messages.length === 0) {
      return NextResponse.json(
        {
          error: 'Could not extract conversation from share page.',
          hint: 'The page may require authentication or use a different format.'
        },
        { status: 422 }
      );
    }

    // Convert to our Message format
    const messages: Message[] = conversationData.messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    return NextResponse.json({
      title: conversationData.title,
      messages,
      source: url
    });

  } catch (error) {
    console.error('Fetch share error:', error);

    if (browser) {
      await browser.close();
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to fetch share link: ${errorMessage}` },
      { status: 500 }
    );
  }
}
