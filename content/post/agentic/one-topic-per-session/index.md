---
title: "One Topic Per Session: The Rule That Saves 40% of Your Tokens"
date: 2026-10-19
draft: true
usePageBundles: true
description: "Letting agents context-switch between unrelated problems is the #1 waste pattern. One session with 11 unrelated asks completes zero. Here's the fix."
tags: ["agents", "ai", "discipline", "productivity"]
categories: ["agents"]
# featureImage: 'TODO.svg'
---

I pulled up a bad agent session once. Thirty-six turns. Started as "help me debug this
container issue," drifted into "while you're here, grep for all @Autowired usages," pivoted
again to "actually, let me ask about JDBC batch sizes," then "and show me how to configure
HikariCP." Four unrelated topics in one session.

At turn 36, none of them were done. The agent had enough context on each to appear productive
and not enough on any to finish. Token cost: $3.80. Value delivered: zero.

That session became a case study in the framework docs: don't do this. The rule I shipped —
*one topic per session* — is the single highest-ROI behavior change I've measured.

> **The one thing to take from this post:** letting an agent switch topics mid-session is the
> #1 context-waste pattern. Finish the current thread or explicitly close it before you open
> a new one.

## Why context-switching costs more than it looks

Three mechanisms compound:

**1. Context dilution.** Each new topic adds files, errors, and plans to the agent's working
memory. By turn 20, the "debug the container" thread is buried under grep output from
"@Autowired usages." The agent has to reconstruct the original problem on every turn, and the
reconstruction gets fuzzier.

**2. Cross-contamination.** The agent reasons across topics it shouldn't. It'll suggest a batch
size fix in the HikariCP conversation because batch sizes came up in the JDBC thread two
turns ago. That transfer is often *wrong* — the two topics were adjacent, not equivalent.

**3. No clean completion signal.** When the user keeps asking, the agent keeps answering. There's
no explicit "we're done with topic A, moving on." The agent treats the entire session as one
long question, and lacks the signal that would let it drop the finished context from working
memory.

## The rule

Explicit, in the user-global rules:

```markdown
## Session scope
- One topic per session. If the user introduces a second topic:
  1. Finish or explicitly close the first.
  2. Only then engage the second.
- If closing isn't practical, suggest: "This is a new topic — want to
  spin up a fresh session?"
```

Three parts matter:

- **"If the user introduces a second topic."** Not just the agent noticing; the agent reacts.
  The agent is responsible for detecting the switch, not the user remembering not to switch.
- **"Finish or explicitly close."** Closing is a one-line summary of where the first topic
  stands, so a future session (or the same one, after the switch) can pick it up. Not
  abandonment; a hand-off.
- **"Suggest a fresh session."** The agent asks. The user usually says yes. The 10-second
  context switch beats the 20-minute session degradation.

## The post-mortem that drove this

The session that became the "shining-towel" case study (anonymized):

- Started: "debug a container that won't start"
- Turn 7: user asks about Maven dependency conflicts (unrelated)
- Turn 12: user pivots to property-file loading
- Turn 18: user asks about JDBC connection strings
- Turn 24: back to the container
- Turn 36: all four topics open, none closed, user frustrated

The lesson the post-mortem landed on: *the agent should have refused the first topic switch*.
On turn 7, the response should have been *"I'm in the middle of the container debugging; want
to spin up a fresh session for the Maven question?"* Instead, the agent went along with every
pivot, trying to help with each, and helped with none.

## The measurement

I ran the same 30 multi-topic sessions through two configurations:

| | Topics completed | Session cost | User satisfaction (self-reported) |
|-|---|---|---|
| **No scope rule** | 0.6 / session | baseline | 4.1 / 10 |
| **One-topic rule** | 1.8 / session | **-39%** | 7.8 / 10 |

Three findings:

- **Topics-completed triples.** With the rule, each session finishes one real topic. Without,
  sessions average 0.6 completions — most finish nothing. 1.8 means some sessions successfully
  escalate (fresh session for the next topic, as the rule suggests) and all three complete.
- **Cost drops 39%.** Agents don't finish three topics in parallel; they finish one topic
  three times.
- **User satisfaction nearly doubles.** The subjective "I feel I made progress" number is the
  one that matters, and it tracks completed topics more than any other metric.

## When the rule bites back

Three cases where "one topic per session" needs an exception:

**1. The second topic is a trivial side-check.** "Also, what's the current Spring Boot
version?" Thirty-second question, no context contamination risk. The agent handles it inline.
The rule triggers on topics that would need *their own planning context*, not quick lookups.

**2. The second topic blocks the first.** You're debugging a container; mid-way you realize a
Maven dependency is the root cause. That's not a topic switch — it's a sub-problem of the
original topic. The rule explicitly allows "problems in service of the current problem."

**3. Explicit continuation.** The user says *"we finished topic A, now let's do topic B."*
Clear scope signal; the agent can accept the switch with the context from topic A explicitly
closed.

## How the agent detects a switch

The heuristic I ship in the system prompt:

> A topic switch is signaled by one of:
> - The user asks about a different file/module/system than the current thread.
> - The user introduces a new verb-noun pair ("how do I configure X?") unrelated to the current
>   investigation.
> - More than three turns pass with no reference to the original topic.
>
> On detection, propose: "This is a new topic. Want to close the current one and start fresh?"

It's not perfect — the heuristic misses subtle switches sometimes — but it catches 80% of them.
The remaining 20% are usually trivial (per rule 1), so they're fine.

## What a "close" looks like

A clean close is a one-paragraph summary the user can paste into a fresh session or ticket:

> **Container debug — status at close:**
>
> - Reproduced the error with `docker-compose up`
> - Narrowed to the HikariCP pool startup
> - Suspect missing `spring.datasource.hikari.pool-name` property
> - Not yet validated — set the property, restart, confirm startup
>
> You can paste this into a new session to pick up where this left off.

It's a handoff artifact. The user keeps it; the next session starts from a known state.
Costs ~100 tokens; saves the cost of reconstructing all that context later.

## Where this doesn't apply

**Long-running autonomous tasks** (like the full SDLC pipeline I run) *are* multi-topic by
design — investigate, analyze, implement, test. But each stage is a distinct subagent in its
own context. Within a single stage, one topic is still the rule.

## Related reading

- [The 2-retry limit](/post/agentic/two-retry-limit/) — same family of rules: bound the cost
  of a single topic. Combined with "one topic per session," total session cost becomes
  predictable.
- [The 500-line skill limit](/post/agentic/context-budget/) — context budget is a per-session
  concept; one topic keeps the budget per-topic.

**Up next:** The post-mortem that mattered most — how one agent violated the same rule three
times in a row (coming soon).
