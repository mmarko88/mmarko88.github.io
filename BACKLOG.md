# Website Backlog — Incomplete Work Triage

_Consolidated from a repo scan on 2026-10-20. Captures everything planned-but-not-done so nothing is lost. Complements `TODO.md`, `IMPROVEMENT_PLAN.md`, `RESEARCH_SITE_AUDIT.md`, and `ARTICLE_IDEAS.md` (which hold the finer detail per item)._

Legend: **P1** = publish-blocking or user-visible gap · **P2** = quality/engagement · **P3** = polish/cleanup.

---

## 1. Unpublished content — two whole series sitting in draft (24 posts)

The largest body of incomplete work. All posts below are `draft: true`, so none are live.

### 1a. `agentic/` series — 18 posts (P1)

Hero + share images **are present** (`hero.svg` / `share.png` per bundle). Remaining blockers:

- **Missing inline diagrams/screenshots** — 6 posts carry a `<!-- TODO: diagram … -->` / `<!-- TODO: screenshot … -->` marker:
  - `context-budget` (screenshot of the context-budget report)
  - `different-critic` (diagram: handoff → separate-context critic → verdict)
  - `eval-harness` (screenshot of a pass-rate trend line)
  - `read-only-subagents` (diagram: delegate → subagent in own context)
  - `rule-layering` (diagram: three-layer conflict resolution)
  - `specialist-checkpoints` (diagram: PR → trigger → parallel specialists → merge)
- **"(coming soon)" cross-links** between posts resolve to nothing until the series is published — they must be wired up (or removed) at publish time.
- **Publish decision + order** — 18 posts is a series launch; needs a sequencing/`seriesWeight` pass (same ordering concern we hit on the MS SQL series), plus a `series` taxonomy if they should render as a set.
- **Cleanup**: 4 posts still have dead commented `# featureImageAlt: 'TODO'` / `# shareImage: 'TODO.png'` lines in front matter (harmless, but should be removed).

Full post list (title): intro, getting-started, llms-for-developers, prompt-engineering, one-topic-per-session, two-retry-limit, rule-layering, rule-violation-postmortem, read-only-subagents, specialist-checkpoints, different-critic, multi-agent, context-budget, eval-harness, measuring-roi, security-trust, devin-desktop, six-month-retrospective.

### 1b. `agent-skills/` series — 3 posts (P1)

All `draft: true`: `what-are-skills`, `creating-your-first`, `experts-and-resources`. Review for completeness, then publish (likely paired with or after the agentic series).

---

## 2. MS SQL / benchmarking drafts (the "Insert Optimization + Post Image" plan) (P1)

- **`monitoring_jdbc_sql_server`** — `draft: true`, and the **only post with genuinely missing images**: front matter still has `# featureImage: 'TODO.svg'` / `# featureImageAlt: 'TODO'` / `# shareImage: 'TODO.png'`. Needs hero + share card generated, then publish. Part of the MS SQL series (add `seriesWeight`).
- **`benchmarking_environment`** — `draft: true`. Written, part of the MS SQL series, images present. Needs a publish decision + `seriesWeight`.
- **`java_benchmarking_jmh`** — `draft: true`. Review + publish decision.
- **`youtube/victor_fp_antipatterns`** ("Functional Programming Antipatterns Notes") — `draft: true`, looks like raw notes. Finish or drop.

> Note: if `benchmarking_environment` / `monitoring_jdbc` join the numbered MS SQL series, re-check the series-nav "Part X of N" count — they'd currently appear without a `seriesWeight`.

---

## 3. Projects data (the "Fetch Projects from GitHub" plan) — ✅ DONE [2026-10-20]

- ~~`data/projects.toml` lists a project `fastest-insert` → `https://github.com/mmarko88/fastest-insert`…~~ **Resolved:** the `fastest-insert` card was removed (overlapped the `blog-examples` card, which already covers that code). `projects.toml` now has 2 cards (`blog-examples`, `ahk-setup`).
  - Follow-up (optional, P3): the file's comment suggests 3–4 entries — consider adding a third project.

---

## 4. Cleanup (P3) — partially done

- ~~**`content/post/placeholder-text.md`** — the Hugo sample "Lorem Ipsum" post…~~ ✅ **Deleted [2026-10-20].**
- Remove dead commented `# …: 'TODO'` front-matter lines across the agentic drafts (see 1a). _(still open)_

---

## 5. Engagement / polish (from existing planning docs — still open)

Already tracked in detail elsewhere; listed here so the picture is complete:

- **IMPROVEMENT_PLAN.md**: Codespaces badges ✅ done · quiz questions ✅ done · series nav ✅ done · TOC ✅ done · dark-mode share cards (P3) · `/stats/` analytics dashboard (P2) · saved-for-later: progress bar, copy-code button, benchmark calculator, newsletter-gated content, automated social-card generation.
- **RESEARCH_SITE_AUDIT.md**: reader poll shortcode ✅ component built (needs an embed URL to go live) · insert-time estimator calculator (P2) · "popular posts" homepage section (P2) · `/archive/` page (P3) · `tldr` shortcode (P3) · asciinema recording (P3).
- **TODO.md**: About page + CV PDF download link (CV file still needed) (P2) · dev.to canonical URLs (manual, P2) · feed v2 — per-card like button + comment counts (P3, deferred).
- **ARTICLE_IDEAS.md**: 11 unwritten post ideas (Tier 1 highest-traffic: the "unsaved transient instance" Hibernate error; "cannot simultaneously fetch multiple bags"; `@EntityGraph` LOAD vs FETCH; "why your test suite is slow").

---

## Out of scope for this repo

- **"Set Days Off Oct 19–30 for Spring Capacity"** — an Azure DevOps capacity/sprint task, unrelated to the website repos. Track it in ADO, not here.

---

## Suggested order

1. **Decide the fate of the 24 draft posts** (P1) — they are finished writing but unpublished; the agentic series especially is the biggest value sitting idle. Pick: publish as-is (accepting missing diagrams), or finish the 6 diagrams first.
2. **`monitoring_jdbc` images** (P1) — only true image gap; smallest task to unblock a publish.
3. ~~Fix `projects.toml`~~ ✅ done [2026-10-20].
4. ~~Delete `placeholder-text.md`~~ ✅ done [2026-10-20].
5. Engagement items (§5) as time allows.
