import { Metadata } from 'next'
import { IntegratedPayrollSystem } from '@/components/payroll/IntegratedPayrollSystem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calculator, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sistem Payroll Terintegrasi - CoalTools',
  description: 'Sistem payroll lengkap dengan kalkulator gaji dan generator slip gaji dalam satu workflow yang mulus'
}

/**
 * Halaman utama untuk Sistem Payroll Terintegrasi
 * Menggabungkan PayrollCalculator dan PayrollGenerator dalam satu interface
 */
export default function IntegratedPayrollPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              Sistem Payroll Terintegrasi
            </h1>
          </div>
          <p className="text-lg font-medium text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Solusi lengkap untuk perhitungan gaji karyawan dengan workflow yang mulus dari kalkulator hingga generate PDF.
          </p>
        </div>

        {/* Main Content */}
        <Card className="border-2 border-purple-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
            <CardTitle className="text-2xl text-purple-800 flex items-center gap-3">
              <Users className="h-6 w-6" />
              Sistem Payroll Terintegrasi
            </CardTitle>
            <CardDescription className="text-base font-medium">
              Solusi lengkap untuk perhitungan gaji karyawan dengan workflow yang mulus dari kalkulator hingga generate PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <IntegratedPayrollSystem />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}