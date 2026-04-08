import Panel from './Panel'

const SEVERITY = {
  high:   { label: 'HIGH',   color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/30',   dot: 'bg-red-500' },
  medium: { label: 'MED',    color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  low:    { label: 'LOW',    color: 'text-gray-400',  bg: 'bg-gray-700/20',  border: 'border-gray-700',     dot: 'bg-gray-500' },
}

export default function RisksPanel({ risks }) {
  const sorted = [...(risks ?? [])].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return (order[a.severity] ?? 1) - (order[b.severity] ?? 1)
  })

  return (
    <Panel title="Key Risks" icon="⚠️">
      <div className="space-y-2.5">
        {sorted.map((r, i) => {
          const sev = SEVERITY[r.severity] || SEVERITY.medium
          return (
            <div key={i} className={`rounded-lg border p-3 ${sev.bg} ${sev.border}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sev.dot}`} />
                <span className={`text-xs font-bold font-mono ${sev.color}`}>{sev.label}</span>
                <span className="text-xs font-semibold text-gray-300">{r.title}</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed pl-3.5">{r.description}</p>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
