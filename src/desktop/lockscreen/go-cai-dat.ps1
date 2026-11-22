# Gỡ cập nhật màn hình khóa: xóa tác vụ, lối tắt Startup và thư mục app.
$AppDir = Join-Path $env:LOCALAPPDATA 'TetCountdown'
Unregister-ScheduledTask -TaskName 'TetCountdown' -Confirm:$false -ErrorAction SilentlyContinue
Remove-Item (Join-Path ([Environment]::GetFolderPath('Startup')) 'TetCountdown.lnk') -ErrorAction SilentlyContinue
Remove-Item $AppDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host 'Đã gỡ. Màn hình khóa giữ ảnh cuối cùng; đổi lại trong Settings > Personalization > Lock screen.'
