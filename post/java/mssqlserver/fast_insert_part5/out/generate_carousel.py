#!/usr/bin/env python3
"""LinkedIn carousel slide generator (1080x1080 PNGs).

Adapted for "Fastest MS SQL Inserts — Part 5: Hibernate Tuning".
Run:  python3 generate_carousel.py
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
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# --- Slide content ---
SLIDES = [
    {"kind": "title",
     "headline": "Hibernate inserts: 26.5 s to 646 ms",
     "sub": "3 settings close ~90% of the gap to raw Bulk Copy — measured on 100,000 SQL Server inserts"},
    {"kind": "content", "headline": "1. Kill the pre-INSERT SELECTs", "lines": [
        "saveAll() calls merge() — SELECT before every INSERT",
        "100k entities = 100,000 extra SELECTs",
        "Implement Persistable<T>, return isNew() = true",
        "26,545 ms -> 2,140 ms (~12x faster)",
    ]},
    {"kind": "content", "headline": "2. StatelessSession = bare metal", "lines": [
        "Drops L1 cache, dirty checking, cascading",
        "No entity tracking — constant memory",
        "1,850 ms — within ~1% of raw JDBC (1,873)",
    ]},
    {"kind": "content", "headline": "3. Turn on the bulkCopy flag", "lines": [
        "URL flag: useBulkCopyForBatchInsert=true",
        "Batches become one Bulk Copy stream each",
        "StatelessSession: 1,850 -> 646 ms (2.9x)",
        "Only ~30% off raw Bulk API (499 ms)",
    ]},
    {"kind": "content", "headline": "Then tune jdbc.batch_size", "lines": [
        "batch_size=1 fails: driver reports -1 row count",
        "batch_size=10 is the cliff: ~20 s — worse than 1",
        "Sweet spot 5,000-10,000 — best: 633 ms",
    ]},
    {"kind": "cta",
     "headline": "Full benchmarks + code",
     "sub": "mmarko88.github.io — link in comments\ngithub.com/mmarko88/blog-examples"},
]

# Tuned so no rendered line exceeds SIZE - 2*MARGIN (920 px) in DejaVu:
# bold 84px ~18 chars, bold 64px ~24 chars, reg 40px ~40 chars, reg 44px ~34 chars.
CHARS_PER_LINE = {"title": 18, "headline": 24, "body": 38, "sub": 32}
MAX_TEXT_W = SIZE - 2 * MARGIN


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
            for para in slide["sub"].split("\n"):
                for line in wrap(para, CHARS_PER_LINE["sub"]):
                    d.text((MARGIN, y), line, font=f_sub, fill=MUTED)
                    y += 56
                y += 12
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


def check_widths():
    """Warn about any rendered line wider than the text area."""
    probe = ImageDraw.Draw(Image.new("RGB", (8, 8)))
    fonts = {"title": font(FONT_BOLD, 84), "headline": font(FONT_BOLD, 64),
             "body": font(FONT_REG, 40), "sub": font(FONT_REG, 44)}
    ok = True
    for i, s in enumerate(SLIDES, 1):
        checks = []
        if s["kind"] in ("title", "cta"):
            checks += [("title", l) for l in wrap(s["headline"], CHARS_PER_LINE["title"])]
            for para in s.get("sub", "").split("\n"):
                checks += [("sub", l) for l in wrap(para, CHARS_PER_LINE["sub"])]
        else:
            checks += [("headline", l) for l in wrap(s["headline"], CHARS_PER_LINE["headline"])]
            for item in s.get("lines", []):
                for j, l in enumerate(wrap(item, CHARS_PER_LINE["body"])):
                    checks.append(("body", ("→ " if j == 0 else "   ") + l))
        for kind, line in checks:
            w = probe.textlength(line, font=fonts[kind])
            if w > MAX_TEXT_W:
                ok = False
                print(f"OVERFLOW slide {i} [{kind}] {w:.0f}px: {line!r}")
    if ok:
        print("width check: all lines fit")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    check_widths()
    for i, slide in enumerate(SLIDES):
        img = draw_slide(slide, i, len(SLIDES))
        path = os.path.join(OUT_DIR, f"slide-{i + 1}.png")
        img.save(path)
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
