---
description: Draft a blog post conforming to ARTICLE_WRITING_STANDARDS.md
---

# Draft a post to writing standards

Usage: `/write-post <topic>` — optionally with notes, links, benchmark output, or a target slug.

This is the generation half of the loop. `/check-standards` is the verification half — this
workflow drafts, then hands off. Never copy standards into this file: read the source doc fresh
each run (step 2), so the skill can't drift stale.

## Steps

1. **Gather the brief.** You need three things before writing anything:
   - **Topic + angle** — what happened, what's the non-obvious point
   - **Evidence** — notes, links, terminal output, benchmark runs, code the post will show
   - **The ONE takeaway** — the single thing a reader should remember (this becomes the callout)

   If the user gave only a title, ask for evidence before proceeding. A post about a benchmark
   with no benchmark output cannot be drafted — measure first, or the draft ships with invented
   numbers.

2. **Read the source of truth.** Read `ARTICLE_WRITING_STANDARDS.md` at repo root in full. Do
   not rely on memory — the doc may have changed since last run.

3. **Read exemplars.** Read 1–2 posts in full to pattern-match voice and structure:
   - `content/post/agent-skills/what-are-skills/index.md` — hook + takeaway callout + comparison table
   - `content/post/agent-skills/creating-your-first/index.md` — stepwise structure

   Swap in a closer exemplar if the topic is a different genre (benchmark post, TIL, mistake post).

4. **Propose an outline; wait for approval.** Present, then stop:
   - 2–3 title candidates (verb + specific thing + context, ~50–60 chars, keyword early; number
     in title only if real measured data exists)
   - Heading skeleton where a scanner reading only headings gets the takeaways — structure
     follows problem → pain → solution → gotchas → takeaway
   - Planned visuals per section (diagram, code block, chart, receipt) — ≥1 beyond feature image
   - Which numbers/claims still need measurement

   Do not draft until the user approves the outline.

5. **Draft the post.** Create `content/post/<slug>/index.md` (kebab-case slug, keyword-rich,
   no dates). Front matter template:

   ```yaml
   ---
   title: "<approved title>"
   date: <today>
   draft: true
   usePageBundles: true
   description: "<140–160 chars, keyword + benefit>"
   tags: ["<tag1>", "<tag2>"]
   categories: ["<category>"]
   # series: ["<series>"]        # only if part of one
   featureImage: 'hero.svg'      # placeholder — real image via /cover-image
   featureImageAlt: '<alt text>'
   shareImage: 'share.png'       # PNG/JPG only — crawlers ignore SVG
   ---
   ```

   Drafting rules — these prevent failures a critic can only flag, not fix:
   - **Never invent a number, measurement, version, or quote.** Anything not in the brief gets
     `<!-- TODO: measure <what> -->` — a visible placeholder, not a plausible guess. This is the
     highest-priority rule in this file.
   - **Write the opening last.** Draft body sections first, then the 2–4 sentence hook (concrete
     scenario, consequence, or surprising claim — never a definition or "In this post…").
   - **The ONE takeaway** goes in a `> **The one thing to take from this post:**` blockquote
     near the top.
   - Code blocks: language-tagged, ≤~30 lines, copy-paste runnable, no forward references,
     omissions marked `// existing settings`.
   - Long implementations go in `<details>` blocks.
   - ≥1 internal link to a related post, placed where the reader wants it.
   - Conclusion = takeaway + next step. No "In conclusion…".

6. **Hand off to the critic.** When the draft is written, tell the user it's ready for review
   and invoke `/check-standards <slug>` — as a *separate* step, not a self-audit in this pass.
   Apply fixes from that report; rerun until FAILs are gone.

## What this workflow is not

- **Not a publisher.** It creates `draft: true` bundles. Measuring TODOs, cover image
  (`/cover-image`), quiz (`/quiz`), and publishing are separate steps.
- **Not a standards copy.** All rule authority lives in `ARTICLE_WRITING_STANDARDS.md`; this
  file only encodes process order and the rules that must hold at generation time.
- **Not an auto-writer.** Steps 1 and 4 are human gates — no evidence in, no draft out; no
  outline approval, no prose.
