<#
  Vẽ ảnh "còn X ngày đến Tết" bằng Edge chạy ẩn rồi đặt làm màn hình khóa Windows.
  Thêm -Wallpaper để đặt luôn làm hình nền desktop (dùng khi không cài được Lively).
  Chạy bằng Windows PowerShell 5.1 (powershell.exe), không phải pwsh 7.
  Nhật ký: %LOCALAPPDATA%\TetCountdown\log.txt
#>
param([switch]$Wallpaper)

$ErrorActionPreference = 'Stop'
$AppDir = Join-Path $env:LOCALAPPDATA 'TetCountdown'
$Web    = Join-Path $AppDir 'web\index.html'
$Log    = Join-Path $AppDir 'log.txt'

function Write-Log($msg) {
    $line = '{0:yyyy-MM-dd HH:mm:ss}  {1}' -f (Get-Date), $msg
    Add-Content -Path $Log -Value $line -Encoding UTF8
    Write-Host $line
}

try {
    if (-not (Test-Path $Web)) { throw "Không thấy $Web. Chạy lại cai-dat.cmd." }

    # 1. Kích thước màn hình: độ phân giải thật + tỉ lệ phóng (125%, 150%...)
    Add-Type -AssemblyName System.Windows.Forms
    $logical = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $vc = Get-CimInstance Win32_VideoController | Where-Object CurrentHorizontalResolution | Select-Object -First 1
    $physW = if ($vc) { [int]$vc.CurrentHorizontalResolution } else { $logical.Width }
    $physH = if ($vc) { [int]$vc.CurrentVerticalResolution } else { $logical.Height }
    $scale = [math]::Round($physW / $logical.Width, 2)
    if ($scale -lt 1) { $scale = 1 }
    $w = [int]($physW / $scale); $h = [int]($physH / $scale)

    # 2. Chụp trang bằng Edge chạy ẩn (Edge có sẵn trên Windows 10/11)
    $edge = @(
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $edge) { throw 'Không tìm thấy Microsoft Edge.' }

    # Tên file đổi theo ngày: Windows giữ ảnh cũ nếu đặt lại đúng file cũ
    $out = Join-Path $AppDir ('lockscreen-{0:yyyyMMdd}.png' -f (Get-Date))
    $url = ([Uri]$Web).AbsoluteUri + '?mode=lock'
    $edgeArgs = @(
        '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
        "--user-data-dir=`"$AppDir\edge-profile`"",
        "--force-device-scale-factor=$scale",
        "--window-size=$w,$h",
        '--virtual-time-budget=4000',
        "--screenshot=`"$out`"",
        $url
    )
    Start-Process -FilePath $edge -ArgumentList $edgeArgs -Wait -WindowStyle Hidden
    if (-not (Test-Path $out)) { throw 'Edge không tạo được ảnh.' }
    Write-Log "Đã vẽ ảnh $out ($physW x $physH, scale $scale)"

    # Xóa ảnh các ngày trước
    Get-ChildItem $AppDir -Filter 'lockscreen-*.png' | Where-Object FullName -ne $out | Remove-Item -ErrorAction SilentlyContinue

    # 3. Đặt màn hình khóa qua Windows Runtime API
    Add-Type -AssemblyName System.Runtime.WindowsRuntime
    $null = [Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
    $null = [Windows.System.UserProfile.LockScreen,Windows.System.UserProfile,ContentType=WindowsRuntime]
    $ext = [System.WindowsRuntimeSystemExtensions].GetMethods()
    $asTaskOp = $ext | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
    $asTaskAct = $ext | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' } | Select-Object -First 1

    $op = [Windows.Storage.StorageFile]::GetFileFromPathAsync($out)
    $t = $asTaskOp.MakeGenericMethod([Windows.Storage.StorageFile]).Invoke($null, @($op))
    $t.Wait(-1) | Out-Null
    $t2 = $asTaskAct.Invoke($null, @([Windows.System.UserProfile.LockScreen]::SetImageFileAsync($t.Result)))
    $t2.Wait(-1) | Out-Null
    Write-Log 'Đã đặt màn hình khóa.'

    # 4. (Tùy chọn) Hình nền desktop tĩnh
    if ($Wallpaper) {
        Add-Type -TypeDefinition @'
using System.Runtime.InteropServices;
public static class TetWall {
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern bool SystemParametersInfo(int a, int b, string c, int d);
}
'@
        [TetWall]::SystemParametersInfo(20, 0, $out, 3) | Out-Null  # SPI_SETDESKWALLPAPER
        Write-Log 'Đã đặt hình nền desktop.'
    }
}
catch {
    Write-Log ('LỖI: ' + $_.Exception.Message)
    exit 1
}
