"""Build favicon.ico — white REXON orbit icon on black square."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "rexon-icon.png"
OUT_DIR = ROOT / "public" / "favicon"
APP_FAV = ROOT.parent / "Frontend-app" / "assets" / "images" / "favicon.png"


def on_black_square(icon: Image.Image) -> Image.Image:
    side = icon.size[0]
    bg = Image.new("RGBA", (side, side), (0, 0, 0, 255))
    bg.paste(icon, (0, 0), icon)
    return bg


def main() -> None:
    icon = on_black_square(Image.open(SRC).convert("RGBA"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    sizes = [16, 32, 48, 64, 128, 256]
    ico_images = []
    for s in sizes:
        resized = icon.resize((s, s), Image.Resampling.LANCZOS)
        path = OUT_DIR / f"favicon-{s}.png"
        resized.save(path, "PNG")
        ico_images.append(resized)
        print("wrote", path)

    ico_images[-1].save(
        OUT_DIR / "favicon.ico",
        format="ICO",
        sizes=[(s, s) for s in sizes],
    )
    print("wrote", OUT_DIR / "favicon.ico")

    app_icon = icon.resize((192, 192), Image.Resampling.LANCZOS)
    APP_FAV.parent.mkdir(parents=True, exist_ok=True)
    app_icon.save(APP_FAV, "PNG")
    print("wrote", APP_FAV)


if __name__ == "__main__":
    main()
