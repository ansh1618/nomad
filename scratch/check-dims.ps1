Add-Type -AssemblyName System.Drawing

$f1 = "C:\Users\ansht\.gemini\antigravity-ide\brain\6676c100-1d67-4535-b1cf-7d514ce53228\media__1785227455276.png"
$img1 = [System.Drawing.Image]::FromFile($f1)
Write-Host "File 1 (png): Width $($img1.Width), Height $($img1.Height)"
$img1.Dispose()

$f2 = "C:\Users\ansht\.gemini\antigravity-ide\brain\6676c100-1d67-4535-b1cf-7d514ce53228\media__1785227435077.jpg"
$img2 = [System.Drawing.Image]::FromFile($f2)
Write-Host "File 2 (jpg): Width $($img2.Width), Height $($img2.Height)"
$img2.Dispose()
