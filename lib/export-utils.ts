// Export utilities for dashboard data
import type { DashboardSummary, DashboardFilters } from './dashboard-types'

export async function exportDashboard(
  data: DashboardSummary | null,
  format: 'excel' | 'pdf',
  filters: DashboardFilters
) {
  if (!data) {
    throw new Error('No data to export')
  }

  if (format === 'excel') {
    await exportToExcel(data, filters)
  } else if (format === 'pdf') {
    await exportToPDF(data, filters)
  }
}

async function exportToExcel(data: DashboardSummary, filters: DashboardFilters) {
  // Create CSV content for Excel compatibility
  const csvContent = generateCSVContent(data, filters)
  
  // Create and download file
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `CoalLens_Dashboard_${filters.period}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function exportToPDF(data: DashboardSummary, filters: DashboardFilters) {
  // Create HTML content for PDF
  const htmlContent = generatePDFContent(data, filters)
  
  // Open in new window for printing
  const newWindow = window.open('', '_blank')
  if (newWindow) {
    newWindow.document.write(htmlContent)
    newWindow.document.close()
    newWindow.print()
  }
}

function generateCSVContent(data: DashboardSummary, filters: DashboardFilters): string {
  const lines: string[] = []
  
  // Header
  lines.push('CoalLens Core12 Dashboard Export')
  lines.push(`Period: ${filters.period}`)
  lines.push(`Site: ${filters.site}`)
  lines.push(`Currency: ${filters.currency}`)
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')
  
  // Core12 KPIs
  lines.push('Core12 KPI Metrics')
  lines.push('Metric,Value,Unit')
  lines.push(`Realized Price/ton,${data.kpi.realizedPricePerTon},${filters.currency}`)
  lines.push(`Benchmark Diff,${data.kpi.benchmarkDiff},${filters.currency}`)
  lines.push(`Saleable Tons,${data.kpi.saleableTons},tons`)
  lines.push(`Yield %,${data.kpi.yieldPct},%`)
  lines.push(`Strip Ratio,${data.kpi.stripRatio},ratio`)
  lines.push(`Cash Cost/ton,${data.kpi.cashCostPerTon},${filters.currency}`)
  lines.push(`Royalty/ton,${data.kpi.royaltyPerTon},${filters.currency}`)
  lines.push(`Cash Margin/ton,${data.kpi.cashMarginPerTon},${filters.currency}`)
  lines.push(`EBITDA/ton,${data.kpi.ebitdaPerTon},${filters.currency}`)
  lines.push(`EBITDA Margin %,${data.kpi.ebitdaMarginPct},%`)
  lines.push(`AISC/ton,${data.kpi.aiscPerTon},${filters.currency}`)
  lines.push(`FCF,${data.kpi.fcf},${filters.currency}`)
  lines.push(`FCF/ton,${data.kpi.fcfPerTon},${filters.currency}`)
  lines.push('')
  
  // Financial Summary
  lines.push('Financial Summary')
  lines.push('Metric,Value,Unit')
  lines.push(`Revenue,${data.finance.revenue},${filters.currency}`)
  lines.push(`COGS,${data.finance.cogs},${filters.currency}`)
  lines.push(`OPEX,${data.finance.opex},${filters.currency}`)
  lines.push(`EBITDA,${data.finance.ebitda},${filters.currency}`)
  lines.push(`Net Income,${data.finance.netIncome},${filters.currency}`)
  lines.push(`Cash Balance,${data.finance.cashClosing},${filters.currency}`)
  lines.push(`Accounts Receivable,${data.finance.ar},${filters.currency}`)
  lines.push(`Accounts Payable,${data.finance.ap},${filters.currency}`)
  lines.push(`DSO,${data.finance.dso},days`)
  lines.push(`DPO,${data.finance.dpo},days`)
  lines.push(`Days Stockpile,${data.finance.daysStockpile},days`)
  lines.push(`CCC,${data.finance.ccc},days`)
  lines.push('')
  
  // Cost Breakdown
  lines.push('Cost Breakdown')
  lines.push('Category,Amount,Per Ton,Percentage')
  data.costBreakdown.forEach(cost => {
    lines.push(`"${cost.category}",${cost.amount},${cost.perTon},${cost.percentage}`)
  })
  lines.push('')
  
  // Vendor Performance
  lines.push('Vendor Performance')
  lines.push('Vendor,Total Spend,Percentage,Price Change %,Critical')
  data.vendorPerformance.forEach(vendor => {
    lines.push(`"${vendor.vendorName}",${vendor.totalSpend},${vendor.percentage},${vendor.priceChange},${vendor.isCritical}`)
  })
  lines.push('')
  
  // Alerts
  lines.push('Active Alerts')
  lines.push('Type,Severity,Message,Status,Created')
  data.alerts.forEach(alert => {
    lines.push(`"${alert.type}","${alert.severity}","${alert.message}","${alert.status}","${alert.createdAt}"`)
  })
  
  return lines.join('\n')
}

function generatePDFContent(data: DashboardSummary, filters: DashboardFilters): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: filters.currency,
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number, decimals = 1) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num)
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>CoalLens Core12 Dashboard - ${filters.period}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          font-size: 12px;
          line-height: 1.4;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .company-name { 
          font-size: 24px; 
          font-weight: bold; 
          color: #2563eb; 
          margin-bottom: 10px;
        }
        .report-title { 
          font-size: 18px; 
          margin: 5px 0; 
          color: #333;
        }
        .period { 
          font-size: 14px; 
          color: #666; 
          margin: 5px 0;
        }
        
        .section { 
          margin: 30px 0; 
          page-break-inside: avoid;
        }
        .section-title { 
          font-size: 16px; 
          font-weight: bold; 
          color: #333; 
          margin-bottom: 15px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        
        .kpi-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 15px; 
          margin: 20px 0;
        }
        .kpi-card { 
          border: 1px solid #ddd; 
          padding: 15px; 
          border-radius: 8px;
          background: #f9f9f9;
        }
        .kpi-label { 
          font-size: 11px; 
          color: #666; 
          margin-bottom: 5px;
        }
        .kpi-value { 
          font-size: 18px; 
          font-weight: bold; 
          color: #333;
        }
        
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0;
          font-size: 11px;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left;
        }
        th { 
          background-color: #f5f5f5; 
          font-weight: bold;
        }
        .number { text-align: right; }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        
        @media print {
          body { margin: 10px; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">CoalLens Core12 Dashboard</div>
        <div class="report-title">Mining Analytics Report</div>
        <div class="period">Period: ${filters.period} | Site: ${filters.site} | Currency: ${filters.currency}</div>
        <div class="period">Generated: ${new Date().toLocaleString('id-ID')}</div>
      </div>

      <div class="section">
        <div class="section-title">Executive Summary - Core12 KPIs</div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Realized Price/ton</div>
            <div class="kpi-value">${formatCurrency(data.kpi.realizedPricePerTon)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Cash Cost/ton</div>
            <div class="kpi-value">${formatCurrency(data.kpi.cashCostPerTon)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Cash Margin/ton</div>
            <div class="kpi-value">${formatCurrency(data.kpi.cashMarginPerTon)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">EBITDA Margin</div>
            <div class="kpi-value">${formatNumber(data.kpi.ebitdaMarginPct)}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Yield %</div>
            <div class="kpi-value">${formatNumber(data.kpi.yieldPct)}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Strip Ratio</div>
            <div class="kpi-value">${formatNumber(data.kpi.stripRatio)}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Financial Performance</div>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th class="number">Value (${filters.currency})</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Revenue</td><td class="number">${formatCurrency(data.finance.revenue)}</td><td>Total sales revenue</td></tr>
            <tr><td>COGS</td><td class="number">${formatCurrency(data.finance.cogs)}</td><td>Cost of goods sold</td></tr>
            <tr><td>OPEX</td><td class="number">${formatCurrency(data.finance.opex)}</td><td>Operating expenses</td></tr>
            <tr><td>EBITDA</td><td class="number">${formatCurrency(data.finance.ebitda)}</td><td>Earnings before interest, tax, depreciation</td></tr>
            <tr><td>Net Income</td><td class="number">${formatCurrency(data.finance.netIncome)}</td><td>Bottom line profit</td></tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Cost Analysis</div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th class="number">Total Amount</th>
              <th class="number">Per Ton</th>
              <th class="number">% of Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.costBreakdown.map(cost => `
              <tr>
                <td>${cost.category}</td>
                <td class="number">${formatCurrency(cost.amount)}</td>
                <td class="number">${formatCurrency(cost.perTon)}</td>
                <td class="number">${formatNumber(cost.percentage)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Working Capital</div>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th class="number">Value</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Days Sales Outstanding (DSO)</td><td class="number">${formatNumber(data.workingCapital.dso)}</td><td>days</td></tr>
            <tr><td>Days Payable Outstanding (DPO)</td><td class="number">${formatNumber(data.workingCapital.dpo)}</td><td>days</td></tr>
            <tr><td>Days Stockpile</td><td class="number">${formatNumber(data.workingCapital.daysStockpile)}</td><td>days</td></tr>
            <tr><td>Cash Conversion Cycle (CCC)</td><td class="number">${formatNumber(data.workingCapital.ccc)}</td><td>days</td></tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Active Alerts</div>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Severity</th>
              <th>Message</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.alerts.slice(0, 10).map(alert => `
              <tr>
                <td>${alert.type}</td>
                <td>${alert.severity.toUpperCase()}</td>
                <td>${alert.message}</td>
                <td>${alert.status.toUpperCase()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${data.alerts.length > 10 ? `<p><em>Showing top 10 of ${data.alerts.length} alerts</em></p>` : ''}
      </div>

      <div class="footer">
        <p>CoalLens Core12 Dashboard | Generated from CoalTools Mining Management Platform</p>
        <p>This report contains confidential business information</p>
      </div>
    </body>
    </html>
  `
}
