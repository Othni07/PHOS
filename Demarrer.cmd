@echo off
rem Lanceur double-clic : demarre le serveur et ouvre la regie.
rem Laisser cette fenetre ouverte pendant tout le culte : la fermer coupe
rem la projection et l'overlay OBS.

cd /d "%~dp0"
title Projecteur - serveur (ne pas fermer)

echo.
echo   Projecteur
echo   ----------
echo   Regie      : http://localhost:5173/console
echo   Projection : http://localhost:5173/projection
echo   Overlay OBS: http://localhost:5173/overlay
echo.
echo   Fermer cette fenetre arrete la projection.
echo.

rem Le navigateur s'ouvre une fois le serveur pret.
start "" /b cmd /c "timeout /t 4 /nobreak >nul && start "" http://localhost:5173/console"

call npm run dev

rem Si on arrive ici, le serveur s'est arrete : garder la fenetre ouverte
rem pour que le message d'erreur reste lisible.
echo.
echo   Le serveur s'est arrete.
pause
