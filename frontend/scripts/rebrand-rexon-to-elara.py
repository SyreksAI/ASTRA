"""User-facing Rexon → Elara (keep legacy rexon asset files on disk)."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

SKIP = (
    "rexon-logo-intro",
    "RexonLogoIntro",
    "rexon-home.scss",
    "render-rexon-intro",
    "process-rexon-icon",
    "rebrand-astra-to-rexon",
    "rebrand-rexon-to-elara",
    "/rexon/",
    "rexon-intro",
)

EXTENSIONS = {".jsx", ".js", ".tsx", ".ts", ".json", ".html", ".md", ".py", ".scss"}


def transform(line: str) -> str:
    if any(s in line for s in SKIP):
        return line
    line = line.replace("/rexon-logo-dark.png", "/elara-logo-dark.svg")
    line = line.replace("/rexon-logo.png", "/elara-logo.svg")
    line = line.replace("/rexon-mark-dark.png", "/elara-mark-dark.svg")
    line = line.replace("/rexon-mark.png", "/elara-mark.svg")
    line = line.replace("/auth/rexon-logo.png", "/auth/elara-logo.svg")
    line = line.replace("/rexon-icon.png", "/elara-icon.png")
    line = line.replace("REXON", "ELARA")
    line = line.replace("Rexon", "Elara")
    line = line.replace("rexon-frontend", "elara-frontend")
    line = line.replace("rexon-mobile", "elara-mobile")
    line = line.replace("com.rexon.social", "com.elara.social")
    line = line.replace('"rexon"', '"elara"')
    line = line.replace("'rexon'", "'elara'")
    line = line.replace("@rexon", "@elara")
    line = line.replace("rexon.app", "elara.app")
    return line


def process(path: Path) -> bool:
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return False
    new = "\n".join(transform(ln) for ln in text.splitlines())
    if text.endswith("\n"):
        new += "\n"
    if new == text:
        return False
    path.write_text(new, encoding="utf-8")
    return True


def main() -> None:
    roots = [
        ROOT / "frontend" / "src",
        ROOT / "frontend" / "index.html",
        ROOT / "frontend" / "package.json",
        ROOT / "Frontend-app",
        ROOT / "backend" / "main.py",
    ]
    n = 0
    for base in roots:
        paths = [base] if base.is_file() else base.rglob("*")
        for p in paths:
            if p.suffix not in EXTENSIONS:
                continue
            if process(p):
                n += 1
                print(p.relative_to(ROOT))
    print(f"Updated {n} files")


if __name__ == "__main__":
    main()
