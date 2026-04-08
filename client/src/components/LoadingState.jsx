import { useState, useEffect } from 'react'

const PHASES = [
  { label: 'Searching web and news sources…', icon: '🔍' },
  { label: 'Pulling SEC filings from EDGAR…', icon: '📄' },
  { label: 'Analyzing competitive landscape…', icon: '📊' },
  { label: 'Reviewing financials and metrics…', icon: '💹' },
  { label: 'Synthesizing investment memo…', icon: '✍️' },
]

export default function LoadingState({ company }) {
  const [phaseIndex, setPhaseIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex(i => Math.min(i + 1, PHASES.length - 1))
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8">
      {/* Animated grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm bg-amber-500/20"
            style={{
              animation: `pulse 1.5s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="text-center space-y-2">
        <p className="text-xs font-mono text-gray-600 uppercase tracking-widest">Researching</p>
        <p className="text-xl font-bold text-gray-100">{company}</p>
      </div>

      {/* Phase steps */}
      <div className="w-full max-w-sm space-y-2">
        {PHASES.map((phase, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-500 ${
              i === phaseIndex
                ? 'bg-amber-500/10 border border-amber-500/30'
                : i < phaseIndex
                ? 'opacity-40'
                : 'opacity-20'
            }`}
          >
            <span className="text-base">{phase.icon}</span>
            <span className={`text-xs font-mono ${i === phaseIndex ? 'text-amber-300' : 'text-gray-500'}`}>
              {phase.label}
            </span>
            {i < phaseIndex && (
              <svg className="ml-auto h-3.5 w-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {i === phaseIndex && (
              <div className="ml-auto w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-700 font-mono">typically 20–40 seconds</p>
    </div>
  )
}
