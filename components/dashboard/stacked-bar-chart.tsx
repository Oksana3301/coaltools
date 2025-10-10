"use client"

import dynamic from 'next/dynamic'

// Dynamic import for the chart content
const DynamicStackedBarChartContent = dynamic(
  () => import('./stacked-bar-chart-content'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full animate-pulse" style={{ height: 300 }}>
        <div className="w-full h-full bg-gray-200 rounded-lg" />
      </div>
    ),
  }
)

interface StackedBarChartProps {
  data: any[]
  height?: number
  stackKeys: string[]
  colors?: string[]
}

export function StackedBarChart({ 
  data, 
  height = 300, 
  stackKeys, 
  colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'] 
}: StackedBarChartProps) {
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact'
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatValue(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <DynamicStackedBarChartContent
      data={data}
      height={height}
      stackKeys={stackKeys}
      colors={colors}
      formatValue={formatValue}
      CustomTooltip={CustomTooltip}
    />
  )
}
