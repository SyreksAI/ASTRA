"""Build logo-dark.png from logo-light.png for #050a0e UI."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
src = ROOT / "assets" / "logo-light.png"
dst = ROOT / "assets" / "logo-dark.png"

im = Image.open(src).convert("RGBA")
arr = np.array(im, dtype=np.float32)
rgb = arr[:, :, :3]
lum = 0.2126 * rgb[:, :, 0] + 0.7152 * rgb[:, :, 1] + 0.0722 * rgb[:, :, 2]
sat = np.max(rgb, axis=2) - np.min(rgb, axis=2)

# White / near-white background -> transparent
is_bg = (lum > 248) | ((lum > 235) & (sat < 18))

# Cyan / teal accent (Talk + bubble glow)
is_accent = (
    (~is_bg)
    & (rgb[:, :, 2] >= rgb[:, :, 0])
    & (rgb[:, :, 2] > 70)
    & (sat > 25)
)

# Very light bubble fill from light asset
is_bubble_fill = (~is_bg) & (~is_accent) & (lum > 175) & (sat < 35)

# Dark ink (ASTRA, dots, dark glass edges)
is_ink = (~is_bg) & (~is_accent) & (~is_bubble_fill) & (lum < 120)

out = np.zeros_like(rgb)
alpha = np.zeros(rgb.shape[:2], dtype=np.float32)

# Accent: slightly brighter cyan for dark backgrounds
out[is_accent] = np.clip(rgb[is_accent] * 1.08 + np.array([0, 8, 12]), 0, 255)
alpha[is_accent] = 255

# Ink -> light silver / white
ink_target = np.array([232.0, 235.0, 238.0])
for i in range(3):
    t = np.clip((120 - lum[is_ink]) / 120, 0, 1)
    out[is_ink, i] = rgb[is_ink, i] * (1 - t) + ink_target[i] * t
alpha[is_ink] = 255

# Bubble glass fill -> dark panel tone
fill = np.array([22.0, 24.0, 28.0])
out[is_bubble_fill] = fill
alpha[is_bubble_fill] = 220

# Mid-tones (glass highlights, gradients)
mid = (~is_bg) & (~is_accent) & (~is_bubble_fill) & (~is_ink)
out[mid] = np.clip(rgb[mid] * 0.55 + np.array([90, 95, 100]), 0, 255)
alpha[mid] = np.clip(180 + (lum[mid] - 80) * 0.5, 120, 255)

# Soft matte white edges
edge = is_bg.copy()
# expand: near-white fringe
dist_white = np.clip((248 - lum) / 25, 0, 1)
alpha = np.where(is_bg, 0, np.maximum(alpha, dist_white * 80))

arr_out = np.zeros_like(arr)
arr_out[:, :, :3] = out
arr_out[:, :, 3] = np.clip(alpha, 0, 255)

result = Image.fromarray(arr_out.astype(np.uint8), "RGBA")
bbox = result.getbbox()
if bbox:
    pad = 4
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(result.width, x1 + pad)
    y1 = min(result.height, y1 + pad)
    result = result.crop((x0, y0, x1, y1))

result.save(dst, optimize=True)
print(f"Wrote {dst} ({result.size[0]}x{result.size[1]})")
