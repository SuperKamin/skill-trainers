# Draws the app icons (yellow circle + lightning bolt on the ink background).
# Run from the project folder:  python tools/make_icons.py   (needs Pillow)
from pathlib import Path
from PIL import Image, ImageDraw

INK, GO = (0x12, 0x13, 0x1F), (0xFF, 0xB6, 0x27)
OUT = Path(__file__).resolve().parent.parent
SS = 4  # supersample for smooth edges

# Bolt in unit coordinates, relative to the circle's bounding box.
BOLT = [(0.58, 0.16), (0.30, 0.56), (0.47, 0.56), (0.41, 0.85), (0.71, 0.43), (0.53, 0.43), (0.60, 0.16)]


def icon(size, circle_frac):
    big = size * SS
    img = Image.new('RGB', (big, big), INK)
    d = ImageDraw.Draw(img)
    r = big * circle_frac / 2
    c = big / 2
    d.ellipse((c - r, c - r, c + r, c + r), fill=GO)
    x0, y0, w = c - r, c - r, 2 * r
    d.polygon([(x0 + px * w, y0 + py * w) for px, py in BOLT], fill=INK)
    return img.resize((size, size), Image.LANCZOS)


icon(192, 0.74).save(OUT / 'icon-192.png', optimize=True)
icon(512, 0.74).save(OUT / 'icon-512.png', optimize=True)
icon(180, 0.70).save(OUT / 'apple-touch-icon.png', optimize=True)
icon(512, 0.56).save(OUT / 'icon-maskable-512.png', optimize=True)  # stays inside the 80% safe zone
print('icons written to', OUT)
