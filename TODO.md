# Website TODO

## #3 — dev.to canonical URLs (manual, ~10 min)

Every post cross-published to dev.to needs its **canonical URL** pointing back to
the professionaldev.dev original, or Google may rank the dev.to copy above this site.

- Edit each article on dev.to → Settings → "Canonical URL"
- Set it to `https://www.professionaldev.dev/post/<path>/`
- Do this for all existing cross-posted articles; add it to the per-post checklist in `ARTICLE_IDEAS.md`

## #7 — Expand About page + CV

`content/about.md` is currently ~15 lines. For recruiter/job-visibility value it should include:

- Who you are: name, role, seniority, specialization (Java backend, performance, databases)
- 3–5 sentence bio — concrete, no buzzwords
- Talks/presentations if any
- CV PDF download link (drop the PDF into `static/files/`, link `/files/cv.pdf`)
- Links already exist in the social menu — just reference them naturally in the text
