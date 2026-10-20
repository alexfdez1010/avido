"""Package existing native screenshots and typography for Google Play."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "store/google-play"
OUT.mkdir(parents=True, exist_ok=True)
Image.open(ROOT / "assets/images/icon.png").convert("RGB").resize((512, 512), Image.Resampling.LANCZOS).save(OUT / "icon.png")

for language in ("es", "en"):
    target = OUT / language
    target.mkdir(exist_ok=True)
    for number, screen in enumerate(("home", "library", "reader", "stats", "trophies"), 1):
        Image.open(ROOT / f"site/assets/screenshots/{language}/{screen}.webp").convert("RGB").save(target / f"{number:02}-{screen}.png")
    graphic = Image.new("RGB", (1024, 500), "#f3ede2")
    draw = ImageDraw.Draw(graphic)
    display = ImageFont.truetype(str(ROOT / "site/assets/fonts/fraunces-black.ttf"), 94)
    body = ImageFont.truetype(str(ROOT / "site/assets/fonts/bricolage-regular.ttf"), 27)
    draw.text((64, 50), "ávido", font=display, fill="#171811")
    lines = ("Tu próximo", "vicio se lee.") if language == "es" else ("Your next obsession", "has pages.")
    headline = ImageFont.truetype(str(ROOT / "site/assets/fonts/fraunces-black.ttf"), 54 if language == "es" else 46)
    draw.multiline_text((68, 194), "\n".join(lines), font=headline, fill="#145b38", spacing=4)
    draw.text((68, 394), "Tus libros. Tu ritmo." if language == "es" else "Your books. Your pace.", font=body, fill="#58594e")
    icon = Image.open(ROOT / "assets/images/icon.png").convert("RGB").resize((250, 250), Image.Resampling.LANCZOS)
    graphic.paste(icon, (706, 125))
    graphic.save(target / "feature-graphic.png")

print("Prepared Google Play PNGs from existing native screenshots, icon and brand fonts.")
