@echo off
REM Script de démarrage du serveur TechQueue pour Windows
REM Ce script démarre un serveur HTTP local sur le port 3000

echo.
echo 🚀 Démarrage du serveur TechQueue...
echo.

REM Vérifier Python
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Utilisation de Python
    echo 📡 Serveur démarré sur http://localhost:3000
    echo.
    echo Appuyez sur Ctrl+C pour arrêter le serveur
    echo ----------------------------------------
    python -m http.server 3000
    goto :eof
)

REM Vérifier Python3
where python3 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Utilisation de Python 3
    echo 📡 Serveur démarré sur http://localhost:3000
    echo.
    echo Appuyez sur Ctrl+C pour arrêter le serveur
    echo ----------------------------------------
    python3 -m http.server 3000
    goto :eof
)

REM Vérifier PHP
where php >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Utilisation de PHP
    echo 📡 Serveur démarré sur http://localhost:3000
    echo.
    echo Appuyez sur Ctrl+C pour arrêter le serveur
    echo ----------------------------------------
    php -S localhost:3000
    goto :eof
)

REM Vérifier Node.js/npx
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Utilisation de Node.js (npx serve)
    echo 📡 Serveur démarré sur http://localhost:3000
    echo.
    echo Appuyez sur Ctrl+C pour arrêter le serveur
    echo ----------------------------------------
    npx serve -p 3000
    goto :eof
)

echo ❌ Aucun serveur HTTP trouvé!
echo.
echo Veuillez installer l'un des outils suivants :
echo   - Python: https://www.python.org/downloads/
echo   - PHP: https://www.php.net/downloads
echo   - Node.js: https://nodejs.org/
pause
