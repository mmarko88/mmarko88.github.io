---
title: "Devin Desktop Best Practices: Getting the Most from Local Agent Sessions"
date: 2026-10-27
draft: true
usePageBundles: true
description: "Practical best practices for Devin Desktop — session management, skill setup, shell configuration, multi-repo workflows, and the gotchas that waste the most time."
tags: ["agents", "ai", "devin", "productivity"]
categories: ["agents"]
featureImage: 'hero.svg'
featureImageAlt: 'Devin Desktop best practices — daily workflow steps from session start to weekly skill audit.'
shareImage: 'share.png'
---

Devin Desktop runs coding agents locally — on your machine, with your file system, your
credentials, your shell. This is different from cloud-hosted agents in ways that matter:
faster file access, no network latency for tool calls, but also direct access to your
production credentials and local git config. Getting the setup right prevents the class of
mistakes that only happen when the agent has full local access.

After six months of daily use on a multi-repo Java project (4,000+ files across 6
repositories), here's what I've learned about making Devin Desktop productive without making
it dangerous.

> **The one thing to take from this post:** Devin Desktop is a power tool. Like all power
> tools, the default settings are safe but slow. The productive setup requires deliberate
> configuration — rules, skills, and boundaries tuned to your specific workflow.

## Initial setup: the first 30 minutes

### 1. Create your global AGENTS.md

**Location:** `~/.config/devin/AGENTS.md` (or `%APPDATA%\devin\AGENTS.md` on Windows)

This file loads in every session. Keep it lean — every line is tokens on every turn. Include:

```markdown
# Global Rules

## Secrets
- Use $env:VAR_NAME (PowerShell) or "$VAR_NAME" (bash)
  for all secrets. Never pass values as literal arguments.
- Skip .env, *secret*, *credential* files entirely.

## Git
- Never force-push shared branches.
- Never modify git config.
- Don't push unless explicitly asked.

## Session
- Keep the session open until user says "done."
- Use ask_user_question for every question.
```

That's 12 lines. It covers the three highest-risk behaviors (secrets, git, session management)
without burning context budget.

### 2. Create project-level AGENTS.md

**Location:** `{repo-root}/AGENTS.md`

This file loads only when working in this repository. It's where project-specific conventions go:

```markdown
# Project: ic-api-standalone

## Tech stack
- Java 17, Spring Boot 3, Hibernate 6, Jersey (JAX-RS)
- JUnit 5 with @ExtendWith (not legacy JUnit 4)
- Custom @Transactional wrapper (investmentcafe.ngs.util.Transactional)

## Build
- mvn clean install -DskipTests
- mvn test -pl EjbServices/NGSService -Dtest="SpecificTest"

## Conventions
- Constructor injection for new services
- Entity packages: entity/client, entity/syssecurity, etc.
- REST base path: /rest/v1/
```

### 3. Set up your skills directory

```
.devin/
  skills/
    investigate/SKILL.md       # Read-only investigation
    review/SKILL.md            # Adversarial code review
    onboard/SKILL.md           # Project context loading
```

Start with three skills. Add more after you've used the first three for a week and know what's
missing.

## Session management

### One topic per session

This is the single most impactful practice. A session that covers "fix the NPE, then update
the docs, then check why the build is slow" completes zero of those tasks well. Each topic
gets its own session.

**Why it matters more on Desktop:** Desktop sessions have your full file system. An agent
context-switching between unrelated tasks might make changes in repo A while investigating
repo B. Session isolation prevents cross-contamination.

### Keep the session alive

Devin Desktop sessions end when you stop interacting. If you're waiting for a build or
test to finish, tell the agent: "Wait for the build to complete, then tell me the result."
Don't close the terminal.

If a session does end unexpectedly, Devin saves the session state. You can resume with
`devin --resume` or start a new session with context from the previous one.

### Check git status before ending

Before ending any session that modified code, run:

```bash
git status
git diff --stat
```

Verify that only the expected files changed. Agents occasionally modify files outside the
stated scope — catching it before the session ends is easier than catching it after.

## Multi-repo workflows

Desktop excels at multi-repo work because all repos are on the same file system. But this
requires discipline.

### Map your repos explicitly

In your global rules or project rules:

```markdown
## Repos
| Repo | Path | Purpose |
|------|------|---------|
| ic-core | C:\repo\ic-core | Legacy reference |
| ic-api-standalone | C:\repo\api1 | Modern API |
| ic-documentation | C:\repo\ic-docs | Standards |
```

