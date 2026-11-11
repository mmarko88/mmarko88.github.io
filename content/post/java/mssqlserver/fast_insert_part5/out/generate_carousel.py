#!/usr/bin/env python3
"""LinkedIn carousel — Fastest Inserts Part 5 (1080x1350 portrait, PDF-ready).

Data-viz driven redesign: every data slide anchors on a bar chart.
Run: python3 generate_carousel.py  ->  slide-N.png + carousel.pdf in ./out
"""

import os
import math
import textwrap
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1350
MARGIN = 80
BG = "#0f172a"
FG = "#f8fafc"
MUTED = "#94a3b8"
ACCENT = "#38bdf8"
GOOD = "#34d399"      # green — winning numbers
BAD = "#f87171"       # red — baseline/cliff numbers
BAR_DIM = "#334155"   # neutral bar fill
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()


def wrap(text, width):
    return textwrap.wrap(text, width=width) or [""]


def eyebrow(d, text):
    d.rectangle([MARGIN, MARGIN, MARGIN + 96, MARGIN + 12], fill=ACCENT)
    d.text((MARGIN + 116, MARGIN - 6), text, font=font(FONT_BOLD, 26), fill=MUTED)


def footer(d, i, total):
    # progress dots + domain
    y = H - MARGIN - 10
    for k in range(total):
        x = MARGIN + k * 34
        fill = ACCENT if k == i else BAR_DIM
        d.ellipse([x, y, x + 14, y + 14], fill=fill)
    t = "professionaldev.dev"
    d.text((W - MARGIN - d.textlength(t, font=font(FONT_REG, 30)), y - 10),
           t, font=font(FONT_REG, 30), fill=MUTED)


def hbar(d, x, y, label, value_text, frac, color, label_w=250, bar_h=52):
    """One horizontal bar: label | bar | value. frac in [0,1] of bar area width."""
    f_label = font(FONT_BOLD, 34)
    f_val = font(FONT_BOLD, 34)
    bar_x = x + label_w
    bar_max = W - MARGIN - bar_x - 170
    d.text((x, y + 6), label, font=f_label, fill=FG)
    d.rounded_rectangle([bar_x, y, bar_x + max(frac, 0.02) * bar_max, y + bar_h],
                        radius=10, fill=color)
    val_color = MUTED if color == BAR_DIM else color
    d.text((bar_x + frac * bar_max + 18, y + 6), value_text, font=f_val, fill=val_color)
    return y + bar_h + 34


def scale_bars(values):
    """sqrt scale so a 30x range stays readable."""
    mx = max(values)
    return [math.sqrt(v / mx) for v in values]


def new_slide():
    img = Image.new("RGB", (W, H), BG)
    return img, ImageDraw.Draw(img)


# ---------- Slide 1: hook ----------
def slide1():
    img, d = new_slide()
    eyebrow(d, "FASTEST MS SQL INSERTS · PART 5")

    y = 260
    d.text((MARGIN, y), "Hibernate inserts:", font=font(FONT_BOLD, 72), fill=FG)
    y += 150
    # struck-out baseline
    base = "26,545 ms"
    f_base = font(FONT_BOLD, 110)
    d.text((MARGIN, y), base, font=f_base, fill=MUTED)
    lw = d.textlength(base, font=f_base)
    d.line([MARGIN, y + 62, MARGIN + lw, y + 62], fill=BAD, width=10)
    y += 190
    d.text((MARGIN, y), "646 ms", font=font(FONT_BOLD, 210), fill=GOOD)
    y += 250
    d.text((MARGIN, y), "3 settings close ~90% of the gap", font=font(FONT_REG, 44), fill=MUTED)
    y += 58
    d.text((MARGIN, y), "to raw Bulk Copy — 100k inserts", font=font(FONT_REG, 44), fill=MUTED)

    d.text((W - MARGIN - 240, H - MARGIN - 120), "swipe →", font=font(FONT_BOLD, 40), fill=ACCENT)
    footer(d, 0, 6)
    return img


# ---------- Slides 2-4: fix + bar comparison ----------
def stat_slide(i, headline, lines, bars, callout, note=None):
    img, d = new_slide()
    eyebrow(d, "HIBERNATE TUNING")

    y = 200
    for ln in wrap(headline, 24):
        d.text((MARGIN, y), ln, font=font(FONT_BOLD, 62), fill=ACCENT)
        y += 76
    y += 20
    for ln in lines:
        for wln in wrap(ln, 46):
            d.text((MARGIN, y), wln, font=font(FONT_REG, 36), fill=FG)
            y += 50
        y += 8
    y += 50

    fracs = scale_bars([b[2] for b in bars])
    for (label, val_text, _, color), fr in zip(bars, fracs):
        y = hbar(d, MARGIN, y, label, val_text, fr, color)
    y += 30
    for ln in wrap(callout, 40):
        d.text((MARGIN, y), ln, font=font(FONT_BOLD, 44), fill=GOOD)
        y += 56
    if note:
        y += 14
        cx, cy = MARGIN + 14, y + 18
        d.ellipse([cx - 15, cy - 15, cx + 15, cy + 15], outline=ACCENT, width=3)
        d.text((cx - 4, cy - 14), "i", font=font(FONT_BOLD, 28), fill=ACCENT)
        for ln in wrap(note, 56):
            d.text((MARGIN + 48, y), ln, font=font(FONT_REG, 32), fill=MUTED)
            y += 46
    footer(d, i, 6)
    return img


