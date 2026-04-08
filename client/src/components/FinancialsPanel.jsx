import Panel from './Panel'

const TREND_CONFIG = {
  up:   { arrow: '▲', color: 'text-green-400' },
  down: { arrow: '▼', color: 'text-red-400' },
  flat: { arrow: '►', color: 'text-gray-500' },
}

function MetricCard({ metric, value, period, change, trend, sourceUrl }) {
  const t = TREND_CONFIG[trend]
  const isPositiveChange = change && (change.startsWith('+') || trend === 'up')
  const isNegativeChange = change && (change.startsWith('-') || trend === 'down')

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors flex flex-col gap-2">
      <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">{metric}</p>
      <p className="text-xl font-bold text-gray-100 font-mono leading-tight">{value ?? 'N/A'}</p>
      <div className="flex items-center justify-between gap-2 mt-auto">
        {period && (
          <span className="text-xs text-gray-600 font-mono">{period}</span>
        )}
        {change && (
          <span className={`text-xs font-mono font-semibold flex items-center gap-0.5 ${
            isPositiveChange ? 'text-green-400' : isNegativeChange ? 'text-red-400' : 'text-gray-500'
          }`}>
            {t && <span className="text-[10px]">{t.arrow}</span>}
            {change}
          </span>
        )}
      </div>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-mono text-amber-600 hover:text-amber-400 transition-colors mt-0.5"
        >
          {sourceUrl.includes('sec.gov') ? 'SEC filing ↗' : 'Source ↗'}
        </a>
      )}
    </div>
  )
}

export default function FinancialsPanel({ financials }) {
  if (!financials?.length) return null

  const fromEdgar = financials.some(f => f.sourceUrl?.includes('sec.gov'))

  return (
    <Panel
      title="Key Financials"
      icon="💹"
      headerRight={
        fromEdgar ? (
          <span className="text-[10px] font-mono text-green-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600 inline-block" />
            Sourced from SEC filings
          </span>
        ) : (
          <span className="text-[10px] font-mono text-amber-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-700 inline-block" />
            AI-estimated · verify before use
          </span>
        )
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {financials.map((f, i) => (
          <MetricCard key={i} {...f} />
        ))}
      </div>
    </Panel>
  )
}
