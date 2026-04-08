require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { SYSTEM_PROMPT, MEMO_TOOL } = require('./prompt');
const { fetchFinancials } = require('./edgar');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  app.use(express.static(path.join(__dirname, '../client/dist')));
} else {
  app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
}
app.use(express.json());

const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post('/api/screen', async (req, res) => {
  const { company } = req.body;

  if (!company || typeof company !== 'string' || company.trim().length === 0) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  const companyName = company.trim().slice(0, 200);
  // Attempt to pre-fetch verified financials directly from SEC EDGAR
  let edgarData = null;
  try {
    edgarData = await fetchFinancials(companyName);
    if (edgarData) console.log(`EDGAR: resolved ${companyName} → ${edgarData.ticker} (${edgarData.rows.length} rows)`);
  } catch (err) {
    console.warn('EDGAR lookup failed, falling back to AI search:', err.message);
  }

  // Build user message — inject EDGAR financials if available
  const userMessage = edgarData
    ? `Research and screen this company: ${companyName}\n\n` +
      `VERIFIED FINANCIALS FROM SEC FILINGS (use exactly as-is for keyFinancials, do not search for financial data):\n` +
      JSON.stringify(edgarData.rows, null, 2)
    : `Research and screen this company: ${companyName}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: [
        {
          type: 'web_search_20260209',
          name: 'web_search',
          allowed_callers: ['direct'],
          max_uses: edgarData ? 4 : 6,
        },
        { ...MEMO_TOOL, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: userMessage }]
    });

    // Extract the submit_memo tool call — input is already parsed JSON, no regex needed
    const memoBlock = message.content.find(b => b.type === 'tool_use' && b.name === 'submit_memo');
    if (!memoBlock) {
      console.error('No submit_memo tool call found. Stop reason:', message.stop_reason);
      console.error('Content blocks:', message.content.map(b => b.type));
      return res.status(500).json({ error: 'Model did not return structured data. Please try again.' });
    }

    const data = memoBlock.input;

    // If EDGAR resolved a ticker/name, trust it over AI-guessed values
    if (edgarData) {
      if (edgarData.ticker) data.ticker  = edgarData.ticker;
      if (edgarData.name)   data.company = edgarData.name;
    }

    // Append EDGAR search link so frontend always has a fallback
    data.edgarSearchUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(companyName)}&CIK=&type=&dateb=&owner=include&count=40&search_text=`;

    res.json(data);
  } catch (err) {
    console.error('Anthropic API error:', err.message);
    const isRateLimit = err.status === 429 || err.message?.includes('rate_limit') || err.message?.includes('rate limit');
    if (isRateLimit) {
      return res.status(429).json({ error: 'RATE_LIMIT' });
    }
    res.status(500).json({ error: err.message || 'An unexpected error occurred' });
  }
});

app.get('/api/quote/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const { range = '6M' } = req.query;

  const rangeMap = { '1M': '1mo', '3M': '3mo', '6M': '6mo', '1Y': '1y' };
  const intervalMap = { '1M': '1d', '3M': '1d', '6M': '1wk', '1Y': '1wk' };
  const yRange = rangeMap[range] || '6mo';
  const interval = intervalMap[range] || '1wk';

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
                `?range=${yRange}&interval=${interval}&includePrePost=false`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    });

    if (!resp.ok) throw new Error(`Yahoo Finance returned ${resp.status}`);

    const json = await resp.json();
    const result = json.chart?.result?.[0];
    if (!result) throw new Error('No data returned');

    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];

    const history = timestamps
      .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().split('T')[0], close: closes[i] }))
      .filter(d => d.close != null);

    const prev = meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice;
    const change = meta.regularMarketPrice - prev;

    res.json({
      price: meta.regularMarketPrice,
      change,
      changePercent: (change / prev) * 100,
      dayHigh: meta.regularMarketDayHigh,
      dayLow: meta.regularMarketDayLow,
      high52: meta.fiftyTwoWeekHigh,
      low52: meta.fiftyTwoWeekLow,
      currency: meta.currency || 'USD',
      history,
    });
  } catch (err) {
    console.error('Quote error:', err.message);
    res.status(404).json({ error: `Could not fetch quote for ${ticker}` });
  }
});

// In production, serve the React app for any non-API route
if (isProd) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n  DueDigital running at http://localhost:${PORT}`);
  console.log(`  Mode: ${isProd ? 'production' : 'development'}\n`);
});
