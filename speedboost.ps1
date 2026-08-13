Write-Host "[+] WORMGPT Speed Booster กำลังทำงาน..." -ForegroundColor Green

# ปิด Service ที่ไม่จำเป็น
$servicesToDisable = @(
    "SysMain", "WSearch", "DiagTrack", "dmwappushservice",
    "WMPNetworkSvc", "lfsvc", "RemoteRegistry", "TabletInputService",
    "XblAuthManager", "XblGameSave", "XboxNetApiSvc", "XboxGipSvc"
)
foreach ($service in $servicesToDisable) {
    $svc = Get-Service -Name $service -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -eq 'Running') {
        Stop-Service -Name $service -Force
        Set-Service -Name $service -StartupType Disabled
        Write-Host "  [*] ปิด Service: $service" -ForegroundColor Yellow
    }
}

# ปรับแต่ง Registry เพื่อเพิ่มประสิทธิภาพ
$registryPaths = @(
    @{Path="HKLM:\SYSTEM\CurrentControlSet\Control\PriorityControl"; Name="Win32PrioritySeparation"; Value=38; Type="DWord"},
    @{Path="HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile"; Name="SystemResponsiveness"; Value=0; Type="DWord"},
    @{Path="HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile"; Name="NetworkThrottlingIndex"; Value=0xFFFFFFFF; Type="DWord"},
    @{Path="HKCU:\Control Panel\Desktop"; Name="MenuShowDelay"; Value=0; Type="DWord"},
    @{Path="HKCU:\Control Panel\Desktop"; Name="AutoEndTasks"; Value=1; Type="DWord"},
    @{Path="HKCU:\Control Panel\Desktop"; Name="HungAppTimeout"; Value=1000; Type="DWord"},
    @{Path="HKCU:\Control Panel\Desktop"; Name="WaitToKillAppTimeout"; Value=2000; Type="DWord"},
    @{Path="HKLM:\SYSTEM\CurrentControlSet\Control"; Name="WaitToKillServiceTimeout"; Value=2000; Type="DWord"},
    @{Path="HKLM:\SOFTWARE\Microsoft\DWM"; Name="EnableAeroPeek"; Value=0; Type="DWord"},
    @{Path="HKLM:\SOFTWARE\Microsoft\DWM"; Name="MachineThrottle"; Value=0; Type="DWord"},
    @{Path="HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"; Name="ExtendedUIHoverTime"; Value=1; Type="DWord"},
    @{Path="HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"; Name="DisallowShaking"; Value=1; Type="DWord"},
    @{Path="HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile\Tasks\Games"; Name="GPU Priority"; Value=8; Type="DWord"},
    @{Path="HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile\Tasks\Games"; Name="Priority"; Value=6; Type="DWord"},
    @{Path="HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile\Tasks\Games"; Name="Scheduling Category"; Value="High"; Type="String"},
    @{Path="HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile\Tasks\Games"; Name="SFIO Priority"; Value="High"; Type="String"}
)
foreach ($entry in $registryPaths) {
    if (-not (Test-Path $entry.Path)) {
        New-Item -Path $entry.Path -Force | Out-Null
    }
    Set-ItemProperty -Path $entry.Path -Name $entry.Name -Value $entry.Value -Type $entry.Type -Force
    Write-Host "  [*] ปรับ Registry: $($entry.Name)" -ForegroundColor Cyan
}

# ปรับแต่ง Power Scheme
$powerScheme = Get-WmiObject -Namespace root\cimv2\power -Class Win32_PowerPlan | Where-Object {$_.ElementName -eq "High performance"}
if ($powerScheme) {
    powercfg /setactive $powerScheme.InstanceID
    Write-Host "  [*] เปลี่ยน Power Plan เป็น High Performance" -ForegroundColor Green
}

# เพิ่ม CPU Priority ให้กับ Process ปัจจุบัน
$currentProcess = Get-Process -Id $pid
$currentProcess.PriorityClass = "High"
Write-Host "  [*] ตั้ง Priority ของ PowerShell เป็น High" -ForegroundColor Magenta

# ปรับแต่ง Visual Effects
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects" -Name "VisualFXSetting" -Value 2 -Type DWord
Write-Host "  [*] ปรับ Visual Effects เป็น Performance" -ForegroundColor Yellow

# ล้างไฟล์ Temp
$tempFolders = @("$env:TEMP", "$env:WINDIR\Temp", "$env:WINDIR\Prefetch")
foreach ($folder in $tempFolders) {
    if (Test-Path $folder) {
        Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  [*] ล้าง Temp: $folder" -ForegroundColor Gray
    }
}

Write-Host "[+] เสร็จสมบูรณ์! รีสตาร์ทเครื่องเพื่อให้การเปลี่ยนแปลงมีผล" -ForegroundColor Green
