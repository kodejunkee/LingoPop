Add-Type -AssemblyName System.Drawing

$p = "assets\mimiko-hero-banner.png"
$img = [System.Drawing.Bitmap]::FromFile($p)
Write-Host "mimiko-hero-banner.png ($($img.Width) x $($img.Height))"
$tl = $img.GetPixel(2, 2)
$tr = $img.GetPixel($img.Width - 3, 2)
$bl = $img.GetPixel(2, $img.Height - 3)
$br = $img.GetPixel($img.Width - 3, $img.Height - 3)

Write-Host "TL: R=$($tl.R), G=$($tl.G), B=$($tl.B)"
Write-Host "TR: R=$($tr.R), G=$($tr.G), B=$($tr.B)"
Write-Host "BL: R=$($bl.R), G=$($bl.G), B=$($bl.B)"
Write-Host "BR: R=$($br.R), G=$($br.G), B=$($br.B)"

$img.Dispose()
