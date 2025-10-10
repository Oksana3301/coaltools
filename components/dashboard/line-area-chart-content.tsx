"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface LineConfig {
  key: string
  name: string
  color: string
  type?: 'monotone' | 'linear' | 'step'
}

interface LineAreaChartContentProps {
  data: any[]
  height: number
  xKey: string
  lines: LineConfig[]
  formatValue: (value: number) => string
  CustomTooltip: React.ComponentType<any>
}

export default function LineAreaChartContent({
  data,
  height,
  xKey,
  lines,
  formatValue,
  CustomTooltip,
}: LineAreaChartContentProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey={xKey} 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
            tickFormatter={formatValue}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {lines.map((line) => (
            <Line
              key={line.key}
              type={line.type || 'monotone'}
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={2}
              dot={{ fill: line.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: line.color }}
              name={line.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}