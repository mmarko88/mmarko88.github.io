---
title: "The 2-Retry Limit: Stop Burning Tokens on the Wrong Error"
date: 2026-10-19
draft: true
usePageBundles: true
description: "A hard cap on error retries plus a clean escalation path is the single biggest cost saver I've measured in agentic development. 42% median session cost drop."
tags: ["agents", "ai", "cost", "errors"]
categories: ["agents"]
featureImage: 'hero.svg' # Series-branded 1200x630 hero (matches MS SQL series design).
featureImageAlt: 'Agentic Development series card for two-retry-limit — see post body for details.'
shareImage: 'share.png'
---

The most expensive agent session I ever ran burned $12 trying to install a Python package. The
machine had no internet. The agent tried pip, pip with `--index-url`, pip with `--trusted-host`,
curl + pip, wget, pip with the proxy, pip with another proxy, apt, conda, poetry, and six more
variants over 47 turns before I noticed the output and killed it. The error was the same every
time: no network.

Agents don't naturally know when to stop. Letting one retry the same failing command indefinitely
is the single most expensive mistake I've measured in agentic development, and the fix is almost
embarrassingly simple: **two attempts, then escalate to a human.**

> **The one thing to take from this post:** error recovery without a cap is a cost loop.
> Two attempts max on the same error, then the agent stops, reports what it tried, and asks.

## Why unlimited retries fail

Three reasons an agent spirals on the same error:

**1. The model confuses "different command" with "different approach."** `pip install X` and
`pip install X --upgrade` are the same approach to the model's planner — install via pip. It
doesn't register them as "I tried this, let me try something categorically different." It
registers them as "I tried, let me vary the flags."

**2. The context fills with failed attempts.** Each retry adds the error output to the context.
After 10 retries, half the window is red error messages, and the model's planning gets worse
because the signal is drowned.

**3. Loss aversion.** The model has invested five turns trying to solve this; stopping *looks*
like admitting defeat. There's no concept of sunk cost in the planning turn. Keep going is
cheap-looking, until it isn't.

## The rule I shipped

Explicit, token-cheap, in the global rules:

```markdown
## Error recovery
- Two attempts max on the same error, then stop and escalate.
- Attempt 1: the obvious fix. Attempt 2: a different approach, not a flag tweak.
- After attempt 2 fails: report (what you tried, what failed, what you suspect), ask the user.
- Exception: ask the user immediately for auth, permissions, or env config problems.
```

Four parts matter:

- **"Two attempts max."** Not three, not five. Two is enough to try the obvious thing and one
  variation. More than that, and the model is cargo-culting.
- **"A different approach, not a flag tweak."** Pip-with-different-flags doesn't count as
  attempt 2. The second attempt must be *categorically* different: a different tool, a different
  install method, a different debugging angle.
- **"Report, then ask."** Reporting is non-negotiable. Agent that stops with "sorry, didn't
  work" is useless; agent that stops with "I tried A (got X), I tried B (got Y), I think the
  root cause is Z" is immediately actionable.
- **Named exceptions.** Auth, permissions, env config → ask on *first* failure. Don't retry a
  401 by varying the request body; the credentials are wrong.

## The measurement

I ran the same 50 tasks against two configurations:

| | Median session cost | Max session cost | Completion rate |
|-|---|---|---|
| **Unlimited retries** | baseline | 14.3× baseline | 72% |
| **2-retry limit + escalate** | **-42%** | 2.1× baseline | 78% |

Three findings:

- **Median cost drops 42%.** Even sessions that *don't* fail save tokens, because the model
  wastes fewer turns on dead ends it would have tried.
- **The long tail collapses.** Max session cost (worst case in the sample) dropped from 14.3× to
  2.1× the median. The $12 install-storm sessions become impossible.
- **Completion rate goes *up*, not down.** This surprised me. The intuition was "if I stop early,
  I'll finish fewer things." The reality is a quick escalation to a human + a one-line answer
  ("you need to be on VPN") unblocks the task in 30 seconds. Letting the agent keep thrashing
  takes 10 minutes to the same answer *if the user is watching*, and forever if they aren't.

## What the escalation looks like

Instead of this (23 turns in):

> ``> pip install sharp``
> ``ERROR: no matching distribution found``
> ``Let me try with --index-url...``

The agent produces this (on turn 3):

> I tried two approaches to install sharp:
>
> 1. `pip install sharp` → "no matching distribution found"
> 2. `conda install -c conda-forge sharp` → "PackageNotFoundError"
>
> I suspect the issue is that `sharp` is an npm package, not a Python one. Should I use `npm
> install sharp` instead, or did you mean a different package?

That report is 90 tokens. The user replies "yes, npm" in two seconds. Total cost: trivial.
Compare to the alternative, where the agent discovers the npm detail after 20 more pip
variations.

## Where the rule exempts itself

Three cases where "two attempts" is wrong:

**1. Idempotent reads that occasionally fail.** `curl` with a transient network blip. Retry up
to 3 times with backoff — but after 3, escalate. Different cost profile; different rule.

**2. Long-running commands that hang.** A build that takes 10 minutes isn't a retry candidate.
Timeout + escalate; don't retry.

**3. Flaky tests on CI.** Known-flaky tests get a 3-retry allowance *at the test level*, with
the flake tagged. Not at the agent level.

Each exception is named in the rules file. "Known flaky test" isn't a free pass for every error.

## When the user is watching

The 2-retry rule assumes a user who can be asked. In fully-unattended mode (long-running
automation), the escalation is to a dead-letter queue — the task fails and a human reviews the
report later. Still cheaper than running the automation into the ground.

## Related reading

- [The 500-line skill limit](/post/agentic/context-budget/) — the context-fills-with-errors
  failure mode gets worse the smaller your budget. Capped retries make budgets easier to hold.
- [One topic per session](/post/agentic/one-topic-per-session/) — related failure: letting the
  agent switch problems mid-session instead of escalating.

**Up next:** The specialist checkpoint pattern — when to split one agent into five (coming soon).
