"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts'

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
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
            tickFormatter={formatValue}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          
          <Bar 
            yAxisId="left"
            dataKey="value" 
            fill="#3b82f6"
            name="Value"
          />
          
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulative"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
            name="Cumulative %"
          />
          
          {/* 80% reference line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey={() => 80}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="80% Line"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
