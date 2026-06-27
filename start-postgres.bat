@echo off
echo ===================================================
echo     POS System: Starting PostgreSQL Service
echo ===================================================
echo.
echo Attempting to start the PostgreSQL service (postgresql-x64-18)
echo with Administrator privileges...
echo.
powershell -Command "Start-Process cmd -ArgumentList '/c net start \"postgresql-x64-18\"' -Verb RunAs"
echo.
echo If a UAC prompt appeared, please click "Yes" to start the service.
echo.
pause
