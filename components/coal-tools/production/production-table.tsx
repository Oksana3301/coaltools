'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import type { ProductionReport } from '@/lib/api';
import { ProductionTransaction, ProductionFilters } from '../types/production-types';

interface ProductionTableProps {
  transactions: ProductionTransaction[];
  filters: ProductionFilters;
  sortConfig: {
    key: keyof ProductionTransaction | null;
    direction: 'asc' | 'desc';
  };
  onSort: (key: keyof ProductionTransaction) => void;
  onEdit: (transaction: ProductionTransaction) => void;
  onDelete: (id: string) => void;
  onView: (transaction: ProductionTransaction) => void;
  onExport: () => void;
  isLoading?: boolean;
}

export function ProductionTable({
  transactions,
  filters,
  sortConfig,
  onSort,
  onEdit,
  onDelete,
  onView,
  onExport,
  isLoading = false,
}: ProductionTableProps) {
  const formatNumber = (num: number | undefined | null, decimals: number = 3) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string | undefined) => {
    const statusConfig = {
      DRAFT: { label: 'Draft', variant: 'secondary' as const },
      SUBMITTED: { label: 'Submitted', variant: 'default' as const },
      APPROVED: { label: 'Approved', variant: 'default' as const },
      REJECTED: { label: 'Rejected', variant: 'destructive' as const },
    };

    const config = statusConfig[(status || 'DRAFT') as keyof typeof statusConfig] || statusConfig.DRAFT;
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getSortIcon = (columnKey: keyof ProductionTransaction) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  const SortableHeader = ({ 
    children, 
    sortKey 
  }: { 
    children: React.ReactNode; 
    sortKey: keyof ProductionTransaction;
  }) => (
    <th className="px-4 py-3 text-left">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSort(sortKey)}
        className="h-auto p-0 font-medium hover:bg-transparent"
      >
        <span className="flex items-center gap-2">
          {children}
          {getSortIcon(sortKey)}
        </span>
      </Button>
    </th>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Produksi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Memuat data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Data Produksi</CardTitle>
            <Button onClick={onExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Tidak ada data transaksi produksi</p>
            <p className="text-sm text-gray-400 mt-1">
              {filters.search || filters.tanggalDari || filters.tanggalSampai || filters.pembeli || filters.status
                ? 'Coba ubah filter pencarian'
                : 'Tambahkan transaksi produksi pertama Anda'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Data Produksi ({transactions.length})</CardTitle>
          <Button onClick={onExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <SortableHeader sortKey="tanggal">Tanggal</SortableHeader>
                <SortableHeader sortKey="nopol">No. Polisi</SortableHeader>
                <SortableHeader sortKey="pembeli">Pembeli</SortableHeader>
                <SortableHeader sortKey="tujuan">Tujuan</SortableHeader>
                <SortableHeader sortKey="gross">Gross (Ton)</SortableHeader>
                <SortableHeader sortKey="tare">Tare (Ton)</SortableHeader>
                <SortableHeader sortKey="netto">Netto (Ton)</SortableHeader>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium w-20">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {formatDate(transaction.tanggal)}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {transaction.nopol}
                  </td>
                  <td className="px-4 py-3">
                    {transaction.pembeli}
                  </td>
                  <td className="px-4 py-3">
                    {transaction.tujuan}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatNumber(transaction.gross)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatNumber(transaction.tare)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    {formatNumber(transaction.netto)}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(transaction.status)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onView(transaction)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Lihat Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(transaction)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(transaction.id || '')}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Row */}
        <div className="mt-4 pt-4 border-t bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Transaksi:</span>
              <span className="ml-2 font-semibold">{transactions.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Gross:</span>
              <span className="ml-2 font-semibold">
                {formatNumber(transactions.reduce((sum, t) => sum + (t.gross || 0), 0))} Ton
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total Netto:</span>
              <span className="ml-2 font-semibold text-blue-600">
                {formatNumber(transactions.reduce((sum, t) => sum + (t.netto || 0), 0))} Ton
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component untuk mobile view (responsive table)
export function ProductionTableMobile({
  transactions,
  onEdit,
  onDelete,
  onView,
}: {
  transactions: ProductionTransaction[];
  onEdit: (transaction: ProductionTransaction) => void;
  onDelete: (id: string) => void;
  onView: (transaction: ProductionTransaction) => void;
}) {
  const formatNumber = (num: number | undefined | null, decimals: number = 3) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string | undefined) => {
    const statusConfig = {
      DRAFT: { label: 'Draft', variant: 'secondary' as const },
      SUBMITTED: { label: 'Submitted', variant: 'default' as const },
      APPROVED: { label: 'Approved', variant: 'default' as const },
      REJECTED: { label: 'Rejected', variant: 'destructive' as const },
    };

    const config = statusConfig[(status || 'DRAFT') as keyof typeof statusConfig] || statusConfig.DRAFT;
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <Card key={transaction.id} className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="font-semibold">{transaction.nopol}</div>
              <div className="text-sm text-gray-600">{formatDate(transaction.tanggal)}</div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(transaction.status)}
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onView(transaction)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Lihat Detail
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(transaction)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(transaction.id || '')}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Pembeli:</span>
              <span className="font-medium">{transaction.pembeli}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tujuan:</span>
              <span>{transaction.tujuan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gross:</span>
              <span className="font-mono">{formatNumber(transaction.gross)} Ton</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tare:</span>
              <span className="font-mono">{formatNumber(transaction.tare)} Ton</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600 font-medium">Netto:</span>
              <span className="font-mono font-semibold text-blue-600">
                {formatNumber(transaction.netto)} Ton
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}