from pathlib import Path
from PIL import Image

BLACK_THRESHOLD = 42
ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public"
APP = ROOT.parent / "Frontend-app" / "assets" / "images"


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
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            lum = int((r + g + b) / 3)
            alpha = max(a, lum)
            if lum < 12:
                px[x, y] = (0, 0, 0, 0)
            else:
                px[x, y] = (0, 0, 0, alpha)
    return img


def process(path: Path, *, light: bool) -> None:
    out = remove_black_bg(Image.open(path))
    if light:
        out = to_light_variant(out)
    out.save(path, "PNG")
    print("ok", path.name, "light" if light else "dark")


def main() -> None:
    for p in [
        PUB / "rexon-logo-dark.png",
        PUB / "rexon-mark-dark.png",
        PUB / "auth" / "rexon-logo.png",
        APP / "rexon-logo-dark.png",
    ]:
        process(p, light=False)
    for p in [
        PUB / "rexon-logo.png",
        PUB / "rexon-mark.png",
        APP / "rexon-mark.png",
    ]:
        process(p, light=True)


if __name__ == "__main__":
    main()
