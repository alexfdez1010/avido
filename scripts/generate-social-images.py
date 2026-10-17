"""Regenerate the launch sharing images with Pillow and the bundled brand fonts."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, PngImagePlugin

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'site/assets'
PAPER, INK, GREEN = '#f3ede2', '#171811', '#3dd68c'

def font(name, size):
    return ImageFont.truetype(str(ASSETS / 'fonts' / name), size)

for language, lines, subtitle in [
    ('es', ['Tu próximo', 'vicio se', 'lee'], 'Tus libros · Tu ritmo · Tu privacidad'),
    ('en', ['Your next', 'obsession', 'has pages'], 'Your books · Your pace · Your privacy'),
]:
    image = Image.new('RGB', (1200, 630), PAPER)
    draw = ImageDraw.Draw(image)
    icon = Image.open(ASSETS / 'icon.png').convert('RGBA').resize((48, 48))
    image.paste(icon, (58, 38), icon)
    draw.text((119, 33), 'ávido', font=font('fraunces-black.ttf', 45), fill=INK)
    draw.text((58, 126), lines[0], font=font('fraunces-black.ttf', 84), fill=INK)
    draw.text((58, 222), lines[1], font=font('fraunces-black.ttf', 84), fill=INK)
    draw.text((58, 320), lines[2], font=font('fraunces-italic.ttf', 88), fill='#145b38')
    draw.text((61, 462), subtitle, font=font('bricolage-regular.ttf', 24), fill=INK)
    draw.rounded_rectangle((58, 523, 650, 581), radius=8, fill=INK)
    label = 'Gratis para Android · Código abierto' if language == 'es' else 'Free for Android · Open source'
    draw.text((80, 537), label, font=font('bricolage-bold.ttf', 24), fill=PAPER)
    draw.rectangle((804, 0, 1200, 630), fill=GREEN)
    shot = Image.open(ASSETS / 'app-home.webp').convert('RGB')
    shot.thumbnail((245, 550))
    image.paste(shot, (878, 40))
    provenance = 'Code-rendered Ávido launch artwork; real Android demonstration screenshot app-home.webp; self-hosted Fraunces/Bricolage fonts; scripts/generate-social-images.py'
    metadata = PngImagePlugin.PngInfo()
    metadata.add_text('Description', provenance)
    image.save(ASSETS / f'og-{language}.png', pnginfo=metadata, optimize=True)
    print(f'Created og-{language}.png (1200 x 630)')
