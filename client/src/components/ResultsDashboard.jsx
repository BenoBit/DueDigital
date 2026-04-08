import { useState } from 'react'
import StockPanel from './StockPanel'
import OverviewPanel from './OverviewPanel'
import AssessmentPanel from './AssessmentPanel'
import FinancialsPanel from './FinancialsPanel'
import CompetitorsPanel from './CompetitorsPanel'
import RisksPanel from './RisksPanel'
import RecentMovesPanel from './RecentMovesPanel'
import SecFilingsPanel from './SecFilingsPanel'
import SourcesPanel from './SourcesPanel'
import { copyMarkdown, downloadMarkdown, exportPdf } from '../utils/exportMemo'

// Wrapper so each panel never splits across columns
function Col({ children }) {
  return <div className="break-inside-avoid mb-4">{children}</div>
}

export default function ResultsDashboard({ data }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await copyMarkdown(data)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="pb-12">
      {/* Company header */}
      <div className="flex items-start justify-between gap-4 pt-2 pb-4 mb-4 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-100 tracking-tight">{data.company}</h2>
            {data.ticker && (
              <span className="text-sm font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                {data.ticker}
              </span>
            )}
            {data.exchange && (
              <span className="text-xs font-mono text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                {data.exchange}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 font-mono mt-1">
            Screened {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {' · '}AI-generated · Not investment advice
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
          >
            {copied ? (
              <><span className="text-green-400">✓</span> Copied</>
            ) : (
              <>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy MD
              </>
            )}
          </button>
          <button
            onClick={() => downloadMarkdown(data)}
            className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            .md
          </button>
          <button
            onClick={() => exportPdf(data)}
            className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded border border-amber-800/60 text-amber-500 hover:text-amber-300 hover:border-amber-600 transition-colors"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      {/* Full-width: Stock price */}
      {data.ticker && (
        <div className="mb-4">
          <StockPanel ticker={data.ticker} />
        </div>
      )}

      {/* Full-width: Business Overview */}
      <div className="mb-4">
        <OverviewPanel overview={data.businessOverview} />
      </div>

      {/* Full-width: Key Financials */}
      <div className="mb-4">
        <FinancialsPanel financials={data.keyFinancials} />
      </div>

      {/* Masonry columns — content pours into the shorter column automatically */}
      <div className="columns-1 lg:columns-2 gap-4">
        {/* Tall sections first so they anchor each column */}
        <Col>
          <CompetitorsPanel competitors={data.competitors} moatAnalysis={data.moatAnalysis} />
        </Col>
        <Col>
          <RecentMovesPanel moves={data.recentMoves} />
        </Col>

        {/* Medium sections */}
        <Col>
          <AssessmentPanel thesis={data.thesis} questions={data.diligenceQuestions} />
        </Col>
        <Col>
          <RisksPanel risks={data.keyRisks} />
        </Col>

        {/* Shorter sections */}
        <Col>
          <SecFilingsPanel
            filings={data.secFilings}
            company={data.company}
            edgarSearchUrl={data.edgarSearchUrl}
          />
        </Col>
      </div>

      {/* Full-width: Sources */}
      {data.sources?.length > 0 && (
        <div className="mt-4">
          <SourcesPanel sources={data.sources} />
        </div>
      )}
    </div>
  )
}
