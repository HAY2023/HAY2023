$ErrorActionPreference = "Stop"

Write-Host "Installing Git and pushing to GitHub..."

$gitExe = "C:\Program Files\Git\bin\git.exe"
if (-not (Test-Path $gitExe)) {
    Write-Host "Downloading Git..."
    $gitInstaller = "$env:TEMP\GitInstaller.exe"
    Invoke-WebRequest -Uri "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe" `
        -OutFile $gitInstaller -UseBasicParsing
    
    Write-Host "Installing Git..."
    Start-Process -FilePath $gitInstaller -ArgumentList '/VERYSILENT /NORESTART /NOCANCEL /SP-' -Wait
    Start-Sleep -Seconds 3
}

$env:Path = "$([Environment]::GetFolderPath([Environment+SpecialFolder]::ProgramFiles))\Git\bin;$([Environment]::GetFolderPath([Environment+SpecialFolder]::ProgramFiles))\Git\cmd;$env:Path"

Write-Host "Configuring Git..."
& $gitExe config --global user.name "Youcef"
& $gitExe config --global user.email "youcef@example.com"

cd "H:\sandouq-fatwa-main\sandouq-fatwa-main"

Write-Host "Initializing repository..."
if (-not (Test-Path ".git")) {
    & $gitExe init
}

Write-Host "Adding files..."
& $gitExe add .

Write-Host "Creating commit..."
$status = & $gitExe status --short
if ($status) {
    & $gitExe commit -m "Initial commit: Add Tauri desktop app config and CI/CD workflow"
}

Write-Host "Setting up remote..."
$remote = & $gitExe remote get-url origin 2>$null
if (-not $remote) {
    & $gitExe remote add origin "https://github.com/HAY2023/youcef-sandouq-fatwa.git"
}

& $gitExe branch -M main 2>$null

Write-Host "Pushing to GitHub (you may need to enter credentials)..."
& $gitExe push -u origin main

Write-Host "Creating tag v1.0.0..."
& $gitExe tag v1.0.0 2>$null
& $gitExe push origin v1.0.0

Write-Host ""
Write-Host "SUCCESS! Check:"
Write-Host "https://github.com/HAY2023/youcef-sandouq-fatwa/actions"
Write-Host ""
