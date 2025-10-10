"use client"

import { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Clock, User, ExternalLink, CheckCircle, X } from 'lucide-react'
import type { AlertItem } from '@/lib/dashboard-types'

interface AlertListProps {
  alerts: AlertItem[]
  onAssign?: (alertId: string, owner: string) => void
  onClose?: (alertId: string) => void
  onReopen?: (alertId: string) => void
}

export function AlertList({ alerts, onAssign, onClose, onReopen }: AlertListProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'med' | 'low'>('all')

  const filteredAlerts = alerts.filter(alert => {
    if (filter !== 'all' && alert.status !== filter) return false
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false
    return true
  })

  const getSeverityColor = (severity: 'low' | 'med' | 'high') => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'med': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getSeverityIcon = (severity: 'low' | 'med' | 'high') => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4" />
      case 'med': return <Clock className="h-4 w-4" />
      case 'low': return <AlertTriangle className="h-4 w-4 opacity-60" />
    }
  }

  const getStatusColor = (status: 'open' | 'closed') => {
    return status === 'open' 
      ? 'bg-orange-100 text-orange-800 border-orange-200'
      : 'bg-green-100 text-green-800 border-green-200'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={(value: any) => setSeverityFilter(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="med">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-gray-600">
          {filteredAlerts.length} of {alerts.length} alerts
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No alerts found</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {getSeverityIcon(alert.severity)}
                        <span className="ml-1 capitalize">{alert.severity}</span>
                      </Badge>
                      
                      <Badge className={getStatusColor(alert.status)}>
                        {alert.status === 'open' ? (
                          <Clock className="h-3 w-3 mr-1" />
                        ) : (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                      </Badge>

                      <span className="text-xs text-gray-500">
                        {alert.type}
                      </span>
                    </div>

                    {/* Message */}
                    <p className="text-sm text-gray-900 font-medium">
                      {alert.message}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Created: {formatDate(alert.createdAt)}
                      </span>
                      
                      {alert.owner && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {alert.owner}
                        </span>
                      )}
                      
                      {alert.sla && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          SLA: {alert.sla}h
                        </span>
                      )}
                    </div>

                    {/* Reference Link */}
                    {alert.ref && (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View {alert.ref.kind} {alert.ref.id}
                        </Button>
                        {alert.ref.description && (
                          <span className="text-xs text-gray-500">
                            {alert.ref.description}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {alert.status === 'open' && onClose && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onClose(alert.id)}
                        className="h-8 px-3"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Close
                      </Button>
                    )}
                    
                    {alert.status === 'closed' && onReopen && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onReopen(alert.id)}
                        className="h-8 px-3"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
