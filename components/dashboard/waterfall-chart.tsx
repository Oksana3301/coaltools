"use client"

import dynamic from 'next/dynamic'

// Dynamic import for the chart content
const DynamicWaterfallChartContent = dynamic(
  () => import('./waterfall-chart-content'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full animate-pulse" style={{ height: 300 }}>
        <div className="w-full h-full bg-gray-200 rounded-lg" />
      </div>
    ),
  }
)

interface WaterfallDataPoint {
  name: string
  value: number
  cumulative: number
  isPositive?: boolean
}

interface WaterfallChartProps {
  data: WaterfallDataPoint[]
  height?: number
}

export function WaterfallChart({ data, height = 300 }: WaterfallChartProps) {
  // Transform data for waterfall visualization
  const chartData = data.map((item, index) => {
    const prevCumulative = index > 0 ? data[index - 1].cumulative : 0
    const start = index === 0 ? 0 : Math.min(prevCumulative, item.cumulative)
    const change = item.value
    
    return {
      name: item.name,
      start,
      change: Math.abs(change),
      cumulative: item.cumulative,
      isPositive: item.isPositive ?? change >= 0,
      originalValue: change
    }
  })

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
          <p className={`text-sm ${data.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {data.isPositive ? '+' : ''}{formatValue(data.originalValue)}
          </p>
          <p className="text-sm text-gray-600">
            Cumulative: {formatValue(data.cumulative)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <DynamicWaterfallChartContent
      data={chartData}
      height={height}
      formatValue={formatValue}
      CustomTooltip={CustomTooltip}
    />
  )
}
