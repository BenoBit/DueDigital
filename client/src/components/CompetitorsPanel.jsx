import Panel from './Panel'

export default function CompetitorsPanel({ competitors, moatAnalysis }) {
  return (
    <Panel title="Competitive Positioning" icon="⚔️">
      <div className="space-y-4">
        {/* Competitors table */}
        <div className="space-y-2">
          {competitors?.map((c, i) => (
            <div key={i} className="rounded-lg border border-gray-800 bg-gray-900/50 p-3 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-200">{c.name}</span>
                {c.estimatedSize && (
                  <span className="text-xs font-mono text-gray-600 shrink-0">{c.estimatedSize}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-1.5 leading-relaxed">{c.description}</p>
              {c.differentiator && (
                <div className="flex items-start gap-1.5">
                  <span className="text-amber-500 text-xs shrink-0 mt-px">›</span>
                  <p className="text-xs text-amber-200/70 leading-relaxed">{c.differentiator}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Moat */}
        {moatAnalysis && (
          <div className="border-t border-gray-800 pt-3">
            <p className="text-xs font-mono text-gray-600 uppercase tracking-wider mb-1.5">Moat Analysis</p>
            <p className="text-xs text-gray-400 leading-relaxed">{moatAnalysis}</p>
          </div>
        )}
      </div>
    </Panel>
  )
}
