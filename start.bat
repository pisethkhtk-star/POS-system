@echo off
echo ===================================================
echo       Starting POS System Development Server
echo ===================================================
echo.

if not exist node_modules (
    echo [WARNING] node_modules directory not found!
    echo Please run "setup.bat" first to install dependencies and configure the database.
    echo.
    pause
    exit /b 1
)

if not exist .env (
    echo [WARNING] .env file not found!
    echo Please run "setup.bat" first to configure your database connection.
    echo.
    pause
    exit /b 1
)

echo Starting Next.js server...
cmd /c npm run dev
pause

