@echo off
cls
echo.
echo ========================================
echo   COALTOOLS - SIMPLE PUSH TO GITHUB
echo ========================================
echo.
echo Repository: https://github.com/Oksana3301/coaltools
echo.
echo ========================================
echo.

echo STEP 1: Login ke GitHub CLI
echo.
echo Silakan ikuti instruksi untuk login:
echo 1. Pilih GitHub.com
echo 2. Pilih HTTPS
echo 3. Pilih Login with a web browser
echo 4. Copy token yang muncul
echo 5. Paste di browser dan approve
echo.
pause
echo.

"C:\Program Files\GitHub CLI\gh.exe" auth login

if errorlevel 1 (
    echo.
    echo ERROR: Login gagal!
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo STEP 2: Setup Repository
echo ========================================
echo.

REM Check if repo exists
"C:\Program Files\GitHub CLI\gh.exe" repo view Oksana3301/coaltools >nul 2>&1
if errorlevel 1 (
    echo Repository belum ada, membuat repository baru...
    "C:\Program Files\GitHub CLI\gh.exe" repo create Oksana3301/coaltools --public --description "CoalTools - Business Management System"
)

echo.
echo ========================================
echo STEP 3: Upload Files
echo ========================================
echo.

echo Mengupload semua perubahan ke GitHub...
echo Ini akan menggunakan GitHub web interface.
echo.

REM Open GitHub repo in browser for manual upload
"C:\Program Files\GitHub CLI\gh.exe" repo view Oksana3301/coaltools --web

echo.
echo ========================================
echo INSTRUKSI UPLOAD MANUAL:
echo ========================================
echo.
echo Browser sudah terbuka. Lakukan langkah berikut:
echo.
echo 1. Klik tombol "Add file" di kanan atas
echo 2. Klik "Upload files"
echo 3. Drag dan drop 6 file ini ke browser:
echo    - app\(with-sidebar)\invoice\page.tsx
echo    - app\(with-sidebar)\invoice\saved\page.tsx
echo    - app\(with-sidebar)\invoice\proofs\page.tsx
echo    - app\(with-sidebar)\kwitansi\saved\page.tsx
echo    - app\(with-sidebar)\kwitansi\proofs\page.tsx
echo    - CHANGES_SUMMARY.md
echo.
echo 4. Isi commit message dengan:
echo    "feat: Enhanced invoice with half A4 portrait preview"
echo.
echo 5. Klik "Commit changes"
echo.
echo 6. Vercel akan otomatis deploy dalam 1-2 menit!
echo.
echo ========================================
echo.
pause


