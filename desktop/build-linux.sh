#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
: "${ZIG:=zig}"
"$ZIG" rc OfficeChat.rc OfficeChat.res
"$ZIG" cc OfficeChat.c OfficeChat.res -target x86_64-windows-gnu -O2 -s -Wl,/subsystem:windows -o OfficeChat.exe -lshell32 -luser32
mkdir -p build/OfficeChat-Windows/source
cp OfficeChat.exe README.txt LICENSE.txt build/OfficeChat-Windows/
cp OfficeChat.c OfficeChat.rc chat.ico build.cmd build-linux.sh build/OfficeChat-Windows/source/
(cd build/OfficeChat-Windows && sha256sum OfficeChat.exe > SHA256.txt)
(cd build && zip -qr OfficeChat-Windows.zip OfficeChat-Windows)