# ---------- Slide 5: batch-size cliff chart ----------
def slide5():
    img, d = new_slide()
    eyebrow(d, "HIBERNATE TUNING")

    y = 200
    for ln in wrap("Then tune jdbc.batch_size", 24):
        d.text((MARGIN, y), ln, font=font(FONT_BOLD, 62), fill=ACCENT)
        y += 76
    y += 10
    d.text((MARGIN, y), "StatelessSession + bulkCopy, 100k inserts:",
           font=font(FONT_REG, 36), fill=FG)
    y += 90

    # sweep data: batch_size -> ms
    data = [("1", "13,725", 13725, BAR_DIM), ("10", "19,615", 19615, BAD),
            ("100", "3,266", 3266, BAR_DIM), ("500", "1,280", 1280, BAR_DIM),
            ("1,000", "844", 844, BAR_DIM), ("5,000", "638", 638, BAR_DIM),
            ("10,000", "633", 633, GOOD), ("50,000", "844", 844, BAR_DIM)]
    fracs = scale_bars([v for _, _, v, _ in data])
    for (label, vt, _, color), fr in zip(data, fracs):
        y = hbar(d, MARGIN, y, label, vt, fr, color, label_w=170)
    y += 10
    for ln in wrap("bs=1: no batch, no bulk copy — ~14 s. 10 is the cliff: ~20 s. Optimum: ~10,000.", 46):
        d.text((MARGIN, y), ln, font=font(FONT_REG, 36), fill=FG)
        y += 50
    footer(d, 4, 6)
    return img


# ---------- Slide 6: CTA ----------
def slide6():
    img, d = new_slide()
    eyebrow(d, "FASTEST MS SQL INSERTS · PART 5")

    y = 300
    for ln in wrap("Full benchmarks + runnable code", 20):
        d.text((MARGIN, y), ln, font=font(FONT_BOLD, 84), fill=FG)
        y += 100
    y += 60
    d.text((MARGIN, y), "professionaldev.dev", font=font(FONT_BOLD, 60), fill=ACCENT)
    y += 86
    d.text((MARGIN, y), "github.com/mmarko88/blog-examples", font=font(FONT_REG, 40), fill=MUTED)
    y += 140
    for ln in wrap("Batch-size sweep, Persistable source, StatelessSession repo — link in comments.", 44):
        d.text((MARGIN, y), ln, font=font(FONT_REG, 38), fill=MUTED)
        y += 52
    footer(d, 5, 6)
    return img


def main():
    slides = [
        slide1(),
        stat_slide(1, "1. Kill the pre-INSERT SELECTs",
                   ["saveAll() calls merge() — a SELECT", "before every INSERT (100k extra)"],
                   [("saveAll()", "26,545 ms", 26545, BAD),
                    ("+ Persistable", "2,140 ms", 2140, GOOD)],
                   "isNew() = true → ~12x faster.",
                   note="Only applicable when the app assigns the PK."),
        stat_slide(2, "2. StatelessSession = bare metal",
                   ["Drops L1 cache, dirty checking, cascading —", "constant memory, no entity tracking"],
                   [("persist()", "2,064 ms", 2064, BAR_DIM),
                    ("Stateless", "1,850 ms", 1850, GOOD),
                    ("raw JDBC", "1,873 ms", 1873, BAR_DIM)],
                   "Within ~1% of raw JDBC."),
        stat_slide(3, "3. Turn on the bulkCopy flag",
                   ["useBulkCopyForBatchInsert=true —", "each executeBatch() = one Bulk Copy stream",
                    "Built for bulk payloads — small batches", "pay the per-stream setup cost"],
                   [("Stateless", "1,850 ms", 1850, BAR_DIM),
                    ("+ bulkCopy", "646 ms", 646, GOOD),
                    ("Bulk API", "499 ms", 499, ACCENT)],
                   "2.9x — only ~30% off the raw Bulk API."),
        slide5(),
        slide6(),
    ]
    os.makedirs(OUT_DIR, exist_ok=True)
    paths = []
    for i, img in enumerate(slides, 1):
        p = os.path.join(OUT_DIR, f"slide-{i}.png")
        img.save(p)
        paths.append(p)
        print(f"wrote {p}")
    pdf = os.path.join(OUT_DIR, "carousel.pdf")
    slides[0].save(pdf, save_all=True, append_images=slides[1:], resolution=300)
    print(f"wrote {pdf}")


if __name__ == "__main__":
    main()
