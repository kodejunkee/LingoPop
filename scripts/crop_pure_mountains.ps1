Add-Type -AssemblyName System.Drawing

$p = "C:\Users\Jayce\.gemini\antigravity\brain\1aef2c25-81b2-4ed9-a40b-405152ac5a80\.user_uploaded\media_1794526364043_6b251458.png"
$img = [System.Drawing.Bitmap]::FromFile($p)

# Pure mountain ridges without any text
$rect = New-Object System.Drawing.Rectangle(240, 368, 135, 65)
$crop = $img.Clone($rect, $img.PixelFormat)
$crop.Save("assets\mimiko-mountains-clean.png", [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose()
$img.Dispose()

Write-Host "Saved assets\mimiko-mountains-clean.png"
