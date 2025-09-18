'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Truck,
  Users,
  Target,
  Calendar,
  BarChart3,
  PieChart,
} from 'lucide-react';
import type { ProductionReport } from '@/lib/api';
import { ProductionTransaction, ProductionAnalytics, BuyerAnalytics, DailySummary } from '../types/production-types';

interface ProductionSummaryProps {
  transactions: ProductionTransaction[];
  analytics: ProductionAnalytics;
  buyerAnalytics: BuyerAnalytics[];
  dailySummary: DailySummary[];
  currentPeriod: string;
  monthlyTarget?: number;
}

export function ProductionSummary({
  transactions,
  analytics,
  buyerAnalytics,
  dailySummary,
  currentPeriod,
  monthlyTarget = 0,
}: ProductionSummaryProps) {
  const formatNumber = (num: number, decimals: number = 3) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTargetProgress = () => {
    if (!monthlyTarget || monthlyTarget === 0) return 0;
    return Math.min((analytics.totalNetto / monthlyTarget) * 100, 100);
  };

  const getTargetStatus = () => {
    const progress = getTargetProgress();
    if (progress >= 100) return { label: 'Target Tercapai', variant: 'default' as const, color: 'text-green-600' };
    if (progress >= 80) return { label: 'Hampir Tercapai', variant: 'secondary' as const, color: 'text-yellow-600' };
    if (progress >= 50) return { label: 'Dalam Progress', variant: 'secondary' as const, color: 'text-blue-600' };
    return { label: 'Perlu Ditingkatkan', variant: 'destructive' as const, color: 'text-red-600' };
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const targetStatus = getTargetStatus();

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Periode {currentPeriod}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Netto</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalNetto)} Ton</div>
            <p className="text-xs text-muted-foreground">
              Gross: {formatNumber(transactions.reduce((sum, t) => sum + (t.gross || 0), 0))} Ton
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Harian</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.averageDaily)} Ton</div>
            <p className="text-xs text-muted-foreground">
              Per hari aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Buyers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(transactions.map(t => t.pembeli)).size}</div>
            <p className="text-xs text-muted-foreground">
              Pembeli aktif
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Target Progress */}
      {monthlyTarget > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Target Bulanan
                </CardTitle>
                <CardDescription>
                  Progress pencapaian target produksi bulan ini
                </CardDescription>
              </div>
              <Badge variant={targetStatus.variant}>
                {targetStatus.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Realisasi: {formatNumber(analytics.totalNetto)} Ton</span>
                <span>Target: {formatNumber(monthlyTarget)} Ton</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    getTargetProgress() >= 100 ? 'bg-green-500' :
                    getTargetProgress() >= 80 ? 'bg-yellow-500' :
                    getTargetProgress() >= 50 ? 'bg-blue-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${getTargetProgress()}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className={targetStatus.color}>
                  {getTargetProgress().toFixed(1)}% tercapai
                </span>
                <span className="text-gray-600">
                  Sisa: {formatNumber(Math.max(0, monthlyTarget - analytics.totalNetto))} Ton
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Buyers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Top Buyers
            </CardTitle>
            <CardDescription>
              Pembeli dengan volume terbesar periode ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {buyerAnalytics.slice(0, 5).map((buyer, index) => {
                const percentage = analytics.totalNetto > 0 
                  ? ((buyer.totalNetto || buyer.netto || 0) / analytics.totalNetto) * 100 
                  : 0;
                
                return (
                  <div key={buyer.buyerName} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                        index === 2 ? 'bg-yellow-500' :
                        index === 3 ? 'bg-purple-500' : 'bg-gray-500'
                      }`} />
                      <div>
                        <div className="font-medium text-sm">{buyer.buyerName}</div>
                        <div className="text-xs text-gray-500">
                          {buyer.transactionCount} transaksi
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">
                        {formatNumber(buyer.totalNetto || buyer.netto || 0)} Ton
                      </div>
                      <div className="text-xs text-gray-500">
                          Avg: {formatNumber(buyer.averagePerTransaction || 0)} ton/transaksi • {percentage.toFixed(1)}%
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Daily Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Ringkasan Harian
            </CardTitle>
            <CardDescription>
              Produksi harian dalam 7 hari terakhir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailySummary.slice(-7).map((day) => {
                const dayName = new Date(day.date).toLocaleDateString('id-ID', {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit'
                });
                
                return (
                  <div key={day.date} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <div className="font-medium text-sm">{dayName}</div>
                      <div className="text-xs text-gray-500">
                        {day.transactionCount} transaksi
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">
                        {formatNumber(day.totalNetto || 0)} Ton
                      </div>
                      <div className="text-xs text-gray-500">
                        Avg: {formatNumber(day.averageNetto || 0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terbaru</CardTitle>
          <CardDescription>
            5 transaksi produksi terbaru
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((transaction) => {
              const date = new Date(transaction.tanggal).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
              
              return (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div>
                      <div className="font-medium text-sm">
                        {transaction.nopol} - {transaction.pembeli}
                      </div>
                      <div className="text-xs text-gray-500">
                        {date} • {transaction.tujuan}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">
                      {formatNumber(transaction.netto || 0)} Ton
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component untuk menampilkan summary dalam bentuk yang lebih compact
export function ProductionSummaryCompact({
  analytics,
  monthlyTarget = 0,
  transactions = [],
}: {
  analytics: ProductionAnalytics;
  monthlyTarget?: number;
  transactions?: ProductionTransaction[];
}) {
  const formatNumber = (num: number, decimals: number = 3) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const getTargetProgress = () => {
    if (!monthlyTarget || monthlyTarget === 0) return 0;
    return Math.min((analytics.totalNetto / monthlyTarget) * 100, 100);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">{analytics.totalTransactions}</div>
        <div className="text-sm text-blue-700">Transaksi</div>
      </div>
      
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-600">{formatNumber(analytics.totalNetto)}</div>
        <div className="text-sm text-green-700">Ton Netto</div>
      </div>
      
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <div className="text-2xl font-bold text-purple-600">{formatNumber(analytics.averageDaily)}</div>
        <div className="text-sm text-purple-700">Avg/Hari</div>
      </div>
      
      <div className="text-center p-4 bg-orange-50 rounded-lg">
        <div className="text-2xl font-bold text-orange-600">{new Set(transactions.map(t => t.pembeli)).size}</div>
        <div className="text-sm text-orange-700">Buyers</div>
      </div>
      
      {monthlyTarget > 0 && (
        <div className="col-span-2 md:col-span-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Target Progress</span>
            <span className="text-sm text-gray-600">{getTargetProgress().toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${getTargetProgress()}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}