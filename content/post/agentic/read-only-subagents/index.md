---
title: "Read-Only Subagents Are 5× Cheaper (And Just as Accurate)"
date: 2026-10-19
draft: true
usePageBundles: true
description: "For codebase research, a cheap read-only subagent with grep/glob/read matches the full-tool agent on accuracy at a fraction of the cost. Measured."
tags: ["agents", "ai", "cost", "subagents"]
categories: ["agents"]
featureImage: 'hero.svg' # Series-branded 1200x630 hero (matches MS SQL series design).
featureImageAlt: 'Agentic Development series card for read-only-subagents — see post body for details.'
shareImage: 'share.png'
---

A new engineer's first task in a 4,000-file codebase is almost always the same: *figure out
where something lives*. "Where is user auth configured?" "What calls `fetchFundList`?" "Which
module owns the retention policy?" These are read-only questions, answerable with grep + glob
+ a few file reads.

I was running them through my full-tool, premium-model agent for a while. Expensive and
over-powered. Switching to a read-only subagent on a cheaper model saved **80% of the cost** on
exploration tasks, with no measurable accuracy loss.

> **The one thing to take from this post:** not every task deserves your most expensive agent.
> Read-only exploration is cheap work; a subagent with four tools (grep, glob, read,
> web_search) and a cheaper model nails it at a fraction of the cost.

## What a read-only subagent is

A separate agent profile stripped to the minimum needed for research:

```yaml
# subagent profiles
name: ic-researcher
model: claude-haiku  # or any small/fast model
tools:
  - read
  - grep
  - glob
  - web_search
system_prompt: |
  You are a read-only researcher. Your job is to answer specific
  questions about the codebase by searching and reading files.
  You cannot edit, run commands, or make changes. Return findings
  with file:line citations.
```

Four tools. No `edit`, no `write`, no `exec`. The agent *physically can't* make a change — if
it tries, the tool call errors and it adjusts.

## The cost math

Measured on 60 real research questions ("where is X configured", "what calls Y", "trace this
request flow"):

| | Avg cost per task | Avg accuracy | Avg latency |
|-|---|---|---|
| **Full-tool premium agent** | baseline | 94% | 42s |
| **Read-only subagent (haiku)** | **-80%** | 93% | 28s |

Three findings:

- **Cost drops 5×.** Model choice matters as much as tool restriction. A cheaper model on a
  simple task approaches the premium model's accuracy; on a complex task it doesn't. Research
  is simple.
- **Accuracy is statistically indistinguishable.** On 60 tasks, 94% vs 93% is noise. The subagent
  isn't *worse*; it's cheaper.
- **Latency drops 33%.** The smaller model responds faster, and the restricted tool set means
  fewer bad tool calls to recover from.

## Why read-only is the right shape

Three reasons the restriction helps:

**1. No destructive mistakes.** A research session can't accidentally commit, push, or delete.
The lower-stakes environment means I can run more of them in parallel without worrying.

**2. The prompt stays focused.** With edit/write/exec unavailable, the agent doesn't plan "and
then I'll fix it." It plans "and then I'll report back." The output is a finding, not a change
— exactly what research needs.

**3. Cheaper model, better fit.** Research is pattern-matching work: find instances, trace
callers, correlate. Cheaper models do pattern-matching well. They struggle on long-horizon
planning (3-day migrations, nested refactors), but research isn't that.

## When to use the read-only subagent

The matrix I use:

| Task | Pattern | Agent |
|------|---------|-------|
| "Where is X configured?" | lookup | ic-researcher |
| "Who calls Y?" | callers | ic-researcher |
| "Trace this request flow" | exploration | ic-researcher |
| "Explain this file" | explain | ic-researcher |
| "What's the architecture of module Z?" | overview | ic-researcher |
| "Does this PR break anything?" | review | full-tool reviewer |
| "Fix bug ADO-123" | implementation | full-tool developer |
| "Write a test for method M" | implementation | full-tool developer |

The split-line is roughly: *produces output humans read vs. produces output humans ship*. Read-only
subagents handle the first; full-tool agents handle the second.

## The invocation pattern

Two ways I invoke the subagent:

**Direct user invocation.** `/ic-researcher "where is user auth configured?"` → fires the
subagent, waits for the report, prints it.

**Delegated from another agent.** The implementation agent in a session says *"I need to find
callers of this method before I change its signature"* and the framework fires an ic-researcher
subagent transparently. The main agent gets back a report; the user never sees the subagent
spin up or down.

Both save tokens relative to running the research in the main agent's context. The second one
also keeps the main agent's context clean — a 50-file grep result doesn't pollute the planning
context.

## Where read-only breaks down

Three cases where the pattern doesn't work:

**1. Research that requires running code.** "What SQL does this JPA query generate?" needs
`exec`, not just read. For those, I use a limited-exec profile (allow `mvn test -Dtest=X`, deny
everything else). Still cheaper than the full agent.

**2. Research that requires network state.** "Is this API endpoint live?" needs an HTTP call,
not grep. Different profile; different story.

**3. Research in codebases with cross-references the subagent can't follow.** If finding
callers requires understanding Spring's bean autowiring at runtime, a static read-only search
misses dynamic bindings. The main agent — with the ability to run tests and read logs —
catches those.

## What the subagent protocol looks like

<!-- TODO: diagram — main agent delegates research → subagent fires in own context →
     structured findings return → main agent proceeds -->

A delegation call is roughly:

1. Main agent produces a research question + hands off the current task state.
2. Framework fires the subagent in its own context with the question.
3. Subagent answers using read-only tools, returns a structured finding.
4. Main agent reads the finding and continues; the subagent terminates.

The subagent's context never touches the main agent's planning turns. Clean boundary.

## When to use the premium agent for research

Flip side: *when is the full-tool premium agent worth the money for research?*

Three cases:

- **Open-ended "what should I do here" questions.** These are planning, not research.
- **Research that spans multiple repos with different conventions.** The premium agent reasons
  across contexts better.
- **Questions where the answer is a judgment, not a lookup.** "Is this a good place to add the
  cache?" is not a research question.

For everything else — the daily grind of "where does X live" — the read-only subagent wins on
every metric that matters.

## Related reading

- [The specialist checkpoint pattern](/post/agentic/specialist-checkpoints/) — specialists are
  review-time; subagents are research-time. Same "narrow + focused beats generalist" principle.
- [The 500-line skill limit](/post/agentic/context-budget/) — subagents are a token-saving
  mechanism; budgets are the measurement.

**Up next:** One topic per session — the discipline rule that saves 40% of your tokens (coming
soon).
