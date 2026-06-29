@echo off
echo ===================================================
echo             POS System Setup Wizard
echo ===================================================
echo.
echo Step 1: Installing dependencies...
echo This may take a moment. Please wait...
echo.
call npm install
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies. Please check your Node.js and Internet connection.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Step 2: Setting up PostgreSQL Database...
echo.
node scripts/setup.js

pause

