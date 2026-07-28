$teamDir = "c:\Users\ansht\Downloads\wandernest-travels-launch-main\wandernest-travels-launch-main\public\images\team"

$harshHd = "C:\Users\ansht\.gemini\antigravity-ide\brain\6676c100-1d67-4535-b1cf-7d514ce53228\media__1785227435077.jpg"
$anshHd = "C:\Users\ansht\.gemini\antigravity-ide\brain\6676c100-1d67-4535-b1cf-7d514ce53228\media__1785227455276.png"

Copy-Item $harshHd -Destination (Join-Path $teamDir "harsh-kumar-jha.jpg") -Force
Copy-Item $anshHd -Destination (Join-Path $teamDir "ansh-goyal.jpg") -Force

Write-Host "Exact HD Founder photos assigned correctly!"
