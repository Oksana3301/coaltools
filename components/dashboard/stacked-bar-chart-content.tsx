"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface StackedBarChartContentProps {
  data: any[]
  height: number
  stackKeys: string[]
  colors: string[]
  formatValue: (value: number) => string
  CustomTooltip: React.ComponentType<any>
}

export default function StackedBarChartContent({
  data,
  height,
  stackKeys,
  colors,
  formatValue,
  CustomTooltip,
}: StackedBarChartContentProps) {
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
          <Legend />
          
          {stackKeys.map((key, index) => (
            <Bar 
              key={key}
              dataKey={key} 
              stackId="stack"
              fill={colors[index % colors.length]}
              name={key.charAt(0).toUpperCase() + key.slice(1)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}