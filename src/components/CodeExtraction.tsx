'use client';

import { useState } from 'react';
import { CodeSnippet } from '@/lib/types';

interface Props {
  codeSnippets: CodeSnippet[];
}

// Group snippets by language
function groupByLanguage(snippets: CodeSnippet[]): Record<string, CodeSnippet[]> {
  return snippets.reduce((acc, snippet) => {
    const lang = snippet.language.toLowerCase() || 'text';
    if (!acc[lang]) {
      acc[lang] = [];
    }
    acc[lang].push(snippet);
    return acc;
  }, {} as Record<string, CodeSnippet[]>);
}

// Language color mapping
const languageColors: Record<string, string> = {
  javascript: 'bg-yellow-100 text-yellow-800',
  typescript: 'bg-blue-100 text-blue-800',
  python: 'bg-green-100 text-green-800',
  java: 'bg-red-100 text-red-800',
  sql: 'bg-purple-100 text-purple-800',
  html: 'bg-orange-100 text-orange-800',
  css: 'bg-pink-100 text-pink-800',
  bash: 'bg-gray-100 text-gray-800',
  shell: 'bg-gray-100 text-gray-800',
  json: 'bg-emerald-100 text-emerald-800',
  default: 'bg-gray-100 text-gray-700'
};

function getLanguageColor(lang: string): string {
  return languageColors[lang.toLowerCase()] || languageColors.default;
}

export default function CodeExtraction({ codeSnippets }: Props) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const grouped = groupByLanguage(codeSnippets);
  const languages = Object.keys(grouped).sort();

  const copyToClipboard = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (codeSnippets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No code snippets found in this conversation.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="flex flex-wrap gap-2">
        {languages.map(lang => (
          <span
            key={lang}
            className={`px-3 py-1 rounded-full text-sm font-medium ${getLanguageColor(lang)}`}
          >
            {lang} ({grouped[lang].length})
          </span>
        ))}
      </div>

      {/* Code snippets by language */}
      {languages.map(lang => (
        <div key={lang}>
          <h3 className="text-lg font-medium text-gray-900 mb-4 capitalize">
            {lang}
          </h3>
          <div className="space-y-4">
            {grouped[lang].map((snippet, index) => {
              const globalIndex = codeSnippets.indexOf(snippet);
              return (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Context */}
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm text-gray-600">{snippet.context}</p>
                    <span className="text-xs text-gray-400">
                      From message #{snippet.messageIndex + 1}
                    </span>
                  </div>

                  {/* Code */}
                  <div className="relative">
                    <pre className="p-4 bg-gray-900 text-gray-100 text-sm overflow-x-auto">
                      <code>{snippet.code}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(snippet.code, globalIndex)}
                      className="absolute top-2 right-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded transition-colors"
                    >
                      {copiedIndex === globalIndex ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
