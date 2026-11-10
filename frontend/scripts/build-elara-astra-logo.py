"""Elara wordmark — same layout & style as Astra (logoDark / logo.png), text «Elara»."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public"
REF_FILL = PUB / "logoDark.png"
REF_OUTLINE = PUB / "logo.png"

CANVAS = (1169, 396)
# Measured from logoDark.png: icon ends ~429px, gap, «ASTRA» from ~478px
ICON_SPLIT = 432
STRIP_TEXT_FROM = 448
TEXT_X = 478
TEXT_Y0 = 46
TEXT_Y1 = 368
TEXT = "Elara"
TEXT_TRACKING = 0  # natural spacing; ASTRA width not needed for shorter wordmark

FONT_REGULAR = [
    Path(r"C:\Windows\Fonts\segoeui.ttf"),
    Path(r"C:\Windows\Fonts\arial.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
]


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for p in FONT_REGULAR:
        if p.exists():
            return ImageFont.truetype(str(p), size=size)
    return ImageFont.load_default()


def black_to_alpha(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8 or (r < 40 and g < 40 and b < 40):
                px[x, y] = (0, 0, 0, 0)
            else:
                px[x, y] = (r, g, b, a if a < 255 else 255)
    return im


def recolor(im: Image.Image, rgb: tuple[int, int, int]) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0:
                px[x, y] = (*rgb, a)
    return im


def icon_from_reference(ref_path: Path) -> Image.Image:
    ref = Image.open(ref_path).convert("RGBA")
    icon = ref.crop((0, 0, ICON_SPLIT, ref.height))
    return black_to_alpha(icon)


def fit_font_size(target_h: int) -> int:
    target_h = TEXT_Y1 - TEXT_Y0
    lo, hi = 80, 280
    best = 200
    while lo <= hi:
        mid = (lo + hi) // 2
        font = load_font(mid)
        draw = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
        bbox = draw.textbbox((0, 0), TEXT, font=font)
        h = bbox[3] - bbox[1]
        if h <= target_h:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return best


def letter_spacing_for_width(font: ImageFont.ImageFont, target_w: int) -> int:
    draw = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    bbox = draw.textbbox((0, 0), TEXT, font=font)
    natural = bbox[2] - bbox[0]
    gaps = max(0, len(TEXT) - 1)
    if gaps == 0 or natural >= target_w:
        return 0
    return max(0, (target_w - natural) // gaps)


def draw_text_spaced(
    draw: ImageDraw.ImageDraw,
    pos: tuple[int, int],
    text: str,
    font: ImageFont.ImageFont,
    fill: tuple[int, ...],
    spacing: int,
    stroke_width: int = 0,
    stroke_fill: tuple[int, ...] | None = None,
) -> None:
    x, y = pos
    kw = {"fill": fill}
    if stroke_width:
        kw["stroke_width"] = stroke_width
        kw["stroke_fill"] = stroke_fill or fill
    for i, ch in enumerate(text):
        draw.text((x, y), ch, font=font, **kw)
        bbox = draw.textbbox((0, 0), ch, font=font, stroke_width=stroke_width)
        x += bbox[2] - bbox[0] + (spacing if i < len(text) - 1 else 0)


def trim_to_content(im: Image.Image, pad: int = 12) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    minx, miny, maxx, maxy = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 24:
                minx = min(minx, x)
                miny = min(miny, y)
                maxx = max(maxx, x)
                maxy = max(maxy, y)
    if maxx <= minx:
        return im
    minx = max(0, minx - pad)
    miny = max(0, miny - pad)
    maxx = min(w - 1, maxx + pad)
    maxy = min(h - 1, maxy + pad)
    return im.crop((minx, miny, maxx + 1, maxy + 1))


def strip_text_region(im: Image.Image, x0: int = STRIP_TEXT_FROM) -> Image.Image:
    """Remove ASTRA letters from reference; keep original Astra icon pixels."""
    im = im.copy()
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(x0, w):
            px[x, y] = (0, 0, 0, 0)
    return im


def compose_like_astra(
    ref_path: Path,
    rgb: tuple[int, int, int],
    *,
    outline: bool = False,
    stroke_width: int = 3,
) -> Image.Image:
    base = black_to_alpha(Image.open(ref_path).convert("RGBA"))
    if not outline and rgb != (255, 255, 255):
        base = recolor(base, rgb)

    canvas = strip_text_region(base)
    draw = ImageDraw.Draw(canvas)

    font_size = fit_font_size(TEXT_Y1 - TEXT_Y0)
    font = load_font(font_size)
    probe = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    bbox = probe.textbbox((0, 0), TEXT, font=font)
    th = bbox[3] - bbox[1]
    ty = TEXT_Y0 + ((TEXT_Y1 - TEXT_Y0) - th) // 2 - bbox[1]

    spacing = TEXT_TRACKING

    if outline:
        draw_text_spaced(
            draw,
            (TEXT_X, ty),
            TEXT,
            font,
            (0, 0, 0, 0),
            spacing,
            stroke_width=stroke_width,
            stroke_fill=(*rgb, 255),
        )
    else:
        draw_text_spaced(draw, (TEXT_X, ty), TEXT, font, (*rgb, 255), spacing)

    return trim_to_content(canvas)


def compose_mark(rgb: tuple[int, int, int], ref: Path, size: int = 256) -> Image.Image:
    icon = trim_to_content(icon_from_reference(ref), pad=10)
    if rgb != (255, 255, 255):
        icon = recolor(icon, rgb)
    scale = size / max(icon.width, icon.height)
    nw, nh = int(icon.width * scale), int(icon.height * scale)
    icon = icon.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(icon, ((size - nw) // 2, (size - nh) // 2), icon)
    return canvas


def compose_dark_theme_wordmark() -> Image.Image:
    """Original Astra icon from logoDark (unchanged) + white «Elara»."""
    return compose_like_astra(REF_FILL, (255, 255, 255), outline=False)


def main() -> None:
    dark = (17, 24, 39)

    compose_like_astra(REF_FILL, dark, outline=False).save(PUB / "elara-logo.png")
    compose_dark_theme_wordmark().save(PUB / "elara-logo-dark.png")
    compose_like_astra(
        REF_OUTLINE,
        (255, 255, 255),
        outline=True,
        stroke_width=3,
    ).save(PUB / "elara-logo-outline.png")

    compose_mark(dark, REF_FILL, 256).save(PUB / "elara-mark.png")
    compose_mark((255, 255, 255), REF_FILL, 256).save(PUB / "elara-mark-dark.png")

    compose_dark_theme_wordmark().save(PUB / "auth" / "elara-logo.png")
    compose_mark((255, 255, 255), REF_FILL, 512).save(PUB / "elara-icon.png")

    print("Elara logos matched to Astra layout OK")


if __name__ == "__main__":
    main()
