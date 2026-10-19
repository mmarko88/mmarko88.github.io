---
title: "The 500-Line Skill Limit: Measuring Your Agent's Context Cost"
date: 2026-10-19
draft: true
usePageBundles: true
description: "Every rule, skill, and system prompt is a token tax on every turn. A Python budget script, three CI caps, and 36% token savings after trimming three dead skills."
tags: ["agents", "ai", "cost", "productivity"]
categories: ["agents"]
# featureImage: 'TODO.svg'
# featureImageAlt: 'TODO'
# shareImage: 'TODO.png'
---

Every rule in your agent's prompt costs tokens on *every single turn* for the rest of the
session. Add a 300-line skill, and a 20-turn session pays for 20 copies of that skill. Add a
900-line AGENTS.md, and *every project session that touches the repo* opens with that
900-line prelude burned into the context window.

I ran a context-budget audit on my framework six months in. The results scared me enough to
build CI that fails on drift.

> **The one thing to take from this post:** if you can't tell me how many tokens your agent's
> rule set costs per session, you can't optimize anything downstream of it. Measure first.

## What the budget looked like before

My framework at the time: ~70 registered skills, each a markdown file loaded on activation.
Most skills were "just a few extra lines" at a time. The audit:

| Component | Size | Loaded when |
|-----------|------|-------------|
| Global AGENTS.md | 11.3 KB | every session, every repo |
| Project AGENTS.md | ~9 KB avg | per repo, every session |
| Framework system prompt | 42 KB | every session |
| Registered skills (70 × ~400 lines avg) | 1,900 KB total | on activation |
| Rules (`.devin/rules/*.md`) | 28 KB | every session |

**The number I didn't want to see: the top 10 skills alone averaged 712 lines each.** A medium
session that activated 4 skills was starting out ~15,000 tokens in before the user said hello.

For context: a session that spent $0.12 was spending $0.04–$0.06 on the preamble alone, before
any work got done. Multiply by thousands of sessions per month across a team.

## The script that made the pain visible

I wrote a Python budget script (`context-budget.py`) that counts tokens per file using
`tiktoken`, groups by category, and emits a `context-budget.md` report:

```python
# simplified from the real thing
def budget(root: Path) -> dict:
    enc = tiktoken.get_encoding("cl100k_base")
    totals = defaultdict(int)
    for path in root.rglob("*.md"):
        category = categorize(path)  # skill | rule | agents-md | docs
        totals[category] += len(enc.encode(path.read_text()))
    return totals
```

The report sorts files by token cost. Opening it for the first time was the moment I realized
the top three skills accounted for a quarter of total skill tokens. Two of them hadn't been
touched in three months.

## The limits that actually work

I set three hard caps and wired them into CI:

**1. AGENTS.md ≤ 16 KB.** Hugo/Devin truncates the global AGENTS.md past 16 KB — details past
that point just don't get seen by the agent. If a repo's AGENTS.md is approaching the cap,
move detail into linked files. CI fails on files over.

**2. Any single skill ≤ 500 lines.** Longer skills become hard to maintain and expensive to load.
If a skill grows past 500 lines, split it: core instructions in `SKILL.md`, bulky references in
a `references/` subdirectory loaded only when needed.

**3. Context budget tracked per PR.** The budget script writes `docs/context-budget.md` in CI
and fails the build if any category grew more than 5% without an explicit `BUDGET-INCREASE: …`
annotation in the PR description. A rule added casually gets caught at review time.

## What I actually trimmed

The audit's top findings, with the fixes:

- **Three skills had copy-pasted versions of the same 180-line "coding standards" section.**
  Consolidated into one canonical file; the three skills link to it. Savings: ~360 lines ×
  tokens per session where any of the three activated.
- **An 800-line AGENTS.md had an exhaustive module-by-module index.** Moved to
  `docs/compact-index.md`; AGENTS.md now says *"for the full index, read X."* Savings: dropped
  AGENTS.md from 23 KB to 8 KB.
- **A "troubleshooting" skill was never activated** — I'd forgotten I built it. Deleted.
- **A skill that fired on every git operation included 300 lines of git etiquette** most of which
  overlapped with the global rules. Trimmed to 90 lines of the delta.

Total: a 36% reduction in average session preamble tokens over three weeks.

## The before/after on real sessions

I replayed 50 recent sessions through both configurations and measured total tokens consumed.
Same prompts, same tasks, different preamble weight:

| Session type | Before (K tokens) | After (K tokens) | Reduction |
|---|---|---|---|
| Quick explain (3-5 turns) | 14 | 9 | **-36%** |
| Bug fix (10-15 turns) | 48 | 33 | **-31%** |
| Full SDLC pipeline (30+ turns) | 142 | 101 | **-29%** |

The savings don't look dramatic per session. Multiplied by my team's throughput — a few hundred
sessions a week — it's a line item on the cost dashboard that finally stopped climbing.

## When to break the limits

The limits are defaults, not laws. Two legitimate exceptions I accept:

**Security rules.** The security skill is longer than 500 lines because it enumerates specific
threat patterns with examples. Agents cutting corners on security are expensive in a different
way than tokens.

**Framework boot sequence.** The skill that teaches a new agent how the framework works is
long because it has to be — a half-trained agent breaks more than it fixes. The exception is
annotated in CI with `BUDGET-EXEMPTION: boot-sequence (critical path)`.

Both exceptions are *named*. Nothing else gets a pass.

## What the dashboard looks like now

<!-- TODO: screenshot of the context-budget.md report, sorted by cost -->

Every PR touching skills or rules shows a context-budget diff in the review. If it's negative
(cheaper), we celebrate briefly. If it's positive, the author explains why — in the PR
description, not after the fact. Four months in, nobody has quietly bloated a skill in a way the
tooling didn't catch.

The practice has a secondary effect: *we delete more.* A skill that hasn't earned its tokens
gets a `remove-skill` PR. Deleting is cheap when the cost is visible; invisible, it stays.

**Up next:** [I ran 1,000 agent sessions through a scoring harness](/post/agentic/eval-harness/)
— the eval methodology, the regressions caught, and the dumb rule tweaks that broke things.
