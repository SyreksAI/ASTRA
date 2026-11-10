"""Сборка контурных обоев чата: doodle как в Telegram + фирменные ASTRA Talk."""
from __future__ import annotations

import math
import os
import random
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), "..", "assets")
REF = os.path.join(ROOT, "chat-wallpaper-telegram-ref.png")
MARK = os.path.join(ROOT, "astra-mark.png")
TILE = 768


def ref_to_outline(stroke: tuple[int, int, int], alpha_scale: float) -> Image.Image | None:
    path = REF if os.path.exists(REF) else None
    if path is None:
        return None
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    side = min(w, h)
    im = im.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
    im = im.resize((TILE, TILE), Image.Resampling.LANCZOS)
    px = im.load()
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    opx = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, _a = px[x, y]
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            if lum < 18:
                continue
            aa = int(min(255, lum * 0.82 * alpha_scale))
            if aa < 8:
                continue
            opx[x, y] = (stroke[0], stroke[1], stroke[2], aa)
    return out


def stamp(canvas: Image.Image, sprite: Image.Image, x: int, y: int, rotate: float) -> None:
    s = sprite.rotate(rotate, expand=True, resample=Image.Resampling.BICUBIC)
    canvas.alpha_composite(s, (int(x - s.width / 2), int(y - s.height / 2)))


def talk_bubble_outline(size: int, stroke: tuple[int, int, int, int], w: int = 2) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pad = size * 0.1
    body = [pad, pad, size - pad, size * 0.68]
    d.rounded_rectangle(body, radius=size * 0.16, outline=stroke, width=w)
    tx, ty = size * 0.24, size * 0.68
    d.line([tx, ty, tx - size * 0.1, size * 0.88], fill=stroke, width=w)
    d.line([tx - size * 0.1, size * 0.88, tx + size * 0.12, ty + size * 0.04], fill=stroke, width=w)
    cy = size * 0.36
    for i in range(3):
        cx = size * 0.34 + i * size * 0.14
        d.ellipse(
            [cx - size * 0.05, cy - size * 0.05, cx + size * 0.05, cy + size * 0.05],
            outline=stroke,
            width=w,
        )
    return im


def star_outline(size: int, stroke: tuple[int, int, int, int], w: int = 2) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = size / 2
    for i in range(4):
        a = i * math.pi / 2 + math.pi / 4
        d.line([c, c, c + math.cos(a) * size * 0.38, c + math.sin(a) * size * 0.38], fill=stroke, width=w)
    return im


def spark_outline(size: int, stroke: tuple[int, int, int, int], w: int = 2) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = size / 2
    d.ellipse([c - size * 0.06, c - size * 0.06, c + size * 0.06, c + size * 0.06], outline=stroke, width=w)
    for a in (0, math.pi / 2, math.pi, 3 * math.pi / 2):
        d.line([c, c, c + math.cos(a) * size * 0.32, c + math.sin(a) * size * 0.32], fill=stroke, width=w)
    return im


def ring_planet_outline(size: int, stroke: tuple[int, int, int, int], w: int = 2) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = size / 2
    r = size * 0.22
    d.ellipse([c - r, c - r, c + r, c + r], outline=stroke, width=w)
    d.arc([c - size * 0.42, c - size * 0.12, c + size * 0.42, c + size * 0.28], 10, 170, fill=stroke, width=w)
    return im


def astra_mark_outline(size: int, stroke: tuple[int, int, int, int]) -> Image.Image:
    if not os.path.exists(MARK):
        return star_outline(size, stroke)
    m = Image.open(MARK).convert("L").resize((size, size), Image.Resampling.LANCZOS)
    edges = m.filter(ImageFilter.FIND_EDGES)
    edges = edges.point(lambda p: 255 if p > 40 else 0)
    rgba = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = edges.load()
    opx = rgba.load()
    for y in range(size):
        for x in range(size):
            if px[x, y] > 0:
                opx[x, y] = stroke
    return rgba


def cat_outline(size: int, stroke: tuple[int, int, int, int], w: int = 2) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = size / 2
    d.ellipse([c - size * 0.28, c - size * 0.2, c + size * 0.28, c + size * 0.32], outline=stroke, width=w)
    d.polygon(
        [
            (c - size * 0.22, c - size * 0.18),
            (c - size * 0.34, c - size * 0.42),
            (c - size * 0.08, c - size * 0.26),
        ],
        outline=stroke,
    )
    d.polygon(
        [
            (c + size * 0.22, c - size * 0.18),
            (c + size * 0.34, c - size * 0.42),
            (c + size * 0.08, c - size * 0.26),
        ],
        outline=stroke,
    )
    for ex in (-0.12, 0.12):
        d.ellipse(
            [c + ex * size - 4, c - 2, c + ex * size + 4, c + 6],
            outline=stroke,
            width=w,
        )
    return im


def rocket_outline(size: int, stroke: tuple[int, int, int, int], w: int = 2) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = size / 2
    d.polygon(
        [
            (c, size * 0.12),
            (c + size * 0.18, size * 0.72),
            (c, size * 0.58),
            (c - size * 0.18, size * 0.72),
        ],
        outline=stroke,
    )
    d.line([c - size * 0.18, size * 0.72, c - size * 0.28, size * 0.88], fill=stroke, width=w)
    d.line([c + size * 0.18, size * 0.72, c + size * 0.28, size * 0.88], fill=stroke, width=w)
    return im


def build_brand_sprites(stroke: tuple[int, int, int, int]) -> list[Image.Image]:
    sizes = [44, 52, 48, 56, 40, 50]
    makers = [
        talk_bubble_outline,
        astra_mark_outline,
        star_outline,
        spark_outline,
        ring_planet_outline,
        cat_outline,
        rocket_outline,
    ]
    sprites: list[Image.Image] = []
    for maker in makers:
        for sz in sizes[:3]:
            sprites.append(maker(sz, stroke))
    return sprites


def scatter(canvas: Image.Image, sprites: list[Image.Image], count: int, rng: random.Random) -> None:
    for _ in range(count):
        spr = rng.choice(sprites)
        x = rng.randint(0, TILE)
        y = rng.randint(0, TILE)
        rot = rng.uniform(-25, 25)
        stamp(canvas, spr, x, y, rot)


def load_base_tile(name: str) -> Image.Image:
    path = os.path.join(ROOT, f"chat-wallpaper-outline-{name}.png")
    if os.path.exists(path):
        return Image.open(path).convert("RGBA").resize((TILE, TILE), Image.Resampling.LANCZOS)
    return Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))


def build_theme(name: str, stroke: tuple[int, int, int], alpha_scale: float, extra_count: int) -> None:
    rng = random.Random(7 if name == "light" else 13)
    stroke_a = (*stroke, 255)

    canvas = ref_to_outline(stroke, alpha_scale)
    if canvas is None:
        canvas = load_base_tile(name)

    brand = build_brand_sprites(stroke_a)
    scatter(canvas, brand, extra_count, rng)

    out = os.path.join(ROOT, f"chat-wallpaper-outline-{name}.png")
    canvas.save(out)
    print("saved", out)


if __name__ == "__main__":
    build_theme("light", (118, 116, 128), 0.5, 55)
    build_theme("dark", (112, 110, 122), 0.38, 48)
