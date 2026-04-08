import { useState } from 'react'
import Panel from './Panel'

const FORM_CONFIG = {
  '10-K':  { color: 'text-blue-300  bg-blue-500/10  border-blue-500/30',  label: '10-K',  desc: 'Annual Report' },
  '10-Q':  { color: 'text-cyan-300  bg-cyan-500/10  border-cyan-500/30',  label: '10-Q',  desc: 'Quarterly Report' },
  'S-1':   { color: 'text-amber-300 bg-amber-500/10 border-amber-500/30', label: 'S-1',   desc: 'IPO Prospectus' },
  '8-K':   { color: 'text-gray-300  bg-gray-700/20  border-gray-700',     label: '8-K',   desc: 'Current Report' },
  '20-F':  { color: 'text-purple-300 bg-purple-500/10 border-purple-500/30', label: '20-F', desc: 'Foreign Annual' },
  'other': { color: 'text-gray-400  bg-gray-800     border-gray-700',     label: 'SEC',   desc: 'Filing' },
}

function FilingWindow({ filing }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = FORM_CONFIG[filing.formType] || FORM_CONFIG.other
  const hasUrl = filing.url?.startsWith('https://')

  return (
    <div className="rounded-lg border border-gray-700 bg-[#0d0d14] overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 border-b border-gray-700">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500/60" />
          <span className="w-2 h-2 rounded-full bg-amber-500/60" />
          <span className="w-2 h-2 rounded-full bg-green-500/60" />
        </div>
        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${cfg.color}`}>
          {cfg.label}
        </span>
        <span className="text-xs font-mono text-gray-500 truncate flex-1">{cfg.desc}</span>
        {filing.date && (
          <span className="text-[10px] font-mono text-gray-600 shrink-0">{filing.date}</span>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {filing.description && (
          <p className="text-xs text-gray-400 leading-relaxed mb-2">{filing.description}</p>
        )}
        {hasUrl ? (
          <a
            href={filing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            View on SEC EDGAR ↗
          </a>
        ) : (
          <span className="text-xs font-mono text-gray-600">URL not available</span>
        )}
      </div>
    </div>
  )
}

export default function SecFilingsPanel({ filings, company, edgarSearchUrl }) {
  const hasFilings = filings?.length > 0

  return (
    <Panel
      title="SEC Filings"
      icon="📋"
      headerRight={
        <a
          href={edgarSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-amber-500 hover:text-amber-300 transition-colors"
        >
          All filings ↗
        </a>
      }
    >
      {!hasFilings ? (
        <div className="text-center py-4 space-y-3">
          <p className="text-xs text-gray-600 font-mono">No public SEC filings found.</p>
          <p className="text-xs text-gray-600">This may be a private company.</p>
          <a
            href={edgarSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-500 hover:text-amber-300 transition-colors"
          >
            Search EDGAR for {company} ↗
          </a>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filings.map((f, i) => (
            <FilingWindow key={i} filing={f} />
          ))}
        </div>
      )}
    </Panel>
  )
}
