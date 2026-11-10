"""Replace user-facing Astra branding with Rexon (skip CSS class names and asset paths)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

SKIP_SUBSTRINGS = (
    "astra-scene",
    "astra-music",
    "AstraMusicCard",
    "AstraSidebar",
    "ASTRA_SIDEBAR",
    "--astra-accent",
    "astra-sidebar",
    "astra-wave",
    "astra-music-player",
    "@keyframes astra",
    "astra_backend",
    "astra_local",
    "astra_dev",
    "astra_postgres",
    "astra_redis",
    "astra_uploads",
    "astra_social",
    "COMPOSE_PROJECT_NAME=astra",
)

EXTENSIONS = {".jsx", ".js", ".tsx", ".ts", ".json", ".html", ".md", ".py", ".sql", ".scss", ".yml", ".example"}


def transform_line(line: str) -> str:
    if any(s in line for s in SKIP_SUBSTRINGS):
        return line
    line = line.replace("ASTRA", "REXON")
    line = line.replace("Astra", "Rexon")
    line = line.replace("@astra", "@rexon")
    line = line.replace("astra.app", "rexon.app")
    line = line.replace("astra-demo", "rexon-demo")
    line = line.replace("astra_token", "rexon_token")
    line = line.replace("astra_search_history", "rexon_search_history")
    line = line.replace("astra-mobile", "rexon-mobile")
    line = line.replace("com.astra.social", "com.rexon.social")
    line = line.replace('"astra"', '"rexon"')
    line = line.replace("'astra'", "'rexon'")
    line = line.replace("astra-frontend", "rexon-frontend")
    return line


def process_file(path: Path) -> bool:
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return False
    new = "\n".join(transform_line(ln) for ln in text.splitlines())
    if text.endswith("\n"):
        new += "\n"
    if new != text:
        path.write_text(new, encoding="utf-8")
        return True
    return False


def main() -> None:
    roots = [
        ROOT / "frontend" / "src",
        ROOT / "frontend" / "index.html",
        ROOT / "frontend" / "package.json",
        ROOT / "Frontend-app",
        ROOT / "backend",
        ROOT / "database",
        ROOT / "docker-compose.yml",
        ROOT / "nginx" / "nginx.conf",
        ROOT / ".env.example",
    ]
    changed = []
    for base in roots:
        if base.is_file():
            if process_file(base):
                changed.append(base)
            continue
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path.suffix not in EXTENSIONS:
                continue
            if "node_modules" in path.parts or "dist" in path.parts:
                continue
            if process_file(path):
                changed.append(path)
    for p in changed:
        print("updated", p.relative_to(ROOT))


if __name__ == "__main__":
    main()
