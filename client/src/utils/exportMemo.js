export function buildMarkdown(data) {
  const lines = []
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  lines.push(`# ${data.company}${data.ticker ? ` (${data.ticker})` : ''}`)
  if (data.exchange) lines.push(`**Exchange:** ${data.exchange}`)
  lines.push(`**Screened:** ${date}`)
  lines.push(`> AI-generated. Not investment advice.`)
  lines.push('')

  // Business Overview
  lines.push('## Business Overview')
  lines.push(data.businessOverview || '')
  lines.push('')

  // Key Financials
  if (data.keyFinancials?.length) {
    lines.push('## Key Financials')
    lines.push('| Metric | Value | Period | Change |')
    lines.push('|--------|-------|--------|--------|')
    for (const f of data.keyFinancials) {
      lines.push(`| ${f.metric} | ${f.value} | ${f.period || '—'} | ${f.change || '—'} |`)
    }
    lines.push('')
  }

  // Competitive Positioning
  if (data.competitors?.length) {
    lines.push('## Competitive Positioning')
    if (data.moatAnalysis) {
      lines.push(`**Moat:** ${data.moatAnalysis}`)
      lines.push('')
    }
    for (const c of data.competitors) {
      lines.push(`### ${c.name}`)
      lines.push(c.description || '')
      if (c.differentiator) lines.push(`*Differentiator:* ${c.differentiator}`)
      lines.push('')
    }
  }

  // Key Risks
  if (data.keyRisks?.length) {
    lines.push('## Key Risks')
    for (const r of data.keyRisks) {
      const sev = (r.severity || '').toUpperCase()
      lines.push(`- **[${sev}] ${r.title}:** ${r.description}`)
    }
    lines.push('')
  }

  // Recent Strategic Moves
  if (data.recentMoves?.length) {
    lines.push('## Recent Strategic Moves')
    for (const m of data.recentMoves) {
      const dateStr = m.date ? `${m.date} · ` : ''
      lines.push(`- **${dateStr}${m.title}**`)
      lines.push(`  ${m.description}`)
      if (m.sourceUrl) lines.push(`  [${m.sourceTitle || 'Source'}](${m.sourceUrl})`)
    }
    lines.push('')
  }

  // SEC Filings
  if (data.secFilings?.length) {
    lines.push('## SEC Filings')
    for (const f of data.secFilings) {
      lines.push(`- **${f.formType}** (${f.date || '—'}): ${f.description || ''} — [View](${f.url})`)
    }
    lines.push('')
  }

  // Investment Thesis & Diligence
  lines.push('## Investment Thesis & Diligence')
  if (data.thesis) {
    lines.push(`**Narrative:** ${data.thesis}`)
    lines.push('')
  }
  if (data.diligenceQuestions?.length) {
    lines.push('**Top Diligence Questions:**')
    data.diligenceQuestions.forEach((q, i) => lines.push(`${i + 1}. ${q}`))
    lines.push('')
  }

  // Sources
  if (data.sources?.length) {
    lines.push('## Sources')
    for (const s of data.sources) {
      const pub = s.publication ? ` · ${s.publication}` : ''
      const date = s.date ? ` · ${s.date}` : ''
      lines.push(`- [${s.title}](${s.url})${pub}${date}`)
    }
  }

  return lines.join('\n')
}

