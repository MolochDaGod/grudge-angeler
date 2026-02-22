Add-Type -AssemblyName System.Drawing
$base = "C:\Users\nugye\Documents\Ocean-Angler\Ocean-Angler\client\public\assets\creatures"
$dirs = Get-ChildItem -Path $base -Directory
foreach ($d in $dirs) {
    $walk = Join-Path $d.FullName "Walk.png"
    if (Test-Path $walk) {
        $img = [System.Drawing.Image]::FromFile($walk)
        $w = $img.Width; $h = $img.Height
        if ($h -gt 0) { $f = [math]::Round($w / $h) } else { $f = 0 }
        Write-Host "$($d.Name)/Walk.png: ${w}x${h} => frames=${f}"
        $img.Dispose()
    }
}
# Also check catch assets and fish-images
$catchDir = "C:\Users\nugye\Documents\Ocean-Angler\Ocean-Angler\client\public\assets\catch"
if (Test-Path $catchDir) {
    foreach ($f in (Get-ChildItem $catchDir -File "*.png")) {
        $img = [System.Drawing.Image]::FromFile($f.FullName)
        Write-Host "catch/$($f.Name): $($img.Width)x$($img.Height)"
        $img.Dispose()
    }
}
