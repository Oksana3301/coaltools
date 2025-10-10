@echo off
setlocal enabledelayedexpansion
cls
color 0A
echo.
echo  ╔════════════════════════════════════════════════╗
echo  ║   COALTOOLS - AUTO PUSH TO GITHUB             ║
echo  ║   Repository: Oksana3301/coaltools            ║
echo  ╚════════════════════════════════════════════════╝
echo.

REM Set GitHub CLI path
set GH=C:\Program Files\GitHub CLI\gh.exe

echo [1/4] Checking GitHub CLI...
"%GH%" --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ✗ ERROR: GitHub CLI not found!
    pause
    exit /b 1
)
echo ✓ GitHub CLI ready
echo.

echo [2/4] Checking authentication...
"%GH%" auth status >nul 2>&1
if errorlevel 1 (
    echo ! You need to login first
    echo.
    echo Follow these steps:
    echo 1. Select: GitHub.com
    echo 2. Select: HTTPS
    echo 3. Select: Login with a web browser
    echo 4. Copy the code shown
    echo 5. Paste in browser and authorize
    echo.
    pause
    "%GH%" auth login
    if errorlevel 1 (
        color 0C
        echo ✗ Login failed!
        pause
        exit /b 1
    )
)
echo ✓ Authenticated
echo.

echo [3/4] Creating GitHub Gist with changes...
echo.
echo Creating a gist to share your code changes...

REM Create a summary file for gist
echo COALTOOLS UPDATE - Invoice Half A4 Portrait Enhancement > update_summary.txt
echo. >> update_summary.txt
echo Files Changed: >> update_summary.txt
echo - app/(with-sidebar)/invoice/page.tsx >> update_summary.txt
echo - app/(with-sidebar)/invoice/saved/page.tsx >> update_summary.txt
echo - app/(with-sidebar)/invoice/proofs/page.tsx >> update_summary.txt
echo - app/(with-sidebar)/kwitansi/saved/page.tsx >> update_summary.txt
echo - app/(with-sidebar)/kwitansi/proofs/page.tsx >> update_summary.txt
echo. >> update_summary.txt
echo Features: >> update_summary.txt
echo - Half A4 portrait invoice format >> update_summary.txt
echo - Preview modal before printing >> update_summary.txt
echo - Fixed all linting errors >> update_summary.txt
echo. >> update_summary.txt
echo Next Steps: >> update_summary.txt
echo 1. Download changed files from this gist >> update_summary.txt
echo 2. Upload to https://github.com/Oksana3301/coaltools >> update_summary.txt
echo 3. Vercel will auto-deploy >> update_summary.txt

"%GH%" gist create update_summary.txt CHANGES_SUMMARY.md --public --desc "CoalTools Update - Invoice Enhancement"
if errorlevel 1 (
    color 0E
    echo ! Gist creation had issues, but continuing...
)
echo.

echo [4/4] Opening GitHub repository...
"%GH%" repo view Oksana3301/coaltools --web
echo.

color 0A
echo  ╔════════════════════════════════════════════════╗
echo  ║              NEXT STEPS                       ║
echo  ╚════════════════════════════════════════════════╝
echo.
echo  Your browser should now be open at:
echo  https://github.com/Oksana3301/coaltools
echo.
echo  To upload your changes:
echo  ────────────────────────────────────────────────
echo  1. Click "Add file" → "Upload files"
echo.
echo  2. Drag these 5 files from your project folder:
echo     • app\(with-sidebar)\invoice\page.tsx
echo     • app\(with-sidebar)\invoice\saved\page.tsx  
echo     • app\(with-sidebar)\invoice\proofs\page.tsx
echo     • app\(with-sidebar)\kwitansi\saved\page.tsx
echo     • app\(with-sidebar)\kwitansi\proofs\page.tsx
echo.
echo  3. Commit message (copy this):
echo     feat: Enhanced invoice with half A4 portrait preview
echo.
echo  4. Click "Commit changes"
echo.
echo  5. Wait 1-2 minutes for Vercel to auto-deploy!
echo     Check: https://coaltools.vercel.app
echo.
echo  ────────────────────────────────────────────────
echo  Files are ready in your folder!
echo  ╚════════════════════════════════════════════════╝
echo.
pause


