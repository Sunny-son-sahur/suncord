; SUNCORD Windows Installer
; Professional installer with Install/Uninstall UI and path selection
; Similar to Vencord's installer experience

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"

; ---- General ----
Name "SUNCORD"
OutFile "suncord-setup.exe"
InstallDir "$LOCALAPPDATA\SUNCORD"
InstallDirRegKey HKCU "Software\SUNCORD" "InstallDir"
RequestExecutionLevel user
Unicode True

; ---- Version Info ----
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "SUNCORD"
VIAddVersionKey "FileDescription" "SUNCORD Installer"
VIAddVersionKey "LegalCopyright" "SUNCORD Team"
VIAddVersionKey "FileVersion" "1.0.0"

; ---- Interface Settings ----
!define MUI_ABORTWARNING

; ---- Welcome Page ----
!define MUI_WELCOMEPAGE_TITLE "Welcome to SUNCORD Installer"
!define MUI_WELCOMEPAGE_TEXT "SUNCORD is a lightweight Discord client modification with a built-in store for plugins and themes.$\r$\n$\r$\nFeatures:$\r$\n  - Store button in Discord's top-right corner$\r$\n  - Drag-and-drop plugin/theme installation$\r$\n  - Online store with Vencord-compatible themes$\r$\n  - Plugin API for developers$\r$\n$\r$\nClick Next to continue."

; ---- License Page ----
!define MUI_LICENSEPAGE_TEXT "Please review the license terms before installing SUNCORD."
!define MUI_LICENSEPAGE_CHECKBOX "I accept the terms of the license agreement"

; ---- Directory Page ----
!define MUI_DIRECTORYPAGE_TEXT_TOP "Choose where to install SUNCORD.$\r$\n$\r$\nThe installer will patch your Discord client at the selected location."
!define MUI_DIRECTORYPAGE_TEXT_DESTINATION "SUNCORD Installation Folder"

; ---- Install Page ----
!define MUI_INSTFILESPAGE_FINISHHEADER_TEXT "Installation Complete"
!define MUI_INSTFILESPAGE_FINISHHEADER_SUBTEXT "SUNCORD has been installed successfully!"

; ---- Finish Page ----
!define MUI_FINISHPAGE_RUN "notepad.exe"
!define MUI_FINISHPAGE_RUN_PARAMETERS "README.txt"
!define MUI_FINISHPAGE_TITLE "SUNCORD Installed!"
!define MUI_FINISHPAGE_TEXT "SUNCORD has been installed and your Discord client has been patched.$\r$\n$\r$\nLaunch Discord to see the Store button in the top-right corner.$\r$\n$\r$\nYou may need to restart Discord if it was running during installation."

; ---- Uninstaller ----
!define MUI_UNCONFIRMPAGE_TEXT_TOP "SUNCORD will be uninstalled and Discord will be restored to its original state."
!define MUI_UNCONFIRMPAGE_TEXT_LOCATION "SUNCORD Installation Folder"

; ---- Pages ----
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; ---- Languages ----
!insertmacro MUI_LANGUAGE "English"

; ---- Installer Sections ----

