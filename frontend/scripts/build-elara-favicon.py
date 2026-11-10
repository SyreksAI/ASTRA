"""Favicon from Astra icon (logoDark) — same mark as full wordmark."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "favicon"
REF_FILL = ROOT / "public" / "logoDark.png"
ICON_SPLIT = 295
LIGHT = (243, 244, 246)


def black_to_alpha(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r < 40 and g < 40 and b < 40:
                px[x, y] = (0, 0, 0, 0)
            else:
                px[x, y] = (r, g, b, 255)
    return im


def load_mark() -> Image.Image:
    ref = Image.open(REF_FILL).convert("RGBA")
    icon = ref.crop((0, 0, ICON_SPLIT, ref.height))
    icon = black_to_alpha(icon)
    px = icon.load()
    for y in range(icon.height):
        for x in range(icon.width):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (*LIGHT, a)
    return icon


def render(size: int) -> Image.Image:
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    mark = load_mark()
    pad = int(size * 0.12)
    target = size - pad * 2
    scale = target / max(mark.width, mark.height)
    nw, nh = int(mark.width * scale), int(mark.height * scale)
    mark = mark.resize((nw, nh), Image.Resampling.LANCZOS)
    bg.paste(mark, ((size - nw) // 2, (size - nh) // 2), mark)
    return bg


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for s in (16, 32, 48, 64, 128, 256):
        render(s).save(OUT / f"favicon-{s}.png")
    render(32).save(OUT / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    render(512).save(ROOT / "public" / "elara-icon.png")
    print("Elara favicon OK")


if __name__ == "__main__":
    main()
