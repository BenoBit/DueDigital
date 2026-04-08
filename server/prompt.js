const SYSTEM_PROMPT = `You are a senior private equity analyst. When given a company name:
1. Use the web_search tool to research it
2. Call the submit_memo tool with your findings

If verified financial data is provided in the user message, use it EXACTLY as-is for keyFinancials — do not modify values or search for additional financial data. Focus searches on qualitative research only.

If no financial data is provided, search for:
- Recent revenue, EBITDA, ARR, growth figures, valuation

Always search for:
- Business model, products, and primary customers
- Key competitors and market position
- Recent news: M&A, funding rounds, leadership changes, product launches (last 12 months)
- SEC filings on EDGAR
- Analyst commentary and risk factors`;

const MEMO_TOOL = {
  name: 'submit_memo',
  description: 'Submit the completed PE screening memo. Call this once after finishing all research.',
  input_schema: {
    type: 'object',
    properties: {
      company: { type: 'string', description: 'Official company name' },
      ticker: { type: ['string', 'null'], description: 'Stock ticker symbol, or null if private' },
      exchange: { type: ['string', 'null'], description: 'NYSE, NASDAQ, private, etc.' },
      businessOverview: {
        type: 'string',
        description: '5-8 sentences covering: what the company does, how it makes money (revenue streams), primary customers, geographies, stage of growth, and any notable structural advantages'
      },
      keyFinancials: {
        type: 'array',
        description: '5-8 rows: Revenue, Revenue Growth, EBITDA or EBITDA Margin, ARR or GMV if applicable, Gross Margin, Headcount, Last Valuation or Market Cap',
        items: {
          type: 'object',
          properties: {
            metric:    { type: 'string' },
            value:     { type: 'string' },
            period:    { type: 'string', description: 'e.g. FY2024 or TTM' },
            change:    { type: ['string', 'null'], description: 'e.g. +23% YoY or null' },
            trend:     { type: ['string', 'null'], enum: ['up', 'down', 'flat', null] },
            sourceUrl: { type: ['string', 'null'], description: 'Direct URL to the article, press release, or filing where this figure was found. Must start with https://. Required when you found the data via web search.' }
          },
          required: ['metric', 'value']
        }
      },
      competitors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name:          { type: 'string' },
            description:   { type: 'string', description: 'One sentence on size and positioning' },
            differentiator:{ type: 'string', description: 'How the target company differs' }
          },
          required: ['name', 'description']
        }
      },
      moatAnalysis: { type: 'string', description: '1-2 sentences on competitive moat type and durability' },
      recentMoves: {
        type: 'array',
        description: 'Events from the last 12 months only, up to 6 items',
        items: {
          type: 'object',
          properties: {
            date:        { type: 'string', description: 'Mon YYYY format' },
            title:       { type: 'string' },
            description: { type: 'string' },
            type:        { type: 'string', enum: ['acquisition','funding','leadership','product','ipo','partnership','regulatory','other'] },
            sourceUrl:   { type: ['string', 'null'] },
            sourceTitle: { type: ['string', 'null'] }
          },
          required: ['title', 'description', 'type']
        }
      },
      keyRisks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title:       { type: 'string' },
            description: { type: 'string' },
            severity:    { type: 'string', enum: ['high', 'medium', 'low'] }
          },
          required: ['title', 'description', 'severity']
        }
      },
      secFilings: {
        type: 'array',
        description: 'Real SEC filings found. Empty array for private companies.',
        items: {
          type: 'object',
          properties: {
            formType:    { type: 'string', description: '10-K, 10-Q, S-1, 8-K, 20-F, etc.' },
            date:        { type: 'string', description: 'YYYY-MM-DD' },
            description: { type: 'string' },
            url:         { type: 'string', description: 'Direct https URL to the SEC filing' }
          },
          required: ['formType', 'url']
        }
      },
      sources: {
        type: 'array',
        description: '3-6 actual source URLs found via search',
        items: {
          type: 'object',
          properties: {
            title:       { type: 'string' },
            url:         { type: 'string' },
            publication: { type: ['string', 'null'] },
            date:        { type: ['string', 'null'] }
          },
          required: ['title', 'url']
        }
      },
      thesis: {
        type: 'string',
        description: 'One sentence framing the core investment narrative without a buy/sell recommendation'
      },
      diligenceQuestions: {
        type: 'array',
        description: '3-5 specific open questions a PE analyst would want answered before proceeding',
        items: { type: 'string' }
      }
    },
    required: ['company', 'businessOverview', 'keyFinancials', 'competitors', 'keyRisks', 'thesis', 'diligenceQuestions']
  }
};

module.exports = { SYSTEM_PROMPT, MEMO_TOOL };
