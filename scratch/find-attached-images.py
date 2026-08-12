import os
import glob

brain_dir = r"C:\Users\ansht\.gemini\antigravity-ide\brain\feeea25d-2972-4837-ad8e-3eed290a6ba6"
print("Scanning brain dir for images:")
for f in os.listdir(brain_dir):
    if f.endswith(".png") or f.endswith(".jpg") or f.endswith(".jpeg") or f.endswith(".webp"):
        full_path = os.path.join(brain_dir, f)
        print(f, "->", os.path.getsize(full_path), "bytes")
