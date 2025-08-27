"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OnboardingWizard } from "@/components/coal-tools/onboarding-wizard"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Settings, User, Zap } from "lucide-react"

export default function OnboardingDemoPage() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { toast } = useToast()

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    toast({
      title: "🎉 Onboarding Selesai!",
      description: "Preferensi Anda telah tersimpan dan siap digunakan untuk generate laporan.",
    })
  }

  const handleOnboardingClose = () => {
    setShowOnboarding(false)
    toast({
      title: "Onboarding Dibatalkan",
      description: "Anda dapat menjalankan onboarding kapan saja dari menu pengaturan.",
      variant: "destructive"
    })
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Coal Mining Report Generator
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Sistem onboarding untuk mengatur preferensi laporan batubara Anda dengan mudah dan cepat
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personalisasi
            </CardTitle>
            <CardDescription>
              Atur profil, jabatan, dan preferensi bahasa laporan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline">8 Langkah Mudah</Badge>
              <Badge variant="outline">Validasi Real-time</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Konfigurasi
            </CardTitle>
            <CardDescription>
              Tentukan format output, komponen biaya, dan struktur gaji
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline">Multiple Format</Badge>
              <Badge variant="outline">Komponen Custom</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Otomatis
            </CardTitle>
            <CardDescription>
              Upload template terbaik dan atur reminder otomatis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline">Upload Template</Badge>
              <Badge variant="outline">Smart Reminder</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="text-center">
        <CardHeader>
          <CardTitle>Siap untuk Memulai?</CardTitle>
          <CardDescription>
            Jalankan onboarding wizard untuk mengatur preferensi laporan Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            size="lg" 
            onClick={() => setShowOnboarding(true)}
            className="w-full sm:w-auto"
          >
            Mulai Onboarding
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Proses ini membutuhkan waktu sekitar 3-5 menit
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fitur Onboarding</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Progress bar dan step indicators
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Validasi form real-time
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Error handling yang informatif
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Responsive design untuk semua device
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Auto-save dan recovery data
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Langkah-Langkah</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium">1</span>
                Profil & Peran
              </li>
              <li className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium">2</span>
                Bahasa & Format
              </li>
              <li className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium">3</span>
                Cashout & Biaya
              </li>
              <li className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium">4</span>
                Produksi Batubara
              </li>
              <li className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium">...</span>
                Dan 4 langkah lainnya
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          userId="demo-user-123"
          onComplete={handleOnboardingComplete}
          onClose={handleOnboardingClose}
        />
      )}
    </div>
  )
}
