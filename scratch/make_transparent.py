from PIL import Image, ImageDraw

def make_circle_transparent(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size

    # Create a circular mask
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    
    # Draw white filled circle in mask (allowing 2px margin)
    cx, cy = width / 2, height / 2
    r = min(width, height) / 2 - 2
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)

    # Apply mask to image alpha channel
    r_ch, g_ch, b_ch, a_ch = img.split()
    
    # Combine original alpha or white background removal with circular mask
    final_alpha = mask
    
    # Create final transparent image
    transparent_img = Image.merge("RGBA", (r_ch, g_ch, b_ch, final_alpha))
    transparent_img.save(output_path, "PNG")
    print(f"Saved transparent circular PNG to {output_path}")

try:
    make_circle_transparent(
        "c:/Users/ansht/Downloads/wandernest-travels-launch-main/wandernest-travels-launch-main/public/images/gonomadik-round-emblem.png",
        "c:/Users/ansht/Downloads/wandernest-travels-launch-main/wandernest-travels-launch-main/public/images/gonomadik-round-emblem.png"
    )
    make_circle_transparent(
        "c:/Users/ansht/Downloads/wandernest-travels-launch-main/wandernest-travels-launch-main/public/images/gonomadik-round-emblem.png",
        "c:/Users/ansht/Downloads/wandernest-travels-launch-main/wandernest-travels-launch-main/public/images/gonomadik-g-monogram.png"
    )
    make_circle_transparent(
        "c:/Users/ansht/Downloads/wandernest-travels-launch-main/wandernest-travels-launch-main/public/images/gonomadik-round-emblem.png",
        "c:/Users/ansht/Downloads/wandernest-travels-launch-main/wandernest-travels-launch-main/public/favicon.png"
    )
except Exception as e:
    print("Error processing image:", e)
