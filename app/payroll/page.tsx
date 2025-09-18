import { Metadata } from 'next'
import { PayrollGenerator } from '@/components/payroll/PayrollGenerator'

export const metadata: Metadata = {
  title: 'Payroll Generator - CoalTools',
  description: 'Generate slip gaji dan kwitansi untuk karyawan dengan mudah dan cepat'
}

/**
 * Halaman utama untuk Payroll Generator
 * Mengintegrasikan semua komponen payroll dalam satu interface
 */
export default function PayrollPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <PayrollGenerator />
    </div>
  )
}