@echo off
echo ====================================
echo   Criando Usuario Davi - Newsletter
echo ====================================
echo.

cd /d "%~dp0.."
echo Diretorio atual: %CD%
echo.

echo Executando script Node.js...
node scripts/createUserDavi.js

echo.
echo ====================================
echo Script finalizado!
echo ====================================
pause