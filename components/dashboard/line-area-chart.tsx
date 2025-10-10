"use client"

import dynamic from 'next/dynamic'

// Dynamic import for the chart content
const DynamicLineAreaChartContent = dynamic(
  () => import('./line-area-chart-content'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full animate-pulse" style={{ height: 300 }}>
        <div className="w-full h-full bg-gray-200 rounded-lg" />
      </div>
    ),
  }
)

interface LineConfig {
  key: string
  name: string
  color: string
  type?: 'monotone' | 'linear' | 'step'
}

interface LineAreaChartProps {
  data: any[]
  height?: number
  xKey: string
  lines: LineConfig[]
}

export function LineAreaChart({ 
  data, 
  height = 300, 
  xKey, 
  lines 
}: LineAreaChartProps) {
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
    <DynamicLineAreaChartContent
      data={data}
      height={height}
      xKey={xKey}
      lines={lines}
      formatValue={formatValue}
      CustomTooltip={CustomTooltip}
    />
  )
}
