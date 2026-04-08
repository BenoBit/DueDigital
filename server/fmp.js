const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

async function fmpFetch(path, apiKey) {
  const sep = path.includes('?') ? '&' : '?';
  const resp = await fetch(`${FMP_BASE}${path}${sep}apikey=${apiKey}`, {
    headers: { Accept: 'application/json' },
  });
  if (!resp.ok) throw new Error(`FMP returned ${resp.status} for ${path}`);
  const data = await resp.json();
  if (data?.['Error Message']) throw new Error(data['Error Message']);
  return data;
}

function fmtNum(n) {
  if (n == null || n === 0) return null;
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  return `${sign}$${abs.toLocaleString()}`;
}

function fmtPct(n) {
  if (n == null) return null;
  return `${(n * 100).toFixed(1)}%`;
}

function yoy(curr, prev) {
  if (!curr || !prev || prev === 0) return null;
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% YoY`;
}

function trendDir(curr, prev) {
  if (curr == null || prev == null) return null;
  return curr > prev ? 'up' : curr < prev ? 'down' : 'flat';
}

// Resolve a company name to a ticker using FMP search.
// Returns null if not found or if it looks like a private company.
async function resolveTicker(company, apiKey) {
  try {
    // Only treat as a ticker if the original input is already uppercase or prefixed with $
    const raw = company.trim();
    const tickerMatch = raw.match(/^\$?([A-Z]{1,5})$/);
    if (tickerMatch) return tickerMatch[1];

    const results = await fmpFetch(
      `/search?query=${encodeURIComponent(company)}&limit=5`,
      apiKey
    );
    if (!Array.isArray(results) || !results.length) return null;

    // Prefer major exchanges
    const majorExchanges = ['NASDAQ', 'NYSE', 'AMEX', 'NYSE AMERICAN'];
    const major = results.filter(r => majorExchanges.includes(r.exchangeShortName?.toUpperCase()));
    const pool = major.length ? major : results;

    // Prefer exact name match, otherwise take the first result
    const lower = company.toLowerCase();
    const exact = pool.find(r => r.name?.toLowerCase() === lower);
    return (exact || pool[0])?.symbol || null;
  } catch {
    return null;
  }
}

// Fetch financials for a public company from FMP.
// Returns { rows, ticker, exchange, companyName } or null on failure.
async function fetchFinancials(ticker, apiKey) {
  const sourceUrl = `https://financialmodelingprep.com/financial-statements/${ticker}`;

  const [income, profile] = await Promise.all([
    fmpFetch(`/income-statement/${ticker}?limit=2`, apiKey),
    fmpFetch(`/profile/${ticker}`, apiKey),
  ]);

  const curr = Array.isArray(income) ? income[0] : null;
  const prev = Array.isArray(income) ? income[1] : null;
  const prof = Array.isArray(profile) ? profile[0] : null;

  if (!curr) return null;

  const period = curr.calendarYear ? `FY${curr.calendarYear}` : 'Latest';
  const rows = [];

  const add = (metric, value, change, trend) => {
    if (value != null) rows.push({ metric, value, period, change, trend, sourceUrl });
  };

  add('Revenue',          fmtNum(curr.revenue),         yoy(curr.revenue, prev?.revenue),                  trendDir(curr.revenue, prev?.revenue));
  add('Gross Profit',     fmtNum(curr.grossProfit),      yoy(curr.grossProfit, prev?.grossProfit),          trendDir(curr.grossProfit, prev?.grossProfit));
  add('Gross Margin',     fmtPct(curr.grossProfitRatio), prev?.grossProfitRatio != null
    ? `${((curr.grossProfitRatio - prev.grossProfitRatio) * 100).toFixed(1)}pp YoY`
    : null,                                                                                                  trendDir(curr.grossProfitRatio, prev?.grossProfitRatio));
  add('EBITDA',           fmtNum(curr.ebitda),           yoy(curr.ebitda, prev?.ebitda),                    trendDir(curr.ebitda, prev?.ebitda));
  add('Operating Income', fmtNum(curr.operatingIncome),  yoy(curr.operatingIncome, prev?.operatingIncome),  trendDir(curr.operatingIncome, prev?.operatingIncome));
  add('Net Income',       fmtNum(curr.netIncome),        yoy(curr.netIncome, prev?.netIncome),              trendDir(curr.netIncome, prev?.netIncome));

  if (prof?.mktCap)
    rows.push({ metric: 'Market Cap', value: fmtNum(prof.mktCap), period: 'Current', change: null, trend: null, sourceUrl });
  if (prof?.fullTimeEmployees)
    rows.push({ metric: 'Employees', value: Number(prof.fullTimeEmployees).toLocaleString(), period: 'Current', change: null, trend: null, sourceUrl });

  return {
    rows,
    ticker:      prof?.symbol          || ticker,
    exchange:    prof?.exchangeShortName || null,
    companyName: prof?.companyName      || null,
  };
}

module.exports = { resolveTicker, fetchFinancials };
