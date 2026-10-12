# Website TODO

## #3 — dev.to canonical URLs (manual, ~10 min)

Every post cross-published to dev.to needs its **canonical URL** pointing back to
the professionaldev.dev original, or Google may rank the dev.to copy above this site.

- Edit each article on dev.to → Settings → "Canonical URL"
- Set it to `https://www.professionaldev.dev/post/<path>/`
- Do this for all existing cross-posted articles; add it to the per-post checklist in `ARTICLE_IDEAS.md`

## #7 — Expand About page + CV ~~DONE (CV PDF still needed for download link)~~

`content/about.md` is currently ~15 lines. For recruiter/job-visibility value it should include:

- Who you are: name, role, seniority, specialization (Java backend, performance, databases)
- 3–5 sentence bio — concrete, no buzzwords
- Talks/presentations if any
- CV PDF download link (drop the PDF into `static/files/`, link `/files/cv.pdf`)
- Links already exist in the social menu — just reference them naturally in the text

## Homepage improvements (research, Oct 2026)

- [x] **H1** — Sharpen hero positioning: who/what/outcome in 5s + CTA (Read posts / Subscribe)
- [x] **H2** — Newsletter CTA on homepage (reuse post-cta Buttondown form)
- [x] **H3** — "Latest" strip on home: 3 newest posts + latest TIL (signals freshness)
- [x] **H4** — Projects/Selected Work section (3-4 cards, data file-driven)
- [x] **H5** — "Start here" series callout (MS SQL 4-part series banner)
- [x] **H6** — /now page + status line in hero
- [x] **H7** — End-of-page contact CTA (X + LinkedIn repeat)
