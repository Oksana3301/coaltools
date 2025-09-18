"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface WaterfallChartData {
  name: string
  start: number
  change: number
  cumulative: number
  isPositive: boolean
  originalValue: number
}

interface WaterfallChartContentProps {
  data: WaterfallChartData[]
  height: number
  formatValue: (value: number) => string
  CustomTooltip: React.ComponentType<any>
}

export default function WaterfallChartContent({
  data,
  height,
  formatValue,
  CustomTooltip,
}: WaterfallChartContentProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            {data.map((entry, index) => (
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