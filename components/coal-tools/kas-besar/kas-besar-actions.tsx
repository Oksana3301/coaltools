'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// AlertDialog not available, using simple confirmation
import {
  Download,
  Upload,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';
import { KasBesarExpense } from '../types/kas-besar-types';

interface KasBesarActionsProps {
  // Bulk actions
  bulkEditMode: boolean;
  selectedExpenses: Set<string>;
  onToggleBulkEdit: () => void;
  onBulkDelete: () => void;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onSelectAll: (checked: boolean) => void;
  
  // Single actions
  onAdd: () => void;
  onRefresh: () => void;
  onExport: () => void;
  onImport: () => void;
  
  // Data
  expenses: KasBesarExpense[];
  isLoading?: boolean;
}

export function KasBesarActions({
  bulkEditMode,
  selectedExpenses,
  onToggleBulkEdit,
  onBulkDelete,
  onBulkApprove,
  onBulkReject,
  onSelectAll,
  onAdd,
  onRefresh,
  onExport,
  onImport,
  expenses,
  isLoading = false,
}: KasBesarActionsProps) {
  const selectedCount = selectedExpenses.size;
  const hasSelection = selectedCount > 0;

  const handleBulkDelete = () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedCount} pengeluaran yang dipilih?`)) {
      onBulkDelete();
    }
  };

  return (
    <>
      {/* Main Action Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Button onClick={onAdd} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tambah Pengeluaran
              </Button>
              
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onImport}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Excel
              </Button>
              
              <Button
                variant="outline"
                onClick={onExport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              
              <Button
                variant={bulkEditMode ? "default" : "outline"}
                onClick={onToggleBulkEdit}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                {bulkEditMode ? 'Selesai Edit' : 'Edit Massal'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Edit Bar */}
      {bulkEditMode && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCount === expenses.length && expenses.length > 0}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">
                    {selectedCount > 0 
                      ? `${selectedCount} item dipilih` 
                      : 'Pilih semua'
                    }
                  </span>
                </div>
                
                {selectedCount > 0 && (
                  <span className="text-sm text-gray-600">
                    dari {expenses.length} total item
                  </span>
                )}
              </div>

              {hasSelection && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onBulkApprove}
                    className="flex items-center gap-1 text-green-600 hover:text-green-700"
                  >
                    <Check className="h-4 w-4" />
                    Setujui ({selectedCount})
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onBulkReject}
                    className="flex items-center gap-1 text-orange-600 hover:text-orange-700"
                  >
                    <X className="h-4 w-4" />
                    Tolak ({selectedCount})
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus ({selectedCount})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}


    </>
  );
}

// Quick Actions Component for individual expense items
interface ExpenseQuickActionsProps {
  expense: KasBesarExpense;
  onEdit: (expense: KasBesarExpense) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDuplicate: (expense: KasBesarExpense) => void;
}

export function ExpenseQuickActions({
  expense,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onDuplicate,
}: ExpenseQuickActionsProps) {
  const handleDelete = () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pengeluaran "${expense.barang}"?`)) {
      onDelete(expense.id || '');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onEdit(expense)}>
            <Edit3 className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => onDuplicate(expense)}>
            <Plus className="mr-2 h-4 w-4" />
            Duplikasi
          </DropdownMenuItem>
          
          {expense.status === 'SUBMITTED' && (
            <>
              <DropdownMenuItem 
                onClick={() => onApprove(expense.id || '')}
                className="text-green-600"
              >
                <Check className="mr-2 h-4 w-4" />
                Setujui
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => onReject(expense.id || '')}
                className="text-orange-600"
              >
                <X className="mr-2 h-4 w-4" />
                Tolak
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>


    </>
  );
}