"use client"

import React, { useState, useEffect } from 'react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Globe, 
  CreditCard, 
  BarChart3, 
  Users, 
  Smartphone, 
  Trophy, 
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Upload,
  Loader2,
  X,
  Plus
} from "lucide-react"

interface OnboardingData {
  runs_profile: {
    full_name: string
    job_title: string
    preferred_lang: string
    preferred_formats: string[]
    reminder_channel: string
    signature_name: string
  }
  onboarding_answers: {
    language: string
    report_formats: string[]
    common_expenses: string[]
    budget_alerts: boolean
    monthly_target_mt?: number
    show_target_vs_actual: boolean
    payroll_modes: string[]
    payroll_components: string[]
    input_devices: string[]
    reminder_channel: string
    sample_report_file_id?: string
    allow_custom_notes: boolean
  }
  personal_best?: {
    title: string
    notes?: string
    sample_file_id?: string
  }
}

interface OnboardingWizardProps {
  userId: string
  onComplete: () => void
  onClose: () => void
}

const STEPS = [
  { id: 1, title: "Profil & Peran", icon: User },
  { id: 2, title: "Bahasa & Format", icon: Globe },
  { id: 3, title: "Cashout & Biaya", icon: CreditCard },
  { id: 4, title: "Produksi Batubara", icon: BarChart3 },
  { id: 5, title: "Struktur Gaji", icon: Users },
  { id: 6, title: "Kebiasaan Input", icon: Smartphone },
  { id: 7, title: "Personal Best", icon: Trophy },
  { id: 8, title: "Review & Submit", icon: CheckCircle },
]

const JOB_TITLES = [
  'Direktur',
  'Direktur Operasional', 
  'Accounting',
  'Admin Lapangan',
  'Operator',
  'Lainnya'
]

const EXPENSE_CATEGORIES = [
  'BBM',
  'Sewa Alat',
  'Fee Koordinasi',
  'Gaji Harian',
  'Materai & Adm',
  'Kasbon'
]

const PAYROLL_MODES = [
  'harian',
  'bulanan',
  'borongan'
]

const PAYROLL_COMPONENTS = [
  'makan',
  'bbm',
  'insentif',
  'pph',
  'bpjs'
]

const INPUT_DEVICES = [
  'mobile',
  'laptop'
]

