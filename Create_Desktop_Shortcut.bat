@echo off
echo Creating One-Flow Desktop Shortcut...

set "SCRIPT_DIR=%~dp0"
powershell -NoProfile -Command "$desktop = [Environment]::GetFolderPath('Desktop'); $wshell = New-Object -ComObject WScript.Shell; $shortcut = $wshell.CreateShortcut($desktop + '\One-Flow.lnk'); $shortcut.TargetPath = '%SCRIPT_DIR%index.html'; $shortcut.IconLocation = '%SCRIPT_DIR%assets\icon.ico'; $shortcut.Save()"

echo.
echo One-Flow shortcut created successfully on your Desktop!
echo.
pause
