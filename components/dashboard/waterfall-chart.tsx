"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

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
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
            tickFormatter={formatValue}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Invisible bars for positioning */}
          <Bar dataKey="start" fill="transparent" stackId="stack" />
          
          {/* Visible bars for changes */}
          <Bar dataKey="change" stackId="stack">
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isPositive ? '#22c55e' : '#ef4444'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
