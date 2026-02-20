# Script to generate app icons for multiple platforms
# يقوم بتوليد الأيقونات لجميع المنصات المطلوبة

param(
    [string]$SourceImage = ".\public\icon-mosque.png",
    [string]$OutputDir = ".\src-tauri\icons"
)

# Check if ImageMagick is installed
$magickAvailable = $null -ne (Get-Command convert -ErrorAction SilentlyContinue)

if (-not $magickAvailable) {
    Write-Host "⚠️ ImageMagick غير مثبت. سيتم محاولة السحب من الثنائيات المرفقة..." -ForegroundColor Yellow
    Write-Host "يرجى تثبيت ImageMagick من: https://imagemagick.org/script/download.php" -ForegroundColor Cyan
    exit 1
}

# Ensure output directories exist
$dirs = @(
    "$OutputDir",
    "$OutputDir\android",
    "$OutputDir\android\mipmap-mdpi",
    "$OutputDir\android\mipmap-hdpi",
    "$OutputDir\android\mipmap-xhdpi",
    "$OutputDir\android\mipmap-xxhdpi",
    "$OutputDir\android\mipmap-xxxhdpi"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

Write-Host "🎨 جاري توليد الأيقونات..." -ForegroundColor Cyan

# Android Icon Sizes (different densities)
$androidSizes = @{
    "mipmap-mdpi/ic_launcher.png" = "48x48"
    "mipmap-hdpi/ic_launcher.png" = "72x72"
    "mipmap-xhdpi/ic_launcher.png" = "96x96"
    "mipmap-xxhdpi/ic_launcher.png" = "144x144"
    "mipmap-xxxhdpi/ic_launcher.png" = "192x192"
}

# Generate Android icons
foreach ($file in $androidSizes.Keys) {
    $size = $androidSizes[$file]
    $outputPath = "$OutputDir\android\$file"
    
    try {
        & convert $SourceImage -resize $size`! -background none -gravity center -extent $size $outputPath
        Write-Host "✅ تم إنشاء: $file ($size)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ خطأ في إنشاء $file: $_" -ForegroundColor Red
    }
}

# Generate Windows ICO (multiple sizes in one file)
try {
    & convert $SourceImage `
        `( -clone 0 -resize 256x256 `) `
        `( -clone 0 -resize 128x128 `) `
        `( -clone 0 -resize 64x64 `) `
        `( -clone 0 -resize 48x48 `) `
        `( -clone 0 -resize 32x32 `) `
        `( -clone 0 -resize 16x16 `) `
        -delete 0 -colors 256 "$OutputDir\icon.ico"
    Write-Host "✅ تم إنشاء: icon.ico" -ForegroundColor Green
}
catch {
    Write-Host "❌ خطأ في إنشاء icon.ico: $_" -ForegroundColor Red
}

# Generate PNG icons with specific sizes
$pngSizes = @{
    "32x32.png" = "32x32"
    "128x128.png" = "128x128"
    "128x128@2x.png" = "256x256"
    "icon.png" = "512x512"
}

foreach ($file in $pngSizes.Keys) {
    $size = $pngSizes[$file]
    $outputPath = "$OutputDir\$file"
    
    try {
        & convert $SourceImage -resize $size`! -background none -gravity center -extent $size $outputPath
        Write-Host "✅ تم إنشاء: $file ($size)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ خطأ في إنشاء $file: $_" -ForegroundColor Red
    }
}

Write-Host "`n✨ تم إنشاء جميع الأيقونات بنجاح!" -ForegroundColor Green
Write-Host "📁 يمكنك العثور على الملفات في: $OutputDir" -ForegroundColor Cyan
