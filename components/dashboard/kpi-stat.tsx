"use client"

import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPIStatProps {
  label: string
  value: number
  suffix?: string
  delta?: number
  format?: 'number' | 'currency' | 'percentage'
}

export function KPIStat({ label, value, suffix, delta, format = 'number' }: KPIStatProps) {
  const formatValue = (val: number) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val)
    }
    if (format === 'percentage') {
      return val.toFixed(1)
    }
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(val)
  }

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return 'text-green-600'
    if (delta < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  const getDeltaIcon = (delta: number) => {
    if (delta > 0) return <TrendingUp className="h-3 w-3" />
    if (delta < 0) return <TrendingDown className="h-3 w-3" />
    return null
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">
        {formatValue(value)}{suffix}
      </div>
      {delta !== undefined && (
        <div className={`flex items-center gap-1 text-xs mt-2 ${getDeltaColor(delta)}`}>
          {getDeltaIcon(delta)}
          <span>{delta >= 0 ? '+' : ''}{delta.toFixed(1)}%</span>
          <span className="text-gray-400">vs last period</span>
        </div>
      )}
    </div>
  )
}
