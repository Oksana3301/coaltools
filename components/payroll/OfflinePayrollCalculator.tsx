'use client'

import React, { useState, useEffect } from 'react'
import { PayrollCalculator } from '@/components/coal-tools/payroll-calculator'
import { generateSamplePayrollData } from '@/lib/sample-payroll-data'

// Mock data untuk testing offline
const MOCK_EMPLOYEES = [
  {
    id: 'emp-001',
    nama: 'Ahmad Wijaya',
    posisi: 'Supervisor',
    kontrakUpahHarian: 150000,
    aktif: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'emp-002', 
    nama: 'Siti Nurhaliza',
    posisi: 'Staff Administrasi',
    kontrakUpahHarian: 120000,
    aktif: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

const MOCK_PAY_COMPONENTS = [
  {
    id: 'comp-001',
    nama: 'Uang Makan Harian',
    tipe: 'earning',
    amount: 25000,
    taxable: false,
    order: 1,
    aktif: true
  },
  {
    id: 'comp-002',
    nama: 'Uang BBM Harian', 
    tipe: 'earning',
    amount: 15000,
    taxable: false,
    order: 2,
    aktif: true
  },
  {
    id: 'comp-003',
    nama: 'Tunjangan Kehadiran',
    tipe: 'earning',
    amount: 50000,
    taxable: true,
    order: 3,
    aktif: true
  },
  {
    id: 'comp-004',
    nama: 'Potongan BPJS',
    tipe: 'deduction',
    amount: 25000,
    taxable: false,
    order: 101,
    aktif: true
  }
]

// Mock API service untuk testing offline
const mockApiService = {
  getEmployees: async () => {
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API delay
    return {
      success: true,
      data: MOCK_EMPLOYEES
    }
  },
  
  getPayComponents: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      success: true,
      data: MOCK_PAY_COMPONENTS
    }
  },
  
  getPayrollRuns: async () => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      success: true,
      data: []
    }
  },
  
  savePayrollRun: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      success: true,
      data: {
        id: `payroll-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString()
      }
    }
  }
}

// Mock getCurrentUserId function
const mockGetCurrentUserId = () => 'user-test-001'

interface OfflinePayrollCalculatorProps {
  onDataCalculated?: (data: any) => void
}

/**
 * Wrapper component untuk PayrollCalculator yang bekerja offline
 * dengan data mock untuk testing dan development
 */
export function OfflinePayrollCalculator({ onDataCalculated }: OfflinePayrollCalculatorProps) {
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    // Override global API service dan utility functions untuk testing
    if (typeof window !== 'undefined') {
      // @ts-ignore - Override untuk testing
      window.apiService = mockApiService
      // @ts-ignore - Override untuk testing  
      window.getCurrentUserId = mockGetCurrentUserId
      
      // Override global objects yang mungkin digunakan komponen
       const originalFetch = window.fetch
       window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
         const urlString = input.toString()
         
         // Intercept API calls dan return mock data
         if (urlString.includes('/api/employees')) {
           return new Response(JSON.stringify({
             success: true,
             data: MOCK_EMPLOYEES
           }), {
             status: 200,
             headers: { 'Content-Type': 'application/json' }
           })
         }
         
         if (urlString.includes('/api/pay-components')) {
           return new Response(JSON.stringify({
             success: true,
             data: MOCK_PAY_COMPONENTS
           }), {
             status: 200,
             headers: { 'Content-Type': 'application/json' }
           })
         }
         
         if (urlString.includes('/api/payroll')) {
           return new Response(JSON.stringify({
             success: true,
             data: []
           }), {
             status: 200,
             headers: { 'Content-Type': 'application/json' }
           })
         }
         
         // Fallback ke fetch asli untuk request lainnya
         return originalFetch(input, init)
       }
    }
    
    setIsReady(true)
    
    // Cleanup function
    return () => {
      if (typeof window !== 'undefined') {
        // Restore original fetch jika diperlukan
        // window.fetch = originalFetch
      }
    }
  }, [])
  
  if (!isReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Memuat kalkulator payroll...</span>
      </div>
    )
  }
  
  return (
    <div className="w-full">
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span className="text-sm text-yellow-800 font-medium">
            Mode Testing Offline
          </span>
        </div>
        <p className="text-xs text-yellow-700 mt-1">
          Menggunakan data sample untuk testing. Data tidak akan tersimpan ke database.
        </p>
      </div>
      
      <PayrollCalculator />
    </div>
  )
}

export default OfflinePayrollCalculator