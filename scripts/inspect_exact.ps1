Add-Type -AssemblyName System.Drawing

$p = "C:\Users\Jayce\.gemini\antigravity\brain\1aef2c25-81b2-4ed9-a40b-405152ac5a80\.user_uploaded\media_1794526364043_6b251458.png"
$img = [System.Drawing.Bitmap]::FromFile($p)

# Total size: 415 x 491
# Let's inspect coordinates:
# Header logo: x=40 to 180, y=60 to 110
# Notification bell: x=330 to 380, y=65 to 115
# Hero text: x=45 to 180, y=125 to 260
# Hero mascot: x=190 to 380, y=120 to 280
# Stat cards: y=285 to 350
# Continue learning card: y=365 to 475

Write-Host "Image Width: $($img.Width), Height: $($img.Height)"

# Crop Header Logo directly from the mockup!
$logoRect = New-Object System.Drawing.Rectangle(44, 70, 155, 48)
$logoCrop = $img.Clone($logoRect, $img.PixelFormat)
$logoCrop.Save("assets\mimiko-header-logo-clean.png", [System.Drawing.Imaging.ImageFormat]::Png)
$logoCrop.Dispose()
Write-Host "Saved mimiko-header-logo-clean.png"

# Crop the ENTIRE Hero section (text + clouds + mascot) to see what it is
$heroRect = New-Object System.Drawing.Rectangle(20, 120, 375, 155)
$heroCrop = $img.Clone($heroRect, $img.PixelFormat)
$heroCrop.Save("assets\test_full_hero.png", [System.Drawing.Imaging.ImageFormat]::Png)
$heroCrop.Dispose()
Write-Host "Saved test_full_hero.png"

# Crop just the Mascot with clouds
$mascotRect = New-Object System.Drawing.Rectangle(190, 120, 195, 160)
$mascotCrop = $img.Clone($mascotRect, $img.PixelFormat)
$mascotCrop.Save("assets\test_mascot_clouds.png", [System.Drawing.Imaging.ImageFormat]::Png)
$mascotCrop.Dispose()
Write-Host "Saved test_mascot_clouds.png"

$img.Dispose()
