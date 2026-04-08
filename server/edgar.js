const EDGAR_HEADERS = { 'User-Agent': 'DueDigital contact@duedigital.com', Accept: 'application/json' };

// Cache the tickers file — it's ~1MB and static
let tickersCache = null;

async function edgarFetch(url) {
  const resp = await fetch(url, { headers: EDGAR_HEADERS });
  if (!resp.ok) throw new Error(`EDGAR ${resp.status}: ${url}`);
  return resp.json();
}

async function getTickersMap() {
  if (tickersCache) return tickersCache;
  const data = await edgarFetch('https://www.sec.gov/files/company_tickers.json');
  tickersCache = Object.values(data); // [{cik_str, ticker, title}]
  return tickersCache;
}

// Normalize: lowercase, strip punctuation, remove common corporate suffixes
function normalize(s) {
  return s.toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(inc|corp|ltd|llc|group|co|plc|the|holdings|international)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Company name → { cik, ticker, name } using company_tickers.json
async function resolveCik(company) {
  try {
    const entries = await getTickersMap();

    // Try direct ticker match first (e.g. user typed "AAPL" or "aapl")
    const tickerUpper = company.trim().toUpperCase();
    const tickerMatch = entries.find(e => e.ticker === tickerUpper);
    if (tickerMatch) {
      return {
        cik:    String(tickerMatch.cik_str).padStart(10, '0'),
        ticker: tickerMatch.ticker,
        name:   tickerMatch.title,
      };
    }

    const qNorm = normalize(company);
    const qWords = qNorm.split(' ').filter(Boolean);
    if (!qWords.length) return null;

    // Score each entry: all query words must appear in title
    // Tiebreak: prefer lower CIK (older = more likely the parent company)
    let best = null, bestScore = -Infinity;

    for (const e of entries) {
      const titleNorm = normalize(e.title);
      const titleWordSet = new Set(titleNorm.split(' ').filter(Boolean));
      const allMatch = qWords.every(w => titleWordSet.has(w)); // exact word, not substring
      if (!allMatch) continue;

      // Score: prefer titles with fewer extra words, tiebreak by lower CIK
      const titleWords = titleWordSet.size;
      const extraWords = titleWords - qWords.length;
      const score = -extraWords * 1000 - e.cik_str; // fewer extra words wins; lower CIK breaks ties
      if (score > bestScore) { best = e; bestScore = score; }
    }

    if (!best) return null;

    return {
      cik:    String(best.cik_str).padStart(10, '0'),
      ticker: best.ticker || null,
      name:   best.title,
    };
  } catch {
    return null;
  }
}

// Pull the most recent two distinct fiscal-year values for a GAAP concept
function annualPair(gaap, ...tags) {
  for (const tag of tags) {
    const entries = gaap?.[tag]?.units?.USD
      ?.filter(u => u.form === '10-K' && u.fp === 'FY')
      ?.sort((a, b) => b.end.localeCompare(a.end));
    if (!entries?.length) continue;

    const curr = entries[0];
    // Find previous year: different fiscal year AND different accession
    const prev = entries.find(e => e.fy !== curr.fy);
    return { curr, prev, tag };
  }
  return null;
}

function fmtNum(n) {
  if (n == null) return null;
  const abs = Math.abs(n), sign = n < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  return `${sign}$${abs.toLocaleString()}`;
}

function fmtPct(n) {
  return n == null ? null : `${(n * 100).toFixed(1)}%`;
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

function filingUrl(cik, accn) {
  if (!accn) return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=10-K&owner=include&count=5`;
  return `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/` +
    `${accn.replace(/-/g, '')}/`;
}

async function fetchFinancials(company) {
  const resolved = await resolveCik(company);
  if (!resolved) return null;

  const { cik, ticker, name } = resolved;
  const data = await edgarFetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`);
  const gaap = data.facts?.['us-gaap'];
  if (!gaap) return null;

  const rows = [];

  const add = (metric, pair, valueFn, changeFn, trendFn) => {
    if (!pair) return;
    const value = valueFn(pair.curr.val, pair.prev?.val);
    if (!value) return;
    const sourceUrl = filingUrl(cik, pair.curr.accn);
    rows.push({
      metric,
      value,
      period: `FY${pair.curr.fy}`,
      change: changeFn?.(pair.curr.val, pair.prev?.val) ?? null,
      trend: trendFn?.(pair.curr.val, pair.prev?.val) ?? null,
      sourceUrl,
    });
  };

  // Revenue — companies use different tags; financial firms use interest/fee income
  const rev = annualPair(gaap,
    'RevenueFromContractWithCustomerExcludingAssessedTax',
    'Revenues', 'SalesRevenueNet', 'SalesRevenueGoodsNet',
    'RevenueFromContractWithCustomerIncludingAssessedTax',
    'InterestAndDividendIncomeOperating',   // banks
    'RevenuesNetOfInterestExpense',         // investment banks (Goldman, Morgan Stanley)
    'NetRevenues',                          // some financial firms
    'NoninterestIncome'                     // bank non-interest revenue
  );
  add('Revenue', rev, (c) => fmtNum(c), yoy, trendDir);

  // Gross Profit + Gross Margin
  const gp = annualPair(gaap, 'GrossProfit');
  add('Gross Profit', gp, (c) => fmtNum(c), yoy, trendDir);
  if (gp && rev) {
    const margin = gp.curr.val / rev.curr.val;
    const prevMargin = (gp.prev && rev.prev) ? gp.prev.val / rev.prev.val : null;
    rows.push({
      metric: 'Gross Margin',
      value: fmtPct(margin),
      period: `FY${gp.curr.fy}`,
      change: prevMargin != null ? `${((margin - prevMargin) * 100).toFixed(1)}pp YoY` : null,
      trend: trendDir(margin, prevMargin),
      sourceUrl: filingUrl(cik, gp.curr.accn),
    });
  }

  // Operating Income
  const oi = annualPair(gaap, 'OperatingIncomeLoss');
  add('Operating Income', oi, (c) => fmtNum(c), yoy, trendDir);

  // Net Income
  const ni = annualPair(gaap, 'NetIncomeLoss');
  add('Net Income', ni, (c) => fmtNum(c), yoy, trendDir);

  // EPS (diluted)
  const eps = annualPair(gaap, 'EarningsPerShareDiluted');
  if (eps) {
    rows.push({
      metric: 'EPS (Diluted)',
      value: `$${eps.curr.val.toFixed(2)}`,
      period: `FY${eps.curr.fy}`,
      change: eps.prev ? `${((eps.curr.val - eps.prev.val) / Math.abs(eps.prev.val) * 100).toFixed(1)}% YoY` : null,
      trend: trendDir(eps.curr.val, eps.prev?.val),
      sourceUrl: filingUrl(cik, eps.curr.accn),
    });
  }

  // R&D
  const rd = annualPair(gaap, 'ResearchAndDevelopmentExpense');
  add('R&D Expense', rd, (c) => fmtNum(c), yoy, trendDir);

  // Headcount
  const emp = annualPair(gaap, 'EntityNumberOfEmployees');
  if (emp) {
    rows.push({
      metric: 'Employees',
      value: emp.curr.val.toLocaleString(),
      period: `FY${emp.curr.fy}`,
      change: emp.prev ? yoy(emp.curr.val, emp.prev.val) : null,
      trend: trendDir(emp.curr.val, emp.prev?.val),
      sourceUrl: filingUrl(cik, emp.curr.accn),
    });
  }

  return { rows, cik, ticker, name };
}

module.exports = { fetchFinancials };
