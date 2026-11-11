@echo off
setlocal
cd /d "%~dp0"
py -3 -c "import sys" >nul 2>&1
if not errorlevel 1 (
    py -3 servidor-mvp.py --open
    goto :fin
)
if exist "%LocalAppData%\Programs\Python\Python313\python.exe" (
    "%LocalAppData%\Programs\Python\Python313\python.exe" servidor-mvp.py --open
    goto :fin
)
python -c "import sys" >nul 2>&1
if not errorlevel 1 (
    python servidor-mvp.py --open
    goto :fin
)
echo No se encontro una instalacion funcional de Python 3.
echo Instala Python desde https://www.python.org/downloads/ y vuelve a abrir este archivo.
:fin
pause
