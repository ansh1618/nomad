$dir = "C:\Users\ansht\.gemini\antigravity-ide\brain\6676c100-1d67-4535-b1cf-7d514ce53228"
Get-ChildItem $dir -File | Where-Object { $_.Name -like "media__*" } | Sort-Object LastWriteTime -Descending | Select-Object -First 6 Name, Length, LastWriteTime | Format-Table -AutoSize
