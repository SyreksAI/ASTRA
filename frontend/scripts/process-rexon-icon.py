"""REXON orbit icon — mark + favicon source (transparent bg)."""
from pathlib import Path

from PIL import Image

BLACK_THRESHOLD = 42
SRC = Path(
    r"C:\Users\Admin\.cursor\projects\c-Users-Admin-Desktop-Astra-social-network\assets"
    r"\c__Users_Admin_AppData_Roaming_Cursor_User_workspaceStorage_a3b9c88e16a6478b0317518bba1948be_images_image-fe1a5109-1056-480b-92eb-73f653fe5c60.png"
)
ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public"


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


def trim_square(img: Image.Image, padding: float = 0.12) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    img = img.crop(bbox)
    w, h = img.size
    side = max(w, h)
    pad = int(side * padding)
    side += pad * 2
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(img, ((side - w) // 2, (side - h) // 2), img)
    return sq


def main() -> None:
    raw = Image.open(SRC)
    dark = trim_square(remove_black_bg(raw))
    light = to_light_variant(dark.copy())

    paths = {
        PUB / "rexon-icon.png": dark,
        PUB / "rexon-mark-dark.png": dark,
        PUB / "rexon-mark.png": light,
    }
    for path, img in paths.items():
        img.save(path, "PNG")
        print("wrote", path)


if __name__ == "__main__":
    main()