Section "SUNCORD Core (required)" SecCore
  SectionIn RO

  SetOutPath "$INSTDIR"

  ; Install all files
  File /r "dist\*.*"

  ; Store install path
  WriteRegStr HKCU "Software\SUNCORD" "InstallDir" "$INSTDIR"

  ; Write uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"

  ; Add to Add/Remove Programs
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SUNCORD" \
    "DisplayName" "SUNCORD"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SUNCORD" \
    "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SUNCORD" \
    "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SUNCORD" \
    "DisplayVersion" "1.0.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SUNCORD" \
    "Publisher" "SUNCORD Team"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SUNCORD" \
    "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SUNCORD" \
    "NoRepair" 1

  ; Get installed size
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SUNCORD" \
    "EstimatedSize" "$0"

  ; Create Start Menu shortcut
  CreateDirectory "$SMPROGRAMMS\SUNCORD"
  CreateShortCut "$SMPROGRAMMS\SUNCORD\SUNCORD.lnk" "$INSTDIR\suncord-launcher.bat"
  CreateShortCut "$SMPROGRAMMS\SUNCORD\Uninstall.lnk" "$INSTDIR\uninstall.exe"

  ; Create desktop shortcut
  CreateShortCut "$DESKTOP\SUNCORD.lnk" "$INSTDIR\suncord-launcher.bat"

  ; Create launcher batch file
  FileOpen $0 "$INSTDIR\suncord-launcher.bat" w
  FileWrite $0 '@echo off$\r$\n'
  FileWrite $0 'echo Starting SUNCORD...$\r$\n'
  FileWrite $0 'cd /d "$INSTDIR"$\r$\n'
  FileWrite $0 'node "$INSTDIR\dist\injector.js"$\r$\n'
  FileWrite $0 'pause$\r$\n'
  FileClose $0

  ; Create README
  FileOpen $0 "$INSTDIR\README.txt" w
  FileWrite $0 'SUNCORD v1.0.0$\r$\n'
  FileWrite $0 '================$\r$\n$\r$\n'
  FileWrite $0 'Installation complete!$\r$\n$\r$\n'
  FileWrite $0 'To use SUNCORD:$\r$\n'
  FileWrite $0 '1. Close Discord completely (check system tray)$\r$\n'
  FileWrite $0 '2. Run the SUNCORD launcher from Start Menu or Desktop$\r$\n'
  FileWrite $0 '3. Discord will start with SUNCORD loaded$\r$\n'
  FileWrite $0 '4. Look for the orange "Store" button in the top-right$\r$\n$\r$\n'
  FileWrite $0 'To uninstall:$\r$\n'
  FileWrite $0 '- Use the Uninstall shortcut in Start Menu$\r$\n'
  FileWrite $0 '- Or go to Settings > Apps > SUNCORD$\r$\n$\r$\n'
  FileWrite $0 'Support: https://github.com/suncord/suncord/issues$\r$\n'
  FileClose $0

SectionEnd

Section "Discord Patch" SecPatch
  ; Attempt to find and patch Discord
  DetailPrint "Looking for Discord installation..."

  ; Check common Discord paths
  ${If} "$LOCALAPPDATA\Discord" "==" ""
    ${AndIf} "$LOCALAPPDATA\DiscordCanary" "==" ""
    ${AndIf} "$LOCALAPPDATA\DiscordPTB" "==" ""
      MessageBox MB_ICONEXCLAMATION|MB_OK \
        "Discord not found in standard locations.$\r$\n$\r$\nPlease install Discord first, then re-run this installer.$\r$\n$\r$\nYou can also manually patch by running:$\r$\n  node $INSTDIR\scripts\inject.mjs"
  ${Else}
    DetailPrint "Discord found. Patching..."
    nsExec::ExecToLog 'node "$INSTDIR\scripts\inject.mjs"'
    ${If} $0 != 0
      MessageBox MB_ICONEXCLAMATION|MB_OK \
        "Automatic patching failed.$\r$\n$\r$\nPlease run manually:$\r$\n  node $INSTDIR\scripts\inject.mjs"
    ${Else}
      DetailPrint "Discord patched successfully!"
    ${EndIf}
  ${EndIf}
SectionEnd

Section "Start Menu Shortcuts" SecShortcuts
  CreateDirectory "$SMPROGRAMMS\SUNCORD"
  CreateShortCut "$SMPROGRAMMS\SUNCORD\SUNCORD.lnk" "$INSTDIR\suncord-launcher.bat"
  CreateShortCut "$SMPROGRAMMS\SUNCORD\Uninstall.lnk" "$INSTDIR\uninstall.exe"
  CreateShortCut "$SMPROGRAMMS\SUNCORD\README.lnk" "$INSTDIR\README.txt"
SectionEnd

; ---- Section Descriptions ----
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecCore} \
    "The core SUNCORD files required to run the client modification."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecPatch} \
    "Automatically patch your Discord client to load SUNCORD."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecShortcuts} \
    "Create Start Menu shortcuts for easy access."
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; ---- Uninstaller Section ----
Section "Uninstall"
  ; Restore Discord
  DetailPrint "Restoring Discord..."
  nsExec::ExecToLog 'node "$INSTDIR\scripts\inject.mjs" uninstall'

  ; Remove files
  RMDir /r "$INSTDIR"

  ; Remove Start Menu items
  RMDir /r "$SMPROGRAMMS\SUNCORD"

  ; Remove desktop shortcut
  Delete "$DESKTOP\SUNCORD.lnk"

  ; Remove registry keys
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SUNCORD"
  DeleteRegKey HKCU "Software\SUNCORD"

  ; Refresh shell icons
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
SectionEnd
