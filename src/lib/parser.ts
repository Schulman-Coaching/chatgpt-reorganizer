import { Message, ParsedConversation } from './types';

/**
 * Parse a ChatGPT conversation from plain text format
 * Expects format like:
 * User: message
 * ChatGPT: response
 *
 * Or:
 * You: message
 * Assistant: response
 */
export function parseTextConversation(text: string): Message[] {
  const messages: Message[] = [];
  const lines = text.split('\n');

  let currentRole: 'user' | 'assistant' | null = null;
  let currentContent: string[] = [];

  const userPrefixes = ['user:', 'you:', 'human:', 'me:'];
  const assistantPrefixes = ['chatgpt:', 'assistant:', 'ai:', 'gpt:', 'claude:'];

  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();

    // Check if this line starts a new message
    let foundUserPrefix = userPrefixes.find(p => lowerLine.startsWith(p));
    let foundAssistantPrefix = assistantPrefixes.find(p => lowerLine.startsWith(p));

    if (foundUserPrefix || foundAssistantPrefix) {
      // Save previous message if exists
      if (currentRole && currentContent.length > 0) {
        messages.push({
          role: currentRole,
          content: currentContent.join('\n').trim()
        });
      }

      // Start new message
      if (foundUserPrefix) {
        currentRole = 'user';
        const prefixLength = foundUserPrefix.length;
        currentContent = [line.slice(line.toLowerCase().indexOf(foundUserPrefix) + prefixLength).trim()];
      } else if (foundAssistantPrefix) {
        currentRole = 'assistant';
        const prefixLength = foundAssistantPrefix.length;
        currentContent = [line.slice(line.toLowerCase().indexOf(foundAssistantPrefix) + prefixLength).trim()];
      }
    } else if (currentRole) {
      // Continue current message
      currentContent.push(line);
    }
  }

  // Don't forget the last message
  if (currentRole && currentContent.length > 0) {
    messages.push({
      role: currentRole,
      content: currentContent.join('\n').trim()
    });
  }

  return messages;
}

/**
 * Parse ChatGPT JSON export format
 * The export has a conversations.json with structure like:
 * { title, mapping: { [id]: { message: { author: { role }, content: { parts } } } } }
 */
export function parseJSONConversation(json: unknown): ParsedConversation {
  // Handle the ChatGPT export format
  const data = json as {
    title?: string;
    create_time?: number;
    mapping?: Record<string, {
      message?: {
        author?: { role?: string };
        content?: { parts?: string[] };
        create_time?: number;
      };
    }>;
  };

  const messages: Message[] = [];

  if (data.mapping) {
    // Sort by create_time to get chronological order
    const entries = Object.values(data.mapping)
      .filter(node => node.message?.author?.role && node.message?.content?.parts)
      .sort((a, b) => {
        const timeA = a.message?.create_time ?? 0;
        const timeB = b.message?.create_time ?? 0;
        return timeA - timeB;
      });

    for (const node of entries) {
      const role = node.message?.author?.role;
      const parts = node.message?.content?.parts ?? [];
      const content = parts.join('\n').trim();

      if (content && (role === 'user' || role === 'assistant')) {
        messages.push({
          role: role,
          content: content,
          timestamp: node.message?.create_time
            ? new Date(node.message.create_time * 1000).toISOString()
            : undefined
        });
      }
    }
  }

  return {
    id: crypto.randomUUID(),
    title: data.title,
    messages,
    createdAt: data.create_time
      ? new Date(data.create_time * 1000)
      : new Date()
  };
}

/**
 * Auto-detect format and parse
 */
export function parseConversation(input: string): ParsedConversation {
  // Try to parse as JSON first
  try {
    const json = JSON.parse(input);
    return parseJSONConversation(json);
  } catch {
    // Fall back to text parsing
    const messages = parseTextConversation(input);
    return {
      id: crypto.randomUUID(),
      messages,
      createdAt: new Date()
    };
  }
}

/**
 * Extract a title from the conversation (first user message, truncated)
 */
export function extractTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'Untitled Conversation';

  const title = firstUserMessage.content.slice(0, 50);
  return title.length < firstUserMessage.content.length ? `${title}...` : title;
}
