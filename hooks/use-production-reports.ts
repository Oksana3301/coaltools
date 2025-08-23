import { useState, useEffect } from 'react'
import { apiService } from '@/lib/api'
import { ProductionReport, Buyer } from '@/lib/api'

export function useProductionReports() {
  const [productionReports, setProductionReports] = useState<ProductionReport[]>([])
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load production reports
  const loadProductionReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiService.getProductionReports()
      if (response.success) {
        setProductionReports(response.data || [])
      } else {
        setError(response.error || 'Failed to load production reports')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load production reports')
    } finally {
      setLoading(false)
    }
  }

  // Load buyers
  const loadBuyers = async () => {
    try {
      const response = await apiService.getBuyers()
      if (response.success) {
        setBuyers(response.data || [])
      }
    } catch (err: any) {
      console.error('Failed to load buyers:', err)
    }
  }

  // Create production report
  const createProductionReport = async (data: Omit<ProductionReport, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'creator' | 'approver' | 'buyer'>) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiService.createProductionReport(data)
      if (response.success) {
        await loadProductionReports() // Reload the list
        return { success: true, data: response.data }
      } else {
        setError(response.error || 'Failed to create production report')
        return { success: false, error: response.error }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create production report')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Update production report
  const updateProductionReport = async (data: Partial<ProductionReport> & { id: string }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiService.updateProductionReport(data)
      if (response.success) {
        await loadProductionReports() // Reload the list
        return { success: true, data: response.data }
      } else {
        setError(response.error || 'Failed to update production report')
        return { success: false, error: response.error }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update production report')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Delete production report
  const deleteProductionReport = async (id: string, hardDelete: boolean = false) => {
    setLoading(true)
    setError(null)
    try {
      const response = hardDelete 
        ? await apiService.hardDeleteProductionReport(id)
        : await apiService.softDeleteProductionReport(id)
      
      if (response.success) {
        await loadProductionReports() // Reload the list
        return { success: true }
      } else {
        setError(response.error || 'Failed to delete production report')
        return { success: false, error: response.error }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete production report')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Update production report status
  const updateProductionReportStatus = async (
    id: string, 
    status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'ARCHIVED',
    approvedBy?: string,
    notes?: string
  ) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiService.updateProductionReportStatus(id, status, approvedBy, notes)
      if (response.success) {
        await loadProductionReports() // Reload the list
        return { success: true, data: response.data }
      } else {
        setError(response.error || 'Failed to update production report status')
        return { success: false, error: response.error }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update production report status')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Create buyer
  const createBuyer = async (data: Omit<Buyer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await apiService.createBuyer(data)
      if (response.success) {
        await loadBuyers() // Reload the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  // Update buyer
  const updateBuyer = async (data: Partial<Buyer> & { id: string }) => {
    try {
      const response = await apiService.updateBuyer(data)
      if (response.success) {
        await loadBuyers() // Reload the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  // Delete buyer
  const deleteBuyer = async (id: string, hardDelete: boolean = false) => {
    try {
      const response = await apiService.deleteBuyer(id, hardDelete)
      if (response.success) {
        await loadBuyers() // Reload the list
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  // Load data on mount
  useEffect(() => {
    loadProductionReports()
    loadBuyers()
  }, [])

  return {
    productionReports,
    buyers,
    loading,
    error,
    loadProductionReports,
    loadBuyers,
    createProductionReport,
    updateProductionReport,
    deleteProductionReport,
    updateProductionReportStatus,
    createBuyer,
    updateBuyer,
    deleteBuyer
  }
}
