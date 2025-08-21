"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Users, 
  Building2, 
  Receipt, 
  Download, 
  CheckCircle, 
  Clock, 
  Star,
  Globe,
  Shield,
  Zap,
  Database,
  Calculator,
  Settings,
  TrendingUp,
  ExternalLink,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Target,
  Layers,
  BarChart3,
  Eye
} from "lucide-react"

export default function InvoiceGeneratorOverview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Receipt className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Generator Invoice
            </h1>
          </div>
          <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Aplikasi web lengkap untuk mengelola pelanggan, vendor, dan membuat invoice profesional dengan integrasi PDF. 
            Solusi end-to-end untuk kebutuhan invoicing bisnis Anda.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <a href="https://p9hwiqcnzx8d.manus.space" target="_blank" className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Akses Aplikasi
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <div className="text-lg px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium">
              Versi 1.0
            </div>
          </div>
        </div>

        {/* Invoice Preview Section */}
        <Card className="border-2 border-orange-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="text-3xl text-orange-800 flex items-center gap-3">
              <Eye className="h-8 w-8" />
              Contoh Hasil Invoice
            </CardTitle>
            <CardDescription className="text-lg">
              Tampilan invoice profesional yang dihasilkan oleh sistem
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            {/* Invoice Preview */}
            <div className="bg-white rounded-lg border-2 border-gray-200 shadow-lg p-8 max-w-4xl mx-auto">
              {/* Invoice Header */}
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">kledo</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">kledo</h2>
                    <p className="text-gray-600">PT Kledo Berhati Nyaman</p>
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">INVOICE</h1>
                  <div className="bg-gray-50 p-4 rounded border">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="font-medium">Invoice</span>
                      <span>INV/00010</span>
                      <span className="font-medium">Tanggal</span>
                      <span>14/08/2020</span>
                      <span className="font-medium">Tgl. Jatuh Tempo</span>
                      <span>13/09/2020</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Table */}
              <div className="mb-8">
                <div className="bg-orange-400 text-white rounded-t-lg">
                  <div className="grid grid-cols-7 gap-4 p-4 font-medium">
                    <div className="col-span-2">Deskripsi</div>
                    <div className="text-center">Kuantitas</div>
                    <div className="text-center">Harga</div>
                    <div className="text-center">Diskon</div>
                    <div className="text-center">Pajak</div>
                    <div className="text-center">Jumlah</div>
                  </div>
                </div>
                
                <div className="border-l border-r border-gray-300">
                  {/* Item 1 */}
                  <div className="grid grid-cols-7 gap-4 p-4 border-b border-gray-200">
                    <div className="col-span-2">
                      <div className="font-medium">Kneel High Boots</div>
                      <div className="text-sm text-gray-600">Ukuran XL</div>
                    </div>
                    <div className="text-center">2</div>
                    <div className="text-center">499.000,00</div>
                    <div className="text-center">10%</div>
                    <div className="text-center">PPN 10%</div>
                    <div className="text-center font-medium">898.200,00</div>
                  </div>
                  
                  {/* Item 2 */}
                  <div className="grid grid-cols-7 gap-4 p-4 border-b border-gray-200">
                    <div className="col-span-2">
                      <div className="font-medium">Moslem Brown Dress</div>
                      <div className="text-sm text-gray-600">Ukuran XXS</div>
                    </div>
                    <div className="text-center">1</div>
                    <div className="text-center">199.000,00</div>
                    <div className="text-center">5%</div>
                    <div className="text-center">PPN 10%</div>
                    <div className="text-center font-medium">189.050,00</div>
                  </div>
                  
                  {/* Item 3 */}
                  <div className="grid grid-cols-7 gap-4 p-4 border-b border-gray-200">
                    <div className="col-span-2">
                      <div className="font-medium">Moslem Purple Shirt</div>
                      <div className="text-sm text-gray-600">Ukuran S</div>
                    </div>
                    <div className="text-center">1</div>
                    <div className="text-center">199.000,00</div>
                    <div className="text-center">0%</div>
                    <div className="text-center">PPN 10%</div>
                    <div className="text-center font-medium">199.000,00</div>
                  </div>
                </div>
              </div>

              {/* Invoice Footer */}
              <div className="grid grid-cols-2 gap-8">
                {/* Left side - Billing Info */}
                <div>
                  <h3 className="text-lg font-bold text-orange-600 mb-3">Tagihan Kepada</h3>
                  <div className="space-y-1 text-gray-700">
                    <p className="font-medium">Cornelia Nurdiyanti Santoso</p>
                    <p>Dk. Abdul. Muis No. 714, Tanjung Pinang 96825, PapBar</p>
                    <p>Telp: 62434366878</p>
                    <p>Email: waskita.cinta@yahoo.com</p>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-orange-600 mb-3">Pesan</h3>
                    <div className="space-y-1 text-gray-700">
                      <p>Silahkan transfer ke rekening:</p>
                      <p>XXXXXXX BCA a/n PT. ABC</p>
                    </div>
                  </div>
                </div>

                {/* Right side - Totals */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp 1.269.090,91</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Diskon</span>
                    <span>(Rp 99.772,73)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pajak</span>
                    <span>Rp 116.931,82</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pembayaran Diterima</span>
                    <span>Rp 500.000,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sisa Tagihan</span>
                    <span>Rp 786.250,00</span>
                  </div>
                  <div className="bg-orange-400 text-white p-3 rounded font-bold text-lg">
                    <div className="flex justify-between">
                      <span>Total</span>
                      <span>Rp 1.286.250,00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Features Overview */}
        <Card className="border-2 border-blue-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-3xl text-blue-800 flex items-center gap-3">
              <Star className="h-8 w-8" />
              Fitur Utama
            </CardTitle>
            <CardDescription className="text-lg">
              Kelola bisnis invoicing Anda dengan fitur-fitur yang komprehensif dan mudah digunakan
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center space-y-4 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                <Users className="h-12 w-12 text-green-600 mx-auto" />
                <h3 className="text-xl font-semibold text-green-800">Manajemen Pelanggan</h3>
                <p className="text-green-600">Kelola data pelanggan lengkap dengan informasi kontak</p>
              </div>
              <div className="text-center space-y-4 p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border-2 border-orange-200">
                <Building2 className="h-12 w-12 text-orange-600 mx-auto" />
                <h3 className="text-xl font-semibold text-orange-800">Manajemen Vendor</h3>
                <p className="text-orange-600">Database vendor untuk keperluan invoice bisnis</p>
              </div>
              <div className="text-center space-y-4 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
                <FileText className="h-12 w-12 text-blue-600 mx-auto" />
                <h3 className="text-xl font-semibold text-blue-800">Pembuatan Invoice</h3>
                <p className="text-blue-600">Buat invoice profesional dengan perhitungan otomatis</p>
              </div>
              <div className="text-center space-y-4 p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border-2 border-purple-200">
                <Download className="h-12 w-12 text-purple-600 mx-auto" />
                <h3 className="text-xl font-semibold text-purple-800">Generate PDF</h3>
                <p className="text-purple-600">Export invoice ke PDF dengan layout profesional</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Customer Management */}
          <Card className="border-2 border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-2xl text-green-800 flex items-center gap-3">
                <Users className="h-6 w-6" />
                Manajemen Pelanggan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">Tambah Pelanggan Baru</p>
                    <p className="text-sm text-muted-foreground">Input data lengkap: nama, email, telepon, contact person, dan alamat</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">Daftar Pelanggan</p>
                    <p className="text-sm text-muted-foreground">Tabel lengkap dengan semua informasi kontak pelanggan</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-semibold">Edit & Hapus</p>
                    <p className="text-sm text-muted-foreground">Fitur edit dan hapus data pelanggan (segera tersedia)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Management */}
          <Card className="border-2 border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
              <CardTitle className="text-2xl text-orange-800 flex items-center gap-3">
                <Building2 className="h-6 w-6" />
                Manajemen Vendor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">Tambah Vendor Baru</p>
                    <p className="text-sm text-muted-foreground">Input data lengkap vendor untuk keperluan invoice</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">Daftar Vendor</p>
                    <p className="text-sm text-muted-foreground">Tabel menampilkan semua vendor terdaftar</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-semibold">Edit & Hapus</p>
                    <p className="text-sm text-muted-foreground">Kelola data vendor yang sudah ada (segera tersedia)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Call to Action */}
        <div className="text-center space-y-6 pt-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-xl shadow-xl">
            <h2 className="text-3xl font-bold mb-4">Siap Mulai Menggunakan Generator Invoice?</h2>
            <p className="text-xl mb-6 opacity-90">
              Mulai kelola invoicing bisnis Anda dengan aplikasi yang profesional dan mudah digunakan
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                <a href="/invoice-overview/create" className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Buat Invoice Baru
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                <a href="https://p9hwiqcnzx8d.manus.space" target="_blank" className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Akses Aplikasi Live
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <div className="bg-white/20 text-white border-white/30 border rounded-lg px-4 py-2">
                Sistem Manajemen Invoice Profesional v1.0
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
