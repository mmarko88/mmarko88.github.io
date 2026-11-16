# Learnings

Durable lessons captured after something was learned the hard way — a wrong assumption,
a failed approach, a convention discovered mid-task. Inspired by Compound Engineering's
`docs/solutions/`.

**The bar:** write a learning only when it holds reasoning not recoverable from the
current repo, and losing it would cause a repeat mistake or real re-investigation.
Completion and effort do not qualify. If the answer to "would the next agent repeat
this without the doc?" is no, write nothing.

**Not learnings:** desk research commissioned before doing the work lives in
`RESEARCH-*.md` at repo root. A learning records what doing taught; research records
what reading taught.

## Format

One file per lesson: `learnings/<category>/<slug>.md`. Categories grow as needed
(e.g. `hugo/`, `workflow/`, `promotion/`).

```yaml
---
title: <what was learned, as a rule>
date: <yyyy-mm-dd>
category: <dir name>
problem_type: wrong_assumption | convention | defect | workflow
applies_when:
  - <situation where this learning fires>
retire_when: <condition under which this doc is stale — delete it then>
tags: [<searchable terms>]
---
```

Body: the fact, why the obvious alternative failed, and what to do instead. Short —
a learning is a pointer to a decision, not an essay.

**Refresh:** when a task reveals a learning is stale or wrong, fix or delete it in the
same change — a wrong learning is worse than none.
