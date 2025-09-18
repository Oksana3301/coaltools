'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KasBesarFilters as FiltersType } from '../types/kas-besar-types';
import {
  TIPE_AKTIVITAS_OPTIONS,
  SATUAN_OPTIONS,
} from '../constants/kas-besar-constants';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'paid', label: 'Dibayar' },
];

interface KasBesarFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  onReset: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function KasBesarFilters({
  filters,
  onFiltersChange,
  onReset,
  isCollapsed,
  onToggleCollapse,
}: KasBesarFiltersProps) {
  const handleFilterChange = (key: keyof FiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== '' && value !== null && value !== undefined
  );

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Pencarian
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
            >
              {isCollapsed ? 'Tampilkan' : 'Sembunyikan'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Pencarian</Label>
              <Input
                id="search"
                placeholder="Cari barang, vendor, atau keterangan..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            {/* Tipe Aktivitas */}
            <div className="space-y-2">
              <Label>Tipe Aktivitas</Label>
              <Select
                value={filters.tipeAktivitas || ''}
                onValueChange={(value) => handleFilterChange('tipeAktivitas', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe aktivitas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Tipe</SelectItem>
                  {TIPE_AKTIVITAS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Status</SelectItem>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vendor */}
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                placeholder="Nama vendor"
                value={filters.vendor || ''}
                onChange={(e) => handleFilterChange('vendor', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tanggal Dari */}
            <div className="space-y-2">
              <Label htmlFor="tanggalDari">Tanggal Dari</Label>
              <Input
                id="tanggalDari"
                type="date"
                value={filters.tanggalDari || ''}
                onChange={(e) => handleFilterChange('tanggalDari', e.target.value)}
              />
            </div>

            {/* Tanggal Sampai */}
            <div className="space-y-2">
              <Label htmlFor="tanggalSampai">Tanggal Sampai</Label>
              <Input
                id="tanggalSampai"
                type="date"
                value={filters.tanggalSampai || ''}
                onChange={(e) => handleFilterChange('tanggalSampai', e.target.value)}
              />
            </div>

            {/* Minimal Total */}
            <div className="space-y-2">
              <Label htmlFor="minTotal">Minimal Total (Rp)</Label>
              <Input
                id="minTotal"
                type="number"
                placeholder="0"
                value={filters.minTotal || ''}
                onChange={(e) => handleFilterChange('minTotal', e.target.value ? Number(e.target.value) : null)}
              />
            </div>

            {/* Maksimal Total */}
            <div className="space-y-2">
              <Label htmlFor="maxTotal">Maksimal Total (Rp)</Label>
              <Input
                id="maxTotal"
                type="number"
                placeholder="Tidak terbatas"
                value={filters.maxTotal || ''}
                onChange={(e) => handleFilterChange('maxTotal', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}