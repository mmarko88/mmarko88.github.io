---
name: linkedin-carousel
description: Generate a multi-image LinkedIn carousel post (PNG slides) from post content
argument-hint: "<post-url-or-file> [num-slides]"
subagent: true
---

Generate a set of PNG slides for a LinkedIn multi-image post (carousel). You are an autonomous agent — do everything end-to-end and report the output file paths.

## What to produce

- **Portrait 1080×1350 PNGs + a combined `carousel.pdf`.** Upload guidance: PDF document posts render as native swipeable carousels and each swipe counts as dwell time (LinkedIn's top signal). Portrait 4:5 fills the mobile viewport — square is second-best, landscape worst.
- 4–8 slides default (respect the user's count if given):
  1. **Hook slide** — a giant proof number or bold claim (e.g. struck-out baseline vs green result). This must stop the scroll on its own. Add a "swipe →" cue.
  2–N-1. **One idea + ONE visual anchor per slide** — prefer a bar chart, big number, or mini diagram over bullet lists. Benchmarks/data posts → real bars (red baseline, green result, accent reference). Never dump paragraphs.
  - **CTA slide** — site domain (from site config, never guessed), repo — direct readers to the link in the post body (link-in-comments is penalized since mid-2026).
- Consistent system across slides: same background, eyebrow tag, accent bar, footer with progress dots + domain.

## Design rules

- Dark minimal bg, ONE accent + semantic green/red for verdicts (`#34d399`/`#f87171`). High contrast.
- Large readable text (headline ≥ 60px, body ≥ 36px); ≥80px margins; left-align.
- Numbers are the graphic — make the best stat huge. Chart bars: sqrt-scale wide ranges so small values stay visible; dim-bar value labels use muted color for readability.
- Extract real content from the post — proof points make the best slide headlines.
- Structure as an information gradient: each slide delivers more than the last; resolution + CTA at the end.

## How to generate

Use `generate_carousel.py` in this skill directory as the template — it ships `hook_slide` / `stat_slide` / `cta_slide` builders plus `hbar`/`scale_bars` chart helpers. Adapt the builders with real post content (set `DOMAIN` from site config `baseurl`), run it, and iterate if text overflows. Python + Pillow only; fonts under `/usr/share/fonts/truetype/`.

Save the adapted script and output PNGs to an `out/` directory next to the post (or `./linkedin-carousel-out/` if unclear), named `slide-1.png` … `slide-N.png` in swipe order.

## Verify before reporting (mandatory)

- **Never invent domains or URLs.** Derive the site domain from the repo's site config (e.g. `baseurl` in `config.toml`) or the post's canonical URL — not from repo or folder names. GitHub usernames are not site domains.
- **Read every rendered PNG back visually** — check text overflow, clipping, overlaps, and that all numbers match the source post exactly. Fix and re-render before reporting.
- Consistent arrow/symbol usage across slides (use `→`, not ASCII `->`).

## Report back

List the output file paths in order, the slide headlines you chose, and one sentence on the design (bg/accent) so the parent agent can relay it. If anything failed, say exactly what and what you tried.
