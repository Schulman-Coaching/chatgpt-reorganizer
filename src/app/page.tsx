'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConversationInput from '@/components/ConversationInput';
import { ParsedConversation, ConversationAnalysis, Message } from '@/lib/types';

type InputMode = 'text' | 'url';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (input: string, mode: InputMode) => {
    setIsLoading(true);
    setError(null);

    try {
      let messages: Message[];
      let title: string | undefined;
      let rawInput = input;

      if (mode === 'url') {
        // Fetch from share link
        const fetchResponse = await fetch('/api/fetch-share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: input })
        });

        if (!fetchResponse.ok) {
          const err = await fetchResponse.json();
          throw new Error(err.error || 'Failed to fetch share link');
        }

        const shareData = await fetchResponse.json();
        messages = shareData.messages;
        title = shareData.title;
        rawInput = `Share URL: ${input}`;
      } else {
        // Parse text input
        const parseResponse = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input })
        });

        if (!parseResponse.ok) {
          const err = await parseResponse.json();
          throw new Error(err.error || 'Failed to parse conversation');
        }

        const parsed: ParsedConversation = await parseResponse.json();
        messages = parsed.messages;
        title = parsed.title;
      }

      if (messages.length === 0) {
        throw new Error('No messages found in the conversation. Make sure the format is correct.');
      }

      // Analyze with AI (using server-side API key)
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          provider: 'claude'
        })
      });

      if (!analyzeResponse.ok) {
        const err = await analyzeResponse.json();
        throw new Error(err.error || 'Failed to analyze conversation');
      }

      const analysis: ConversationAnalysis = await analyzeResponse.json();

      // Save to database
      const saveResponse = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          rawInput,
          messages,
          analysis,
          aiProvider: 'claude'
        })
      });

      if (!saveResponse.ok) {
        const err = await saveResponse.json();
        throw new Error(err.error || 'Failed to save conversation');
      }

      const saved = await saveResponse.json();

      // Navigate to view page
      router.push(`/view/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">ChatGPT Reorganizer</h1>
          <a
            href="/history"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View History
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">How to Use</h3>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Paste a ChatGPT share link, OR</li>
                <li>Paste conversation text / upload JSON</li>
                <li>Click &quot;Analyze&quot; to process</li>
                <li>View organized topics, code, and summary</li>
              </ol>
            </div>

            <div className="mt-4 bg-green-50 rounded-lg border border-green-200 p-4">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                API Key Configured
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Import Your Conversation
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <ConversationInput onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
