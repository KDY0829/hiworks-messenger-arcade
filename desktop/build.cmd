@echo off
cd /d "%~dp0"
where zig >nul 2>nul
if errorlevel 1 (
  echo Install Zig 0.12 or newer from https://ziglang.org/download/ and add it to PATH.
  pause
  exit /b 1
)
zig rc OfficeChat.rc OfficeChat.res
if errorlevel 1 exit /b 1
zig cc OfficeChat.c OfficeChat.res -target x86_64-windows-gnu -O2 -s -Wl,/subsystem:windows -o OfficeChat.exe -lshell32 -luser32
if errorlevel 1 exit /b 1
echo Built OfficeChat.exe
pause
