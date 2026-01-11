'use client';

import { useState } from 'react';
import { TopicCluster, Message } from '@/lib/types';

interface Props {
  topics: TopicCluster[];
  messages: Message[];
}

export default function TopicClusters({ topics, messages }: Props) {
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set([0]));

  const toggleTopic = (index: number) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (topics.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No topics identified in this conversation.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {topics.map((topic, topicIndex) => (
        <div
          key={topicIndex}
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          {/* Topic header */}
          <button
            onClick={() => toggleTopic(topicIndex)}
            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
          >
            <div>
              <h3 className="font-medium text-gray-900">{topic.name}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{topic.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                {topic.messageIndices.length} messages
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedTopics.has(topicIndex) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Messages in this topic */}
          {expandedTopics.has(topicIndex) && (
            <div className="divide-y divide-gray-100">
              {topic.messageIndices.map((msgIndex) => {
                const message = messages[msgIndex];
                if (!message) return null;

                return (
                  <div
                    key={msgIndex}
                    className={`p-4 ${
                      message.role === 'user' ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          message.role === 'user'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {message.role === 'user' ? 'You' : 'Assistant'}
                      </span>
                      <span className="text-xs text-gray-400">#{msgIndex + 1}</span>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {message.content.length > 500
                        ? message.content.slice(0, 500) + '...'
                        : message.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
