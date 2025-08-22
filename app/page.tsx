"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Receipt, 
  FileText, 
  Calculator, 
  Truck,
  Coins,
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  BarChart3,
  Settings,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Globe,
  Database,
  Clock,
  CheckCircle,
  Award
} from "lucide-react"
import Link from "next/link"

export default function MainPage() {
  const features = [
    {
      title: "Generator Kwitansi",
      description: "Buat kwitansi profesional dengan format Indonesia yang lengkap dan dapat di-export ke PDF",
      icon: Receipt,
      href: "/kwitansi",
      color: "bg-blue-500",
      badge: "Core Feature",
      status: "active"
    },
    {
      title: "Invoice Generator",
      description: "Sistem manajemen invoice lengkap dengan pelanggan, vendor, dan export PDF",
      icon: FileText,
      href: "/invoice",
      color: "bg-green-500",
      badge: "Professional",
      status: "active"
    },
    {
      title: "Coal Tools Suite",
      description: "Sistem terintegrasi untuk manajemen kas kecil, gaji karyawan, dan produksi batu bara",
      icon: Truck,
      href: "/coal-tools",
      color: "bg-orange-500",
      badge: "Enterprise",
      status: "active"
    },
    {
      title: "Payroll Calculator",
      description: "Kalkulator gaji karyawan dengan komponen dinamis dan slip gaji otomatis",
      icon: Calculator,
      href: "/coal-tools",
      color: "bg-purple-500",
      badge: "Advanced",
      status: "active"
    }
  ]

  const tools = [
    {
      name: "Kas Kecil",
      description: "Manajemen pengeluaran kecil dengan validasi dan approval workflow",
      icon: Coins,
      status: "active"
    },
    {
      name: "Kas Besar", 
      description: "Pengelolaan transaksi besar dengan kontrak dan dokumen pendukung",
      icon: DollarSign,
      status: "active"
    },
    {
      name: "Laporan Produksi",
      description: "Tracking produksi batu bara dengan import/export Excel",
      icon: TrendingUp,
      status: "active"
    },
    {
      name: "Manajemen Karyawan",
      description: "Database karyawan dengan data lengkap dan status aktif",
      icon: Users,
      status: "active"
    }
  ]

  const stats = [
    { label: "Total Features", value: "12+", icon: Star },
    { label: "Active Tools", value: "8", icon: CheckCircle },
    { label: "Database Tables", value: "15+", icon: Database },
    { label: "API Endpoints", value: "25+", icon: Zap }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-orange-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-white">
                Business Tools Hub
              </h1>
            </div>
            <p className="text-xl text-white font-medium max-w-3xl mx-auto leading-relaxed">
              Platform terintegrasi untuk semua kebutuhan bisnis Anda. Dari generator kwitansi hingga manajemen produksi batu bara.
            </p>
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-white/90 font-semibold">
                <Link href="/coal-tools-kaskecil" className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Mulai Menggunakan
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white border-2 border-orange-400 font-semibold shadow-lg">
                <Link href="/invoice" className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Lihat Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12 bg-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mx-auto mb-3">
                  <stat.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-gray-700">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Features */}
      <div className="py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Fitur Utama
            </h2>
            <p className="text-lg font-medium text-gray-700 max-w-3xl mx-auto">
              Semua tools yang Anda butuhkan dalam satu platform terintegrasi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center`}>
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">{feature.title}</CardTitle>
                        <Badge variant="secondary" className="mt-2 font-medium">
                          {feature.badge}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${feature.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className="text-xs font-medium text-gray-600 capitalize">{feature.status}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm font-medium mb-4 text-gray-700">
                    {feature.description}
                  </CardDescription>
                  <Button asChild className="w-full group-hover:bg-blue-600 transition-colors font-semibold">
                    <Link href={feature.href} className="flex items-center justify-center gap-2">
                      Akses Tool
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Coal Tools Suite Detail */}
      <div className="py-12 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Coal Tools Suite
            </h2>
            <p className="text-lg font-medium text-gray-700 max-w-3xl mx-auto">
              Sistem manajemen terintegrasi untuk industri batu bara
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {tools.map((tool, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <tool.icon className="h-5 w-5 text-orange-600" />
                  </div>
                  <CardTitle className="text-base font-bold">{tool.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm font-medium text-gray-700">
                    {tool.description}
                  </CardDescription>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className={`w-2 h-2 rounded-full ${tool.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-xs font-medium text-gray-600 capitalize">{tool.status}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 font-semibold">
              <Link href="/coal-tools-kaskecil" className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Akses Coal Tools
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Highlights */}
      <div className="py-12 bg-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Keamanan & Compliance</h3>
                  <p className="text-sm font-medium text-gray-700">Audit trail lengkap dan approval workflow yang aman</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Database Terintegrasi</h3>
                  <p className="text-sm font-medium text-gray-700">PostgreSQL dengan Prisma ORM untuk performa optimal</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Real-time Updates</h3>
                  <p className="text-sm font-medium text-gray-700">Perubahan data langsung terlihat di semua komponen</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Analytics & Reports</h3>
                  <p className="text-sm font-medium text-gray-700">Laporan dan dashboard untuk insights bisnis</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">24/7 Availability</h3>
                  <p className="text-sm font-medium text-gray-700">Sistem selalu siap digunakan kapan saja</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Award className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Enterprise Ready</h3>
                  <p className="text-sm font-medium text-gray-700">Skalabel untuk perusahaan besar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">
            Siap Memulai?
          </h2>
          <p className="text-lg font-medium text-white/90 mb-6 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan bisnis yang telah menggunakan platform kami
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-white/90 font-semibold">
              <Link href="/coal-tools-kaskecil" className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Mulai Sekarang
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white border-2 border-orange-400 font-semibold shadow-lg">
              <Link href="/invoice" className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lihat Demo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}