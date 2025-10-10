# COALTOOLS - AUTO PUSH TO GITHUB
# Repository: github.com/Oksana3301/coaltools

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COALTOOLS - AUTO PUSH TO GITHUB" -ForegroundColor Cyan
Write-Host "  Repository: github.com/Oksana3301/coaltools" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Add Git to PATH
$env:PATH += ";C:\Program Files\Git\cmd;C:\Program Files\Git\bin"

# Check if Git is available
try {
    $gitVersion = git --version 2>&1
    Write-Host "Git ditemukan: $gitVersion" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR: Git tidak ditemukan!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solusi:" -ForegroundColor Yellow
    Write-Host "1. Download Git dari https://git-scm.com/download/win"
    Write-Host "2. Install dengan default settings"
    Write-Host "3. Restart komputer"
    Write-Host "4. Jalankan script ini lagi"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if this is a git repository
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    git remote add origin https://github.com/Oksana3301/coaltools.git
    Write-Host ""
}

# Add all changes
Write-Host "Adding all changes..." -ForegroundColor Cyan
git add .

# Commit with message
Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Cyan
$commitMessage = @"
feat: Enhanced invoice with half A4 portrait preview and fixed subpages linting

INVOICE ENHANCEMENTS:
- Added half A4 portrait format (210mm x 148.5mm) for invoice printing
- Implemented preview modal before printing/downloading
- Optimized font sizes and spacing for smaller page format
- Fixed page constraints and overflow issues
- Maintained backward compatibility with all existing features

SUBPAGES FIXES:
- Fixed unused imports in invoice/saved, invoice/proofs
- Fixed unused imports in kwitansi/saved, kwitansi/proofs
- Removed unused state variables (editingInvoice, editingKwitansi)
- Fixed useEffect dependency warnings with useCallback
- Improved code quality and removed all linter errors

FILES MODIFIED:
- app/(with-sidebar)/invoice/page.tsx (2241 lines)
- app/(with-sidebar)/invoice/saved/page.tsx
- app/(with-sidebar)/invoice/proofs/page.tsx
- app/(with-sidebar)/kwitansi/saved/page.tsx
- app/(with-sidebar)/kwitansi/proofs/page.tsx

FEATURES ADDED:
- Preview modal with exact size representation
- Half A4 portrait printing (saves paper)
- Better print dialog UX
- Cleaner codebase (no linting errors)

TESTED: All existing features work without breaking changes
Deployed at: coaltools.vercel.app
"@

git commit -m $commitMessage

# Push to GitHub
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan

try {
    git push -u origin main 2>&1
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  SUCCESS! Code pushed to GitHub" -ForegroundColor Green
    Write-Host "  Repository: github.com/Oksana3301/coaltools" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vercel akan otomatis deploy dalam 1-2 menit" -ForegroundColor Yellow
    Write-Host "Check status di: https://vercel.com/dashboard" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "ERROR: Push gagal!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Kemungkinan penyebab:" -ForegroundColor Yellow
    Write-Host "1. Belum login ke GitHub"
    Write-Host "2. Remote URL salah"
    Write-Host "3. Tidak ada akses ke repository"
    Write-Host ""
    Write-Host "Solusi:" -ForegroundColor Yellow
    Write-Host '1. Jalankan: git config --global user.name "Oksana3301"'
    Write-Host '2. Jalankan: git config --global user.email "your-email@example.com"'
    Write-Host "3. Atau gunakan GitHub Desktop untuk push"
    Write-Host ""
    
    Read-Host "Press Enter to exit"
    exit 1
}

Read-Host "Press Enter to exit"


