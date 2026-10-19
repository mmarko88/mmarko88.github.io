---
title: "Agentic Development: What Actually Works in Legacy Java"
date: 2026-10-19
draft: true
usePageBundles: true
description: "Six months of coding agents on a 4,000-file Java 17 codebase, measured by session cost and completion rate. What stuck, what I killed, in a 10-part series."
tags: ["agents", "ai", "java", "productivity"]
categories: ["agents"]
# featureImage: 'TODO.svg'
# featureImageAlt: 'TODO'
# shareImage: 'TODO.png'
---

I spent six months giving coding agents increasingly serious work on a real legacy codebase —
Java 17, Spring Boot, 4,000+ files, 367 JPA entities, multi-tenant SQL Server. Not toy problems:
production bug fixes, SDLC-style feature work, security remediation, performance regressions. The
agents got better. I got better at knowing what to let them do, and what to make them stop doing.

This post opens a series on the handful of patterns that actually paid off, measured in session
success rates and token cost — not in hype.

## What this series is (and isn't)

**Is:**

- Opinionated, measured accounts of specific patterns that moved the needle.
- Code and config excerpts from a real agent framework I run every day.
- Numbers: before/after session counts, token budgets, pass rates.

**Isn't:**

- "AI will replace developers" — I've watched agents try, and I've watched them fail.
- A framework pitch. I'm not selling anything; the patterns here are tool-agnostic.
- A beginner's tutorial. If you've never run an agent on real code, this won't be the right first read.

## The series

Each part is a standalone post. Together they describe the agentic development loop I use today.

1. **Why your coding agent needs a different critic.** Intrinsic self-correction doesn't work.
   LLMs reviewing their own output re-derive the same conclusion. Published research + my own
   measurements say the verifier must run in a fresh context and try to *falsify*.
2. **The 500-line skill limit.** Every rule, skill, and system prompt is a token tax on every
   turn. Measuring the budget and enforcing it in CI changed what rules I was willing to add.
3. **Rule layering: user > project > framework.** Once you have three sources of rules, you need
   a precedence system. The alternative is agents cherry-picking.
4. **I ran 1,000 agent sessions through a scoring harness.** You can't optimize what you don't
   measure. The eval cases, the regressions caught, and the dumb rule tweaks that broke things.
5. **The 2-retry limit.** Letting an agent retry the same failing command 50 times is the single
   most expensive mistake. A hard cap + escalation is the biggest cost saver I've measured.
6. **The specialist checkpoint pattern.** A generalist can't review a database migration, a
   security change, and a performance regression equally well. Four specialists that only fire
   when relevant beat a monolithic prompt.
7. **Read-only subagents are 5× cheaper.** For exploration/research tasks, a cheap read-only
   subagent (grep + glob + read, cheaper model) matches a full-tool agent on accuracy at a
   fraction of the cost.
8. **One topic per session.** Letting agents context-switch between unrelated problems is the
   #1 waste pattern I've seen. One session with 11 unrelated asks completes zero of them.
9. **The post-mortem that mattered most.** How one agent violated the same rule three times in a
   row by acknowledging it each time. The rule rewrite that catches this.
10. **Six-month retrospective.** What stuck, what I killed, actual ROI numbers.

## The underlying thesis

**Agentic development is engineering, not magic.** It's measurement, feedback loops, budgets,
retries, and specialists — the same practices that work for every other distributed system. The
teams getting value from coding agents aren't the ones with the fanciest prompts; they're the
ones treating the agent as a service they can observe, bound, and iterate on.

If you have a specific setup you've been fighting with, say which part of the pipeline is hurting
and I'll aim the next post at it.

> **The one thing to take from this post:** every pattern in this series started as a cost line
> on a token bill or a session that didn't complete. Measure first; opine later.

**Up next:** [Why your coding agent needs a different critic](/post/agentic/different-critic/) —
the research on intrinsic self-correction, and the A/B results from running the same workload
with and without a separate-context adversarial pass.
