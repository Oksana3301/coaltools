import { useState, useEffect } from 'react'
import { apiService, KasKecilExpense } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export const useKasKecil = () => {
  const [expenses, setExpenses] = useState<KasKecilExpense[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const { toast } = useToast()

  // Load expenses
  const loadExpenses = async (params?: {
    page?: number
    limit?: number
    status?: string
    includeDeleted?: boolean
  }) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiService.getKasKecil({
        page: params?.page || 1,
        limit: params?.limit || 20,
        status: params?.status as any,
        includeDeleted: params?.includeDeleted
      })
      
      if (response.success && response.data) {
        setExpenses(response.data)
        if (response.pagination) {
          setPagination(response.pagination)
        }
      } else {
        setError(response.error || 'Failed to load expenses')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load expenses'
      setError(errorMessage)
      console.error('Error loading expenses:', err)
      
      // Show toast for database connection errors
      if (errorMessage.includes('Database connection failed')) {
        toast({
          title: "Database Error",
          description: "Unable to connect to the database. Please check your internet connection.",
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Create expense
  const createExpense = async (data: Omit<KasKecilExpense, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'creator'>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiService.createKasKecil(data)
      
      if (response.success && response.data) {
        setExpenses(prev => [response.data!, ...prev])
        toast({
          title: "Berhasil",
          description: "Data pengeluaran berhasil ditambahkan"
        })
        return response.data
      } else {
        setError(response.error || 'Failed to create expense')
        toast({
          title: "Error",
          description: response.error || 'Failed to create expense',
          variant: "destructive"
        })
        return null
      }
    } catch (err) {
      setError('Failed to create expense')
      toast({
        title: "Error",
        description: 'Failed to create expense',
        variant: "destructive"
      })
      console.error('Error creating expense:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Update expense
  const updateExpense = async (data: Partial<KasKecilExpense> & { id: string }) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiService.updateKasKecil(data)
      
      if (response.success && response.data) {
        setExpenses(prev => prev.map(exp => 
          exp.id === data.id ? response.data! : exp
        ))
        toast({
          title: "Berhasil",
          description: "Data pengeluaran berhasil diperbarui"
        })
        return response.data
      } else {
        setError(response.error || 'Failed to update expense')
        toast({
          title: "Error",
          description: response.error || 'Failed to update expense',
          variant: "destructive"
        })
        return null
      }
    } catch (err) {
      setError('Failed to update expense')
      toast({
        title: "Error",
        description: 'Failed to update expense',
        variant: "destructive"
      })
      console.error('Error updating expense:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Soft delete expense
  const softDeleteExpense = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiService.softDeleteKasKecil(id)
      
      if (response.success) {
        setExpenses(prev => prev.filter(exp => exp.id !== id))
        toast({
          title: "Berhasil",
          description: "Data pengeluaran berhasil dihapus (soft delete)"
        })
        return true
      } else {
        setError(response.error || 'Failed to delete expense')
        toast({
          title: "Error",
          description: response.error || 'Failed to delete expense',
          variant: "destructive"
        })
        return false
      }
    } catch (err) {
      setError('Failed to delete expense')
      toast({
        title: "Error",
        description: 'Failed to delete expense',
        variant: "destructive"
      })
      console.error('Error deleting expense:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Hard delete expense
  const hardDeleteExpense = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiService.hardDeleteKasKecil(id)
      
      if (response.success) {
        setExpenses(prev => prev.filter(exp => exp.id !== id))
        toast({
          title: "Berhasil",
          description: "Data pengeluaran berhasil dihapus permanen"
        })
        return true
      } else {
        setError(response.error || 'Failed to delete expense')
        toast({
          title: "Error",
          description: response.error || 'Failed to delete expense',
          variant: "destructive"
        })
        return false
      }
    } catch (err) {
      setError('Failed to delete expense')
      toast({
        title: "Error",
        description: 'Failed to delete expense',
        variant: "destructive"
      })
      console.error('Error deleting expense:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Restore expense
  const restoreExpense = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiService.restoreKasKecil(id)
      
      if (response.success && response.data) {
        setExpenses(prev => [response.data!, ...prev])
        toast({
          title: "Berhasil",
          description: "Data pengeluaran berhasil dipulihkan"
        })
        return response.data
      } else {
        setError(response.error || 'Failed to restore expense')
        toast({
          title: "Error",
          description: response.error || 'Failed to restore expense',
          variant: "destructive"
        })
        return null
      }
    } catch (err) {
      setError('Failed to restore expense')
      toast({
        title: "Error",
        description: 'Failed to restore expense',
        variant: "destructive"
      })
      console.error('Error restoring expense:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Update expense status
  const updateExpenseStatus = async (id: string, status: KasKecilExpense['status']) => {
    return updateExpense({ id, status })
  }

  return {
    expenses,
    loading,
    error,
    pagination,
    loadExpenses,
    createExpense,
    updateExpense,
    softDeleteExpense,
    hardDeleteExpense,
    restoreExpense,
    updateExpenseStatus
  }
}
