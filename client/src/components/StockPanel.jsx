import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import Panel from './Panel'

const RANGES = ['1M', '3M', '6M', '1Y']

function fmt(n, opts = {}) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', opts).format(n)
}

function fmtPrice(n, currency = 'USD') {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(n)
}


function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CustomTooltip = ({ active, payload, currency }) => {
  if (!active || !payload?.length) return null
  const { date, close } = payload[0].payload
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      <div className="text-gray-400">{fmtDate(date)}</div>
      <div className="text-amber-300 font-bold">{fmtPrice(close, currency)}</div>
    </div>
  )
}

export default function StockPanel({ ticker }) {
  const [range, setRange] = useState('6M')
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading') // loading | done | error

  useEffect(() => {
    if (!ticker) return
    setStatus('loading')
    setData(null)

    fetch(`/api/quote/${encodeURIComponent(ticker)}?range=${range}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setStatus('error'); return }
        setData(d)
        setStatus('done')
      })
      .catch(() => setStatus('error'))
  }, [ticker, range])

  if (!ticker) return null

  const isUp = data?.change >= 0
  const chartColor = isUp ? '#34d399' : '#f87171'

  // Compute y-axis domain with padding
  let yDomain = ['auto', 'auto']
  if (data?.history?.length) {
    const closes = data.history.map(d => d.close).filter(Boolean)
    const minC = Math.min(...closes)
    const maxC = Math.max(...closes)
    const pad = (maxC - minC) * 0.1 || 1
    yDomain = [minC - pad, maxC + pad]
  }

  return (
    <Panel
      title="Stock Price"
      icon="📈"
      headerRight={
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                range === r
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      }
    >
      {status === 'loading' && (
        <div className="flex items-center justify-center h-48 text-xs font-mono text-gray-600 animate-pulse">
          Fetching {ticker} data…
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center justify-center h-48 text-xs font-mono text-gray-600">
          Could not load quote for <span className="text-gray-400 ml-1">{ticker}</span>
          <span className="ml-1 text-gray-700">(private or unlisted)</span>
        </div>
      )}

      {status === 'done' && data && (
        <div className="space-y-4">
          {/* Price row */}
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <div className="text-3xl font-bold font-mono text-gray-100">
                {fmtPrice(data.price, data.currency)}
              </div>
              <div className={`flex items-center gap-1.5 text-sm font-mono mt-0.5 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                <span>{isUp ? '▲' : '▼'}</span>
                <span>{fmtPrice(Math.abs(data.change), data.currency)}</span>
                <span className="text-xs">({data.changePercent?.toFixed(2)}%)</span>
              </div>
            </div>
            <div className="flex gap-6 ml-auto pb-1">
              <div className="text-right">
                <div className="text-[10px] font-mono text-gray-600 uppercase">Day High</div>
                <div className="text-sm font-mono text-gray-300">{fmtPrice(data.dayHigh, data.currency)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono text-gray-600 uppercase">Day Low</div>
                <div className="text-sm font-mono text-gray-300">{fmtPrice(data.dayLow, data.currency)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono text-gray-600 uppercase">52W High</div>
                <div className="text-sm font-mono text-gray-300">{fmtPrice(data.high52, data.currency)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono text-gray-600 uppercase">52W Low</div>
                <div className="text-sm font-mono text-gray-300">{fmtPrice(data.low52, data.currency)}</div>
              </div>
            </div>
          </div>

          {/* Chart */}
          {data.history?.length > 0 ? (
            <div className="h-48 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.history} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtDate}
                    tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#4b5563' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={60}
                  />
                  <YAxis
                    domain={yDomain}
                    tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#4b5563' }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                    tickFormatter={v => fmtPrice(v, data.currency)}
                  />
                  <Tooltip content={<CustomTooltip currency={data.currency} />} />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke={chartColor}
                    strokeWidth={1.5}
                    fill="url(#stockGrad)"
                    dot={false}
                    activeDot={{ r: 3, fill: chartColor, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-xs font-mono text-gray-600 text-center py-4">No price history available</div>
          )}
        </div>
      )}
    </Panel>
  )
}
