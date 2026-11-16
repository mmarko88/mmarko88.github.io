---
name: learn
description: Capture a durable lesson from completed work into learnings/ — a wrong assumption, failed approach, or convention discovered mid-task. Use after verified work corrected a belief, or when asked to record a lesson. Not for desk research (RESEARCH-*.md) or work that went as planned.
argument-hint: "[optional: one-line context of what was learned]"
---

# Capture a learning

Write the lesson of one qualifying problem into `learnings/<category>/<slug>.md` so the
next session finds it before repeating the mistake. Convention borrowed from Compound
Engineering's `ce-compound`; format defined in `learnings/README.md`.

**Done when:** the file exists with full frontmatter, the body names the wrong belief
and the rule replacing it, and a `retire_when` condition is set — or nothing was
written and the report says why.

## Qualification

Read `learnings/README.md` for the bar: the lesson must not be recoverable from the
current repo, and losing it must plausibly cause a repeat. Judge this from the session;
an explicit invocation asks for the judgment, it does not lower the bar. When several
lessons qualify, run this skill once per lesson — never batch.

If an existing learning covers it but is stale or incomplete, update that file instead
of creating a duplicate.

## Steps

1. **Pick the cheapest form that stops the repeat.** A fix to `AGENTS.md`, a standards
   doc, or a skill file beats a learning when the lesson belongs somewhere an agent
   already reads. Write a learning only when no standing document owns the lesson.
2. **Write the file.** `learnings/<category>/<kebab-slug>.md`, frontmatter per
   `learnings/README.md`. The body states: what was believed, what turned out true,
   the rule to follow. Ground every claim against the current repo — no stale paths or
   version numbers.
3. **Check discoverability.** If the lesson fires in a specific workflow, add one line
   to that skill's SKILL.md pointing at the learning — a doc nobody reads does not
   compound.
4. **Report** the file path and the one-line rule, or `Skipped: <reason>` when nothing
   qualified.
