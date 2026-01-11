'use client';

export type ViewType = 'topics' | 'code' | 'summary';

interface Props {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  topicCount?: number;
  codeCount?: number;
}

const views: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'topics',
    label: 'Topics',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  {
    id: 'code',
    label: 'Code',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    )
  },
  {
    id: 'summary',
    label: 'Summary',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    )
  }
];

export default function ViewSwitcher({ activeView, onViewChange, topicCount, codeCount }: Props) {
  const getCount = (id: ViewType) => {
    if (id === 'topics' && topicCount !== undefined) return topicCount;
    if (id === 'code' && codeCount !== undefined) return codeCount;
    return undefined;
  };

  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
      {views.map(view => {
        const count = getCount(view.id);
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === view.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {view.icon}
            <span>{view.label}</span>
            {count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                activeView === view.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
