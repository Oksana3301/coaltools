"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, BarChart3, FileSpreadsheet, Upload, Download, PlusCircle, Filter, Search, Calendar } from "lucide-react"
import { ProductionReport } from "@/components/coal-tools/production-report"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function LaporanProduksiPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Laporan Produksi Batubara
            </h1>
          </div>
          <p className="text-lg font-medium text-gray-700 max-w-4xl mx-auto leading-relaxed">
            Sistem tracking dan pelaporan produksi batubara terintegrasi dengan import/export Excel, 
            analisis performa harian, dan dashboard real-time untuk monitoring operasional tambang.
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-orange-200 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-orange-600">2,450</div>
              <div className="text-sm text-gray-600">Total Produksi (Ton)</div>
              <Badge variant="outline" className="mt-1 text-xs">Bulan Ini</Badge>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">+15.2%</div>
              <div className="text-sm text-gray-600">Peningkatan</div>
              <Badge variant="outline" className="mt-1 text-xs">vs Bulan Lalu</Badge>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">24</div>
              <div className="text-sm text-gray-600">Laporan Harian</div>
              <Badge variant="outline" className="mt-1 text-xs">Aktif</Badge>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">98.5%</div>
              <div className="text-sm text-gray-600">Kepatuhan Laporan</div>
              <Badge variant="outline" className="mt-1 text-xs">Target: 95%</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg">
            <PlusCircle className="h-4 w-4 mr-2" />
            Tambah Laporan Baru
          </Button>
          <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
            <Upload className="h-4 w-4 mr-2" />
            Import dari Excel
          </Button>
          <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
            <Download className="h-4 w-4 mr-2" />
            Export ke Excel
          </Button>
          <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
            <Filter className="h-4 w-4 mr-2" />
            Filter Data
          </Button>
          <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
            <Search className="h-4 w-4 mr-2" />
            Cari Laporan
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
              <CardTitle className="text-orange-800 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Dashboard Produksi
              </CardTitle>
              <CardDescription>
                Monitoring real-time produksi harian dengan analisis tren dan performa
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Grafik produksi harian dan bulanan
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Target vs realisasi produksi
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Analisis efisiensi operasional
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Alert otomatis untuk anomali
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-green-800 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Manajemen Data
              </CardTitle>
              <CardDescription>
                Import/export Excel dan validasi data otomatis untuk akurasi laporan
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Import batch dari file Excel
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Validasi data dan error checking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Template standar industri
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Backup otomatis dan versioning
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analisis & Laporan
              </CardTitle>
              <CardDescription>
                Generate laporan otomatis dan analisis mendalam untuk pengambilan keputusan
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Laporan otomatis harian/mingguan
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Analisis tren dan prediksi
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  KPI dashboard dan metrics
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Export ke berbagai format
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Main Production Report Component */}
        <Card className="border-2 border-orange-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
            <CardTitle className="text-2xl text-orange-800 flex items-center gap-3">
              <TrendingUp className="h-6 w-6" />
              Sistem Laporan Produksi Terintegrasi
            </CardTitle>
            <CardDescription className="text-base font-medium">
              Platform lengkap untuk tracking produksi batubara dengan import/export Excel dan analisis real-time
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ProductionReport />
          </CardContent>
        </Card>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">🚀 Fitur Unggulan</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                  <div>
                    <strong>Import Excel Massal:</strong> Upload ribuan data sekaligus dengan validasi otomatis
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                  <div>
                    <strong>Dashboard Real-time:</strong> Monitor produksi dan performa secara langsung
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                  <div>
                    <strong>Analisis Mendalam:</strong> Tren produksi, efisiensi, dan prediksi berbasis AI
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2"></span>
                  <div>
                    <strong>Otomasi Laporan:</strong> Generate laporan harian/mingguan secara otomatis
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">📊 Manfaat Bisnis</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                  <div>
                    <strong>Efisiensi +40%:</strong> Otomasi proses input dan validasi data produksi
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full mt-2"></span>
                  <div>
                    <strong>Akurasi Data 99%:</strong> Validasi real-time dan error detection otomatis
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></span>
                  <div>
                    <strong>Compliance Ready:</strong> Memenuhi standar pelaporan industri tambang
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mt-2"></span>
                  <div>
                    <strong>Cost Saving:</strong> Mengurangi biaya administrasi hingga 60%
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}