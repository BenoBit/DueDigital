import { useState, useCallback } from 'react'
import SearchBar from './components/SearchBar'
import LoadingState from './components/LoadingState'
import ResultsDashboard from './components/ResultsDashboard'

export default function App() {
  const [company, setCompany] = useState('')
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [error, setError] = useState('')

  const handleScreen = useCallback(async (companyName) => {
    if (!companyName.trim()) return
    setStatus('loading')
    setData(null)
    setError('')

    try {
      const res = await fetch('/api/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: companyName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Server error ${res.status}`)
      setData(json)
      setStatus('done')
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
      setStatus('error')
    }
  }, [])

  const handleReset = useCallback(() => {
    setStatus('idle')
    setData(null)
    setError('')
    setCompany('')
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0f] font-sans">
      {/* Top bar */}
      <header className="border-b border-gray-800 bg-[#0d0d14] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-amber-400 font-bold text-sm tracking-widest font-mono">DueDigital</span>
            <span className="text-gray-700 text-xs hidden sm:block">|</span>
            <span className="text-gray-600 text-xs font-mono hidden sm:block">INVESTMENT INTELLIGENCE</span>
          </div>

          <div className="flex-1 max-w-xl">
            <SearchBar
              value={company}
              onChange={setCompany}
              onSubmit={handleScreen}
              loading={status === 'loading'}
              compact
            />
          </div>

          {status !== 'idle' && (
            <button
              onClick={handleReset}
              className="text-xs text-gray-500 hover:text-gray-300 font-mono transition-colors shrink-0"
            >
              [ clear ]
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-3 tracking-tight">
                Company Screener
              </h1>
              <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
                Enter any company to generate a structured PE investment screen —
                live financials, competitive positioning, SEC filings, and sourced news.
              </p>
            </div>
            <div className="w-full max-w-lg">
              <SearchBar
                value={company}
                onChange={setCompany}
                onSubmit={handleScreen}
                loading={false}
              />
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {['ServiceTitan', 'Figma', 'Stripe', 'Databricks', 'Canva'].map(s => (
                <button
                  key={s}
                  onClick={() => { setCompany(s); handleScreen(s) }}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors font-mono"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {status === 'loading' && <LoadingState company={company} />}

        {status === 'error' && (
          error === 'RATE_LIMIT' ? (
            <div className="rounded-lg border border-amber-900 bg-amber-950/30 p-5 font-mono text-sm text-amber-400 max-w-2xl mx-auto mt-8">
              <span className="font-bold">RATE LIMIT</span>
              {' — '}Too many requests. Wait ~60 seconds and try again.
              <div className="mt-2 text-xs text-amber-700">
                Each screen uses significant API quota. Anthropic enforces a per-minute token limit on new accounts.
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-red-900 bg-red-950/30 p-5 text-sm text-red-400 font-mono max-w-2xl mx-auto mt-8">
              <span className="text-red-500 font-bold">ERROR</span> — {error}
            </div>
          )
        )}

        {status === 'done' && data && (
          <ResultsDashboard data={data} />
        )}
      </main>
    </div>
  )
}
