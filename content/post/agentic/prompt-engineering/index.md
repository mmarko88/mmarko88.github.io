---
title: "Prompt Engineering for Coding Agents: The Difference Between 'Fix the Bug' and a Prompt That Works"
date: 2026-10-23
draft: true
usePageBundles: true
description: "Specific patterns for writing task prompts that coding agents actually follow. Before/after examples, the anatomy of an effective prompt, and the mistakes that waste the most tokens."
tags: ["agents", "ai", "prompts", "productivity"]
categories: ["agents"]
featureImage: 'hero.svg'
featureImageAlt: 'Prompt engineering for coding agents — vague vs specific prompt comparison with cost difference.'
shareImage: 'share.png'
---

"Fix the failing test." I typed this into a coding agent and watched it read 47 files,
change 3 things that weren't broken, introduce a new bug, and then spend 20 minutes trying
to fix the bug it just created. Total cost: $4.20 in tokens and 35 minutes of wall time.

The next day I typed: "The test `ContactServiceTest.testFindByEmail` fails with NPE at
`ContactService.java:142`. The `emailNormalizer` field is null — it's missing `@Inject`.
Add the injection and verify the test passes." Same agent, same model. Fixed in 90 seconds.
Cost: $0.12.

The difference wasn't the agent. It was the prompt.

> **The one thing to take from this post:** a good agent prompt has three parts — the symptom,
> the evidence, and the boundary. Miss any of them and the agent guesses.

## The anatomy of an effective prompt

### 1. The symptom (what's wrong)

Name the specific failure, not the category of problem.

```text
Bad:  "There's a performance issue in the API."
Good: "The GET /rest/v1/documents endpoint returns in 8s for client ACME.
      Expected: under 500ms. Started after commit abc1234."
```

The bad prompt forces the agent to investigate what "performance issue" means. The good prompt
tells it exactly what to measure against.

### 2. The evidence (what you already know)

Share what you've already found. Every clue you give saves the agent 5-10 file reads.

```text
Bad:  "Fix the NPE."
Good: "NPE at ContactService.java:142. Stack trace shows emailNormalizer
      is null. The field exists but has no @Inject annotation. The service
      was recently moved from ic-core where it used field injection."
```

The agent doesn't need to rediscover what you already know. Give it your diagnosis and let
it verify + fix.

### 3. The boundary (what to do and what NOT to do)

Agents are eager. Without a boundary, they'll optimize, refactor, and "improve" things you
didn't ask about.

```text
Bad:  "Fix the authentication bug."
Good: "Fix the authentication bug in JwtAuthenticationFilter.java.
      Change only the token validation logic — do not modify
      SecurityConfig, do not change endpoint permissions,
      do not update dependencies."
```

## Six prompt patterns that work

### Pattern 1: Bug fix (symptom + trace + boundary)

```text
Bug: {test/endpoint/feature} fails with {exact error}.
Location: {file:line}.
Cause: {what you think is wrong}.
Fix: {what you want changed}.
Boundary: change only {these files}. Run {this test} to verify.
```

### Pattern 2: Feature implementation (spec + examples + constraints)

```text
Add {feature} to {component}.
Behavior: when {trigger}, then {result}.
Example: {concrete input → expected output}.
Constraints: follow the pattern in {existing similar feature}.
Test: add a test that covers {the main scenario}.
```

### Pattern 3: Investigation (question + scope + output)

```text
Investigate: why does {X} happen when {Y}?
Start from: {entry point file/class}.
Scope: read at most {N} files.
Output: root cause + list of affected files + proposed fix (don't implement).
```

### Pattern 4: Refactoring (what + pattern + verify)

```text
Refactor: extract {method/class/module} from {source}.
Follow the pattern used in {existing example}.
Preserve all existing behavior — run {test suite} before and after.
No functional changes.
```

### Pattern 5: Code review (diff + criteria + format)

