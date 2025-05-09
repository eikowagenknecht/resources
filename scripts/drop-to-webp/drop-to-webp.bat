@echo off
setlocal enabledelayedexpansion

:: Set quality level and max width
set QUALITY=85
set MAX_WIDTH=1440

:: Check for arguments - if none, show help
if "%~1"=="" (
    call :ShowHelp
    exit /b 0
)

:: Check if ImageMagick is installed
where magick >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ImageMagick is not installed! Please install it from:
    echo https://imagemagick.org/script/download.php#windows
    pause
    exit /b 1
)

:: Process each file dropped onto the script
for %%f in (%*) do (
    echo Processing: "%%~nxf"
    
    :: Get image width using ImageMagick
    magick identify -format "%%w" "%%~ff" > temp.txt
    set /p WIDTH=<temp.txt
    del temp.txt
    
    :: Create temp filenames for both conversion methods
    set "TEMP_LOSSY=%%~dpnf_lossy_temp.webp"
    set "TEMP_LOSSLESS=%%~dpnf_lossless_temp.webp"
    set "OUTPUT=%%~dpnf.webp"
    
    :: Convert with resize if needed
    if !WIDTH! GTR %MAX_WIDTH% (
        echo Image width is !WIDTH!px - resizing to %MAX_WIDTH%px
        magick "%%~ff" -resize %MAX_WIDTH%x -quality %QUALITY% "!TEMP_LOSSY!"
        magick "%%~ff" -resize %MAX_WIDTH%x -define webp:lossless=true "!TEMP_LOSSLESS!"
    ) else (
        echo Image width is !WIDTH!px - converting without resize
        magick "%%~ff" -quality %QUALITY% "!TEMP_LOSSY!"
        magick "%%~ff" -define webp:lossless=true "!TEMP_LOSSLESS!"
    )
    
    :: Get file sizes
    for %%s in ("!TEMP_LOSSY!") do set LOSSY_SIZE=%%~zs
    for %%s in ("!TEMP_LOSSLESS!") do set LOSSLESS_SIZE=%%~zs
    
    echo Lossy size: !LOSSY_SIZE! bytes
    echo Lossless size: !LOSSLESS_SIZE! bytes
    
    :: Compare and keep the smaller one
    if !LOSSLESS_SIZE! LSS !LOSSY_SIZE! (
        echo Keeping lossless version ^(smaller^)
        copy "!TEMP_LOSSLESS!" "!OUTPUT!" > nul
    ) else (
        echo Keeping lossy version ^(smaller^)
        copy "!TEMP_LOSSY!" "!OUTPUT!" > nul
    )
    
    :: Clean up temp files
    del "!TEMP_LOSSY!" "!TEMP_LOSSLESS!"
    
    echo Saved as: "!OUTPUT!"
    echo.
)

echo Conversion complete!
echo.
pause
exit /b 0

:ShowHelp
echo ================================================================
echo                   WebP Image Converter Tool
echo ================================================================
echo.
echo  This script converts images to WebP format, automatically 
echo  choosing between lossy and lossless compression to get the
echo  smallest file size.
echo.
echo  USAGE:
echo    1. Drag and drop image file(s) onto this script, or
echo    2. Right-click image(s) and select "Send to" this script
echo.
echo  SETTINGS (can be modified in the script):
echo    - Quality level for lossy compression: 85
echo    - Maximum width: 1440px (larger images will be resized)
echo.
echo  REQUIREMENTS:
echo    - ImageMagick must be installed
echo.
echo  Press any key to exit...
pause > nul
exit /b 0