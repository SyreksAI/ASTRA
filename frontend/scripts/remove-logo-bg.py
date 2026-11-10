"""Remove solid black background from RILORA PNG logos."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

BLACK_THRESHOLD = 42


def remove_black_bg(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r <= BLACK_THRESHOLD and g <= BLACK_THRESHOLD and b <= BLACK_THRESHOLD:
                px[x, y] = (0, 0, 0, 0)
    return img


def to_light_variant(img: Image.Image) -> Image.Image:
    """White glyph on transparent -> black glyph on transparent."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            lum = (r + g + b) / 3
            tone = int(max(0, min(255, lum)))
            px[x, y] = (0, 0, 0, tone if tone > 8 else a)
    return img


def process(path: Path, *, light: bool) -> None:
    raw = Image.open(path)
    out = remove_black_bg(raw)
    if light:
        out = to_light_variant(out)
    out.save(path, "PNG")
    print(f"ok {'light' if light else 'dark'}: {path}")


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    pub = root / "public"
    app = root.parent / "Frontend-app" / "assets" / "images"

    dark_files = [
        pub / "rilora-logo-dark.png",
        pub / "rilora-mark-dark.png",
        pub / "auth" / "rilora-logo.png",
        app / "rilora-logo-dark.png",
        app / "rilora-mark-dark.png",
    ]
    light_files = [
        pub / "rilora-logo.png",
        pub / "rilora-mark.png",
        app / "rilora-logo.png",
        app / "rilora-mark.png",
    ]

    for p in dark_files:
        if p.is_file():
            process(p, light=False)

    for p in light_files:
        if p.is_file():
            process(p, light=True)


if __name__ == "__main__":
    main()
