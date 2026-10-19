---
title: "The Specialist Checkpoint Pattern: When to Split One Agent Into Five"
date: 2026-10-19
draft: true
usePageBundles: true
description: "One generalist agent reviews DB migrations, security changes, perf regressions equally badly. Four specialists firing only when relevant beat the monolith."
tags: ["agents", "ai", "patterns", "specialization"]
categories: ["agents"]
featureImage: 'hero.svg' # Series-branded 1200x630 hero (matches MS SQL series design).
featureImageAlt: 'Agentic Development series card for specialist-checkpoints — see post body for details.'
shareImage: 'share.png'
---

For a year I ran a single generalist code-review agent. It wrote the review for every PR —
Spring Boot refactors, Hibernate queries, Dockerfile tweaks, SQL migrations, security patches.
The reviews were fine. They were not good.

The agent flagged "consider adding a comment" on database migrations with no rollback plan. It
approved security changes that introduced timing attacks. It missed obvious N+1 queries. It
caught code smells; it missed category errors.

The fix was obvious in retrospect: the single-prompt generalist was spread too thin to be
anywhere near expert on every category. The pattern that replaced it is five smaller agents
that fire only when their domain is relevant.

> **The one thing to take from this post:** one prompt can't be an expert at everything. Four
> specialists that fire only when relevant beat a 2,000-line monolith system prompt.

## The specialist pattern

Four review-time specialists:

| Specialist | Fires when | Looks for |
|-----------|-----------|-----------|
| **ic-database-checkpoint** | PR touches migrations, JPA entities, SQL, Hibernate config | N+1 queries, missing indexes, non-reversible migrations, isolation level choices, connection pool impact |
| **ic-security-checkpoint** | PR touches auth, encryption, logging, input validation, dependencies | OWASP top 10, secret handling, PII, auth bypass, injection, dependency CVEs |
| **ic-performance-checkpoint** | PR touches query layer, loops with I/O, caching, concurrent code | JVM tuning, pool exhaustion, @Transactional strategy, latency SLA impact, memory pressure |
| **ic-devops-checkpoint** | PR touches Dockerfile, pipeline YAML, EBS config, deployment | Build reproducibility, deployment safety, rollback readiness, ALB/CDN config, env drift |

Each specialist has 300–500 lines of focused instructions and *only* looks at its domain. The
generalist reviewer still runs — it coordinates the specialists and makes the final
accept/reject call — but it delegates deep expertise.

## When the specialist fires

Not every PR fires every specialist. The trigger logic is in `.devin/workflows/_shared/ic-flow.csv`:

```csv
# Pseudocode: trigger-pattern format
specialist, trigger_pattern, required
ic-database, "src/main/**/dao/**|liquibase/**|*.sql", true
ic-security, "SecurityConfig|JwtAuthFilter|@PreAuthorize|password|encrypt", true
ic-performance, "pom.xml|@Transactional|HikariConfig|@Cacheable", if_touched
ic-devops, "Dockerfile|azure-pipelines|docker-compose|*.yml", true
```

The reviewer agent reads this file at the start of a review, matches the PR diff against each
pattern, and fires only the specialists whose trigger matches. A pure UI-copy change fires zero
specialists; a DB migration fires three; a dependency bump fires security + maybe performance.

## The measurement

I ran 80 PRs through both configurations and compared the review quality:

| | True positives | False negatives | Review tokens |
|-|---|---|---|
| **Monolith reviewer** | 61% of real issues | 39% missed | baseline |
| **Reviewer + specialists** | **84% of real issues** | **16% missed** | +42% |

The specialist pattern catches **37% more real issues** at 42% more tokens. For a code-review
agent, where false negatives land in production, the trade is a bargain.

The categorical breakdown explains why:

- **Database issues:** monolith caught 48%, specialists caught 91%. The specialist knows what
  a non-reversible migration looks like; the generalist doesn't.
- **Security issues:** monolith caught 55%, specialists caught 88%. The generalist nitpicked
  variable names on security PRs; the specialist flagged a timing-attack-prone comparison.
- **Performance issues:** monolith caught 44%, specialists caught 78%. The specialist spots
  the N+1 the generalist read right past.
- **Everything else:** roughly tied. The generalist is still useful on code smell and style.

## What makes a good specialist prompt

Three traits I observed in the specialists that worked:

**1. Focused checklist, not open ended.** The database specialist has 23 explicit checks
("does the migration have an explicit rollback?" "does any new query join across tenants?").
The generalist had "review for issues." Narrow prompts stay sharp.

**2. Required evidence.** Each finding the specialist raises must cite a file:line. "There's a
potential N+1 somewhere" is not an acceptable finding; "N+1 in `FundServiceImpl.java:224` —
`findByFundId` is inside a loop" is.

**3. Explicit non-domain exclusions.** The security specialist's prompt literally says *"do
not comment on code style, formatting, or anything not security-relevant."* Without that
exclusion, specialists drift into generalism and the token cost explodes.

## What the gating looks like

<!-- TODO: diagram — PR → trigger match → specialists fire in parallel → reviewer merges findings -->

A review session with three specialists running in parallel takes ~2 minutes and $0.80. A
review that found a critical bug saves hours of human time plus one production incident. The
economics are good enough that I run the specialists on *every* qualifying PR, not just the big
ones.

## When specialists are the wrong pattern

**For planning or ideation.** Specialists are review-time animals — they verify a done thing.
During planning, you want the generalist to think broadly, not a security checker on standby
nitpicking a diagram.

**For small codebases.** If your repo is 500 files, you don't need four specialists; the
generalist is fine. The pattern pays off at scale, where no single prompt can hold expert-level
knowledge of every subsystem.

**When your rubrics overlap too much.** If your "security" and "devops" specialists are
flagging the same findings, you have one specialist in two files. Consolidate.

## The maintenance tax

The downside: each specialist is a prompt I now have to keep sharp. When Spring Boot 4 drops
and `@Transactional` semantics change, the performance specialist's prompt needs an update.
Four specialists = four maintenance surfaces. I accept the tax because the review quality is
worth it, but it's real.

> **Attribution:** The patterns and specific numbers in this post come from
> [Devin](https://devin.ai) with the `ic-documentation` agent framework my team maintains — not
> from an independent reproduction. See the [series intro](/post/agentic/intro/) for the full
> disclosure. The patterns themselves generalize to any coding-agent setup.

## Related reading

- [The 500-line skill limit](/post/agentic/context-budget/) — specialists are still bound by
  the per-skill cap. If one grows past 500 lines, split it (database → migrations + queries).
- [Why your coding agent needs a different critic](/post/agentic/different-critic/) — same
  separate-context principle; specialists are a special case of the pattern.

**Up next:** Read-only subagents are 5× cheaper — the exploration/research pattern (coming soon).
