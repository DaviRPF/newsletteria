@echo off
echo.
echo ========================================
echo   ENVIAR NEWSLETTER MANUALMENTE
echo ========================================
echo.

if "%1"=="" (
    echo ERRO: Numero de telefone nao fornecido!
    echo.
    echo Uso: enviarNewsletter.bat [numero]
    echo Exemplo: enviarNewsletter.bat 558481843434
    echo.
    pause
    exit /b 1
)

echo Enviando newsletter para: %1
echo.
echo Aguarde...
echo.

cd /d "%~dp0\.."
node scripts/enviarNewsletterDireto.js %1

echo.
pause