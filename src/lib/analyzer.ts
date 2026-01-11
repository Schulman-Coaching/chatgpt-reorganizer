import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { Message, ConversationAnalysis, AIProvider } from './types';

const ANALYSIS_PROMPT = `You are a JSON-only response bot. Analyze this conversation and respond with ONLY valid JSON, no other text.

The conversation is provided as an array of messages, each with a role (user/assistant) and content.

Respond with this exact JSON structure (and nothing else - no explanations, no markdown, just JSON):
{
  "topics": [
    {
      "name": "Topic name",
      "description": "Brief description of what this topic covers",
      "messageIndices": [0, 1, 2]
    }
  ],
  "codeSnippets": [
    {
      "language": "python",
      "code": "the actual code",
      "context": "What question or problem this code addresses",
      "messageIndex": 3
    }
  ],
  "summary": {
    "tldr": "A 1-2 sentence summary of the entire conversation",
    "outline": [
      {
        "title": "Section title",
        "description": "What was discussed/decided",
        "messageIndices": [0, 1],
        "children": []
      }
    ]
  }
}

Rules:
1. Every message should belong to at least one topic
2. Extract ALL code blocks found in the conversation (look for \`\`\` blocks)
3. The outline should capture the logical flow and key decisions
4. Be concise but comprehensive
5. IMPORTANT: Return ONLY valid JSON, no other text before or after

Here is the conversation to analyze:
`;

function extractJSON(text: string): ConversationAnalysis {
  // Try direct parse first
  try {
    return JSON.parse(text.trim());
  } catch {
    // Continue to other methods
  }

  // Try to extract from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Continue
    }
  }

  // Try to find JSON object pattern
  const jsonObjectMatch = text.match(/\{[\s\S]*"topics"[\s\S]*"summary"[\s\S]*\}/);
  if (jsonObjectMatch) {
    try {
      return JSON.parse(jsonObjectMatch[0]);
    } catch {
      // Continue
    }
  }

  // Last resort: find anything that looks like JSON
  const startIdx = text.indexOf('{');
  const endIdx = text.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    try {
      return JSON.parse(text.substring(startIdx, endIdx + 1));
    } catch {
      // Give up
    }
  }

  throw new Error('Could not extract valid JSON from response. Raw response: ' + text.substring(0, 200));
}

export async function analyzeWithClaude(
  messages: Message[],
  apiKey: string
): Promise<ConversationAnalysis> {
  const client = new Anthropic({ apiKey });

  // Truncate very long conversations to avoid token limits
  const maxMessages = 50;
  const truncatedMessages = messages.length > maxMessages
    ? [...messages.slice(0, 25), ...messages.slice(-25)]
    : messages;

  const conversationText = truncatedMessages
    .map((m, i) => `[${i}] ${m.role}: ${m.content.substring(0, 2000)}`)
    .join('\n\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: ANALYSIS_PROMPT + conversationText
      }
    ]
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return extractJSON(textContent.text);
}

export async function analyzeWithOpenAI(
  messages: Message[],
  apiKey: string
): Promise<ConversationAnalysis> {
  const client = new OpenAI({ apiKey });

  // Truncate very long conversations
  const maxMessages = 50;
  const truncatedMessages = messages.length > maxMessages
    ? [...messages.slice(0, 25), ...messages.slice(-25)]
    : messages;

  const conversationText = truncatedMessages
    .map((m, i) => `[${i}] ${m.role}: ${m.content.substring(0, 2000)}`)
    .join('\n\n');

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: ANALYSIS_PROMPT + conversationText
      }
    ],
    response_format: { type: 'json_object' }
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return extractJSON(content);
}

export async function analyzeConversation(
  messages: Message[],
  provider: AIProvider,
  apiKey: string
): Promise<ConversationAnalysis> {
  if (provider === 'claude') {
    return analyzeWithClaude(messages, apiKey);
  } else {
    return analyzeWithOpenAI(messages, apiKey);
  }
}
