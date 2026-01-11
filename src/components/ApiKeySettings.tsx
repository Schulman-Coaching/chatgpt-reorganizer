'use client';

import { useState, useEffect } from 'react';
import { AIProvider, ApiKeySettings as ApiKeySettingsType } from '@/lib/types';

interface Props {
  onSettingsChange?: (settings: ApiKeySettingsType) => void;
}

export default function ApiKeySettings({ onSettingsChange }: Props) {
  const [provider, setProvider] = useState<AIProvider>('claude');
  const [claudeKey, setClaudeKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [showKeys, setShowKeys] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai-settings');
    if (saved) {
      const settings = JSON.parse(saved) as ApiKeySettingsType;
      setProvider(settings.provider);
      setClaudeKey(settings.claudeKey || '');
      setOpenaiKey(settings.openaiKey || '');
    }
  }, []);

  // Save settings and notify parent
  const saveSettings = () => {
    const settings: ApiKeySettingsType = {
      provider,
      claudeKey: claudeKey || undefined,
      openaiKey: openaiKey || undefined
    };
    localStorage.setItem('ai-settings', JSON.stringify(settings));
    onSettingsChange?.(settings);
  };

  // Auto-save when values change
  useEffect(() => {
    saveSettings();
  }, [provider, claudeKey, openaiKey]);

  const currentKey = provider === 'claude' ? claudeKey : openaiKey;
  const hasValidKey = currentKey && currentKey.length > 10;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">AI Provider Settings</h3>

      <div className="space-y-4">
        {/* Provider selector */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Provider</label>
          <div className="flex gap-2">
            <button
              onClick={() => setProvider('claude')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                provider === 'claude'
                  ? 'bg-orange-100 text-orange-700 border border-orange-300'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Claude
            </button>
            <button
              onClick={() => setProvider('openai')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                provider === 'openai'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              OpenAI
            </button>
          </div>
        </div>

        {/* API Key input */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            {provider === 'claude' ? 'Anthropic API Key' : 'OpenAI API Key'}
          </label>
          <div className="relative">
            <input
              type={showKeys ? 'text' : 'password'}
              value={provider === 'claude' ? claudeKey : openaiKey}
              onChange={(e) =>
                provider === 'claude'
                  ? setClaudeKey(e.target.value)
                  : setOpenaiKey(e.target.value)
              }
              placeholder={provider === 'claude' ? 'sk-ant-...' : 'sk-...'}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowKeys(!showKeys)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKeys ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span className={`w-2 h-2 rounded-full ${hasValidKey ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-gray-600">
            {hasValidKey ? 'API key configured' : 'No API key set'}
          </span>
        </div>
      </div>
    </div>
  );
}