```text
Review the changes in {branch/PR/file list}.
Check for: {security issues, performance, correctness, conventions}.
For each finding: cite the file:line, state the problem, suggest a fix.
Format: markdown table with columns: File | Line | Finding | Suggestion.
```

### Pattern 6: Migration (from + to + verify)

```text
Migrate {component} from {old} to {new}.
Reference: {migration guide or example that's already done}.
Steps: {ordered list of what needs to change}.
Verify: {tests that must pass after migration}.
Do not migrate {things that should stay on the old version}.
```

## Before/after: real examples

### Example 1: Vague → Specific

```text
Before: "The document upload is broken."

After:  "DocumentUploadResource.uploadDocument() returns 500 for
        multipart uploads larger than 10MB. The error log shows
        'Request entity too large' from the Jersey layer. This
        worked before the Spring Boot 3 migration. Check if the
        multipart config in application.properties has the correct
        property names for Spring Boot 3
        (spring.servlet.multipart.max-file-size)."
```

### Example 2: Too broad → Bounded

```text
Before: "Improve the test coverage."

After:  "Add unit tests for FundInvestorService.createFundInvestor().
        Cover: successful creation, duplicate detection (should throw
        DuplicateFundInvestorException), and null fund ID (should throw
        IllegalArgumentException). Follow the pattern in
        FundServiceTest.java. Use JUnit 5 with @ExtendWith."
```

### Example 3: Outcome-focused → Process-focused

```text
Before: "Make the email sending more reliable."

After:  "Investigate why emails in DistributionListService.sendEmails()
        are occasionally sent twice. Check the idempotency key logic in
        EmailService.send(). The deduplication window is 30 minutes
        (ic.requestIdempotency.emailDuplicationPreventionMinutes).
        I suspect the key is generated from the wrong fields.
        Don't fix yet — report what you find."
```

## The mistakes that waste the most tokens

### 1. No stopping condition

"Make the code better" has no definition of done. The agent will iterate forever (or until
it hits the token limit). Always give a concrete stopping condition: a test that passes, an
error that disappears, a metric that improves.

### 2. Multiple unrelated tasks in one prompt

"Fix the NPE in ContactService AND update the Swagger docs AND add the new endpoint." The
agent will context-switch between these, likely breaking one while fixing another. One task
per prompt. Chain them if needed.

### 3. Telling the agent HOW instead of WHAT

"Open ContactService.java, go to line 142, add `@Inject` before the `emailNormalizer` field,
then save the file and run the test." This micro-management prevents the agent from using its
judgment — and if any detail is wrong, it follows your instructions into the wall.

Better: tell it what's wrong and what "fixed" looks like. Let it figure out how.

Exception: when the agent has demonstrated that it picks the wrong approach, then constrain the
how. But start with what.

### 4. Assuming the agent remembers

The agent starts fresh every session. If you told it about your project conventions yesterday,
it doesn't know today. This is what rules and skills solve — persistent instructions that
survive across sessions.

### 5. Not including the error message

"The test is failing" forces the agent to run the test and read the output — two tool calls
that cost tokens and time. If you already have the error, paste it. The agent skips straight
to analysis.

## The prompt quality checklist

Before sending a prompt, check:

- [ ] **Specific failure?** Can someone who's never seen the code reproduce from your description?
- [ ] **Evidence included?** Stack traces, error messages, relevant file names?
- [ ] **Boundary set?** What files/modules are in scope? What's off-limits?
- [ ] **Stopping condition?** What does "done" look like? Which test to run?
- [ ] **Single task?** One problem per prompt?
- [ ] **No assumed context?** Would this prompt work in a fresh session?

If you can check all six, the prompt will likely produce a good result on the first try. If
you can't check three or more, expect iteration — and iteration is where costs multiply.

**Related:** [Getting Started with Agentic Development](/post/agentic/getting-started/) for the
fundamental concepts, and [The 2-Retry Limit](/post/agentic/two-retry-limit/) for what happens
when prompts aren't specific enough and the agent enters a retry loop.
