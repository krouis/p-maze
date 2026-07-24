import os
import sys

def main():
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("Pillow is not installed. Let's install it and generate the icons.")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow"])
        from PIL import Image, ImageDraw

    os.makedirs('public/icons', exist_ok=True)

    # 512x512 canvas
    img = Image.new('RGBA', (512, 512), color=(11, 12, 16, 255))
    draw = ImageDraw.Draw(img)

    # Draw cyan retro maze border
    draw.rectangle([64, 64, 448, 448], outline=(69, 243, 255, 255), width=24)
    # Inside decorative walls
    draw.rectangle([128, 128, 256, 384], outline=(197, 163, 255, 255), width=16)
    draw.rectangle([256, 128, 384, 256], outline=(197, 163, 255, 255), width=16)

    # Player yellow pixel block
    draw.rectangle([220, 220, 292, 292], fill=(255, 204, 0, 255), outline=(255, 234, 112, 255), width=6)
    
    # White eyes
    draw.rectangle([236, 240, 248, 252], fill=(255, 255, 255, 255))
    draw.rectangle([264, 240, 276, 252], fill=(255, 255, 255, 255))
    
    # Black pupils
    draw.rectangle([242, 246, 248, 252], fill=(0, 0, 0, 255))
    draw.rectangle([270, 246, 276, 252], fill=(0, 0, 0, 255))

    # Save 512px icon
    img.save('public/icons/icon-512.png')

    # Resize to 192px icon using NEAREST filter for crisp pixel art scaling
    img_192 = img.resize((192, 192), Image.Resampling.NEAREST)
    img_192.save('public/icons/icon-192.png')

    print("App icons generated successfully under public/icons/")

if __name__ == '__main__':
    main()
