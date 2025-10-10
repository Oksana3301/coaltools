@echo off
echo ========================================
echo   COALTOOLS - AUTO PUSH TO GITHUB
echo   Repository: github.com/Oksana3301/coaltools
echo ========================================
echo.

REM Add Git to PATH
set PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\Git\bin

REM Check if Git is available
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git tidak ditemukan!
    echo.
    echo Solusi:
    echo 1. Download Git dari https://git-scm.com/download/win
    echo 2. Install dengan default settings
    echo 3. Restart komputer
    echo 4. Jalankan script ini lagi
    echo.
    pause
    exit /b 1
)

echo Git ditemukan! Melanjutkan...
echo.

REM Check if this is a git repository
if not exist ".git" (
    echo Initializing Git repository...
    git init
    git remote add origin https://github.com/Oksana3301/coaltools.git
    echo.
)

REM Add all changes
echo Adding all changes...
git add .

REM Commit with message
echo.
echo Committing changes...
git commit -m "feat: Enhanced invoice with half A4 portrait preview and fixed subpages linting

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
Deployed at: coaltools.vercel.app"

REM Push to GitHub
echo.
echo Pushing to GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ERROR: Push gagal!
    echo.
    echo Kemungkinan penyebab:
    echo 1. Belum login ke GitHub
    echo 2. Remote URL salah
    echo 3. Tidak ada akses ke repository
    echo.
    echo Solusi:
    echo 1. Jalankan: git config --global user.name "Oksana3301"
    echo 2. Jalankan: git config --global user.email "your-email@example.com"
    echo 3. Atau gunakan GitHub Desktop untuk push
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS! Code pushed to GitHub
echo   Repository: github.com/Oksana3301/coaltools
echo ========================================
echo.
echo Vercel akan otomatis deploy dalam 1-2 menit
echo Check status di: https://vercel.com/dashboard
echo.
pause


