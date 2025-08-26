"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import { EmployeeManagement } from "@/components/coal-tools/employee-management"

export default function KaryawanPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Manajemen Karyawan
            </h1>
          </div>
          <p className="text-lg font-medium text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Kelola data karyawan dengan informasi lengkap termasuk NIK, jabatan, bank account, dan data pribadi lainnya.
          </p>
        </div>

        {/* Main Content */}
        <Card className="border-2 border-green-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-2xl text-green-800 flex items-center gap-3">
              <Users className="h-6 w-6" />
              Sistem Manajemen Karyawan
            </CardTitle>
            <CardDescription className="text-base font-medium">
              Tambah, edit, dan kelola data karyawan dengan form yang lengkap dan terstruktur
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <EmployeeManagement />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
