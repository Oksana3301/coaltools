"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import { PayrollCalculator } from "@/components/coal-tools/payroll-calculator"

export default function KalkulatorGajiPage() {
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
              Kalkulator Gaji
            </h1>
          </div>
          <p className="text-lg font-medium text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Kalkulator gaji karyawan dengan komponen dinamis dan slip gaji otomatis.
          </p>
        </div>

        {/* Main Content */}
        <Card className="border-2 border-purple-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
            <CardTitle className="text-2xl text-purple-800 flex items-center gap-3">
              <Users className="h-6 w-6" />
              Sistem Kalkulator Gaji
            </CardTitle>
            <CardDescription className="text-base font-medium">
              Perhitungan gaji karyawan dengan komponen dinamis dan slip gaji otomatis
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <PayrollCalculator />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
