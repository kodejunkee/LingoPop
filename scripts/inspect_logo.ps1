Add-Type -AssemblyName System.Drawing

$p = "assets\mimiko-header-logo-clean.png"
$img = [System.Drawing.Bitmap]::FromFile($p)
Write-Host "mimiko-header-logo-clean.png: $($img.Width) x $($img.Height)"
$pCorner = $img.GetPixel(2, 2)
Write-Host "Corner: R=$($pCorner.R), G=$($pCorner.G), B=$($pCorner.B)"
$img.Dispose()
