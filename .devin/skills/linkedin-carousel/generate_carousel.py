#!/usr/bin/env python3
"""LinkedIn carousel slide generator (1080x1350 portrait, PDF-ready).

Research-backed defaults: portrait 4:5 fills mobile viewport, PDF export
for LinkedIn document posts (native swipe + dwell time), every data slide
anchors on a bar chart or giant number — not bullet lists.

Adapt the slide builders at the bottom with real post content, then run:
    python3 generate_carousel.py   ->  slide-N.png + carousel.pdf

Slide helpers provided:
  title_slide / hook slide   -> giant number or claim + eyebrow
  stat_slide                 -> headline + lines + hbar comparison + callout
  cta_slide                  -> big CTA + domain
  hbar / scale_bars          -> horizontal bar charts (sqrt scale)
"""

import os
import math
import textwrap
from PIL import Image, ImageDraw, ImageFont

# --- Config ---
W, H = 1080, 1350        # portrait 4:5 — max mobile viewport
MARGIN = 80
BG = "#0f172a"           # dark slate
FG = "#f8fafc"           # near-white
MUTED = "#94a3b8"
ACCENT = "#38bdf8"       # sky blue
GOOD = "#34d399"         # green — winning numbers
BAD = "#f87171"          # red — baseline/cliff numbers
BAR_DIM = "#334155"      # neutral bar fill
DOMAIN = "example.com"   # ADAPT: derive from site config baseurl, never guess
EYEBROW = "POST SERIES · PART N"  # ADAPT
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
    y = H - MARGIN - 10
    for k in range(total):
        x = MARGIN + k * 34
        fill = ACCENT if k == i else BAR_DIM
        d.ellipse([x, y, x + 14, y + 14], fill=fill)
    t = DOMAIN
    d.text((W - MARGIN - d.textlength(t, font=font(FONT_REG, 30)), y - 10),
           t, font=font(FONT_REG, 30), fill=MUTED)


def hbar(d, x, y, label, value_text, frac, color, label_w=250, bar_h=52):
    """One horizontal bar: label | bar | value. frac in [0,1]."""
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
    """sqrt scale so a ~30x range stays readable."""
    mx = max(values)
    return [math.sqrt(v / mx) for v in values]


def new_slide():
    img = Image.new("RGB", (W, H), BG)
    return img, ImageDraw.Draw(img)


# ---------- ADAPT THESE BUILDERS ----------

def hook_slide(i, total):
    """Giant hero number — struck-out baseline vs green result."""
    img, d = new_slide()
    eyebrow(d, EYEBROW)
    y = 260
    d.text((MARGIN, y), "Deploy time:", font=font(FONT_BOLD, 72), fill=FG)
    y += 150
    base = "14 min"
    f_base = font(FONT_BOLD, 110)
    d.text((MARGIN, y), base, font=f_base, fill=MUTED)
    lw = d.textlength(base, font=f_base)
    d.line([MARGIN, y + 62, MARGIN + lw, y + 62], fill=BAD, width=10)
    y += 190
    d.text((MARGIN, y), "90 sec", font=font(FONT_BOLD, 210), fill=GOOD)
    y += 250
    for ln in wrap("What we changed — measured, not guessed", 34):
        d.text((MARGIN, y), ln, font=font(FONT_REG, 44), fill=MUTED)
        y += 58
    d.text((W - MARGIN - 240, H - MARGIN - 120), "swipe →",
           font=font(FONT_BOLD, 40), fill=ACCENT)
    footer(d, i, total)
    return img


def stat_slide(i, total, headline, lines, bars, callout):
    """headline + context lines + hbar rows + green callout.
    bars: [(label, value_text, numeric_value, color)]"""
    img, d = new_slide()
    eyebrow(d, EYEBROW)
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
    footer(d, i, total)
    return img


def cta_slide(i, total):
    img, d = new_slide()
    eyebrow(d, EYEBROW)
    y = 300
    for ln in wrap("Full write-up + code", 20):
        d.text((MARGIN, y), ln, font=font(FONT_BOLD, 84), fill=FG)
        y += 100
    y += 60
    d.text((MARGIN, y), DOMAIN, font=font(FONT_BOLD, 60), fill=ACCENT)
    footer(d, i, total)
    return img


def main():
    slides = [
        hook_slide(0, 3),
        stat_slide(1, 3, "The fix that mattered",
                   ["Context line one", "Context line two"],
                   [("before", "14 min", 840, BAD),
                    ("after", "90 sec", 90, GOOD)],
                   "~9x faster. One config change."),
        cta_slide(2, 3),
    ]
    os.makedirs(OUT_DIR, exist_ok=True)
    for i, img in enumerate(slides, 1):
        p = os.path.join(OUT_DIR, f"slide-{i}.png")
        img.save(p)
        print(f"wrote {p}")
    pdf = os.path.join(OUT_DIR, "carousel.pdf")
    slides[0].save(pdf, save_all=True, append_images=slides[1:], resolution=300)
    print(f"wrote {pdf}")


if __name__ == "__main__":
    main()
