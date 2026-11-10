"""Remove baked-in dark background from logo-dark.png (keep glow + text)."""
from __future__ import annotations

import shutil
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "assets" / "logo-dark.png"
backup = ROOT / "assets" / "logo-dark-opaque.png"

if not backup.exists():
    shutil.copy(path, backup)

im = Image.open(path).convert("RGBA")
arr = np.array(im, dtype=np.float32)
h, w = arr.shape[:2]
rgb = arr[:, :, :3]

edge_pts = []
for x in range(0, w, max(1, w // 40)):
    edge_pts.append(rgb[0, x])
    edge_pts.append(rgb[h - 1, x])
for y in range(0, h, max(1, h // 20)):
    edge_pts.append(rgb[y, 0])
    edge_pts.append(rgb[y, w - 1])
bg = np.median(edge_pts, axis=0)

dist = np.linalg.norm(rgb - bg, axis=2)
lum = 0.2126 * rgb[:, :, 0] + 0.7152 * rgb[:, :, 1] + 0.0722 * rgb[:, :, 2]

near_bg = dist < 28
very_dark = lum < 22
alpha = np.clip((dist - 8) * 6.5, 0, 255)
alpha = np.where(lum > 35, np.maximum(alpha, np.clip((lum - 20) * 3.2, 0, 255)), alpha)
alpha = np.where(near_bg & very_dark, 0, alpha)
alpha = np.where((dist < 18) & (lum < 45), alpha * 0.35, alpha)

cyanish = (rgb[:, :, 2] > rgb[:, :, 0] + 15) & (rgb[:, :, 2] > 60)
alpha = np.where(cyanish, np.maximum(alpha, 180), alpha)
silver = lum > 90
alpha = np.where(silver, np.maximum(alpha, 255), alpha)

arr[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
out = Image.fromarray(arr.astype(np.uint8), "RGBA")
bbox = out.getbbox()
if bbox:
    out = out.crop(bbox)
out.save(path, optimize=True)
print(f"Wrote transparent logo: {path} ({out.size[0]}x{out.size[1]})")
