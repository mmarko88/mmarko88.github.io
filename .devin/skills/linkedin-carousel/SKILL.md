---
name: linkedin-carousel
description: Generate a multi-image LinkedIn carousel post (PNG slides) from post content
argument-hint: "<post-url-or-file> [num-slides]"
subagent: true
---

Generate a set of PNG slides for a LinkedIn multi-image post (carousel). You are an autonomous agent — do everything end-to-end and report the output file paths.

## What to produce

- Square 1080×1080 PNGs (LinkedIn multi-image posts accept multiple images; square fills the feed best).
- 4–8 slides default (respect the user's count if given):
  1. **Title/hook slide** — post title or strongest claim, big type. This must stop the scroll on its own.
  2–N-1. **One idea per slide** — a headline line + 2–4 short supporting lines or a mini code snippet. Never dump paragraphs; if a slide is crowded, split it.
  - **CTA slide** — short call to action ("Full write-up — link in comments" / handle / repo). 
- Consistent design across slides: same background, accent color bar, footer with slide number (e.g. "2/6").

## Design rules

- Dark or light minimal background, ONE accent color. High contrast text.
- Large readable text (headline ≥ 60px, body ≥ 36px at 1080px).
- Generous margins (~80px). Left-align text.
- No logos/watermarks unless the user provides them.
- Extract real content from the post — headlines and takeaways, not filler. Proof points (numbers) make the best slide headlines.

## How to generate

Use `generate_carousel.py` in this skill directory as the template — adapt its `SLIDES` list with content extracted from the post, run it, and iterate if text overflows. It uses Python + Pillow (available on this machine; fonts under `/usr/share/fonts/truetype/`).

Save the adapted script and output PNGs to an `out/` directory next to the post (or `./linkedin-carousel-out/` if unclear), named `slide-1.png` … `slide-N.png` in swipe order.

## Verify before reporting (mandatory)

- **Never invent domains or URLs.** Derive the site domain from the repo's site config (e.g. `baseurl` in `config.toml`) or the post's canonical URL — not from repo or folder names. GitHub usernames are not site domains.
- **Read every rendered PNG back visually** — check text overflow, clipping, overlaps, and that all numbers match the source post exactly. Fix and re-render before reporting.
- Consistent arrow/symbol usage across slides (use `→`, not ASCII `->`).

## Report back

List the output file paths in order, the slide headlines you chose, and one sentence on the design (bg/accent) so the parent agent can relay it. If anything failed, say exactly what and what you tried.
