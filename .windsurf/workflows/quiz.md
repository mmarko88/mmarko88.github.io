---
description: Generate quiz questions for a post from its content
---

# Quiz questions for a post

Usage: `/quiz <post>` — `<post>` is a directory or slug under `content/post/` (e.g. `quiz teen_mistakes`).

Produces `quiz` shortcode cards inserted under a `## Test yourself` section near the end of the post (before Resources/conclusion tail). Rules distilled from `RESEARCH-quiz-questions.md` — distractor quality is where quizzes live or die.

## Shortcode format

```
{{< quiz question="..." options="A|B|C|D" correct="0" explanation="..." >}}
{{< quiz question="..." options="A|B|C|D" correct="0,2" multi="true" explanation="..." source="/post/slug/">}}
```

`correct` = 0-based index (comma-separated for multi). `explanation` shows after answering; `source` links back into the post. Answers persist in localStorage and aggregate via Waline (submissions + correct count per question).

## Steps

1. **Read the post fully.** Extract the learning outcomes: the key takeaway, the mechanism, the decision rule, the gotcha, any hard numbers. One outcome per question — the takeaway is always covered first.

2. **Write 3–4 questions** (5 ceiling for long posts). Roughly one per major section. If a section yields only trivia, skip it — cut rather than pad.

3. **Match type to outcome:**
   - mechanism/decision → **application scenario** stem ("Your suite does X — which setting fixes it?"), the strongest type
   - a choice with degrees → **best-answer**
   - a genuine set (risks, prerequisites) → **multi-select** (`multi="true"`, max 1 per post)
   - an implicit comparison → **odd-one-out / tradeoff**
   - Never: version numbers, syntax spelling, negative stems ("which is NOT"), "all/none of the above", fill-in-the-blank restatements of post sentences

4. **Distractor rules (observable — check each):**
   - plausible only — wrong options come from real misconceptions/common errors, not filler
   - homogeneous: same length, grammar, form across all options; correct answer is NOT the longest
   - mutually exclusive — no option partially true, no overlapping ranges
   - no stem keyword repeated in the correct option; no "always/never" in wrong options
   - 3–4 options; correct index varies across the post's questions

5. **Explanations teach.** 1–2 sentences: why the answer is right AND why the tempting distractor is wrong. Add `source` when a post section answers it.

6. **Insert** under `## Test yourself` before the Resources section. If that section exists, append rather than duplicate.

7. **Self-check before finishing:** every question is answerable from the post alone; at least one application/scenario question; no two questions test the same outcome; correct-index positions differ.

8. **Verify** the post renders at `localhost:1313` and the cards answer correctly. Do not commit unless asked.

## Data loop (later)

After a post has a few hundred quiz submissions, query Waline aggregates (`reaction0` = submissions, `reaction1` = correct per `?quiz=<md5>` path). ~100% correct = too easy or cued → rewrite distractors; ~0% = ambiguous or off-content → fix or cut. Mid-range discriminates best.
