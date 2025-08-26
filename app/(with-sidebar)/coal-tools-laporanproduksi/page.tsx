"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { ProductionReport } from "@/components/coal-tools/production-report"

export default function LaporanProduksiPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Laporan Produksi
            </h1>
          </div>
          <p className="text-lg font-medium text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Tracking produksi batu bara dengan import/export Excel dan laporan terintegrasi.
          </p>
        </div>

        {/* Main Content */}
        <Card className="border-2 border-orange-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
            <CardTitle className="text-2xl text-orange-800 flex items-center gap-3">
              <TrendingUp className="h-6 w-6" />
              Sistem Laporan Produksi
            </CardTitle>
            <CardDescription className="text-base font-medium">
              Tracking dan pelaporan produksi batu bara dengan import/export Excel
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ProductionReport />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
