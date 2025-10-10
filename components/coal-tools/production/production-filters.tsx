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
import {
  Search,
  Filter,
  X,
  Calendar,
  Users,
  FileText,
} from 'lucide-react';
import type { Buyer } from '@/lib/api';
import { ProductionFilters } from '../types/production-types';

interface ProductionFiltersProps {
  filters: ProductionFilters;
  onFiltersChange: (filters: ProductionFilters) => void;
  buyers: Buyer[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function ProductionFiltersComponent({
  filters,
  onFiltersChange,
  buyers,
  isCollapsed = false,
  onToggleCollapse,
}: ProductionFiltersProps) {
  const handleFilterChange = (field: keyof ProductionFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      tanggalDari: '',
      tanggalSampai: '',
      pembeli: '',
    });
  };

  const hasActiveFilters = () => {
    return filters.search || filters.status || filters.tanggalDari || filters.tanggalSampai || filters.pembeli;
  };

  if (isCollapsed) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Pencarian
              {hasActiveFilters() && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Pencarian
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters() && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Pencarian
            </Label>
            <Input
              id="search"
              placeholder="Cari no. polisi, pembeli, tujuan..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <Label htmlFor="tanggalDari" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tanggal Dari
            </Label>
            <Input
              id="tanggalDari"
              type="date"
              value={filters.tanggalDari}
              onChange={(e) => handleFilterChange('tanggalDari', e.target.value)}
            />
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <Label htmlFor="tanggalSampai" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tanggal Sampai
            </Label>
            <Input
              id="tanggalSampai"
              type="date"
              value={filters.tanggalSampai}
              onChange={(e) => handleFilterChange('tanggalSampai', e.target.value)}
              min={filters.tanggalDari || undefined}
            />
          </div>

          {/* Buyer Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pembeli
            </Label>
            <Select
              value={filters.pembeli}
              onValueChange={(value) => handleFilterChange('pembeli', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih pembeli" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Pembeli</SelectItem>
                {buyers.map((buyer) => (
                  <SelectItem key={buyer.id} value={buyer.nama}>
                    {buyer.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Status
            </Label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters() && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Filter aktif:</span>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Pencarian: "{filters.search}"
                  </span>
                )}
                {filters.tanggalDari && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    Dari: {new Date(filters.tanggalDari).toLocaleDateString('id-ID')}
                  </span>
                )}
                {filters.tanggalSampai && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    Sampai: {new Date(filters.tanggalSampai).toLocaleDateString('id-ID')}
                  </span>
                )}
                {filters.pembeli && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                    Pembeli: {filters.pembeli}
                  </span>
                )}
                {filters.status && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                    Status: {STATUS_OPTIONS.find(s => s.value === filters.status)?.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Quick filter buttons component
export function ProductionQuickFilters({
  onFilterChange,
  currentPeriod,
}: {
  onFilterChange: (filters: Partial<ProductionFilters>) => void;
  currentPeriod: string;
}) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const quickFilters = [
    {
      label: 'Hari Ini',
      onClick: () => {
        const todayStr = today.toISOString().split('T')[0];
        onFilterChange({
          tanggalDari: todayStr,
          tanggalSampai: todayStr,
        });
      },
    },
    {
      label: '7 Hari Terakhir',
      onClick: () => {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        onFilterChange({
          tanggalDari: weekAgo.toISOString().split('T')[0],
          tanggalSampai: today.toISOString().split('T')[0],
        });
      },
    },
    {
      label: 'Bulan Ini',
      onClick: () => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        onFilterChange({
          tanggalDari: firstDay.toISOString().split('T')[0],
          tanggalSampai: lastDay.toISOString().split('T')[0],
        });
      },
    },
    {
      label: 'Bulan Lalu',
      onClick: () => {
        const firstDay = new Date(currentYear, currentMonth - 1, 1);
        const lastDay = new Date(currentYear, currentMonth, 0);
        onFilterChange({
          tanggalDari: firstDay.toISOString().split('T')[0],
          tanggalSampai: lastDay.toISOString().split('T')[0],
        });
      },
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {quickFilters.map((filter) => (
        <Button
          key={filter.label}
          variant="outline"
          size="sm"
          onClick={filter.onClick}
          className="text-xs"
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}