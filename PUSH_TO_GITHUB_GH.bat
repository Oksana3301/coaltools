@echo off
echo ========================================
echo   COALTOOLS - AUTO PUSH TO GITHUB
echo   Using GitHub CLI
echo   Repository: github.com/Oksana3301/coaltools
echo ========================================
echo.

REM Set GitHub CLI path
set PATH=%PATH%;C:\Program Files\GitHub CLI

REM Check if GitHub CLI is available
"C:\Program Files\GitHub CLI\gh.exe" --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: GitHub CLI tidak ditemukan!
    pause
    exit /b 1
)

echo GitHub CLI ditemukan! Melanjutkan...
echo.

REM Login check
echo Checking authentication...
"C:\Program Files\GitHub CLI\gh.exe" auth status
if errorlevel 1 (
    echo.
    echo Anda perlu login terlebih dahulu.
    echo.
    "C:\Program Files\GitHub CLI\gh.exe" auth login
)

echo.
echo Membuat commit dan push ke GitHub...
echo.

REM Create commit using gh cli
"C:\Program Files\GitHub CLI\gh.exe" repo create Oksana3301/coaltools --public --source=. --remote=origin --push 2>nul

REM If repo already exists, just push
"C:\Program Files\GitHub CLI\gh.exe" repo sync

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


