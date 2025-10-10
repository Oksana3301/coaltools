"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign } from "lucide-react"
import { KasBesarManagement } from "@/components/coal-tools/kas-besar-management"

export default function KasBesarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Kas Besar
            </h1>
          </div>
          <p className="text-lg font-medium text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Pengelolaan transaksi kas besar dengan kontrak dan dokumen pendukung yang lengkap.
          </p>
        </div>

        {/* Main Content */}
        <Card className="border-2 border-green-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-2xl text-green-800 flex items-center gap-3">
              <DollarSign className="h-6 w-6" />
              Sistem Manajemen Kas Besar
            </CardTitle>
            <CardDescription className="text-base font-medium">
              Input, validasi, dan approval transaksi kas besar dengan dokumen pendukung
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <KasBesarManagement />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
