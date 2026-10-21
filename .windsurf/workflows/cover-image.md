---
description: Design a branded cover image (featureImage hero + share.png) for a post
---

# Cover image for a post

Usage: `/cover-image <post>` — `<post>` is a directory or slug under `content/post/` (e.g. `cover-image teen_mistakes`).

Produces ≥5 candidate cards as SVG + rendered PNG previews; the user picks one. The chosen hero ships as a **light/dark-adaptive SVG** (the site has both themes). Distilled from OG-image CTR research — do not skip the read-first steps.

## Steps

1. **Read the post fully** (title, description, hook, conclusion). Find the *punchline*: the most surprising number, the strongest quote, or the core mechanism/takeaway. The card sells the click — do NOT just repeat the H1 on a colored background.

2. **Pick a concept type** (in priority order — the first that fits the content):
   - **Proof card** — the surprising number / before-vs-after / benchmark shape (best for measured posts; numbers get clicked)
   - **Quote card** — bold typography + attribution badge (interviews, opinions, quotable one-liners)
   - **Visual metaphor** — the article's mechanism compressed into one glance (pipeline, split bar, ✗/✓ list)
   - **Title card** — fallback only: eyebrow tag + shortened title + one-line hook

3. **Draft ≥5 SVG variants** at `1200x630` in the post's page bundle — **one variant per persona** from `DESIGNER_PERSONAS.md` (Reporter, Mechanic, Skeptic, Curator, Storyteller, Minimalist; pick ≥5, never two from the same persona). Work each persona as an independent pass — select persona → pull raw material → generate its variant — so concepts don't bleed into each other. For posts about a *person*, prefer a variant with their real public headshot — faces outperform every other focal point (crop tight, expressive beats neutral).

   **Personas may research.** When the post's own material is thin for a persona's lens, run a targeted `search_web` burst (the `/research` shape — vary vocabulary and stance, title/snippet-filter first): real incidents and famous bugs for Reporter/Skeptic, measurable numbers for Curator, analogies from other domains for Storyteller. One burst per persona max, sources must actually be opened before a claim lands on the card. Skip research when the post supplies everything the persona needs.

   If the user rejects the set, run a **reseed burst**: list rejected concepts as one-line mechanisms, swap in personas not yet used, and generate only new directions.

   **Serving rules (from RESEARCH-cover-image.md — most card failures are here, not design):**
   - `shareImage` must be a raster file (PNG/JPG) with a real extension — social crawlers ignore SVG/WebP
   - Platforms cache cards by URL forever: if re-generating a card for an already-shared post, bump the filename (e.g. `share-v2.png`)
   - JPEG for photos, PNG for text cards; never rely on transparency; keep under a few hundred KB
   - `featureImageAlt`/`og:image:alt`: describe the card in plain words — not a verbatim title repeat

   **Brand tokens** (match existing heroes, e.g. `fp-antipatterns-hero.svg`):
   - Light bg `#f7f9fc` / dark bg `#172033`; accent bar `rect` 12px `#1a5fb4` at top
   - Font `Segoe UI, Arial, sans-serif` only; red `#ca3f3f` (+bg `#fde8e8`), green `#17864b` (+bg `#d9f2e4`), muted `#617086` (light) / `#9aa8bf` (dark)
   - Eyebrow row: `font-size 24`, `font-weight 700`, `letter-spacing 2`, caps, accent color
   - Footer: `TOPIC · TOPIC · professionaldev.dev`, `font-size 18`, muted

   **Adaptive hero rules** (winner must satisfy; variants may be single-theme for draft speed):
   - Palette via CSS classes + `@media (prefers-color-scheme: dark)` inside `<style>` — one SVG serves both themes. SVGs loaded via `<img>` DO honor `prefers-color-scheme` internally.
   - Class-name colors, never hardcoded fills on elements that must flip: `.bg`, `.panel`, `.ink`, `.mut`, `.chip`, `.foot`.
   - Keep semantic colors constant across themes (`#1a5fb4`, green/red verdicts) — flip only surfaces and text.
   - Elements masking other elements (e.g. label pills over dashed lines) must use the `.bg` class so they match in both themes.
   - Previewing a specific theme headlessly: `--force-prefers-color-scheme` is unreliable; instead render from a temp copy with the media query flipped — `sed 's/prefers-color-scheme: dark/min-width: 9999px/'` forces light, `min-width: 0px` forces dark.
   - `share.png` is always rendered from the LIGHT variant (social crawlers, single raster).

   **Layout rules** (from research — violations get cropped or ignored):
   - Safe zone: keep everything critical inside the center ~1000x500; ≥60px from edges (platforms crop unpredictably)
   - Headline 46–72px so it reads at ~300–400px preview width; max 2–3 text elements; 6–10 words of large text max
   - One message — billboard, not infographic. If a row needs a label >~35 chars at 22px, shorten it or move the annotation to a separate column (x≥580)
   - No fake buttons/CTA chrome; high contrast (dark text on light card or white on `#172033`)
   - Estimate text width ≈ `chars × font-size × 0.55`; check for overlaps before rendering
   - Keep text ≤10 words and large — Google Discover recommends against *text-heavy* og:images (a performance recommendation, not a ban); the card must still read visually without its text

4. **Render PNG previews** — headless Chrome (works offline, no rsvg/magick needed):
   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --headless --disable-gpu --window-size=1200,630 \
     --screenshot="<abs>/preview-<name>.png" "file://<abs>/hero-<name>.svg"
   ```
   If the SVG ever uses web fonts, wait for `document.fonts.ready` before screenshot — `load` doesn't cover them (Playwright > Puppeteer if this pipeline ever graduates to a script). **Always `read_file` each PNG to check it visually** — overlaps, clipping, and legibility at ~400px thumbnail width. Fix and re-render before presenting.

5. **Self-check before presenting** (reviewer pass — observable bans, not vibes). For each PNG, verify: nothing critical within 60px of edges; headline ≤10 words and legible at 400px; no fake buttons/CTA chrome; no text overlapping other elements; brand tokens used (accent `#1a5fb4`, site font, footer with `professionaldev.dev`); the card reads visually even without its text. Any failure → fix and re-render *before* the user sees it.

6. **Present previews to the user.** On pick: if the winner isn't already adaptive, convert it to class-based fills with the `prefers-color-scheme` block; render **both light and dark previews** and re-run the self-check on each (contrast, invisible icons, masked labels). Rename winner to `<slug>-hero.svg` (or post's existing convention), render `share.png` from the light variant, delete losing SVGs/previews.

7. **Wire front matter** — if the post isn't a page bundle yet, `git mv post.md post/index.md` first:
   ```yaml
   usePageBundles: true
   featureImage: '<name>-hero.svg'   # hero shown atop the post
   featureImageAlt: '<what the card literally shows>'
   shareImage: 'share.png'           # PNG — social crawlers ignore SVG/WebP
   ```

8. **Verify** on `localhost:1313` — post serves 200 and the hero renders. Optionally sanity-check the card with a link-preview debugger (Facebook Debugger, LinkedIn Post Inspector) before the post is shared — crawlers cache the first fetch. Do not commit unless asked.
