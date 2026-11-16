---
name: post-pulse
description: Pull GA4 pageview stats through stats-api, compare real post performance against what ARTICLE_WRITING_STANDARDS.md predicts, and record outcomes as learnings. Use for a periodic performance review of published posts, or when asked which posts worked and why. The loop-closer — feeds evidence back into the standards.
argument-hint: "[days, default 90] [mode:non-interactive]"
---

# Post performance retro

Closes the loop: the standards make claims (numbers in titles get clicks, failure
framing gets shares, 1200–1800 words is the sweet spot). This skill checks whether the
published posts' traffic agrees, and captures what it finds in `learnings/`.

**Done when:** a ranked report of post performance is emitted, each standards
prediction tested against the data is marked confirmed/contradicted/insufficient-data,
and qualifying surprises are written to `learnings/promotion/` via the `learn` skill —
or the report says nothing qualified.

**Boundaries:** read-only for GA and posts. Writes go only to `learnings/` and
`ARTICLE_WRITING_STANDARDS.md` (and only with explicit user approval). Never write the
stats password into the repo, a file, or output.

## Steps

1. **Get the password.** Use `STATS_PASSWORD` from the environment if set; otherwise
   ask the user once. Never persist it.

2. **Pull the data.** POST to `https://mmarko88githubio-stats-api.vercel.app/api/ga`
   with `{"password": "...", "days": <days>}`. The response is the same payload the
   `/mmarko88stats/` page renders — per-page views, sources, devices. For a suspicious
   number on one post, re-query with `"page": "/post/<topic>/<slug>/"` for its
   breakdown. On 401 say so and stop; on 429 wait and retry once.

3. **Rank and compare.** Build a table: post, views, views/day since publish (posts
   published mid-window need normalizing). Then test the standards' testable
   predictions against the ranking:
   - numeric title → CTR proxy (views vs. non-numeric titles)
   - failure/mistake framing → views and sources
   - word count band (~1200–1800) vs. outliers
   - cross-posted (dev.to) vs. native traffic split if sources allow
   Each gets confirmed / contradicted / insufficient-data with the numbers.

4. **Capture what the data taught.** A confirmed prediction is not a learning — it's
   already in the standards. A *contradiction* or a surprise the standards never
   predicted qualifies for `learnings/promotion/<slug>.md` — invoke `learn` once per
   qualifying lesson. Propose standards edits only where data clearly contradicts;
   small samples get noted, not enshrined.

5. **Report.** Table first, then the per-prediction verdicts, then learnings written.
   No narrative padding — this is a stats report.
