"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Save, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { KasBesarExpense } from "../types/kas-besar-types"
import { 
  SATUAN_OPTIONS, 
  TIPE_AKTIVITAS_OPTIONS, 
  SUB_JENIS_OPTIONS 
} from "../constants/kas-besar-constants"

interface KasBesarFormProps {
  formData: KasBesarExpense
  setFormData: (data: KasBesarExpense) => void
  onSubmit: (data: KasBesarExpense) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
  loading?: boolean
}

export function KasBesarForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isEditing = false,
  loading = false
}: KasBesarFormProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const kontrakInputRef = useRef<HTMLInputElement>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)

  // Auto calculate total
  const calculatedTotal = formData.banyak * formData.hargaSatuan

  // Calculate form completion percentage
  const getFormCompletionPercentage = () => {
    const requiredFields: (keyof KasBesarExpense)[] = ['tanggal', 'tipeAktivitas', 'barang', 'satuan', 'subJenis', 'vendorNama']
    const completedFields = requiredFields.filter(field => {
      const value = formData[field]
      return value !== undefined && value !== null && value !== ''
    })
    return Math.round((completedFields.length / requiredFields.length) * 100)
  }

  const handleInputChange = (field: keyof KasBesarExpense, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
      // Auto-calculate total when banyak or hargaSatuan changes
      ...(field === 'banyak' || field === 'hargaSatuan' ? {
        total: field === 'banyak' ? value * formData.hargaSatuan : formData.banyak * value
      } : {})
    })
    
    // Clear error when user starts typing
    if (formErrors[field as string]) {
      setFormErrors(prev => ({ ...prev, [field as string]: '' }))
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.tanggal) errors.tanggal = 'Tanggal wajib diisi'
    if (!formData.tipeAktivitas) errors.tipeAktivitas = 'Tipe aktivitas wajib dipilih'
    if (!formData.barang) errors.barang = 'Nama barang/jasa wajib diisi'
    if (!formData.satuan) errors.satuan = 'Satuan wajib dipilih'
    if (!formData.subJenis) errors.subJenis = 'Sub jenis wajib dipilih'
    if (!formData.vendorNama) errors.vendorNama = 'Nama vendor wajib diisi'
    if (formData.banyak <= 0) errors.banyak = 'Jumlah harus lebih dari 0'
    if (formData.hargaSatuan <= 0) errors.hargaSatuan = 'Harga satuan harus lebih dari 0'
    if (!formData.kontrakUrl) errors.kontrakUrl = 'Kontrak wajib diupload untuk kas besar'
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: "Form tidak valid",
        description: "Mohon lengkapi semua field yang wajib diisi",
        variant: "destructive"
      })
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: "Error",
        description: "Gagal menyimpan data. Silakan coba lagi.",
        variant: "destructive"
      })
    }
  }

  const handleFileUpload = async (file: File, type: 'bukti' | 'kontrak') => {
    if (!file) return
    
    setIsUploading(true)
    try {
      // Simulate file upload - replace with actual upload logic
      const url = URL.createObjectURL(file)
      
      if (type === 'bukti') {
        handleInputChange('buktiUrl', url)
      } else {
        handleInputChange('kontrakUrl', url)
      }
      
      toast({
        title: "File berhasil diupload",
        description: `${type === 'bukti' ? 'Bukti' : 'Kontrak'} telah diupload`
      })
    } catch (error) {
      toast({
        title: "Error upload",
        description: "Gagal mengupload file",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">
              {isEditing ? 'Edit' : 'Tambah'} Pengeluaran Kas Besar
            </CardTitle>
            <CardDescription>
              Form untuk mencatat pengeluaran kas besar (≥ Rp 10 juta)
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Kelengkapan Form</div>
            <div className="text-lg font-semibold text-blue-600">
              {getFormCompletionPercentage()}%
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal *</Label>
              <Input
                id="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={(e) => handleInputChange('tanggal', e.target.value)}
                className={formErrors.tanggal ? 'border-red-500' : ''}
              />
              {formErrors.tanggal && (
                <p className="text-sm text-red-500">{formErrors.tanggal}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipeAktivitas">Tipe Aktivitas *</Label>
              <Select
                value={formData.tipeAktivitas}
                onValueChange={(value) => handleInputChange('tipeAktivitas', value)}
              >
                <SelectTrigger className={formErrors.tipeAktivitas ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Pilih tipe aktivitas" />
                </SelectTrigger>
                <SelectContent>
                  {TIPE_AKTIVITAS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.tipeAktivitas && (
                <p className="text-sm text-red-500">{formErrors.tipeAktivitas}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subJenis">Sub Jenis *</Label>
              <Select
                value={formData.subJenis}
                onValueChange={(value) => handleInputChange('subJenis', value)}
              >
                <SelectTrigger className={formErrors.subJenis ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Pilih sub jenis" />
                </SelectTrigger>
                <SelectContent>
                  {SUB_JENIS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.subJenis && (
                <p className="text-sm text-red-500">{formErrors.subJenis}</p>
              )}
            </div>
          </div>

          {/* Item Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="barang">Nama Barang/Jasa *</Label>
              <Input
                id="barang"
                value={formData.barang}
                onChange={(e) => handleInputChange('barang', e.target.value)}
                placeholder="Masukkan nama barang atau jasa"
                className={formErrors.barang ? 'border-red-500' : ''}
              />
              {formErrors.barang && (
                <p className="text-sm text-red-500">{formErrors.barang}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banyak">Jumlah *</Label>
                <Input
                  id="banyak"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.banyak}
                  onChange={(e) => handleInputChange('banyak', parseFloat(e.target.value) || 0)}
                  className={formErrors.banyak ? 'border-red-500' : ''}
                />
                {formErrors.banyak && (
                  <p className="text-sm text-red-500">{formErrors.banyak}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="satuan">Satuan *</Label>
                <Select
                  value={formData.satuan}
                  onValueChange={(value) => handleInputChange('satuan', value)}
                >
                  <SelectTrigger className={formErrors.satuan ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {SATUAN_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.satuan && (
                  <p className="text-sm text-red-500">{formErrors.satuan}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hargaSatuan">Harga Satuan *</Label>
                <Input
                  id="hargaSatuan"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hargaSatuan}
                  onChange={(e) => handleInputChange('hargaSatuan', parseFloat(e.target.value) || 0)}
                  className={formErrors.hargaSatuan ? 'border-red-500' : ''}
                />
                {formErrors.hargaSatuan && (
                  <p className="text-sm text-red-500">{formErrors.hargaSatuan}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total">Total</Label>
                <Input
                  id="total"
                  type="number"
                  value={calculatedTotal}
                  readOnly
                  className="bg-gray-50 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Vendor Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informasi Vendor</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendorNama">Nama Vendor *</Label>
                <Input
                  id="vendorNama"
                  value={formData.vendorNama}
                  onChange={(e) => handleInputChange('vendorNama', e.target.value)}
                  placeholder="Nama perusahaan/vendor"
                  className={formErrors.vendorNama ? 'border-red-500' : ''}
                />
                {formErrors.vendorNama && (
                  <p className="text-sm text-red-500">{formErrors.vendorNama}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vendorTelp">Telepon Vendor</Label>
                <Input
                  id="vendorTelp"
                  value={formData.vendorTelp || ''}
                  onChange={(e) => handleInputChange('vendorTelp', e.target.value)}
                  placeholder="Nomor telepon"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vendorEmail">Email Vendor</Label>
                <Input
                  id="vendorEmail"
                  type="email"
                  value={formData.vendorEmail || ''}
                  onChange={(e) => handleInputChange('vendorEmail', e.target.value)}
                  placeholder="email@vendor.com"
                />
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dokumen Pendukung</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kontrak/PO *</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => kontrakInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.kontrakUrl ? 'Ganti Kontrak' : 'Upload Kontrak'}
                  </Button>
                  {formData.kontrakUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInputChange('kontrakUrl', '')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <input
                  ref={kontrakInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'kontrak')
                  }}
                  className="hidden"
                />
                {formErrors.kontrakUrl && (
                  <p className="text-sm text-red-500">{formErrors.kontrakUrl}</p>
                )}
                {formData.kontrakUrl && (
                  <p className="text-sm text-green-600">✓ Kontrak telah diupload</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Bukti Pembayaran</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.buktiUrl ? 'Ganti Bukti' : 'Upload Bukti'}
                  </Button>
                  {formData.buktiUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInputChange('buktiUrl', '')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'bukti')
                  }}
                  className="hidden"
                />
                {formData.buktiUrl && (
                  <p className="text-sm text-green-600">✓ Bukti telah diupload</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Catatan tambahan (opsional)"
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <Button
              type="submit"
              disabled={loading || isUploading}
              className="flex-1 md:flex-none"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update' : 'Simpan'}
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 md:flex-none"
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}