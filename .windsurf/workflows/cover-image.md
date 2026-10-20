---
description: Design a branded cover image (featureImage hero + share.png) for a post
---

# Cover image for a post

Usage: `/cover-image <post>` — `<post>` is a directory or slug under `content/post/` (e.g. `cover-image teen_mistakes`).

Produces 2–3 candidate cards as SVG + rendered PNG previews; the user picks one. Distilled from OG-image CTR research — do not skip the read-first steps.

## Steps

1. **Read the post fully** (title, description, hook, conclusion). Find the *punchline*: the most surprising number, the strongest quote, or the core mechanism/takeaway. The card sells the click — do NOT just repeat the H1 on a colored background.

2. **Pick a concept type** (in priority order — the first that fits the content):
   - **Proof card** — the surprising number / before-vs-after / benchmark shape (best for measured posts; numbers get clicked)
   - **Quote card** — bold typography + attribution badge (interviews, opinions, quotable one-liners)
   - **Visual metaphor** — the article's mechanism compressed into one glance (pipeline, split bar, ✗/✓ list)
   - **Title card** — fallback only: eyebrow tag + shortened title + one-line hook

3. **Draft 2–3 SVG variants** at `1200x630` in the post's page bundle. Vary the direction (e.g. light list vs dark quote vs diagram), not just colors.

   **Brand tokens** (match existing heroes, e.g. `fp-antipatterns-hero.svg`):
   - Light bg `#f7f9fc` / dark bg `#172033`; accent bar `rect` 12px `#1a5fb4` at top
   - Font `Segoe UI, Arial, sans-serif` only; red `#ca3f3f` (+bg `#fde8e8`), green `#17864b` (+bg `#d9f2e4`), muted `#617086` (light) / `#9aa8bf` (dark)
   - Eyebrow row: `font-size 24`, `font-weight 700`, `letter-spacing 2`, caps, accent color
   - Footer: `TOPIC · TOPIC · professionaldev.dev`, `font-size 18`, muted

   **Layout rules** (from research — violations get cropped or ignored):
   - Safe zone: keep everything critical inside the center ~1000x500; ≥60px from edges (platforms crop unpredictably)
   - Headline 46–72px so it reads at ~300–400px preview width; max 2–3 text elements; 6–10 words of large text max
   - One message — billboard, not infographic. If a row needs a label >~35 chars at 22px, shorten it or move the annotation to a separate column (x≥580)
   - No fake buttons/CTA chrome; high contrast (dark text on light card or white on `#172033`)
   - Estimate text width ≈ `chars × font-size × 0.55`; check for overlaps before rendering

4. **Render PNG previews** — headless Chrome (works offline, no rsvg/magick needed):
   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --headless --disable-gpu --window-size=1200,630 \
     --screenshot="<abs>/preview-<name>.png" "file://<abs>/hero-<name>.svg"
   ```
   **Always `read_file` each PNG to check it visually** — overlaps, clipping, thumbnail readability. Fix and re-render before presenting.

5. **Present previews to the user.** On pick: rename winner to `<slug>-hero.svg` (or post's existing convention), re-render it as `share.png`, delete losing SVGs/previews.

6. **Wire front matter** — if the post isn't a page bundle yet, `git mv post.md post/index.md` first:
   ```yaml
   usePageBundles: true
   featureImage: '<name>-hero.svg'   # hero shown atop the post
   featureImageAlt: '<what the card literally shows>'
   shareImage: 'share.png'           # PNG — social crawlers ignore SVG/WebP
   ```

7. **Verify** on `localhost:1313` — post serves 200 and the hero renders. Do not commit unless asked.
