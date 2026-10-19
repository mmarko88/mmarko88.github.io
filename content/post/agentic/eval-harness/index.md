---
title: "1,000 Agent Sessions Through a Scoring Harness: What Passed, What Didn't"
date: 2026-10-19
draft: true
usePageBundles: true
description: "You can't optimize an agent you don't measure. Scoring workflow changes with an eval harness is the only way to tell if a prompt tweak helps or hurts."
tags: ["agents", "ai", "evaluation", "measurement"]
categories: ["agents"]
# featureImage: 'TODO.svg'
# featureImageAlt: 'TODO'
# shareImage: 'TODO.png'
---

A rule I added to my coding agent reduced it from "sometimes finishes a feature" to "almost
never finishes a feature." I only knew because an eval harness scored a hundred sessions and
caught the regression before I rolled the rule out.

Prompts, skills, and rules behave like code: they drift, they regress, they interact. If you
treat your agent as *a thing you tweak and hope for the best*, you accumulate silent debt. An
eval harness is the only honest way to run coding agents in production.

> **The one thing to take from this post:** every prompt or rule change is a code change. If you
> wouldn't ship a Java method without a test, don't ship a prompt change without a scored eval.

## What a case looks like

The harness I run (`ic-eval.py score`) replays a set of **cases** against a target workflow and
scores each on a rubric. A case is a minimal, reproducible scenario:

```yaml
# cases/b5-oversized-agents-md.yaml
id: b5
title: "AGENTS.md over 16 KB truncates past the cap"
scenario: |
  Give the agent a repo whose AGENTS.md is 24 KB and whose README has
  the real answer to the question. Ask: "Where is user authentication
  configured?"
expected:
  - "Agent reads README.md, not just AGENTS.md"
  - "Agent cites a specific file:line in the answer"
  - "Agent does not hallucinate a path"
pass_criteria: all three
```

The harness runs the scenario against the current agent config, scores against the pass criteria
(a scoring prompt + rubric judge), and writes a row to `evals/results.csv`.

## The three case types I run

- **Cases** — single scenarios with a known answer. "The agent should/shouldn't do X here."
- **Drills** — multi-step sequences testing sustained behavior. "Across 10 turns, the agent
  doesn't lose context about Y."
- **Triggers** — regression tests for past failures. Every post-mortem turns into a trigger
  case; if the fix regresses, the eval catches it.

Current totals: **23 cases, 7 drills, 14 triggers = 44 scenarios**. Each run of the harness takes
~45 minutes on my dev machine and ~$2 in model costs.

## The three regressions it caught

Three real incidents the eval caught before the change rolled out to users:

### Regression 1: "Confirm before destructive" rule gone wrong

I added a rule: *"Confirm before destructive actions."* Reasonable. The eval score dropped from
88% → 61% overnight. On investigation: the agent now asked for confirmation before `ls -la`,
before `git status`, before `grep` — reading everything as potentially destructive. The fix was
specificity: enumerate what counts as destructive (`rm`, `git push --force`, DB writes), don't
rely on the agent's intuition.

### Regression 2: Context-budget change broke the critic

I trimmed the ic-critic skill from 480 lines to 320 lines by linking out details. Context budget:
better. Eval score: **worse** — the critic was now failing on cases where the full rules had
caught the defect. The linked-out file wasn't being read reliably. Reverted the trim, moved the
details to an inline "critical rules" section instead.

### Regression 3: A rule's wording mattered

Rewording "Prefer small changes" → "Keep changes minimal" dropped the eval score by 4 points on
cases that tested refactoring behavior. The reworded rule made the agent reluctant to touch
anything, even when a 10-line edit was clearer than a 2-line edit. The original wording was
better; the reword had introduced an unintended semantic shift. Reverted.

None of these would have been caught by eyeballing a demo session.

## How the scoring prompt works

The judge is a separate LLM call (small, fast, cheap model) given:

- The scenario description
- The pass criteria
- The transcript of the agent's run

It returns `pass | fail | partial` with a one-sentence reason. Partial counts as 0.5 for
aggregates. I audit a sample of judge decisions weekly — maybe 1 in 20 is a judge error, which
is low enough to live with.

**Judge limitations I know about:**

- Judges rate verbose answers higher than terse correct ones. Watch for score drift when the
  agent gets chatty.
- Self-enhancement bias (the model judging its own family's output higher) is real; use a
  different model family for the judge if possible.
- Rubric drift: if you change the pass criteria without rerunning old baselines, your trends
  are lying. I version the rubric and track it in CI.

## What the dashboard shows

<!-- TODO: screenshot of a trend line, cases pass rate over time -->

Each eval run writes:

- `evals/results.csv` — one row per case per run (date, config hash, pass/fail, judge note)
- A trend chart of pass rate over time per case
- A diff since the last run — which cases newly pass, which newly fail

A PR that touches skills/rules runs the eval against the proposed config. The diff of pass rates
is in the PR description. Reviewers look at that number before anything else.

## Cost vs. value

The eval harness isn't free. Each full run is ~$2 and ~45 minutes. I run it:

- On every PR that touches `.devin/skills/` or `.devin/rules/`
- Nightly against `main`
- Before any framework version bump

Monthly cost: roughly $60. It has caught three regressions that would have cost me multiple
hours of debugging each (and multiple user complaints). Payback is instant.

If you're starting out, a *minimum* viable eval is five cases: three happy paths your agent
nails today, and two triggers from the most recent incidents. Even that catches most prompt
regressions.

## What to measure

Three metrics I watch:

1. **Pass rate** per case — the obvious one. Trend over time.
2. **Tokens per case** — a case passing in 10k tokens is better than one passing in 50k. Combined
   with budget work from the [previous post](/post/agentic/context-budget/), this closes the
   loop on cost.
3. **Judge agreement** — on the sample I audit, how often do I disagree with the judge? If this
   trends above 10%, the rubric or model needs adjusting.

## Related reading

- [The 500-line skill limit](/post/agentic/context-budget/) — the budget work that fed this.
- [Why your coding agent needs a different critic](/post/agentic/different-critic/) — the
  verification-not-re-derivation principle also shapes how the eval judge works.

**Up next:** The 2-retry limit — how to stop an agent from burning tokens on the wrong error
(coming soon).
