# Best practices for creating cover images for web posts

**Answer:** One 1200×630 PNG/JPG per post covers the in-post hero, the social share card, and thumbnails. Design it like a billboard — one focal idea readable at ~400px — not an infographic. Serve it as a plain, absolute-URL image file and verify it with platform debuggers before sharing.

**Confidence:** high on specs and serving rules (vendor docs agree); medium on CTR design claims (mostly practitioner consensus, thin hard data — the strongest numbers are Google's own Discover case studies [2]).

## Why

### Specs — one file, three jobs

- **1200×630 (1.91:1)** is the default that works for the in-post hero, the og:image card, and feed thumbnails [8]. Facebook accepts up to ~2000×1600 / 8MB but 1200×630 is the sweet spot; all major landscape surfaces are 1.91:1 (X uses 16:9 for photo posts) [7].
- **Format:** JPEG preferred for photographs; PNG fine for text cards — but never rely on transparency (platforms flatten it inconsistently) [4]. Keep it under a few hundred KB; <1MB for PNG to avoid pixelation [7].
- **Discover requires more than the card:** ≥1200px wide, >300K total pixels, 16:9-ish, `max-image-preview:large` in robots meta or schema.org `primaryImageOfPage` — and Google may still crop; keep the important part landscape-safe [1][3]. Measured payoff: +79% CTR (Kirbie's Cravings), +30% CTR and +332% clicks/6mo (Istoé) [2].

### Design — what gets clicked

- **One focal point, readable at 400px.** Billboards beat infographics; ~6–10 words of large text max [8][10].
- **Faces outperform everything** — crop tight, expressive emotion, eyes as anchor; gestures tell the story in one frame [10].
- **Rule of thirds + negative space** over dead-center clutter; depth layers (bg/subject/accent) read professional at small sizes [10].
- **Brand consistency** = recurring recognition — lock 2–3 colors, one font family, small consistent logo/site-name lockup [10][11].
- **Avoid**: generic stock, white/floating-subject backgrounds, text at edges, tiny type, fake buttons/CTA chrome, ad-like banners [8][9][11].
- **Safe zones are non-negotiable** — the same file is cropped to square/4:3 thumbnails and link cards; keep critical content in the center ~1000×500, ≥60px from edges [8][10].

### Serving — where cards silently fail

- `og:image` must be an **absolute HTTPS URL** ending in a real extension (`.jpg`/`.png`); no redirects, no auth, no cookies, direct `200` + `image/*` content-type [4][5].
- **Platforms cache by URL forever** — version the filename or the URL when the card changes; signed/expiring URLs die on re-shares [5].
- Set `og:image:width`/`:height` (helps Facebook pre-cache) and `og:image:alt`/`twitter:image:alt` in plain words (not a title repeat); `twitter:card` = `summary_large_image` with `name=` [5][6].
- Malformed width/height on *any* og:image in a set can break *all* of them; small images (<600px) get Facebook's condensed layout [6].
- Test reality, not validators: Facebook Debugger, X composer preview, LinkedIn Post Inspector, WhatsApp/Telegram/iMessage test shares — crawlers each cache differently [4][5].

### The text-overlay tension — resolved

Google Discover guidance says "for best results, avoid text-heavy images" in `og:image`/schema markup [1][3] — while social practice says a short bold headline on the card lifts CTR. Not a real conflict:

- It is a **recommendation, not a prohibition** — Google explicitly softened "avoid images with text" to "avoid *text-heavy* images"; the intent is "don't make it look like a text ad or a social card" [12].
- The risk is Discover *performance*, not exclusion or penalty — light overlays and modest branding are fine; walls of text that are illegible on mobile are the actual problem [12].
- Practical resolution: keep card text to ≤10 large words, ensure the image reads visually without the text. If Discover traffic ever matters, point `primaryImageOfPage` at a clean non-text variant while `og:image` keeps the card [3].

### Generation tooling

- **Build-time > runtime** for a static blog — generate the PNG once, serve it as a file, zero per-request cost [14].
- **Warm headless browser** (the approach already used here) beats Satori on render speed once launched (~50–100ms/card) and gets full CSS + system fonts; cost is launching Chromium (~1s) and remembering `document.fonts.ready` before screenshot (web fonts don't wait on `load`) [13][14].
- **Satori + resvg / @vercel/og**: ~120–190ms per card, 15–20× less memory than a browser, serverless-friendly — but a CSS subset (flexbox, no grid), fonts must be passed as TTF/OTF/WOFF buffers, and **missing glyphs render as boxes with no fallback** — a real trap for emoji/CJK [13][14].
- **SaaS** (Cloudinary URL transforms, Bannerbear, screenshot APIs like ScreenshotOne/Microlink): zero infra, signed/cached URLs — sensible when you don't want to own the pipeline [14].
- Playwright over Puppeteer for new work — same engine, better API, multi-browser [14].

### Measuring — the only honest answer

Practitioner guidance is consensus, not science; the reliable loop is: change one variable (headline copy > image style > background > logo placement), define the metric + window before starting, track card CTR *and* downstream behavior, and A/B on your own audience [16][17].

## What would change this

A platform deprecating 1.91:1 or Google hardening the text rule into a policy — both are watch items, neither is signaled today.

## Considered and rejected

- **Dynamic per-request OG generation** — real-time cards (Satori routes, screenshot APIs) are correct for dynamic data, but wrong default for a blog: static files cached by URL are exactly what crawlers want [5][14].
- **SVG as the social image** — unusable; crawlers require raster formats. SVG stays as the hero/authoring source only.
- **1600×840 "extra sharpness"** — harmless but no measurable benefit; 1200×630 is the standard surface everywhere [8].

## Open

- Whether text-on-card measurably *hurts* this site's Discover impressions specifically — unresolvable without Search Console data; the safe move (clean `primaryImageOfPage` variant) costs little if it ever matters.
- Which card style wins for this audience — only A/B data can say.

## Sources

[1] Get on Discover — Google Search Central: https://developers.google.cn/search/docs/appearance/google-discover
[2] Large Images in Google Search case study — Google: https://developers.google.cn/search/case-studies/large-images-case-study
[3] Google uses schema.org markup and og:image for thumbnails — Search Engine Land: https://searchengineland.com/google-uses-both-schema-org-markup-and-ogimage-meta-tag-for-thumbnails-in-google-search-and-discover-470598
[4] Open Graph images guide — ScreenshotOne: https://screenshotone.com/blog/open-graph-images/
[5] Social card checklist — RenderScreenshot: https://renderscreenshot.com/docs/guides/social-card-checklist
[6] Open Graph protocol for social images — Yoast: https://yoast.com/advanced-technical-seo-social-image-ogimage-tags/
[7] Social image size requirements — HubSpot: https://knowledge.hubspot.com/social/configure-your-websites-robots.txt-and-image-meta-tags-for-social-post-link-previews
[8] Featured image design: sizes and tips — MadeGoodDesigns: https://madegooddesigns.com/featured-image-design/
[9] Hero image best practices — Webflow: https://webflow.com/blog/website-hero-image
[10] Thumbnail design guidelines — Domer: https://domer.io/blog/thumbnail-design-guidelines-blogs-videos
[11] Create featured images that draw readers — Designmodo: https://designmodo.com/create-featured-images/
[12] Google Discover image rules softened (text is UX issue, not prohibition) — suzukikenichi: https://www.suzukikenichi.com/blog/google-discover-image-rules-softened-text-in-images-is-a-ux-and-performance-issue-not-a-prohibition/
[13] Satori vs Puppeteer for OG images — RenderScreenshot: https://renderscreenshot.com/compare/satori-vs-puppeteer-og-images
[14] Programmatic screenshots and OG image tools — DevTools Guide: https://devtoolsguide.com/screenshot-and-og-image-tools/
[15] Adding text overlays to OG images — ogimagen: https://ogimagen.com/blog/og-image-text-overlay
[16] OG images: make the share legible — SEOJuice: https://seojuice.com/blog/open-graph-images-boost-your-click-through-rates/
[17] OG image best practices 2026 — Screenhance: https://screenhance.com/blog/og-image-best-practices
