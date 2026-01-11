'use client';

import { useState } from 'react';
import { OutlineNode, Message } from '@/lib/types';

interface Props {
  tldr: string;
  outline: OutlineNode[];
  messages: Message[];
}

interface OutlineItemProps {
  node: OutlineNode;
  messages: Message[];
  depth: number;
}

function OutlineItem({ node, messages, depth }: OutlineItemProps) {
  const [expanded, setExpanded] = useState(depth === 0);
  const [showMessages, setShowMessages] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const hasMessages = node.messageIndices && node.messageIndices.length > 0;

  return (
    <div className={`${depth > 0 ? 'ml-4 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="py-2">
        {/* Title row */}
        <div className="flex items-start gap-2">
          {(hasChildren || hasMessages) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{node.title}</h4>
            <p className="text-sm text-gray-600 mt-0.5">{node.description}</p>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-2">
            {/* Show messages toggle */}
            {hasMessages && (
              <button
                onClick={() => setShowMessages(!showMessages)}
                className="text-xs text-blue-600 hover:text-blue-700 mb-2"
              >
                {showMessages ? 'Hide' : 'Show'} related messages ({node.messageIndices!.length})
              </button>
            )}

            {/* Related messages */}
            {showMessages && hasMessages && (
              <div className="space-y-2 mb-4 bg-gray-50 rounded-lg p-3">
                {node.messageIndices!.map((msgIndex) => {
                  const message = messages[msgIndex];
                  if (!message) return null;
                  return (
                    <div
                      key={msgIndex}
                      className={`p-2 rounded text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-white text-gray-700 border border-gray-200'
                      }`}
                    >
                      <span className="font-medium">
                        {message.role === 'user' ? 'You' : 'Assistant'}:
                      </span>{' '}
                      {message.content.length > 200
                        ? message.content.slice(0, 200) + '...'
                        : message.content}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Children */}
            {hasChildren && (
              <div className="space-y-1">
                {node.children!.map((child, index) => (
                  <OutlineItem
                    key={index}
                    node={child}
                    messages={messages}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SummaryOutline({ tldr, outline, messages }: Props) {
  if (!tldr && outline.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No summary available for this conversation.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TL;DR */}
      {tldr && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
          <h3 className="text-sm font-medium text-blue-800 mb-2">TL;DR</h3>
          <p className="text-gray-700">{tldr}</p>
        </div>
      )}

      {/* Outline */}
      {outline.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Conversation Outline</h3>
          <div className="space-y-1">
            {outline.map((node, index) => (
              <OutlineItem
                key={index}
                node={node}
                messages={messages}
                depth={0}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
