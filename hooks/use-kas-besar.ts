import { useState, useEffect, useCallback, useRef } from 'react'
import { apiService, KasBesarExpense, ApiResponse } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export interface UseKasBesarOptions {
  autoFetch?: boolean
  initialFilters?: {
    page?: number
    limit?: number
    status?: string
    search?: string
    userId?: string
  }
}

export function useKasBesar(options: UseKasBesarOptions = {}) {
  const { toast } = useToast()
  const { autoFetch = true, initialFilters = {} } = options

  // State management
  const [expenses, setExpenses] = useState<KasBesarExpense[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [filters, setFilters] = useState(initialFilters)
  const filtersRef = useRef(filters)
  
  // Update ref when filters change
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  // Fetch expenses
  const fetchExpenses = useCallback(async (customFilters?: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const filtersToUse = customFilters || filtersRef.current
      const response = await apiService.getKasBesar(filtersToUse)
      
      if (response.success && response.data) {
        setExpenses(response.data)
        if (response.pagination) {
          setPagination(response.pagination)
        }
      } else {
        throw new Error(response.error || 'Gagal mengambil data')
      }
    } catch (err) {
      // Ensure we always set a string error message, never an event object
      let errorMessage = 'Terjadi kesalahan'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message)
      }
      setError(errorMessage)
      console.error('Error loading kas besar expenses:', err)
      
      // Show toast for database connection errors
      if (errorMessage.includes('Database connection failed')) {
        toast({
          title: "Database Error",
          description: "Unable to connect to the database. Please check your internet connection.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }, [toast]) // Removed filters from dependencies to prevent infinite loop

  // Create expense
  const createExpense = useCallback(async (data: Omit<KasBesarExpense, 'id' | 'createdAt' | 'updatedAt'>) => {
    setCreating(true)
    setError(null)

    try {
      const response = await apiService.createKasBesar(data)
      
      if (response.success && response.data) {
        // Add to local state
        setExpenses(prev => [response.data!, ...prev])
        toast({
          title: "Berhasil",
          description: response.message || "Kas besar berhasil dibuat"
        })
        return response.data
      } else {
        throw new Error(response.error || 'Gagal membuat kas besar')
      }
    } catch (err) {
      // Ensure we always set a string error message, never an event object
      let errorMessage = 'Terjadi kesalahan'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message)
      }
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    } finally {
      setCreating(false)
    }
  }, [toast])

  // Update expense
  const updateExpense = useCallback(async (data: Partial<KasBesarExpense> & { id: string }) => {
    setUpdating(true)
    setError(null)

    try {
      const response = await apiService.updateKasBesar(data)
      
      if (response.success && response.data) {
        // Update local state
        setExpenses(prev => prev.map(exp => 
          exp.id === data.id ? response.data! : exp
        ))
        toast({
          title: "Berhasil",
          description: response.message || "Kas besar berhasil diperbarui"
        })
        return response.data
      } else {
        throw new Error(response.error || 'Gagal memperbarui kas besar')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    } finally {
      setUpdating(false)
    }
  }, [toast])

  // Update status
  const updateStatus = useCallback(async (
    id: string, 
    status: KasBesarExpense['status'],
    approvalNotes?: string,
    approvedBy?: string
  ) => {
    setUpdating(true)
    setError(null)

    try {
      const response = await apiService.updateKasBesarStatus(id, status, approvalNotes, approvedBy)
      
      if (response.success && response.data) {
        // Update local state
        setExpenses(prev => prev.map(exp => 
          exp.id === id ? response.data! : exp
        ))
        toast({
          title: "Berhasil",
          description: response.message || `Status berhasil diubah menjadi ${status}`
        })
        return response.data
      } else {
        throw new Error(response.error || 'Gagal memperbarui status')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    } finally {
      setUpdating(false)
    }
  }, [toast])

  // Delete expense
  const deleteExpense = useCallback(async (id: string, userId: string) => {
    setDeleting(id)
    setError(null)

    try {
      const response = await apiService.deleteKasBesar(id, userId)
      
      if (response.success) {
        // Remove from local state
        setExpenses(prev => prev.filter(exp => exp.id !== id))
        toast({
          title: "Berhasil",
          description: response.message || "Kas besar berhasil dihapus"
        })
      } else {
        throw new Error(response.error || 'Gagal menghapus kas besar')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    } finally {
      setDeleting(null)
    }
  }, [toast])

  // Search and filter
  const search = useCallback((searchTerm: string) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, search: searchTerm, page: 1 }
      // Use setTimeout to avoid immediate re-render during state update
      setTimeout(() => fetchExpenses(newFilters), 0)
      return newFilters
    })
  }, [])

  const filterByStatus = useCallback((status: string) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, status, page: 1 }
      // Use setTimeout to avoid immediate re-render during state update
      setTimeout(() => fetchExpenses(newFilters), 0)
      return newFilters
    })
  }, [])

  const changePage = useCallback((page: number) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, page }
      // Use setTimeout to avoid immediate re-render during state update  
      setTimeout(() => fetchExpenses(newFilters), 0)
      return newFilters
    })
  }, [])

  // Get expense by ID from local state
  const getExpenseById = useCallback((id: string) => {
    return expenses.find(exp => exp.id === id)
  }, [expenses])

  // Get recent transaction types for quick actions
  const getRecentTransactionTypes = useCallback(() => {
    return expenses
      .slice(-5)
      .map(exp => exp.tipeAktivitas)
      .filter((type, index, arr) => arr.indexOf(type) === index)
  }, [expenses])

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchExpenses()
    }
  }, []) // Only run on mount

  return {
    // Data
    expenses,
    pagination,
    filters,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    error,
    
    // Actions
    fetchExpenses,
    createExpense,
    updateExpense,
    updateStatus,
    deleteExpense,
    
    // Helpers
    search,
    filterByStatus,
    changePage,
    getExpenseById,
    getRecentTransactionTypes,
    
    // Manual filter update
    setFilters: (newFilters: typeof filters) => {
      setFilters(newFilters)
      fetchExpenses(newFilters)
    }
  }
}
