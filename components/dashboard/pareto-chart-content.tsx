"use client"

import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
} from 'recharts'

interface ParetoChartContentProps {
  data: Array<{
    name: string
    value: number
    cumulative: number
  }>
  height: number
  formatValue: (value: number) => string
  CustomTooltip: React.ComponentType<any>
}

export default function ParetoChartContent({
  data,
  height,
  formatValue,
  CustomTooltip,
}: ParetoChartContentProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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