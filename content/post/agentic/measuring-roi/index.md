---
title: "Measuring Agent ROI: When Coding Agents Save Time and When They Cost More"
date: 2026-10-24
draft: true
usePageBundles: true
description: "How to measure if coding agents actually save time. Token costs vs developer hours, the tasks where agents pay for themselves, and the ones where they don't."
tags: ["agents", "ai", "productivity", "measurement"]
categories: ["agents"]
featureImage: 'hero.svg'
featureImageAlt: 'Measuring agent ROI — bar chart showing time saved by task type from bulk refactoring to architecture.'
shareImage: 'share.png'
---

My team spent $847 on agent tokens last month. We also shipped 23% more PRs than the month
before, with fewer reviewer comments per PR. Does that mean the agents paid for themselves?
Maybe. But proving it requires more than vibes and gut feelings.

This post is about how to measure — actually measure, with numbers — whether coding agents
are saving you time or burning your budget.

> **The one thing to take from this post:** ROI isn't about token cost. It's about the total
> cost of a task: developer time + agent tokens + review time + rework. Measure all four or
> you're fooling yourself.

## The total cost equation

```text
Total cost = developer_time + agent_tokens + review_time + rework_time
```

An agent that produces a PR in 10 minutes but requires 45 minutes of review and 30 minutes
of rework didn't save time — it shifted work from writing to reviewing. That's not
necessarily bad (reviewing is often easier than writing), but you need to count all of it.

### What to measure

| Metric | How to track | What it tells you |
|--------|-------------|-------------------|
| **Session cost** | Token usage × price | Direct agent expense |
| **Session completion rate** | Tasks completed / tasks started | Agent reliability |
| **Time to first PR** | Clock time from task start to PR creation | Agent speed |
| **Review comments per PR** | Count from code review | Output quality |
| **Rework rate** | PRs requiring changes after review | Real completion quality |
| **Developer intervention rate** | Times you had to redirect/fix the agent | Autonomy level |

### The metrics that actually matter

**Session completion rate** is the most important metric. An agent that costs $0.50 per session
but completes 90% of tasks beats one that costs $0.10 but completes only 40%. The failed
sessions aren't free — you spent time formulating the task, waiting, reviewing partial work,
and then doing it yourself.

**Rework rate** is the second most important. A PR that passes on first review saved real time.
A PR that goes through three review cycles cost more than manual coding.

## Where agents pay for themselves

Based on six months of tracked data on a 4,000-file Java codebase, here's where agents
consistently save time:

### Tier 1: Clear ROI (saves 60-80% of time)

- **Bulk refactoring** — rename a method across 50 files, update import paths, convert patterns.
  Agent time: 5-15 min. Manual time: 1-3 hours.
- **Boilerplate generation** — CRUD endpoints, DTO classes, test scaffolding. The patterns are
  well-established and the agent produces them perfectly.
- **Documentation generation** — Javadoc, README updates, API changelog entries. The agent reads
  the code and produces accurate documentation faster than you can type it.

### Tier 2: Good ROI (saves 30-50% of time)

- **Well-defined bug fixes** — clear symptom, known location, existing test coverage. The agent
  reads the failing test, traces to the root cause, and fixes it.
- **Security remediation** — SQL injection parameterization, input validation, encoding fixes.
  Mechanical transformations with clear patterns.
- **Test writing** — given a service with clear behavior, the agent writes tests that cover the
  obvious cases. You add the edge cases.

### Tier 3: Break-even (saves 0-20% of time)

- **Complex feature implementation** — multi-file features with business logic. The agent gets
  70-80% right, but the remaining 20-30% requires significant intervention.
- **Performance optimization** — the agent can find the slow query but often proposes fixes that
  don't account for side effects.
- **Database migrations** — the agent generates correct Liquibase, but you need to verify
  rollback behavior and data migration manually.

### Tier 4: Negative ROI (costs more time)

- **Architectural decisions** — the agent can't evaluate trade-offs you haven't articulated.
  It picks whatever pattern it's seen most often, which may not fit your constraints.
- **Novel algorithms** — anything that requires genuine invention rather than pattern application.
- **Cross-system debugging** — tracing a problem across multiple services, databases, and
  queues. The agent lacks the holistic context.
- **Vague requirements** — "make the API better" produces random changes that need full review.

## How to track ROI (the simple version)

You don't need elaborate tooling. A spreadsheet works:

```text
| Date | Task | Agent? | Agent cost | Agent time | Manual estimate | Review comments | Rework? |
|------|------|--------|-----------|-----------|----------------|----------------|---------|
| 10/1 | Fix NPE in ContactSvc | Yes | $0.15 | 3 min | 20 min | 0 | No |
| 10/1 | Add fund filter | Yes | $2.30 | 25 min | 45 min | 4 | Yes |
| 10/2 | Rename API endpoint | Yes | $0.40 | 5 min | 90 min | 0 | No |
| 10/2 | Design caching layer | No | — | — | 3 hrs | — | — |
```

After two weeks, you'll have enough data to see which task categories are worth delegating
and which aren't. After a month, you'll have your own ROI numbers instead of relying on
someone else's benchmarks.

## The hidden costs people miss

### Context switching cost

When the agent fails and you need to take over, you're context-switching from
"reviewer" mode to "implementer" mode. That context switch costs 10-15 minutes of ramp-up
time. If the agent fails 30% of the time, you're spending 30% × 15 minutes = 4.5 minutes per
task just on switching.

### Review overhead

Agent-generated code requires the same review rigor as human-written code — possibly more,
because agents make different mistakes than humans. If your team doesn't have a review habit,
adding agents won't create one.

### Skill maintenance

Your rules and skills need updating as the codebase evolves. Budget 30-60 minutes per month
for skill maintenance. A stale skill that gives wrong instructions costs more than no skill.

### Learning curve

The first two weeks of using agents will be slower, not faster. You're learning what to
delegate, how to prompt, and what to review. This is an investment that pays off in week three
and beyond.

## The numbers that should worry you

Watch for these signals that agents are costing more than they save:

- **Completion rate below 60%**: more failures than successes means the agent isn't suited
  to your tasks (or your prompts need work)
- **Average review comments above 5 per PR**: the agent is producing low-quality output
  that shifts work to reviewers
- **Rework rate above 30%**: the agent's first attempt is wrong too often
- **Session cost above $5**: the agent is reading too many files or retrying too many times
  (see [The 2-Retry Limit](/post/agentic/two-retry-limit/))

And the signals that agents are paying off:

- **Completion rate above 80%**: reliable enough to trust with routine work
- **PR merge rate on first review above 70%**: quality is high enough that reviewers approve
- **Time to first PR under 15 minutes**: faster than manual for most tasks
- **Developer reports spending more time reviewing than writing**: the balance has shifted
  toward higher-value work

## A framework for deciding what to delegate

Before assigning a task to an agent, ask three questions:

1. **Is the task well-defined?** Can you write a specific prompt with clear boundaries and a
   stopping condition? If not, you'll spend more time prompting than coding.
2. **Does a pattern exist?** Has the agent (or you) solved a similar task before? Pattern-based
   tasks are where agents excel.
3. **Is the cost of failure low?** If the agent produces wrong output, how long does it take
   to detect and fix? Tasks with fast feedback (tests pass/fail) are safer to delegate.

If all three answers are yes → delegate. If two are yes → try it, track the result. If one
or zero → do it yourself.

**Related:** [Getting Started with Agentic Development](/post/agentic/getting-started/) for the
fundamentals, and [1,000 Sessions Through a Scoring Harness](/post/agentic/eval-harness/) for
how to systematically measure agent quality.
