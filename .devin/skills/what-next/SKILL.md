---
name: what-next
description: Score and rank what to work on next — parked drafts, backlog ideas, fresh angles — and emit a short list with the route for each (publish, finish, write, research, promote). Use when the user asks what to write/do next; not for drafting (write-post) or verifying (check-standards).
argument-hint: "[optional: focus area, e.g. 'java' or 'promotion']"
---

# What next

Adapted from Compound Engineering's `ce-ideate`, shrunk to a solo blog's decision:
the problem is never idea generation — it's choosing among parked drafts, ranked
backlog items, and fresh angles.

**Done when:** a ranked list of 3–5 candidates is emitted, each with its evidence,
the adversarial-cut reason losers lost, and a named route per survivor — or the
report says there is nothing worth doing and why.

## Ground before scoring

No candidate judged from memory. Read, in order:

1. `content/ideas/` — every parked draft; for each, estimate completeness
   (prose done? visuals? front matter? what's the smallest remaining step?).
2. `ARTICLE_IDEAS.md` — ranked backlog with demand evidence.
3. `BACKLOG.md` — known blockers per parked item.
4. `learnings/` — promotion and workflow lessons that change what "good" means.
5. `post-pulse` output if the user ran it recently — real traffic beats guesses.

## Score each candidate on four axes

- **Demand** — search demand evidence (SO views, recurring questions), or proven
  series/niche pull. A post nobody googles needs a different justification.
- **Distance to ship** — a parked draft at 90% beats a fresh idea at 0%. Name the
  specific remaining step, not a percentage.
- **Evidence on hand** — can claims be measured/shown? A benchmark post without
  benchmark output is a research task, not a draft task.
- **Momentum** — series continuation, proven niche, ties to a top-performing post,
  or a live promotion window.

## Generate, critique all, explain survivors only

Include fresh candidates alongside parked ones — a quick pass for anything the
files missed. Then cut adversarially: every rejected candidate gets an explicit
reason ("demand unproven", "needs 6 diagrams first", "saturated topic"), never a
silent drop or optimistic ranking.

## Output

```markdown
## What next — <date>

1. **<candidate>** — <route: publish | finish | write | research | promote>
   Evidence: <demand / distance / evidence / momentum in one line>
   Why it won: <the single deciding factor>

## Cut
- **<candidate>** — <why it lost>

Verdict: <recommended single next action + which skill runs it>
```

Routes map to skills: `post-lifecycle publish|idea`, `write-post`, `research`,
`promote-post`, `check-standards`. The verdict is one action — the user picks.