export function OnboardingWizard({ userId, onComplete, onClose }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const [data, setData] = useState<OnboardingData>({
    runs_profile: {
      full_name: '',
      job_title: '',
      preferred_lang: 'id',
      preferred_formats: [],
      reminder_channel: 'email',
      signature_name: ''
    },
    onboarding_answers: {
      language: 'id',
      report_formats: [],
      common_expenses: [],
      budget_alerts: true,
      show_target_vs_actual: true,
      payroll_modes: [],
      payroll_components: [],
      input_devices: [],
      reminder_channel: 'email',
      allow_custom_notes: true
    }
  })

  const [customExpense, setCustomExpense] = useState('')
  const [customComponent, setCustomComponent] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  // Validation for each step
  const validateStep = (step: number): { isValid: boolean; errors: Record<string, string> } => {
    const stepErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (data.runs_profile.full_name.length < 2) {
          stepErrors.full_name = 'Nama lengkap minimal 2 karakter'
        }
        if (!data.runs_profile.job_title) {
          stepErrors.job_title = 'Pilih jabatan Anda'
        }
        break
      case 2:
        if (data.runs_profile.preferred_formats.length < 1) {
          stepErrors.preferred_formats = 'Pilih minimal 1 format laporan'
        }
        break
      case 3:
        if (data.onboarding_answers.common_expenses.length < 1) {
          stepErrors.common_expenses = 'Pilih minimal 1 komponen biaya'
        }
        break
      case 4:
        if (data.onboarding_answers.monthly_target_mt !== undefined && data.onboarding_answers.monthly_target_mt <= 0) {
          stepErrors.monthly_target_mt = 'Target harus lebih dari 0'
        }
        break
      case 5:
        if (data.onboarding_answers.payroll_modes.length < 1) {
          stepErrors.payroll_modes = 'Pilih minimal 1 pola gaji'
        }
        if (data.onboarding_answers.payroll_components.length < 1) {
          stepErrors.payroll_components = 'Pilih minimal 1 komponen payroll'
        }
        break
      case 6:
        if (data.onboarding_answers.input_devices.length < 1) {
          stepErrors.input_devices = 'Pilih minimal 1 media input'
        }
        break
      case 7:
      case 8:
        break
      default:
        break
    }

    return { isValid: Object.keys(stepErrors).length === 0, errors: stepErrors }
  }

  const isStepValid = (step: number): boolean => {
    return validateStep(step).isValid
  }

  const handleNext = () => {
    const validation = validateStep(currentStep)
    setErrors(validation.errors)
    
    if (validation.isValid && currentStep < 8) {
      setCurrentStep(currentStep + 1)
      setErrors({}) // Clear errors when moving to next step
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setErrors({}) // Clear errors when going back
    }
  }

  const handleArrayToggle = (array: string[], value: string, setter: (newArray: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value))
    } else {
      setter([...array, value])
    }
  }

  const addCustomExpense = () => {
    if (customExpense.trim() && !data.onboarding_answers.common_expenses.includes(customExpense.trim())) {
      setData(prev => ({
        ...prev,
        onboarding_answers: {
          ...prev.onboarding_answers,
          common_expenses: [...prev.onboarding_answers.common_expenses, customExpense.trim()]
        }
      }))
      setCustomExpense('')
    }
  }

  const addCustomComponent = () => {
    if (customComponent.trim() && !data.onboarding_answers.payroll_components.includes(customComponent.trim())) {
      setData(prev => ({
        ...prev,
        onboarding_answers: {
          ...prev.onboarding_answers,
          payroll_components: [...prev.onboarding_answers.payroll_components, customComponent.trim()]
        }
      }))
      setCustomComponent('')
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...data,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Onboarding Selesai",
          description: result.message,
        })
        onComplete()
      } else {
        throw new Error(result.error || 'Failed to submit onboarding')
      }
    } catch (error) {
      console.error('Error submitting onboarding:', error)
      toast({
        title: "Error",
        description: "Gagal menyimpan data onboarding",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-sync signature name with full name
  useEffect(() => {
    if (!data.runs_profile.signature_name || data.runs_profile.signature_name === '') {
      setData(prev => ({
        ...prev,
        runs_profile: {
          ...prev.runs_profile,
          signature_name: prev.runs_profile.full_name
        }
      }))
    }
  }, [data.runs_profile.full_name])

  // Sync language preferences
  useEffect(() => {
    setData(prev => ({
      ...prev,
      onboarding_answers: {
        ...prev.onboarding_answers,
        language: prev.runs_profile.preferred_lang,
        report_formats: prev.runs_profile.preferred_formats,
        reminder_channel: prev.runs_profile.reminder_channel
      }
    }))
  }, [data.runs_profile.preferred_lang, data.runs_profile.preferred_formats, data.runs_profile.reminder_channel])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                value={data.runs_profile.full_name}
                onChange={(e) => {
                  setData(prev => ({
                    ...prev,
                    runs_profile: { ...prev.runs_profile, full_name: e.target.value }
                  }))
                  // Clear error when user starts typing
                  if (errors.full_name) {
                    setErrors(prev => ({ ...prev, full_name: '' }))
                  }
                }}
                placeholder="Masukkan nama lengkap Anda"
                className={cn(
                  "transition-colors",
                  errors.full_name && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="text-sm font-medium">
                Jabatan <span className="text-destructive">*</span>
              </Label>
              <Select
                value={data.runs_profile.job_title}
                onValueChange={(value) => {
                  setData(prev => ({
                    ...prev,
                    runs_profile: { ...prev.runs_profile, job_title: value }
                  }))
                  // Clear error when user selects
                  if (errors.job_title) {
                    setErrors(prev => ({ ...prev, job_title: '' }))
                  }
                }}
              >
                <SelectTrigger className={cn(
                  "transition-colors",
                  errors.job_title && "border-destructive focus:ring-destructive"
                )}>
                  <SelectValue placeholder="Pilih jabatan" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TITLES.map(title => (
                    <SelectItem key={title} value={title}>{title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.job_title && (
                <p className="text-sm text-destructive">{errors.job_title}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signatureName" className="text-sm font-medium">
                Nama Tanda Tangan <span className="text-muted-foreground">(opsional)</span>
              </Label>
              <Input
                id="signatureName"
                value={data.runs_profile.signature_name}
                onChange={(e) => setData(prev => ({
                  ...prev,
                  runs_profile: { ...prev.runs_profile, signature_name: e.target.value }
                }))}
                placeholder="Default: sama dengan nama lengkap"
              />
              <p className="text-xs text-muted-foreground">
                Nama yang akan muncul sebagai tanda tangan pada laporan
              </p>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Bahasa Utama Laporan</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'id', label: 'Indonesia', icon: '🇮🇩' },
                  { value: 'en', label: 'English', icon: '🇺🇸' },
                  { value: 'both', label: 'Keduanya', icon: '🌐' }
                ].map(lang => (
                  <Button
                    key={lang.value}
                    variant={data.runs_profile.preferred_lang === lang.value ? "default" : "outline"}
                    onClick={() => setData(prev => ({
                      ...prev,
                      runs_profile: { ...prev.runs_profile, preferred_lang: lang.value }
                    }))}
                    className="flex items-center gap-2"
                  >
                    <span>{lang.icon}</span>
                    {lang.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Pilih bahasa yang akan digunakan untuk laporan yang dihasilkan
              </p>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Format Laporan <span className="text-destructive">*</span>
              </Label>
              <div className={cn(
                "grid grid-cols-1 gap-3 p-4 rounded-lg border",
                errors.preferred_formats && "border-destructive"
              )}>
                {[
                  { value: 'whatsapp', label: 'WhatsApp', description: 'Ringkasan untuk chat', icon: '💬' },
                  { value: 'pdf', label: 'PDF', description: 'Dokumen resmi', icon: '📄' },
                  { value: 'excel', label: 'Excel', description: 'Data detail untuk analisis', icon: '📊' }
                ].map(format => (
                  <div key={format.value} className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={format.value}
                      checked={data.runs_profile.preferred_formats.includes(format.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setData(prev => ({
                            ...prev,
                            runs_profile: {
                              ...prev.runs_profile,
                              preferred_formats: [...prev.runs_profile.preferred_formats, format.value]
                            }
                          }))
                        } else {
                          setData(prev => ({
                            ...prev,
                            runs_profile: {
                              ...prev.runs_profile,
                              preferred_formats: prev.runs_profile.preferred_formats.filter(f => f !== format.value)
                            }
                          }))
                        }
                        // Clear error when user makes selection
                        if (errors.preferred_formats) {
                          setErrors(prev => ({ ...prev, preferred_formats: '' }))
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={format.value} className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                        <span>{format.icon}</span>
                        {format.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">{format.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {errors.preferred_formats && (
                <p className="text-sm text-destructive">{errors.preferred_formats}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Anda dapat memilih beberapa format sekaligus
              </p>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>Komponen biaya yang sering dicatat *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {EXPENSE_CATEGORIES.map(expense => (
                  <div key={expense} className="flex items-center space-x-2">
                    <Checkbox
                      id={expense}
                      checked={data.onboarding_answers.common_expenses.includes(expense)}
                      onCheckedChange={(checked) => {
                        handleArrayToggle(
                          data.onboarding_answers.common_expenses,
                          expense,
                          (newArray) => setData(prev => ({
                            ...prev,
                            onboarding_answers: { ...prev.onboarding_answers, common_expenses: newArray }
                          }))
                        )
                      }}
                    />
                    <Label htmlFor={expense} className="text-sm">{expense}</Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Tambah komponen lainnya..."
                  value={customExpense}
                  onChange={(e) => setCustomExpense(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomExpense()}
                />
                <Button onClick={addCustomExpense} variant="outline">Tambah</Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="budgetAlerts"
                checked={data.onboarding_answers.budget_alerts}
                onCheckedChange={(checked) => setData(prev => ({
                  ...prev,
                  onboarding_answers: { ...prev.onboarding_answers, budget_alerts: checked }
                }))}
              />
              <Label htmlFor="budgetAlerts">Aktifkan peringatan (tanpa bukti/melebihi budget)</Label>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="monthlyTarget">Target produksi bulanan (MT)</Label>
              <Input
                id="monthlyTarget"
                type="number"
                value={data.onboarding_answers.monthly_target_mt || ''}
                onChange={(e) => setData(prev => ({
                  ...prev,
                  onboarding_answers: { 
                    ...prev.onboarding_answers, 
                    monthly_target_mt: e.target.value ? parseFloat(e.target.value) : undefined 
                  }
                }))}
                placeholder="Masukkan target dalam metric ton"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="showTarget"
                checked={data.onboarding_answers.show_target_vs_actual}
                onCheckedChange={(checked) => setData(prev => ({
                  ...prev,
                  onboarding_answers: { ...prev.onboarding_answers, show_target_vs_actual: checked }
                }))}
              />
              <Label htmlFor="showTarget">Tampilkan Target vs Realisasi otomatis</Label>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <Label>Pola Gaji *</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {PAYROLL_MODES.map(mode => (
                  <div key={mode} className="flex items-center space-x-2">
                    <Checkbox
                      id={mode}
                      checked={data.onboarding_answers.payroll_modes.includes(mode)}
                      onCheckedChange={(checked) => {
                        handleArrayToggle(
                          data.onboarding_answers.payroll_modes,
                          mode,
                          (newArray) => setData(prev => ({
                            ...prev,
                            onboarding_answers: { ...prev.onboarding_answers, payroll_modes: newArray }
                          }))
                        )
                      }}
                    />
                    <Label htmlFor={mode} className="text-sm capitalize">{mode}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Komponen Payroll *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {PAYROLL_COMPONENTS.map(component => (
                  <div key={component} className="flex items-center space-x-2">
                    <Checkbox
                      id={component}
                      checked={data.onboarding_answers.payroll_components.includes(component)}
                      onCheckedChange={(checked) => {
                        handleArrayToggle(
                          data.onboarding_answers.payroll_components,
                          component,
                          (newArray) => setData(prev => ({
                            ...prev,
                            onboarding_answers: { ...prev.onboarding_answers, payroll_components: newArray }
                          }))
                        )
                      }}
                    />
                    <Label htmlFor={component} className="text-sm capitalize">{component}</Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Tambah komponen custom..."
                  value={customComponent}
                  onChange={(e) => setCustomComponent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomComponent()}
                />
                <Button onClick={addCustomComponent} variant="outline">Tambah</Button>
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-4">
            <div>
              <Label>Media Input *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {INPUT_DEVICES.map(device => (
                  <div key={device} className="flex items-center space-x-2">
                    <Checkbox
                      id={device}
                      checked={data.onboarding_answers.input_devices.includes(device)}
                      onCheckedChange={(checked) => {
                        handleArrayToggle(
                          data.onboarding_answers.input_devices,
                          device,
                          (newArray) => setData(prev => ({
                            ...prev,
                            onboarding_answers: { ...prev.onboarding_answers, input_devices: newArray }
                          }))
                        )
                      }}
                    />
                    <Label htmlFor={device} className="text-sm capitalize">{device}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Reminder bila laporan harian belum masuk</Label>
              <div className="flex gap-2 mt-2">
                {[
                  { value: 'email', label: 'Email' },
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'none', label: 'Tidak perlu' }
                ].map(reminder => (
                  <Button
                    key={reminder.value}
                    variant={data.runs_profile.reminder_channel === reminder.value ? "default" : "outline"}
                    onClick={() => setData(prev => ({
                      ...prev,
                      runs_profile: { ...prev.runs_profile, reminder_channel: reminder.value }
                    }))}
                  >
                    {reminder.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="allowNotes"
                checked={data.onboarding_answers.allow_custom_notes}
                onCheckedChange={(checked) => setData(prev => ({
                  ...prev,
                  onboarding_answers: { ...prev.onboarding_answers, allow_custom_notes: checked }
                }))}
              />
              <Label htmlFor="allowNotes">Izinkan catatan bebas per laporan</Label>
            </div>
            <div>
              <Label htmlFor="sampleFile">Upload contoh laporan terbaik (PDF/Excel)</Label>
              <div className="mt-2">
                <Input
                  id="sampleFile"
                  type="file"
                  accept=".pdf,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setUploadedFile(file)
                    }
                  }}
                />
                {uploadedFile && (
                  <div className="mt-2 flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm text-gray-600">{uploadedFile.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 8:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Pengaturan Anda</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium">Profil</h4>
                <p>Nama: {data.runs_profile.full_name}</p>
                <p>Jabatan: {data.runs_profile.job_title}</p>
                <p>Bahasa: {data.runs_profile.preferred_lang}</p>
              </div>
              <div>
                <h4 className="font-medium">Format Laporan</h4>
                <div className="flex gap-1 flex-wrap">
                  {data.runs_profile.preferred_formats.map(format => (
                    <Badge key={format} variant="secondary">{format}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium">Komponen Biaya</h4>
                <div className="flex gap-1 flex-wrap">
                  {data.onboarding_answers.common_expenses.slice(0, 3).map(expense => (
                    <Badge key={expense} variant="outline">{expense}</Badge>
                  ))}
                  {data.onboarding_answers.common_expenses.length > 3 && (
                    <Badge variant="outline">+{data.onboarding_answers.common_expenses.length - 3} lainnya</Badge>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium">Target Produksi</h4>
                <p>{data.onboarding_answers.monthly_target_mt ? `${data.onboarding_answers.monthly_target_mt} MT/bulan` : 'Tidak diset'}</p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-3 text-xl">
                {React.createElement(STEPS[currentStep - 1].icon, { 
                  className: "h-6 w-6 text-primary" 
                })}
                {STEPS[currentStep - 1].title}
              </CardTitle>
              <CardDescription className="mt-1">
                Langkah {currentStep} dari {STEPS.length} • Atur preferensi laporan Anda
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
              <span className="sr-only">Tutup</span>
            </Button>
          </div>
          
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round((currentStep / STEPS.length) * 100)}%</span>
            </div>
            <Progress value={(currentStep / STEPS.length) * 100} className="w-full h-2" />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between mt-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                  index + 1 < currentStep ? "bg-primary text-primary-foreground" :
                  index + 1 === currentStep ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                )}>
                  {index + 1 < currentStep ? 
                    <CheckCircle className="h-4 w-4" /> : 
                    index + 1
                  }
                </div>
                <span className="text-xs text-muted-foreground mt-1 text-center hidden sm:block">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            {renderStep()}
          </div>
        </CardContent>

        <div className="flex-shrink-0 border-t p-6">
          <div className="flex justify-between items-center max-w-2xl mx-auto">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>

            <div className="text-sm text-muted-foreground">
              {currentStep} / {STEPS.length}
            </div>

            {currentStep === 8 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Selesai
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isStepValid(currentStep)}
                className="flex items-center gap-2 min-w-[120px]"
              >
                Lanjut
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
