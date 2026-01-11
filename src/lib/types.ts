export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ParsedConversation {
  id: string;
  title?: string;
  messages: Message[];
  createdAt: Date;
}

export interface TopicCluster {
  name: string;
  description: string;
  messageIndices: number[];
}

export interface CodeSnippet {
  language: string;
  code: string;
  context: string;
  messageIndex: number;
}

export interface OutlineNode {
  title: string;
  description: string;
  children?: OutlineNode[];
  messageIndices?: number[];
}

export interface ConversationAnalysis {
  topics: TopicCluster[];
  codeSnippets: CodeSnippet[];
  summary: {
    tldr: string;
    outline: OutlineNode[];
  };
}

export type AIProvider = 'claude' | 'openai';

export interface ApiKeySettings {
  provider: AIProvider;
  claudeKey?: string;
  openaiKey?: string;
}
