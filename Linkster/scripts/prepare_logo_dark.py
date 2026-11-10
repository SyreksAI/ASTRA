"""Dark logo: same canvas as logo-light.png (1024x341), transparent background."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
light_path = ROOT / "assets" / "logo-light.png"
src = ROOT / "assets" / "logo-dark-source.png"
dst = ROOT / "assets" / "logo-dark.png"

light = Image.open(light_path)
canvas_size = light.size  # (1024, 341)

im = Image.open(src).convert("RGBA")
if im.size != canvas_size:
    im = im.resize(canvas_size, Image.Resampling.LANCZOS)

arr = np.array(im, dtype=np.float32)
rgb = arr[:, :, :3]
lum = 0.2126 * rgb[:, :, 0] + 0.7152 * rgb[:, :, 1] + 0.0722 * rgb[:, :, 2]

is_black = lum < 12
is_glow = (~is_black) & (rgb[:, :, 2] > rgb[:, :, 0] + 8) & (rgb[:, :, 1] > 40)

alpha = np.zeros(rgb.shape[:2], dtype=np.float32)
alpha[~is_black] = 255
alpha[is_glow & (lum < 80)] = np.maximum(
    alpha[is_glow & (lum < 80)], np.clip(lum[is_glow & (lum < 80)] * 3.5, 40, 220)
)
halo = (~is_black) & (lum < 45)
alpha[halo] = np.clip((lum[halo] - 8) * 5.5, 0, 200)
alpha[is_glow] = np.maximum(alpha[is_glow], np.clip(lum[is_glow] * 2.2, 60, 255))
alpha[lum > 140] = 255

arr[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
out = Image.fromarray(arr.astype(np.uint8), "RGBA")
out.save(dst, optimize=True)
print(f"Saved {dst} size={out.size} (matches light {canvas_size})")
