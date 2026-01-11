'use client';

import { useState, useRef } from 'react';

type InputMode = 'text' | 'url';

interface Props {
  onSubmit: (input: string, mode: InputMode) => void;
  isLoading?: boolean;
}

export default function ConversationInput({ onSubmit, isLoading }: Props) {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (inputMode === 'url' && urlInput.trim()) {
      onSubmit(urlInput.trim(), 'url');
    } else if (inputMode === 'text' && textInput.trim()) {
      onSubmit(textInput.trim(), 'text');
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      setTextInput(text);
      setInputMode('text');
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/json' || file.name.endsWith('.json') || file.type === 'text/plain')) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const isValid = inputMode === 'url' ? urlInput.trim() : textInput.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mode selector */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setInputMode('text')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            inputMode === 'text'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Paste Text
        </button>
        <button
          type="button"
          onClick={() => setInputMode('url')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            inputMode === 'url'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Share Link
        </button>
      </div>

      {inputMode === 'url' ? (
        /* URL Input */
        <div className="space-y-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://chatgpt.com/share/..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500">
            Paste a ChatGPT share link (e.g., chatgpt.com/share/abc123)
          </p>
        </div>
      ) : (
        /* Text Input */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative rounded-lg border-2 transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200 bg-white'
          }`}
        >
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste your ChatGPT conversation here, or drag & drop a JSON export file...

Example format:
User: How do I create a React component?
ChatGPT: Here's how to create a React component..."
            rows={12}
            className="w-full p-4 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />

          {dragActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-50/90 rounded-lg">
              <div className="text-blue-600 font-medium">Drop file here</div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {inputMode === 'text' && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,.txt"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                Upload JSON Export
              </button>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {inputMode === 'url' ? 'Fetching...' : 'Analyzing...'}
            </span>
          ) : (
            'Analyze Conversation'
          )}
        </button>
      </div>
    </form>
  );
}
