---
name: post-shape
description: Interview the user one question at a time on a chosen topic and produce a structured post brief — reader query, pain, ONE takeaway, evidence have/need, angle, genre — that write-post consumes directly. Use between picking a topic (what-next) and drafting (write-post). Routes fact-finding to research; never asks what can be looked up.
argument-hint: "<topic or slug> [known context]"
---

# Shape a post

Adapted from Compound Engineering's `ce-brainstorm`: one question at a time, ask only
decisions. This skill turns a raw topic into a brief `write-post` can draft from —
its step-1 evidence gate and step-4 outline gate consume this output directly.

**Done when:** the brief below is filled — every field either answered or routed —
and emitted for user approval. A question the user can't answer becomes a routed
need, not a stall.

## Rules

- **One question at a time.** Wait for the answer before the next. Never a wall of
  prompts.
- **Ask only what only the user can decide** — their experience, opinion, intent.
  Anything fact-checkable is not a question: look it up yourself (repo, post-pulse
  data, web) or route it to `/research`.
- **Skip what's already answered** — the invocation context, the parked draft's
  prose, or a previous answer may fill a field. Confirm, don't re-ask.
- Max ~6 questions. If more are needed, the topic isn't a post yet — say so.

## The question set

In order; each maps to a brief field.

1. **The reader's query** — what did they literally type into Google? Verbatim,
   not an audience label. If unknown, that's a `/research` task (SO demand check),
   not a guess.
2. **The pain** — what did you actually hit? the error string, the slow query, the
   dead end. Personal experience is the post's spine (NOCAY allows this "I").
3. **The ONE takeaway** — the single sentence a reader should remember. Becomes the
   callout.
4. **Evidence inventory** — what exists now (code, benchmark output, terminal
   receipts) vs. what's missing. Each missing item routes: facts/demand/competitor
   coverage → `/research`; measurements → user runs it or a `<!-- TODO: measure -->`;
   repo facts → read directly.
5. **The angle** — what do people get wrong about this? what's the non-obvious or
   contrarian bit only you saw? No angle → say so honestly; some posts win on
   completeness instead.
6. **Genre** — offer the patterns: problem→pain→solution→gotchas→takeaway /
   postmortem / benchmark report / TIL / explainer. Recommend one with a reason.

## Gap lenses (run before emitting)

- **Coverage** — does a top-ranking answer already say this well? If yes, the post
  needs the angle or better evidence, or it's a cut. (Quick web check or `/research`.)
- **Evidence** — every claim in the brief traceable to have/need? Unproven numbers
  are the write-post killer.
- **Freshness** — why now? Version change, your recent bug, series momentum, or a
  live promotion window.
- **Distance** — is the smallest useful version a TIL instead of a full post?

## Output

```markdown
## Post brief: <topic>

- **Reader query:** "<verbatim>"
- **Pain:** <what was hit>
- **ONE takeaway:** <sentence>
- **Angle:** <what people get wrong / what's unique>
- **Genre:** <pattern>
- **Evidence have:** <list>
- **Evidence need:** <item → routed to: research / measure / TODO>
- **Title candidates:** <2–3, per standards>
- **Route:** /research <query> → /post-lifecycle new → /write-post
```

Emit the brief, get approval, then hand off: `/post-lifecycle new <slug>` → `/write-post`.
