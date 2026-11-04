@echo off
echo ===================================================
echo Memulai Flask Backend REST API SIOMAS...
echo URL: http://127.0.0.1:5000
echo Swagger Docs: http://127.0.0.1:5000/apidocs
echo Tekan Ctrl+C untuk menghentikan server.
echo ===================================================
cd /d "%~dp0Backend"
if exist "%~dp0.venv\Scripts\python.exe" (
    "%~dp0.venv\Scripts\python.exe" run.py
) else (
    "C:\Users\Lenovo\.venvs\siomas\Scripts\python.exe" run.py
)
pause
