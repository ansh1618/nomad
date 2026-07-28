Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\ansht\.gemini\antigravity-ide\brain\6676c100-1d67-4535-b1cf-7d514ce53228\media__1785226946442.png"
$srcImg = [System.Drawing.Image]::FromFile($sourcePath)

$w = $srcImg.Width
$h = $srcImg.Height

Write-Host "Source image width: $w, height: $h"

# Create public/images/team folder if it doesn't exist
$teamDir = "c:\Users\ansht\Downloads\wandernest-travels-launch-main\wandernest-travels-launch-main\public\images\team"
if (!(Test-Path $teamDir)) {
    New-Item -ItemType Directory -Path $teamDir -Force
}

# Crop 1: Harsh (Left photo in screenshot)
# Position roughly: x = 4.2% of width, y = 49.3% of height, width = 22.5% of width, height = 24.8% of height
$hX = [int]($w * 0.038)
$hY = [int]($h * 0.493)
$hW = [int]($w * 0.224)
$hH = [int]($h * 0.248)

$cropHarshRect = New-Object System.Drawing.Rectangle($hX, $hY, $hW, $hH)
$bmpHarsh = New-Object System.Drawing.Bitmap($hW, $hH)
$gHarsh = [System.Drawing.Graphics]::FromImage($bmpHarsh)
$gHarsh.DrawImage($srcImg, (New-Object System.Drawing.Rectangle(0, 0, $hW, $hH)), $cropHarshRect, [System.Drawing.GraphicsUnit]::Pixel)
$gHarsh.Dispose()

$harshPath = Join-Path $teamDir "harsh-kumar-jha.jpg"
$bmpHarsh.Save($harshPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmpHarsh.Dispose()

# Crop 2: Ansh (Right photo in screenshot)
# Position roughly: x = 53.5% of width, y = 49.3% of height, width = 22.5% of width, height = 24.8% of height
$aX = [int]($w * 0.534)
$aY = [int]($h * 0.493)
$aW = [int]($w * 0.224)
$aH = [int]($h * 0.248)

$cropAnshRect = New-Object System.Drawing.Rectangle($aX, $aY, $aW, $aH)
$bmpAnsh = New-Object System.Drawing.Bitmap($aW, $aH)
$gAnsh = [System.Drawing.Graphics]::FromImage($bmpAnsh)
$gAnsh.DrawImage($srcImg, (New-Object System.Drawing.Rectangle(0, 0, $aW, $aH)), $cropAnshRect, [System.Drawing.GraphicsUnit]::Pixel)
$gAnsh.Dispose()

$anshPath = Join-Path $teamDir "ansh-goyal.jpg"
$bmpAnsh.Save($anshPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmpAnsh.Dispose()

$srcImg.Dispose()
Write-Host "Founder photos successfully cropped and saved!"