export function downloadMarkdown(data) {
  const md = buildMarkdown(data)
  const slug = data.company.replace(/[^a-z0-9]/gi, '-').toLowerCase()
  const filename = `${slug}-screen.md`
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function copyMarkdown(data) {
  const md = buildMarkdown(data)
  await navigator.clipboard.writeText(md)
}

export function exportPdf(data) {
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const severityColor = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' }

  const financialsRows = (data.keyFinancials || []).map(f => `
    <tr>
      <td>${f.metric}</td>
      <td><strong>${f.value}</strong></td>
      <td>${f.period || '—'}</td>
      <td style="color:${f.trend === 'up' ? '#16a34a' : f.trend === 'down' ? '#dc2626' : '#6b7280'}">${f.change || '—'}</td>
    </tr>`).join('')

  const risksHtml = (data.keyRisks || [])
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - ({ high: 0, medium: 1, low: 2 }[b.severity])))
    .map(r => `
    <div class="risk" style="border-left:3px solid ${severityColor[r.severity] || '#6b7280'}">
      <span class="badge" style="color:${severityColor[r.severity] || '#6b7280'}">${(r.severity || '').toUpperCase()}</span>
      <strong>${r.title}</strong>
      <p>${r.description}</p>
    </div>`).join('')

  const movesHtml = (data.recentMoves || []).map(m => `
    <div class="move">
      <div class="move-header">
        ${m.date ? `<span class="date">${m.date}</span>` : ''}
        <span class="type-badge">${(m.type || 'other').toUpperCase()}</span>
      </div>
      <strong>${m.title}</strong>
      <p>${m.description}</p>
      ${m.sourceUrl ? `<a href="${m.sourceUrl}">${m.sourceTitle || 'Source'} ↗</a>` : ''}
    </div>`).join('')

  const competitorsHtml = (data.competitors || []).map(c => `
    <div class="competitor">
      <strong>${c.name}</strong>
      <p>${c.description}</p>
      ${c.differentiator ? `<p class="diff">› ${c.differentiator}</p>` : ''}
    </div>`).join('')

  const sourcesHtml = (data.sources || []).map(s =>
    `<li><a href="${s.url}">${s.title}</a>${s.publication ? ` · ${s.publication}` : ''}${s.date ? ` · ${s.date}` : ''}</li>`
  ).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${data.company} — DueDigital Screen</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #111; line-height: 1.5; padding: 32px 40px; }
  h1 { font-size: 22px; font-weight: 700; }
  h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #444; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin: 24px 0 10px; }
  h3 { font-size: 11px; font-weight: 600; margin-bottom: 2px; }
  p { margin-top: 3px; color: #374151; }
  a { color: #b45309; text-decoration: none; }
  .meta { color: #6b7280; font-size: 10px; margin-top: 4px; }
  .badges { display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
  .badge { font-size: 9px; font-weight: 700; font-family: monospace; padding: 2px 6px; border-radius: 3px; border: 1px solid currentColor; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; color: #6b7280; padding: 4px 8px; background: #f9fafb; }
  td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; }
  tr:last-child td { border-bottom: none; }
  .risk { padding: 8px 10px; margin-bottom: 6px; background: #f9fafb; border-radius: 4px; }
  .risk .badge { display: inline-block; margin-bottom: 3px; }
  .move { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
  .move:last-child { border-bottom: none; }
  .move-header { display: flex; gap: 8px; align-items: center; margin-bottom: 2px; }
  .date { font-size: 10px; color: #6b7280; font-family: monospace; }
  .type-badge { font-size: 9px; font-weight: 700; font-family: monospace; color: #6b7280; }
  .competitor { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
  .competitor:last-child { border-bottom: none; }
  .diff { color: #92400e; font-style: italic; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .thesis-box { background: #f9fafb; border-radius: 4px; padding: 10px 12px; margin-bottom: 10px; }
  ol, ul { padding-left: 16px; }
  li { margin-bottom: 4px; }
  .footer { margin-top: 32px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; }
  @media print {
    body { padding: 20px 28px; }
    @page { margin: 0.6in; size: letter; }
  }
</style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <h1>${data.company}</h1>
      <div class="badges">
        ${data.ticker ? `<span class="badge" style="color:#b45309">${data.ticker}</span>` : ''}
        ${data.exchange ? `<span class="badge" style="color:#6b7280">${data.exchange}</span>` : ''}
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-weight:700;font-size:10px;color:#b45309;letter-spacing:.1em">DUEDIGITAL</div>
      <div class="meta">Screened ${date}</div>
    </div>
  </div>

  <h2>Business Overview</h2>
  <p>${data.businessOverview || ''}</p>

  <h2>Key Financials</h2>
  <table>
    <thead><tr><th>Metric</th><th>Value</th><th>Period</th><th>Change</th></tr></thead>
    <tbody>${financialsRows}</tbody>
  </table>

  <div class="two-col">
    <div>
      <h2>Competitive Positioning</h2>
      ${data.moatAnalysis ? `<p style="margin-bottom:10px;font-style:italic">${data.moatAnalysis}</p>` : ''}
      ${competitorsHtml}
    </div>
    <div>
      <h2>Key Risks</h2>
      ${risksHtml}
    </div>
  </div>

  <h2>Recent Strategic Moves</h2>
  ${movesHtml}

  <h2>Investment Thesis & Diligence</h2>
  ${data.thesis ? `<div class="thesis-box"><p>${data.thesis}</p></div>` : ''}
  ${data.diligenceQuestions?.length ? `<ol>${data.diligenceQuestions.map(q => `<li>${q}</li>`).join('')}</ol>` : ''}

  ${data.sources?.length ? `<h2>Sources</h2><ul>${sourcesHtml}</ul>` : ''}

  <div class="footer">AI-generated screening memo · Not investment advice · DueDigital</div>

<script>window.onload = () => { window.print(); }</script>
</body>
</html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
}
