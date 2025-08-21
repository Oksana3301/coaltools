"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Calculator, 
  Truck,
  Coins,
  Users,
  TrendingUp,
  DollarSign
} from "lucide-react"
import { ExpenseManagement } from "@/components/coal-tools/expense-management"
import { KasBesarManagement } from "@/components/coal-tools/kas-besar-management"
import { PayrollCalculator } from "@/components/coal-tools/payroll-calculator"
import { ProductionReport } from "@/components/coal-tools/production-report"

export default function CoalToolsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
              <Truck className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Coal Tools
            </h1>
          </div>
          <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Sistem manajemen terintegrasi untuk pengelolaan kas kecil, kalkulator gaji karyawan, dan pelaporan produksi batu bara.
          </p>
        </div>

        {/* Main Content */}
        <Card className="border-2 border-orange-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
            <CardTitle className="text-3xl text-orange-800 flex items-center gap-3">
              <Calculator className="h-8 w-8" />
              Sistem Manajemen Coal Tools
            </CardTitle>
            <CardDescription className="text-lg">
              Kelola kas kecil, gaji karyawan, dan produksi batu bara dalam satu platform
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <Tabs defaultValue="expense-management" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="expense-management" className="flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Kas Kecil
                </TabsTrigger>
                <TabsTrigger value="kas-besar" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Kas Besar
                </TabsTrigger>
                <TabsTrigger value="payroll-calculator" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Kalkulator Gaji
                </TabsTrigger>
                <TabsTrigger value="production-report" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Laporan Produksi
                </TabsTrigger>
              </TabsList>

              <TabsContent value="expense-management" className="mt-8">
                <ExpenseManagement />
              </TabsContent>

              <TabsContent value="kas-besar" className="mt-8">
                <KasBesarManagement />
              </TabsContent>

              <TabsContent value="payroll-calculator" className="mt-8">
                <PayrollCalculator />
              </TabsContent>

              <TabsContent value="production-report" className="mt-8">
                <ProductionReport />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Coins className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-blue-800">Kas Kecil</CardTitle>
                  <CardDescription>Input & validasi pengeluaran</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Validasi Jenis & Sub Jenis</li>
                <li>• Perhitungan total otomatis</li>
                <li>• Upload bukti transaksi</li>
                <li>• Workflow approval</li>
                <li>• Audit trail lengkap</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-red-800">Kas Besar</CardTitle>
                  <CardDescription>Pengeluaran besar & kontrak</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Kontrak & sewa alat berat</li>
                <li>• Validasi dokumen wajib</li>
                <li>• Approval berlapis</li>
                <li>• Upload kontrak bertanda tangan</li>
                <li>• Audit trail ketat</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-green-800">Gaji Karyawan</CardTitle>
                  <CardDescription>Kalkulator & komponen gaji</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Upah harian berbasis kontrak</li>
                <li>• Komponen gaji dinamis</li>
                <li>• Perhitungan pajak otomatis</li>
                <li>• Export slip gaji PDF</li>
                <li>• Integrasi kas kecil</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-purple-800">Produksi Batu Bara</CardTitle>
                  <CardDescription>Import/Export Excel</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Transaksi timbangan harian</li>
                <li>• Import dari Excel/CSV</li>
                <li>• Rekap periode otomatis</li>
                <li>• Export laporan PDF</li>
                <li>• Dashboard produksi</li>
              </ul>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
