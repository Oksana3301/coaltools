"use client"

import dynamic from 'next/dynamic'

// Dynamic import for the entire chart component
const DynamicParetoChartContent = dynamic(
  () => import('./pareto-chart-content'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full animate-pulse" style={{ height: 300 }}>
        <div className="w-full h-full bg-gray-200 rounded-lg" />
      </div>
    ),
  }
)

interface ParetoDataPoint {
  name: string
  value: number
  percentage: number
  trend?: number
}

interface ParetoChartProps {
  data: ParetoDataPoint[]
  height?: number
}

export function ParetoChart({ data, height = 300 }: ParetoChartProps) {
  // Calculate cumulative percentages for Pareto line
  const chartData = data
    .sort((a, b) => b.value - a.value)
    .reduce((acc, item, index) => {
      const cumulative = index === 0 ? item.percentage : acc[index - 1].cumulative + item.percentage
      acc.push({
        ...item,
        cumulative: Math.min(cumulative, 100)
      })
      return acc
    }, [] as any[])

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact'
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-blue-600">
            Value: {formatValue(data.value)}
          </p>
          <p className="text-sm text-gray-600">
            Share: {data.percentage.toFixed(1)}%
          </p>
          <p className="text-sm text-purple-600">
            Cumulative: {data.cumulative.toFixed(1)}%
          </p>
          {data.trend !== undefined && (
            <p className={`text-sm ${data.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Trend: {data.trend >= 0 ? '+' : ''}{data.trend.toFixed(1)}%
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <DynamicParetoChartContent 
      data={chartData}
      height={height}
      formatValue={formatValue}
      CustomTooltip={CustomTooltip}
    />
  )
}
