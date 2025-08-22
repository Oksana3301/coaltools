"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins } from "lucide-react"
import { ExpenseManagement } from "@/components/coal-tools/expense-management"

export default function KasKecilPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
              <Coins className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Kas Kecil
            </h1>
          </div>
          <p className="text-lg font-medium text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Manajemen pengeluaran kas kecil dengan validasi dan approval workflow yang terintegrasi.
          </p>
        </div>

        {/* Main Content */}
        <Card className="border-2 border-blue-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardTitle className="text-2xl text-blue-800 flex items-center gap-3">
              <Coins className="h-6 w-6" />
              Sistem Manajemen Kas Kecil
            </CardTitle>
            <CardDescription className="text-base font-medium">
              Input, validasi, dan approval pengeluaran kas kecil dengan tracking lengkap
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ExpenseManagement />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
