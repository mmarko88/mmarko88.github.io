---
title: "Creating Your First Agent Skills: Templates, Anti-Patterns, and the Five Skills Every Codebase Needs"
date: 2026-10-21
draft: true
usePageBundles: true
description: "How to write effective agent skills from scratch. Practical templates for Devin, Cursor, and Claude Code, common mistakes that waste tokens, and the five skills that pay for themselves immediately."
tags: ["agents", "ai", "skills", "tutorial"]
categories: ["agents"]
series: ["Agent Skills"]
featureImage: 'hero.svg'
featureImageAlt: 'Creating agent skills — five essential skills and anti-patterns to avoid.'
# shareImage: 'share.png'
---

The first skill I wrote was 800 lines long. It covered every edge case I could think of,
referenced twelve internal documents, and included decision trees for scenarios that happened
once a year. The agent loaded it every session, burning 15% of its context window before doing
any actual work. Most of those tokens were wasted on instructions that never fired.

The skill that replaced it was 47 lines. It handled the common case, linked to the rare cases,
and the agent's completion rate went up.

> **The one thing to take from this post:** a good skill is short, specific, and testable. If
> you can't tell whether the agent followed it, it's not a skill — it's a wish.

## The anatomy of a skill

Every effective skill has four parts, regardless of which tool you use:

```markdown
# Skill: {name}

## When to use
{Trigger condition — specific enough that you could write an if-statement for it}

## Steps
{Numbered sequence — each step produces a verifiable output}

## Output format
{What the agent should produce — structure, not prose}

## What NOT to do
{The 2-3 mistakes that agents actually make on this task}
```

That's it. Everything else is optional. Let's look at each part.

### "When to use" — the trigger

This is the most important section. A vague trigger means the skill fires when it shouldn't
(wasting tokens) or doesn't fire when it should (wasting your time).

```text
# Bad trigger
When investigating problems in the codebase.

# Good trigger
When a user reports a slow API endpoint (response time >2s)
or when a performance test shows regression >20% from baseline.
```

The good trigger is falsifiable — you can check whether the condition is met. The bad trigger
matches everything.

### Steps — the procedure

Number them. Keep each step to one action with one verifiable result. An agent that can't tell
when a step is done will either skip it or loop on it.

```text
# Bad step
3. Analyze the database queries for performance issues.

# Good step
3. Run EXPLAIN on every query in the service method.
   If any query shows a full table scan (type: ALL), flag it.
   Output: query text + EXPLAIN output for flagged queries.
```

### Output format — what done looks like

Give the agent a structure. Tables work well. Templates work well. "Write a summary" doesn't.

### What NOT to do — guardrails

Agents have predictable failure modes. Name the 2-3 that apply to this skill:

```text
## What NOT to do
- Do NOT modify the database schema without asking.
  This skill is for investigation only.
- Do NOT assume a query is slow because it has joins.
  Check EXPLAIN output before flagging.
- Do NOT fix the issue. Report it and stop.
```

## Tool-specific formats

### Devin skills

```
.devin/
  skills/
    investigate-performance/
      SKILL.md          # The skill definition
      scripts/           # Helper scripts (optional)
```

Devin skills support `allowed-tools` frontmatter to restrict what the agent can do:

```yaml
---
name: investigate-performance
description: Investigate slow API endpoints
allowed-tools: [read, grep, exec]  # No write access
---
```

### Cursor rules

```
.cursor/
  rules/
    performance-investigation.mdc
```

Cursor rules use `.mdc` files with YAML frontmatter:

```yaml
---
description: "Performance investigation procedure"
globs: ["**/*Service.java", "**/*Resource.java"]
alwaysApply: false
---
```

The `globs` field is powerful — the rule only activates when the agent is working on matching
files. This saves context on every other task.

### Claude Code AGENTS.md

Claude Code reads `AGENTS.md` from any directory in the project. Rules in subdirectories
apply only when working in that directory:

```
AGENTS.md                    # Project-wide rules
src/main/AGENTS.md          # Rules for main source
src/test/AGENTS.md          # Rules for tests only
```

This directory scoping is the simplest version of "when to use" — the rule activates based on
where the agent is working.

