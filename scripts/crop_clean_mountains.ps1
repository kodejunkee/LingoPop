Add-Type -AssemblyName System.Drawing

$p = "C:\Users\Jayce\.gemini\antigravity\brain\1aef2c25-81b2-4ed9-a40b-405152ac5a80\.user_uploaded\media_1794526364043_6b251458.png"
$img = [System.Drawing.Bitmap]::FromFile($p)

# In img (415 x 491):
# Continue Learning card bounds:
# x=45 to 375, y=360 to 480
# Mountain ridges are in x=210 to 375, y=365 to 440
$crop = $img.Clone((New-Object System.Drawing.Rectangle(220, 368, 155, 62)), $img.PixelFormat)
$crop.Save("assets\test_clean_mountains.png", [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose()

Write-Host "Saved test_clean_mountains.png"
$img.Dispose()
