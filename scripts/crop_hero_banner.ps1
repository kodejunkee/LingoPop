Add-Type -AssemblyName System.Drawing

$p = "C:\Users\Jayce\.gemini\antigravity\brain\1aef2c25-81b2-4ed9-a40b-405152ac5a80\.user_uploaded\media_1794526364043_6b251458.png"
$img = [System.Drawing.Bitmap]::FromFile($p)

# Let's crop the exact hero card area
# In mockup: left margin is ~35, right margin is ~380, top is ~130, bottom is ~280
$x = 35
$y = 125
$w = 345
$h = 158

$rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
$crop = $img.Clone($rect, $img.PixelFormat)
$crop.Save("assets\mimiko-hero-banner.png", [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose()

Write-Host "Saved assets\mimiko-hero-banner.png ($w x $h)"
$img.Dispose()
