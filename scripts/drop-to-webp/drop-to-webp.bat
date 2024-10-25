@echo off
setlocal enabledelayedexpansion

:: Set quality level and max width
set QUALITY=85
set MAX_WIDTH=1440

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
    
    :: Get image width using ImageMagick and store in temporary file
    magick identify -format "%%w" "%%~ff" > temp.txt
    set /p WIDTH=<temp.txt
    del temp.txt
    
    if !WIDTH! GTR %MAX_WIDTH% (
        echo Image width is !WIDTH!px - resizing to %MAX_WIDTH%px
        magick "%%~ff" -resize %MAX_WIDTH%x -quality %QUALITY% "%%~dpnf.webp"
    ) else (
        echo Image width is !WIDTH!px - converting without resize
        magick "%%~ff" -quality %QUALITY% "%%~dpnf.webp"
    )
)

echo.
echo Conversion complete!
echo.
pause
