Add-Type -AssemblyName System.Drawing

$p = "C:\Users\Jayce\.gemini\antigravity\brain\1aef2c25-81b2-4ed9-a40b-405152ac5a80\.user_uploaded\media_1794526364043_6b251458.png"
$img = [System.Drawing.Bitmap]::FromFile($p)
Write-Host "Width: $($img.Width), Height: $($img.Height)"
$img.Dispose()
