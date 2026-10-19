---
title: "Six Months of Agentic Development on Legacy Java: What Stuck"
date: 2026-10-19
draft: true
usePageBundles: true
description: "The retrospective. Which rules I kept, which I killed, actual ROI numbers from six months of coding agents on a 4,000-file Spring Boot codebase."
tags: ["agents", "ai", "retrospective", "productivity"]
categories: ["agents"]
# featureImage: 'TODO.svg'
---

Six months ago I started seriously running coding agents on a 4,000-file Java 17 Spring Boot
codebase. Not toy problems — real production tickets, security remediations, performance
regressions, cross-repo migrations. This series documented the patterns that mattered along the
way. This post closes it with a retrospective: what stuck, what I killed, and the numbers.

> **The one thing to take from this post:** the patterns that stuck are the ones with
> measurable ROI. The ones I killed sounded clever but didn't survive a scoring harness. If
> you take one meta-lesson from six months of agentic development, it's this: *measure, cull,
> keep*.

## The scorecard

Across the nine patterns in this series, three outcomes:

### Kept (production-grade)

| Pattern | Measured ROI |
|---------|-------------|
| [Different critic (separate context)](/post/agentic/different-critic/) | 3× more defects caught at the gate |
| [Context budget / 500-line skill limit](/post/agentic/context-budget/) | 36% median session token reduction |
| [Rule layering](/post/agentic/rule-layering/) | Silent overrides caught at CI, not in production |
| [1,000-session eval harness](/post/agentic/eval-harness/) | Three real regressions caught before rollout |
| [2-retry limit](/post/agentic/two-retry-limit/) | 42% median session cost drop, long-tail collapsed |
| [Specialist checkpoints](/post/agentic/specialist-checkpoints/) | 37% more real issues caught at review |
| [Read-only subagents](/post/agentic/read-only-subagents/) | 5× cheaper on exploration tasks, no accuracy loss |
| [One topic per session](/post/agentic/one-topic-per-session/) | Topics completed 3×, satisfaction nearly doubled |
| [Rule compliance in-turn](/post/agentic/rule-violation-postmortem/) | Rule violations repeat-rate dropped to ~0 |

Every one of these has a measurement attached. The measurements are the reason they survived.

### Killed (sounded clever, didn't work)

Three patterns I invested time in that I eventually deleted:

**1. Multi-agent debate for every decision.** The idea: two agents argue, a third moderates,
best answer wins. Measured: 3× cost for 1.1× accuracy. For most tasks, the single-agent + critic
pattern is strictly better. Debate helps on genuinely ambiguous open-ended questions; coding is
rarely one of those.

**2. Self-reflection loops.** Agent produces output, agent reads it, agent iterates. Across
measured sessions, the iterations usually *didn't* improve accuracy (Huang 2024 was right). I
replaced self-reflection with the separate-context critic pattern.

**3. Chain-of-thought-style scratchpads in every prompt.** Making every agent "think step by
step" sounded safe but doubled the output length on tasks where the answer was simple. I now
reserve explicit CoT prompts for genuinely multi-step reasoning (planning, estimation).

### Partially kept

Two patterns that work in some contexts and not others:

**1. Specialist checkpoints for small codebases.** Pays off at my scale (4,000+ files). On a
500-file project the generalist is still better; the specialists over-fire and nitpick. I keep
the pattern but gate it on repo size.

**2. Full-SDLC pipeline (investigate → analyze → architect → implement → test).** Dramatic on
large features. Overkill on bug fixes under 4 hours. I kept the pipeline but added a classifier
up front that picks the recipe — bug fix vs feature vs hotfix — rather than running all stages
every time.

## The economics

Six months of running these patterns on a team of three developers:

| Metric | Baseline (no agents) | After 6 months |
|--------|---------------------|----------------|
| Tickets completed per developer per sprint | 6.2 | 8.9 |
| Agent token cost per developer per month | $0 | $240 |
| Average time to first PR on a new ticket | 2.1 days | 1.3 days |
| Code review turn-around (first comment) | 1.4 days | 0.4 days |
| Post-release defects per sprint | 2.3 | 1.1 |

Three things stand out:

- **Throughput up 44%.** Not from "agents writing code"; from agents handling investigation,
  review, and documentation faster than humans. The humans still write most of the production
  code.
- **$240 per developer per month** is the fully-loaded agent cost. For context: a quarter of
  the way to a day of senior developer time.
- **Defects down 52%.** This surprised me. The pattern-review (specialists catching N+1s, the
  critic catching off-by-ones) does more for quality than I expected.

## The unlock that mattered most

If I had to pick one pattern that enabled everything else, it's the **eval harness**. Every
other pattern in this series was measurable only because the harness existed. Without it:

- The "different critic" change would have been intuition, not evidence.
- The context-budget trims would have been undetectable regressions.
- The "2-retry limit" would have felt restrictive instead of saving 42%.

**You can't optimize what you don't measure.** The harness is the measurement surface. Build
it first; everything else gets easier.

## What I'd do differently if starting again

Three mistakes I'd avoid on a greenfield agent setup:

**1. Build the eval harness in week one, not week six.** I ran agents for six weeks without
measurement and accumulated two months of unverified-by-anything intuitions. Half of them were
wrong. I threw out a lot of work when I finally measured.

**2. Keep AGENTS.md under 8 KB from day one.** Mine grew to 24 KB before I audited. Trimming
it back was painful because every section had been added for *some* real reason. Rejecting them
in advance is cheaper than deleting them later.

**3. Decide which model goes with which task from the start.** I used the premium model for
everything for the first two months. Switching to cheaper models for research cut costs in
half overnight. Model choice is a decision; make it deliberately.

## Where this is going next

The patterns in this series are stable; the ecosystem isn't. Three directions I'm watching:

- **Cheaper reasoning models.** Haiku-class models already handle research. The next cost
  cliff is reasoning models cheap enough to use as the critic. That changes the economics of
  the gate pattern.
- **Code-local evals.** Running the eval harness per-PR on the parts of the agent config the
  PR touches, not the whole thing. Faster feedback, less flake.
- **Deeper tool restriction.** Read-only subagents at 5× cheaper is nice; what's a 50×-cheaper
  tool-restricted agent look like? I don't know yet, but it's where the next win probably is.

## Closing

Agentic development isn't an experiment anymore for me. It's a toolchain, maintained like any
other toolchain: measurements, budgets, specialists, retries, post-mortems. The weird part
isn't that it works. The weird part is that nothing about making it work is magic — it's the
same engineering practices that make everything else work. Measure, cull, keep.

If a specific pattern in this series was useful to you, [tell me](https://x.com/mare_milenkovic)
— especially if you've measured it in your own setup. The numbers above are mine; yours will
differ. The ones that match are the ones to trust.

## Related reading

- Start of this series: [Agentic Development: What Actually Works in Legacy Java](/post/agentic/intro/)
- The one I'd read first if you only read one: [1,000 agent sessions through a scoring harness](/post/agentic/eval-harness/)
