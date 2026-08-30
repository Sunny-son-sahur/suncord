; SUNCORD Windows Installer — minimal, works on Linux NSIS cross-compiler

!include "MUI2.nsh"

Name "SUNCORD"
OutFile "suncord-setup.exe"
InstallDir "$LOCALAPPDATA\SUNCORD"
InstallDirRegKey HKCU "Software\SUNCORD" "InstallDir"
RequestExecutionLevel user

!define MUI_ABORTWARNING

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

; Install section
Section "SUNCORD Core" SecCore
  SectionIn RO
  SetOutPath "$INSTDIR"

  ; Install dist files
  File /r "dist\*.*"

  ; Install scripts
  File "scripts\inject.mjs"
  File "scripts\suncord.sh"

  ; Save install path
  WriteRegStr HKCU "Software\SUNCORD" "InstallDir" "$INSTDIR"

  ; Write uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"

  ; Add/Remove Programs entry
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SUNCORD" "DisplayName" "SUNCORD"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SUNCORD" "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SUNCORD" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SUNCORD" "DisplayVersion" "1.0.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SUNCORD" "Publisher" "SUNCORD Team"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SUNCORD" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SUNCORD" "NoRepair" 1

  ; Start Menu
  CreateDirectory "$SMPROGRAMMS\SUNCORD"
  CreateShortCut "$SMPROGRAMMS\SUNCORD\SUNCORD.lnk" "$INSTDIR\suncord-launcher.bat"
  CreateShortCut "$SMPROGRAMMS\SUNCORD\Uninstall.lnk" "$INSTDIR\uninstall.exe"

  ; Desktop shortcut
  CreateShortCut "$DESKTOP\SUNCORD.lnk" "$INSTDIR\suncord-launcher.bat"

  ; Launcher batch
  FileOpen $0 "$INSTDIR\suncord-launcher.bat" w
  FileWrite $0 '@echo off$\r$\n'
  FileWrite $0 'echo Starting SUNCORD...$\r$\n'
  FileWrite $0 'cd /d "$INSTDIR"$\r$\n'
  FileWrite $0 'node dist\injector.js$\r$\n'
  FileWrite $0 'pause$\r$\n'
  FileClose $0
SectionEnd

; Uninstaller
Section "Uninstall"
  ; Remove files
  RMDir /r "$INSTDIR"

  ; Remove shortcuts
  RMDir /r "$SMPROGRAMMS\SUNCORD"
  Delete "$DESKTOP\SUNCORD.lnk"

  ; Remove registry
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SUNCORD"
  DeleteRegKey HKCU "Software\SUNCORD"
SectionEnd
