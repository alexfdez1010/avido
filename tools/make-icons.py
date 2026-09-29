"""Generates the app icon set from the Fraunces font. Run: python3 tools/make-icons.py"""
from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, 'node_modules/@expo-google-fonts/fraunces/900Black_Italic/Fraunces_900Black_Italic.ttf')
OUT = os.path.join(ROOT, 'assets/images')
INK = (16, 14, 11, 255)
PAPER = (243, 237, 226, 255)
EMBER = (61, 214, 140, 255)


def glyph(size, scale, color, accent, bg=None):
    s = size * 4
    img = Image.new('RGBA', (s, s), bg or (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, int(s * 0.62 * scale))
    box = d.textbbox((0, 0), 'a', font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    x = (s - w) / 2 - box[0]
    y = (s - h) / 2 - box[1] + s * 0.07 * scale
    d.text((x, y), 'a', font=font, fill=color)
    cx, cy = s / 2 + s * 0.1 * scale, s / 2 - h / 2 - s * 0.075 * scale + s * 0.07 * scale
    L, T = s * 0.16 * scale, s * 0.055 * scale
    accent_img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ad = ImageDraw.Draw(accent_img)
    ad.rounded_rectangle((cx - L / 2, cy - T / 2, cx + L / 2, cy + T / 2), radius=T / 2, fill=accent)
    accent_img = accent_img.rotate(38, center=(cx, cy), resample=Image.BICUBIC)
    img.alpha_composite(accent_img)
    return img.resize((size, size), Image.LANCZOS)


glyph(1024, 1.0, PAPER, EMBER, INK).save(os.path.join(OUT, 'icon.png'))
glyph(1024, 0.62, PAPER, EMBER).save(os.path.join(OUT, 'android-icon-foreground.png'))
glyph(1024, 0.62, (255, 255, 255, 255), (255, 255, 255, 255)).save(os.path.join(OUT, 'android-icon-monochrome.png'))
glyph(512, 0.9, PAPER, EMBER).save(os.path.join(OUT, 'splash-icon.png'))
glyph(96, 1.0, (255, 255, 255, 255), (255, 255, 255, 255)).save(os.path.join(OUT, 'notification-icon.png'))
glyph(48, 1.0, PAPER, EMBER, INK).save(os.path.join(OUT, 'favicon.png'))
