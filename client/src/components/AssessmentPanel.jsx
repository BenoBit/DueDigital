import Panel from './Panel'

export default function AssessmentPanel({ thesis, questions }) {
  return (
    <Panel title="Investment Thesis & Diligence" icon="🎯">
      <div className="space-y-4">
        {/* Thesis */}
        {thesis && (
          <div className="rounded-lg border border-gray-700 bg-gray-800/40 p-3">
            <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1.5">Narrative</p>
            <p className="text-sm text-gray-200 leading-relaxed">{thesis}</p>
          </div>
        )}

        {/* Diligence questions */}
        {questions?.length > 0 && (
          <div>
            <p className="text-xs font-mono text-gray-600 uppercase tracking-wider mb-2">
              Top Diligence Questions
            </p>
            <ol className="space-y-2">
              {questions.map((q, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-400 leading-relaxed">
                  <span className="text-amber-500 font-bold font-mono shrink-0">{i + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </Panel>
  )
}
