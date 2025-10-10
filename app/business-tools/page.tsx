"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Receipt, 
  FileText, 
  Users, 
  Building2,
  Download,
  Calculator,
  Star,
  ArrowRight,
  ExternalLink,
  Shield,
  Database
} from "lucide-react"

export default function BusinessToolsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Calculator className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Business Tools
            </h1>
          </div>
          <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Kumpulan alat bisnis profesional untuk mengelola dokumentasi, invoice, dan kwitansi dengan mudah dan efisien.
          </p>
        </div>

        {/* Main Tools Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Kwitansi Generator Card */}
          <Card className="border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Receipt className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl text-blue-800">Generator Kwitansi</CardTitle>
                  <CardDescription className="text-lg text-blue-600">
                    Aplikasi pembuat kwitansi Indonesia
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <p className="text-gray-700 text-lg">
                Buat kwitansi profesional dalam format PDF dengan perhitungan otomatis terbilang dalam bahasa Indonesia, 
                logo perusahaan, dan desain yang rapi.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Receipt className="h-4 w-4" />
                  <span>Format Kwitansi Indonesia</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Calculator className="h-4 w-4" />
                  <span>Konversi Angka ke Huruf</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Download className="h-4 w-4" />
                  <span>Export PDF Professional</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Building2 className="h-4 w-4" />
                  <span>Logo Perusahaan</span>
                </div>
              </div>

              <div className="pt-4">
                <Button asChild size="lg" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 group">
                  <Link href="/" className="flex items-center justify-center gap-2">
                    Buka Generator Kwitansi
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Overview Card */}
          <Card className="border-2 border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl text-green-800">Invoice Generator</CardTitle>
                  <CardDescription className="text-lg text-green-600">
                    Sistem manajemen invoice lengkap
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <p className="text-gray-700 text-lg">
                Dokumentasi lengkap sistem Invoice Generator untuk mengelola pelanggan, vendor, dan membuat invoice 
                profesional dengan integrasi PDF dan database.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Users className="h-4 w-4" />
                  <span>Manajemen Pelanggan</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Building2 className="h-4 w-4" />
                  <span>Manajemen Vendor</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Calculator className="h-4 w-4" />
                  <span>Perhitungan Otomatis</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Database className="h-4 w-4" />
                  <span>Database Integration</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button asChild size="lg" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 group">
                  <a href="/invoice-overview" className="flex items-center justify-center gap-2">
                    Lihat Overview & Dokumentasi
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </Button>
                
                <Button asChild variant="outline" size="lg" className="w-full border-green-200 hover:bg-green-50 group">
                  <a href="https://p9hwiqcnzx8d.manus.space" target="_blank" className="flex items-center justify-center gap-2">
                    Akses Aplikasi Live
                    <ExternalLink className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Coal Tools Card */}
          <Card className="border-2 border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 pb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl text-orange-800">Coal Tools</CardTitle>
                  <CardDescription className="text-lg text-orange-600">
                    Sistem manajemen batu bara
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <p className="text-gray-700 text-lg">
                Platform terintegrasi untuk mengelola kas kecil, penggajian karyawan, dan pelaporan produksi batu bara 
                dengan fitur import/export Excel dan workflow approval.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <Calculator className="h-4 w-4" />
                  <span>Kas Kecil & Gaji</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <FileText className="h-4 w-4" />
                  <span>Laporan Produksi</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <Download className="h-4 w-4" />
                  <span>Import/Export Excel</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <Shield className="h-4 w-4" />
                  <span>Workflow Approval</span>
                </div>
              </div>

              <div className="pt-4">
                <Button asChild size="lg" className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 group">
                  <a href="/coal-tools" className="flex items-center justify-center gap-2">
                    Buka Coal Tools
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Features Overview */}
        <Card className="border-2 border-purple-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
            <CardTitle className="text-3xl text-purple-800 flex items-center gap-3">
              <Star className="h-8 w-8" />
              Mengapa Pilih Business Tools Kami?
            </CardTitle>
            <CardDescription className="text-lg">
              Solusi terpadu untuk kebutuhan administrasi dan dokumentasi bisnis Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="text-center space-y-4 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <Shield className="h-12 w-12 text-blue-600 mx-auto" />
                <h3 className="text-xl font-semibold text-blue-800">Keamanan & Privacy</h3>
                <p className="text-blue-600 text-sm">Data Anda tersimpan aman dengan enkripsi dan backup otomatis</p>
              </div>

              <div className="text-center space-y-4 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <Download className="h-12 w-12 text-green-600 mx-auto" />
                <h3 className="text-xl font-semibold text-green-800">Export PDF Professional</h3>
                <p className="text-green-600 text-sm">Generate dokumen PDF berkualitas tinggi siap cetak dan email</p>
              </div>

              <div className="text-center space-y-4 p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                <Calculator className="h-12 w-12 text-purple-600 mx-auto" />
                <h3 className="text-xl font-semibold text-purple-800">Perhitungan Otomatis</h3>
                <p className="text-purple-600 text-sm">Sistem kalkulasi otomatis dengan validasi dan konversi terbilang</p>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Quick Access Navigation */}
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
            <CardTitle className="text-2xl text-gray-800 flex items-center gap-3">
              <ArrowRight className="h-6 w-6" />
              Akses Cepat
            </CardTitle>
            <CardDescription className="text-lg">
              Navigasi cepat ke semua fitur dan halaman
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <Button asChild variant="outline" size="lg" className="h-16 flex-col gap-2 hover:bg-blue-50 hover:border-blue-200">
                <Link href="/">
                  <Receipt className="h-6 w-6" />
                  <span>Kwitansi Generator</span>
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="h-16 flex-col gap-2 hover:bg-green-50 hover:border-green-200">
                <a href="/invoice-overview">
                  <FileText className="h-6 w-6" />
                  <span>Invoice Overview</span>
                </a>
              </Button>

              <Button asChild variant="outline" size="lg" className="h-16 flex-col gap-2 hover:bg-orange-50 hover:border-orange-200">
                <a href="/coal-tools">
                  <Building2 className="h-6 w-6" />
                  <span>Coal Tools</span>
                </a>
              </Button>

              <Button asChild variant="outline" size="lg" className="h-16 flex-col gap-2 hover:bg-purple-50 hover:border-purple-200">
                <a href="/auth">
                  <Users className="h-6 w-6" />
                  <span>Login</span>
                </a>
              </Button>

            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
