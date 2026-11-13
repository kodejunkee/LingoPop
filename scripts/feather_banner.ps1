Add-Type -AssemblyName System.Drawing

$srcPath = "assets\mimiko-hero-banner.png"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$dest = New-Object System.Drawing.Bitmap($src.Width, $src.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$feather = 10

for ($y = 0; $y -lt $src.Height; $y++) {
    for ($x = 0; $x -lt $src.Width; $x++) {
        $p = $src.GetPixel($x, $y)
        
        # Calculate distance to nearest edge
        $distX = [Math]::Min($x, $src.Width - 1 - $x)
        $distY = [Math]::Min($y, $src.Height - 1 - $y)
        $dist = [Math]::Min($distX, $distY)
        
        $alpha = 255
        if ($dist -lt $feather) {
            $alpha = [int](($dist / [double]$feather) * 255)
        }
        
        $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
    }
}

$dest.Save("assets\mimiko-hero-banner-feathered.png", [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Dispose()
$src.Dispose()

Write-Host "Feathered banner saved to assets\mimiko-hero-banner-feathered.png"
