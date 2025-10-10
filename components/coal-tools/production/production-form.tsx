'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  Save,
  X,
  Calculator,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProductionReport, Buyer } from '@/lib/api';
import { ProductionFormData } from '../types/production-types';
import {
  validateFileType,
  validateFileSize,
  generateProductionTemplate,
  importExcelFile,
} from '@/lib/file-utils';
import { getCurrentUser } from '@/lib/auth';

interface ProductionFormProps {
  isOpen: boolean;
  onClose: () => void;
  formData: ProductionFormData;
  onFormDataChange: (field: string, value: string | number) => void;
  onSubmit: (data: Omit<ProductionReport, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editingTransaction: ProductionReport | null;
  buyers: Buyer[];
  isSubmitting?: boolean;
}

export function ProductionForm({
  isOpen,
  onClose,
  formData,
  onFormDataChange,
  onSubmit,
  editingTransaction,
  buyers,
  isSubmitting = false,
}: ProductionFormProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto calculate netto from gross and tare
  const calculatedNetto = formData.gross_ton - formData.tare_ton;

  const formatNumber = (num: number, decimals: number = 3) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const validateForm = () => {
    const requiredFields = ['tanggal', 'nopol', 'pembeli_nama', 'tujuan'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Form tidak lengkap",
        description: `Mohon lengkapi field: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }

    if (formData.gross_ton <= 0 || formData.tare_ton <= 0) {
      toast({
        title: "Nilai tidak valid",
        description: "Gross dan Tare harus lebih dari 0",
        variant: "destructive"
      });
      return false;
    }

    if (formData.gross_ton <= formData.tare_ton) {
      toast({
        title: "Gross tidak valid",
        description: "Gross harus lebih besar dari Tare",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const transactionData = {
        tanggal: formData.tanggal,
        nopol: formData.nopol,
        pembeliNama: formData.pembeli_nama,
        tujuan: formData.tujuan,
        grossTon: formData.gross_ton,
        tareTon: formData.tare_ton,
        nettoTon: calculatedNetto,
        notes: formData.notes,
        createdBy: getCurrentUser()?.id || 'demo-user',
        status: 'DRAFT' as const
      };

      await onSubmit(transactionData);
      onClose();
      
      toast({
        title: editingTransaction ? "Transaksi diperbarui" : "Transaksi ditambahkan",
        description: `Berhasil ${editingTransaction ? 'memperbarui' : 'menambahkan'} transaksi produksi`
      });
    } catch (error) {
      toast({
        title: "Gagal menyimpan",
        description: "Terjadi kesalahan saat menyimpan transaksi",
        variant: "destructive"
      });
    }
  };

  const handleImport = async (file: File) => {
    try {
      if (!validateFileType(file, ['xlsx', 'xls'])) {
        toast({
          title: "File tidak valid",
          description: "Hanya file Excel (.xlsx, .xls) yang diperbolehkan",
          variant: "destructive"
        });
        return;
      }

      if (!validateFileSize(file, 10)) {
        toast({
          title: "File terlalu besar",
          description: "Ukuran file maksimal 10MB",
          variant: "destructive"
        });
        return;
      }

      const data = await importExcelFile(file);
      if (data.length < 2) {
        toast({
          title: "File kosong",
          description: "File Excel tidak memiliki data yang valid",
          variant: "destructive"
        });
        return;
      }

      // Process first row as sample data
      const rowData = data[1] as string[];
      onFormDataChange('tanggal', rowData[0] || '');
      onFormDataChange('nopol', rowData[1] || '');
      onFormDataChange('pembeli_nama', rowData[2] || '');
      onFormDataChange('tujuan', rowData[3] || '');
      onFormDataChange('gross_ton', parseFloat(rowData[4]) || 0);
      onFormDataChange('tare_ton', parseFloat(rowData[5]) || 0);
      onFormDataChange('notes', rowData[7] || '');
      
      toast({
        title: "Data diimpor",
        description: "Data dari Excel berhasil dimuat ke form"
      });
    } catch (error) {
      toast({
        title: "Import gagal",
        description: "Terjadi kesalahan saat mengimpor file Excel",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  const downloadTemplate = () => {
    try {
      generateProductionTemplate();
      toast({
        title: "Template diunduh",
        description: "Template Excel berhasil diunduh"
      });
    } catch (error) {
      toast({
        title: "Gagal mengunduh",
        description: "Terjadi kesalahan saat mengunduh template",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Produksi'}
              </CardTitle>
              <CardDescription>
                {editingTransaction 
                  ? 'Perbarui data transaksi produksi' 
                  : 'Masukkan data transaksi produksi baru'
                }
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Import Section */}
            {!editingTransaction && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Import dari Excel</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Pilih File Excel
                  </Button>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tanggal">Tanggal *</Label>
                <Input
                  id="tanggal"
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => onFormDataChange('tanggal', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nopol">No. Polisi *</Label>
                <Input
                  id="nopol"
                  placeholder="B 1234 ABC"
                  value={formData.nopol}
                  onChange={(e) => onFormDataChange('nopol', e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Pembeli *</Label>
                <Select
                  value={formData.pembeli_nama}
                  onValueChange={(value) => onFormDataChange('pembeli_nama', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pembeli" />
                  </SelectTrigger>
                  <SelectContent>
                    {buyers.map((buyer) => (
                      <SelectItem key={buyer.id} value={buyer.nama}>
                        {buyer.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tujuan">Tujuan *</Label>
                <Input
                  id="tujuan"
                  placeholder="Lokasi tujuan"
                  value={formData.tujuan}
                  onChange={(e) => onFormDataChange('tujuan', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gross_ton">Gross (Ton) *</Label>
                <Input
                  id="gross_ton"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.000"
                  value={formData.gross_ton || ''}
                  onChange={(e) => onFormDataChange('gross_ton', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tare_ton">Tare (Ton) *</Label>
                <Input
                  id="tare_ton"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.000"
                  value={formData.tare_ton || ''}
                  onChange={(e) => onFormDataChange('tare_ton', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            {/* Calculated Netto */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Netto (Otomatis)</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {formatNumber(calculatedNetto)} Ton
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Gross ({formatNumber(formData.gross_ton)}) - Tare ({formatNumber(formData.tare_ton)})
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                placeholder="Catatan tambahan (opsional)"
                value={formData.notes}
                onChange={(e) => onFormDataChange('notes', e.target.value)}
                rows={3}
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || calculatedNetto <= 0}
                className="flex-1"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingTransaction ? 'Perbarui' : 'Simpan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}