The agent can't infer which directory is which repo. Name them.

### Use /add-dir for cross-repo context

When a task requires understanding from another repo (e.g., checking coding standards in
`ic-documentation` while implementing in `ic-api-standalone`), use `/add-dir` to add the
reference repo to the session's scope.

### Never modify two repos in one session

Read from multiple repos. Write to only one. Cross-repo changes need coordination that a
single session can't manage — different branches, different PRs, different review cycles.

## Shell configuration

### Use PowerShell for Windows, bash for scripts

Devin Desktop defaults to bash (Git Bash on Windows). For Windows-specific commands
(Active Directory, Azure tools, .NET), explicitly set `shell_flavor: "powershell"`.

### Watch for proxy settings

If you're behind a corporate proxy, the agent's shell commands may fail silently. Set
proxy environment variables in your shell profile:

```bash
export HTTP_PROXY="http://proxy.corp:8080"
export HTTPS_PROXY="http://proxy.corp:8080"
export NO_PROXY="localhost,127.0.0.1,*.internal.corp"
```

### Secrets via environment variables

Load secrets from a secrets manager at shell startup, not from files:

```powershell
# Profile script loads secrets into env vars
$env:AZDO_PAT = (Get-Secret -Name "azdo-pat")
$env:SONAR_TOKEN = (Get-Secret -Name "sonar-token")
```

The agent accesses them via `$env:AZDO_PAT` — it never sees the actual values.

## Performance tips

### Reduce context load time

Large AGENTS.md files slow down every session start. The context window is finite — every
token of rules is a token not available for actual work. Audit your rules quarterly:

- Remove rules the agent hasn't violated in 3+ months
- Merge duplicate rules
- Move rarely-needed instructions into invocable skills instead of always-loaded rules

### Use subagents for exploration

When investigating a large codebase, spawn a read-only subagent instead of exploring in the
main session. The subagent has its own context window, doesn't pollute the main session's
context, and is cheaper (can use a smaller model).

```
# In main session
Use subagent_explore to find where authentication
is handled in the Jersey resource classes.
```

### Batch tool calls

Devin supports parallel tool calls. When you need to read multiple files, read them all in
one turn instead of one at a time. This reduces round trips and is faster on Desktop where
file I/O is local.

## The gotchas

### Git hooks and auto-commits

Some Devin Desktop configurations auto-stage or auto-commit changes. Verify your setup:

```bash
ls .devin/hooks.v1.json  # Check for post-tool hooks
git log --oneline -5      # Verify no unexpected commits
```

If auto-commit is enabled, every file edit becomes a commit. This can create a messy git
history. Prefer manual commits with meaningful messages.

### Process persistence

Shell sessions persist between tool calls. If you start a dev server in one command, it's
still running when the next command runs. Use background processes intentionally:

```bash
# Start dev server in background
npm run dev &

# Later, kill it explicitly
kill %1
```

### File system access

Devin Desktop has access to your entire file system by default. The scope mechanism lets
you restrict this, but you must actively request scope restrictions. For sensitive
directories (credentials, personal files), add explicit deny rules:

```markdown
## Off-limits directories
- Never read or access: ~/.ssh/, ~/.aws/credentials
- Never read: ~/Documents/personal/
```

### Windows path issues

On Windows, paths with spaces or special characters cause frequent failures. Use quotes
consistently:

```bash
# Always quote paths with spaces
cd "C:\Users\name\My Documents"
```

## The daily workflow

After six months, my daily pattern:

1. **Morning:** Start a session with the day's first task. One topic.
2. **Before changes:** Verify git status, ensure clean working tree.
3. **During work:** Use `ask_user_question` for decisions, not inline questions.
4. **Before ending:** `git status`, `git diff --stat`, verify only expected changes.
5. **After ending:** Review the session's changes in a proper diff tool.
6. **Weekly:** Audit rules and skills — remove stale ones, add new ones from that week's
   patterns.

The setup takes an afternoon. The payoff is every day after that.

**Related:** [Getting Started with Agentic Development](/post/agentic/getting-started/) for
the fundamentals, [Agent Skills, Workflows, and Personalities](/post/agent-skills/what-are-skills/)
for how to build your skill library, and [Agent Security and Trust Boundaries](/post/agentic/security-trust/)
for the security model.
