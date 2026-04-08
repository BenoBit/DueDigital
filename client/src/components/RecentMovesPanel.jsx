import Panel from './Panel'

const TYPE_CONFIG = {
  acquisition: { label: 'M&A',         color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  funding:     { label: 'FUNDING',      color: 'text-green-400  bg-green-500/10  border-green-500/30'  },
  ipo:         { label: 'IPO',          color: 'text-amber-400  bg-amber-500/10  border-amber-500/30'  },
  leadership:  { label: 'LEADERSHIP',   color: 'text-blue-400   bg-blue-500/10   border-blue-500/30'   },
  product:     { label: 'PRODUCT',      color: 'text-cyan-400   bg-cyan-500/10   border-cyan-500/30'   },
  partnership: { label: 'PARTNERSHIP',  color: 'text-teal-400   bg-teal-500/10   border-teal-500/30'   },
  regulatory:  { label: 'REGULATORY',   color: 'text-red-400    bg-red-500/10    border-red-500/30'    },
  other:       { label: 'UPDATE',       color: 'text-gray-400   bg-gray-700/20   border-gray-700'      },
}

export default function RecentMovesPanel({ moves }) {
  return (
    <Panel title="Recent Strategic Moves" icon="📰" headerRight={
      <span className="text-xs font-mono text-gray-600">Last 12 months</span>
    }>
      <div className="space-y-3">
        {moves?.length === 0 && (
          <p className="text-xs text-gray-600 font-mono">No major strategic moves found in the last 12 months.</p>
        )}
        {moves?.map((m, i) => {
          const cfg = TYPE_CONFIG[m.type] || TYPE_CONFIG.other
          const hasSource = m.sourceUrl && m.sourceUrl.startsWith('https://')
          return (
            <div key={i} className="flex gap-3 group">
              {/* Timeline line */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-amber-500/60 mt-1 shrink-0" />
                {i < moves.length - 1 && <div className="w-px flex-1 bg-gray-800 mt-1" />}
              </div>

              {/* Content */}
              <div className="pb-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {m.date && (
                    <span className="text-xs font-mono text-gray-600">{m.date}</span>
                  )}
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-200 mb-0.5 leading-snug">{m.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-1.5">{m.description}</p>
                {hasSource && (
                  <a
                    href={m.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-500 hover:text-amber-300 font-mono transition-colors group/link"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 015.656 0l4-4a4 4 0 01-5.656-5.656l-1.102 1.101" />
                    </svg>
                    {m.sourceTitle || 'Source'}
                    <svg className="h-2.5 w-2.5 opacity-0 group-hover/link:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
