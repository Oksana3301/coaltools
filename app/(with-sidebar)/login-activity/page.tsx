"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Shield,
  Calendar,
  User,
  Monitor,
  Globe
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LoginActivity {
  id: string
  userId: string
  email: string
  ipAddress: string | null
  userAgent: string | null
  status: 'SUCCESS' | 'FAILED' | 'LOCKED'
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

interface LoginActivityResponse {
  success: boolean
  data: LoginActivity[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function LoginActivityPage() {
  const [activities, setActivities] = useState<LoginActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const { toast } = useToast()

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50'
      })
      
      if (searchEmail) {
        params.append('email', searchEmail)
      }
      
      if (statusFilter) {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/auth/login-activity?${params}`)
      const data: LoginActivityResponse = await response.json()

      if (data.success) {
        setActivities(data.data)
        setTotalPages(data.pagination.totalPages)
        setTotalRecords(data.pagination.total)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch login activities",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast({
        title: "Error",
        description: "An error occurred while fetching data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [currentPage, searchEmail, statusFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>
      case 'FAILED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      case 'LOCKED':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100"><Shield className="h-3 w-3 mr-1" />Locked</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Admin</Badge>
      case 'approver':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Approver</Badge>
      case 'user':
        return <Badge variant="outline">User</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const exportToCSV = () => {
    const headers = ['Email', 'User Name', 'Role', 'Status', 'IP Address', 'Date']
    const csvContent = [
      headers.join(','),
      ...activities.map(activity => [
        activity.email,
        activity.user?.name || 'Unknown',
        activity.user?.role || 'Unknown',
        activity.status,
        activity.ipAddress || 'Unknown',
        formatDate(activity.createdAt)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `login-activity-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Login Activity</h1>
          <p className="text-muted-foreground">
            Monitor and track user login activities across the system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={fetchActivities} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search by Email</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Enter email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Filter</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="LOCKED">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Records</label>
              <div className="text-2xl font-bold text-blue-600">{totalRecords.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Login Activities
          </CardTitle>
          <CardDescription>
            Showing {activities.length} of {totalRecords} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading activities...
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No login activities found
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{activity.email}</span>
                        {activity.user && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">{activity.user.name}</span>
                            {getRoleBadge(activity.user.role)}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Monitor className="h-3 w-3" />
                          <span>{activity.ipAddress || 'Unknown IP'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(activity.createdAt)}</span>
                        </div>
                      </div>
                      {activity.userAgent && (
                        <div className="mt-2 text-xs text-gray-500 truncate">
                          <Globe className="h-3 w-3 inline mr-1" />
                          {activity.userAgent}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
