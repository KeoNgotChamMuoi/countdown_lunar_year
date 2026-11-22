<#
  Cài cập nhật màn hình khóa hằng ngày. Không cần quyền admin.
  - Chép giao diện (src/pwa) vào %LOCALAPPDATA%\TetCountdown\web
  - Tạo tác vụ "TetCountdown" chạy 00:01 mỗi ngày (chạy bù nếu máy tắt lúc đó)
  - Tạo lối tắt trong Startup để chạy mỗi lần đăng nhập
  Tham số -Wallpaper: đặt luôn ảnh tĩnh làm hình nền desktop.
#>
param([switch]$Wallpaper)

$ErrorActionPreference = 'Stop'
$Here   = Split-Path -Parent $MyInvocation.MyCommand.Path
$Pwa    = Resolve-Path (Join-Path $Here '..\..\pwa')
$AppDir = Join-Path $env:LOCALAPPDATA 'TetCountdown'
$Script = Join-Path $AppDir 'cap-nhat.ps1'

New-Item -ItemType Directory -Force -Path (Join-Path $AppDir 'web') | Out-Null
Copy-Item -Path (Join-Path $Pwa '*') -Destination (Join-Path $AppDir 'web') -Recurse -Force
Copy-Item -Path (Join-Path $Here 'cap-nhat.ps1') -Destination $Script -Force
Write-Host "Đã chép app vào $AppDir"

$psArgs = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$Script`""
if ($Wallpaper) { $psArgs += ' -Wallpaper' }

# Tác vụ hằng ngày
$action   = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $psArgs
$trigger  = New-ScheduledTaskTrigger -Daily -At '00:01'
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
Register-ScheduledTask -TaskName 'TetCountdown' -Action $action -Trigger $trigger -Settings $settings -Description 'Cập nhật màn hình khóa đếm ngày đến Tết' -Force | Out-Null
Write-Host 'Đã tạo tác vụ TetCountdown (00:01 mỗi ngày).'

# Chạy khi đăng nhập: lối tắt trong Startup (không cần admin)
$startup = [Environment]::GetFolderPath('Startup')
$lnk = (New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $startup 'TetCountdown.lnk'))
$lnk.TargetPath = 'powershell.exe'
$lnk.Arguments = $psArgs
$lnk.WindowStyle = 7
$lnk.Save()
Write-Host 'Đã thêm vào Startup.'

# Chạy ngay lần đầu
$extra = @()
if ($Wallpaper) { $extra += '-Wallpaper' }
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Script @extra
