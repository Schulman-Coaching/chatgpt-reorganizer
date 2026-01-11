'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import ViewSwitcher, { ViewType } from '@/components/ViewSwitcher';
import TopicClusters from '@/components/TopicClusters';
import CodeExtraction from '@/components/CodeExtraction';
import SummaryOutline from '@/components/SummaryOutline';
import { Message, ConversationAnalysis } from '@/lib/types';
import { exportToMarkdown, downloadMarkdown } from '@/lib/exporter';

interface ConversationData {
  id: string;
  title: string | null;
  messages: Message[];
  analysis: ConversationAnalysis | null;
  aiProvider: string | null;
  createdAt: string;
}

export default function ViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('summary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const response = await fetch(`/api/conversations/${resolvedParams.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Conversation not found');
          }
          throw new Error('Failed to load conversation');
        }
        const data = await response.json();
        setConversation(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium">{error || 'Conversation not found'}</div>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  const analysis = conversation.analysis;
  const messages = conversation.messages;

  const handleExport = () => {
    if (!analysis) return;
    const title = conversation.title || 'Untitled Conversation';
    const markdown = exportToMarkdown(title, messages, analysis);
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md`;
    downloadMarkdown(filename, markdown);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {conversation.title || 'Untitled Conversation'}
                </h1>
                <p className="text-sm text-gray-500">
                  {messages.length} messages · Analyzed with{' '}
                  <span className="capitalize">{conversation.aiProvider || 'AI'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {analysis && (
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export MD
                </button>
              )}
              <Link
                href="/history"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View History
              </Link>
            </div>
          </div>

          {/* View Switcher */}
          <ViewSwitcher
            activeView={activeView}
            onViewChange={setActiveView}
            topicCount={analysis?.topics?.length}
            codeCount={analysis?.codeSnippets?.length}
          />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {!analysis ? (
          <div className="text-center py-12 text-gray-500">
            No analysis available for this conversation.
          </div>
        ) : (
          <>
            {activeView === 'topics' && (
              <TopicClusters
                topics={analysis.topics || []}
                messages={messages}
              />
            )}

            {activeView === 'code' && (
              <CodeExtraction codeSnippets={analysis.codeSnippets || []} />
            )}

            {activeView === 'summary' && (
              <SummaryOutline
                tldr={analysis.summary?.tldr || ''}
                outline={analysis.summary?.outline || []}
                messages={messages}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
