#!/usr/bin/env python3
"""LinkedIn carousel slide generator (1080x1080 PNGs).

Adapt the SLIDES list with real post content, then run:
    python3 generate_carousel.py

Slide kinds:
  title   -> {"kind": "title", "headline": "...", "sub": "..."}
  content -> {"kind": "content", "headline": "...", "lines": ["...", "..."]}
  cta     -> {"kind": "cta", "headline": "...", "sub": "..."}
"""

import os
import textwrap
from PIL import Image, ImageDraw, ImageFont

# --- Config ---
SIZE = 1080
MARGIN = 80
BG = "#0f172a"          # dark slate
FG = "#f8fafc"          # near-white
MUTED = "#94a3b8"       # muted gray
ACCENT = "#38bdf8"      # sky blue
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")

FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# --- Slide content: ADAPT THIS ---
SLIDES = [
    {"kind": "title", "headline": "We cut deploy time from 14 min to 90 seconds", "sub": "Here's exactly how"},
    {"kind": "content", "headline": "The problem", "lines": [
        "Builds queued behind a single runner",
        "Every test ran on every change",
        "No caching between runs",
    ]},
    {"kind": "content", "headline": "What worked", "lines": [
        "Split tests by directory ownership",
        "Cache deps keyed on lockfile hash",
        "Parallelize the 3 slowest suites first",
    ]},
    {"kind": "cta", "headline": "Full write-up with all the numbers", "sub": "Link in comments"},
]

CHARS_PER_LINE = {"title": 22, "headline": 26, "body": 40, "sub": 34}


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()


def wrap(text, width):
    return textwrap.wrap(text, width=width) or [""]


def draw_slide(slide, index, total):
    img = Image.new("RGB", (SIZE, SIZE), BG)
    d = ImageDraw.Draw(img)

    # accent bar top-left
    d.rectangle([MARGIN, MARGIN, MARGIN + 96, MARGIN + 12], fill=ACCENT)

    y = MARGIN + 140
    kind = slide["kind"]

    if kind in ("title", "cta"):
        f_head = font(FONT_BOLD, 84)
        for line in wrap(slide["headline"], CHARS_PER_LINE["title"]):
            d.text((MARGIN, y), line, font=f_head, fill=FG)
            y += 100
        if slide.get("sub"):
            y += 30
            f_sub = font(FONT_REG, 44)
            for line in wrap(slide["sub"], CHARS_PER_LINE["sub"]):
                d.text((MARGIN, y), line, font=f_sub, fill=MUTED)
                y += 56
    else:
        f_head = font(FONT_BOLD, 64)
        for line in wrap(slide["headline"], CHARS_PER_LINE["headline"]):
            d.text((MARGIN, y), line, font=f_head, fill=ACCENT)
            y += 78
        y += 40
        f_body = font(FONT_REG, 40)
        for item in slide.get("lines", []):
            wrapped = wrap(item, CHARS_PER_LINE["body"])
            for i, line in enumerate(wrapped):
                prefix = "→ " if i == 0 else "   "
                d.text((MARGIN, y), prefix + line, font=f_body, fill=FG)
                y += 56
            y += 16

    # footer: slide number
    d.text((SIZE - MARGIN - 60, SIZE - MARGIN), f"{index + 1}/{total}",
           font=font(FONT_REG, 32), fill=MUTED)

    return img


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for i, slide in enumerate(SLIDES):
        img = draw_slide(slide, i, len(SLIDES))
        path = os.path.join(OUT_DIR, f"slide-{i + 1}.png")
        img.save(path)
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