## The five skills every codebase should have

After building skills for a 4,000-file Java codebase, these five paid for themselves within a
week:

### 1. Investigate (read-only)

The agent's first instinct on any bug is to start fixing. An investigation skill forces it to
understand first:

```markdown
# Skill: investigate

## Steps
1. Reproduce the problem (read the failing test or error log)
2. Trace the code path from entry point to failure
3. List all files involved (max 10)
4. Identify the root cause layer (controller / service / DAO / DB)
5. Write a one-paragraph root cause statement

## What NOT to do
- Do NOT write any fixes. Investigation only.
- Do NOT read more than 15 files. If you need more, the scope is wrong.
```

### 2. Review (with critic personality)

Never let the same agent review its own work:

```markdown
# Skill: review

## Personality
You are an adversarial reviewer. Try to BREAK the change.

## Steps
1. Read the diff — what changed?
2. Read the test — does it cover the change?
3. Check: does the fix address root cause or symptom?
4. Check: what else does this change affect? (grep for callers)
5. Verdict: PASS / REWORK (with specific findings)
```

### 3. Test (write a failing test first)

```markdown
# Skill: write-test

## Steps
1. Read the requirement or bug description
2. Write a test that FAILS (proving the bug exists or the feature is missing)
3. Run the test — confirm it fails for the right reason
4. Stop. Do not implement the fix.

## Output
- Test file path
- Test method name
- Expected failure message
- Actual failure message (from test run)
```

### 4. Onboarding (project-specific)

The most underrated skill. Reduces context-loading from 10+ file reads to a structured summary:

```markdown
# Skill: onboard

## Steps
1. Read AGENTS.md (project conventions)
2. Read the module's pom.xml or package.json (dependencies)
3. List the 5 most recently changed files (git log)
4. Identify the test framework and how to run tests
5. Summarize in 10 lines: stack, conventions, test command, key files
```

### 5. Commit (with standards)

```markdown
# Skill: prepare-commit

## Steps
1. Run git diff — review every changed file
2. Check: are there any secrets, keys, or passwords in the diff?
3. Check: does every change relate to the stated task?
4. Write commit message: imperative mood, why not what, under 72 chars
5. Stage only the files that belong to this change
```

## The anti-patterns that waste the most tokens

### 1. The encyclopedia skill

A skill that tries to cover every case. 500+ lines. Loaded every session. Most of it never
fires. **Fix:** split into multiple focused skills with specific triggers.

### 2. The vibes skill

"Write clean, maintainable code following best practices." This tells the agent nothing
actionable. **Fix:** replace with specific, falsifiable rules.

### 3. The stale skill

References files that were renamed, tools that were replaced, conventions that changed. The
agent follows outdated instructions and produces wrong output. **Fix:** review skills quarterly.
Version them. Delete what's dead.

### 4. The duplicate skill

The same instruction in three different files. The agent reads all three, spending 3x the tokens
for 1x the value. Worse: if they contradict, the agent picks one unpredictably. **Fix:** single
source of truth. Link, don't copy.

### 5. The unverifiable skill

"Ensure the code is secure." How? By what standard? The agent can't verify this, so it either
skips it or adds a comment saying "security was considered." **Fix:** specific checks with
specific pass/fail criteria.

## Starting from zero: a 30-minute setup

If you have no skills today, here's the fastest path to value:

1. **Create the rules file** (10 min): Write 5-10 rules covering your codebase's non-obvious
   conventions. Framework choices, naming patterns, import preferences, test framework.

2. **Create the investigate skill** (10 min): Copy the template above, adjust for your stack.
   The investigation skill prevents the most expensive mistake: the agent fixing the wrong
   thing.

3. **Create the review skill** (10 min): Copy the template, add your codebase-specific checks.
   The review skill catches the second most expensive mistake: the agent producing code that
   passes tests but violates conventions.

That's 30 minutes of setup that saves hours per week. Everything else — workflows, personalities,
specialized skills — builds on this foundation.

**Next in this series:** [Agentic Development Experts and Resources](/post/agent-skills/experts-and-resources/) —
who to follow, what to read, and the open-source skills repositories worth studying.
