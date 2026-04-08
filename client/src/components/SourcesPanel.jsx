import Panel from './Panel'

export default function SourcesPanel({ sources }) {
  return (
    <Panel title="Sources" icon="🔗">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {sources.map((s, i) => (
          <a
            key={i}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2.5 p-2.5 rounded-lg border border-gray-800 hover:border-gray-600 hover:bg-gray-800/40 transition-all group"
          >
            <div className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-gray-700 transition-colors">
              <svg className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-300 font-medium leading-snug line-clamp-2 group-hover:text-gray-100 transition-colors">
                {s.title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {s.publication && (
                  <span className="text-[10px] font-mono text-gray-600">{s.publication}</span>
                )}
                {s.date && (
                  <span className="text-[10px] font-mono text-gray-700">· {s.date}</span>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </Panel>
  )
}
