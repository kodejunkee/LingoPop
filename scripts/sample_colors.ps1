Add-Type -AssemblyName System.Drawing

$p = "C:\Users\Jayce\.gemini\antigravity\brain\1aef2c25-81b2-4ed9-a40b-405152ac5a80\.user_uploaded\media_1794526364043_6b251458.png"
$img = [System.Drawing.Bitmap]::FromFile($p)

# Let's sample colors:
# Top left background (around x=50, y=50)
$c1 = $img.GetPixel(50, 50)
Write-Host "Top background (50,50): R=$($c1.R), G=$($c1.G), B=$($c1.B)" # hex

# Below hero, behind stat cards (around x=50, y=280)
$c2 = $img.GetPixel(50, 280)
Write-Host "Behind stat cards (50,280): R=$($c2.R), G=$($c2.G), B=$($c2.B)"

# Center of hero banner behind text (around x=60, y=180)
$c3 = $img.GetPixel(60, 180)
Write-Host "Behind hero text (60,180): R=$($c3.R), G=$($c3.G), B=$($c3.B)"

# Between hero text and mascot (around x=190, y=180)
$c4 = $img.GetPixel(190, 180)
Write-Host "Middle of hero (190,180): R=$($c4.R), G=$($c4.G), B=$($c4.B)"

# Background behind Continue Learning card (around x=50, y=480)
$c5 = $img.GetPixel(50, 480)
Write-Host "Bottom background (50,480): R=$($c5.R), G=$($c5.G), B=$($c5.B)"

$img.Dispose()
