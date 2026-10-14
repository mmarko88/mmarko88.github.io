---
description: Check a blog post against ARTICLE_WRITING_STANDARDS.md
---

# Check post against writing standards

Usage: `/check-standards <post>` where `<post>` is a path, directory name, or slug under `content/post/` (e.g. `check-standards data_to_functions`).

## Steps

1. **Resolve the post.** If the argument isn't an existing path, search `content/post/` for a directory or `index.md`/`.md` file whose name contains the argument (`find_by_name` with pattern `*<arg>*` or a directory listing). If ambiguous, ask which post.

2. **Read the standards.** Read `ARTICLE_WRITING_STANDARDS.md` at the repo root — it is the source of truth. Do not rely on memory of it; the doc may have changed.

3. **Read the post** fully, including front matter.

4. **Evaluate every standard below** against the post. For each, report PASS / WARN / FAIL with the specific line numbers or quoted text as evidence:

   - **Title**: outcome/problem-driven, searchable phrasing, ~50–60 chars, keyword early; numbers/first-person framing when real data exists. `description` in front matter, 140–160 chars.
   - **Hook**: first 2–4 sentences open a curiosity gap (scenario, consequence, surprising claim, question). FAIL if it opens with a definition, "In this post we will…", or a coverage summary.
   - **TL;DR**: present for posts over ~1000 words.
   - **Front-loaded payoff**: answer/recommendation appears early; structure follows problem → pain → solution → gotchas → takeaway.
   - **Brevity**: no padding paragraphs, paragraphs ≤ ~5 lines; word count in the ~1200–1800 sweet spot (flag <500 or >2000 without justification).
   - **Specificity**: numbers/versions/measurements back every performance or impact claim; flag vague hedging ("can be significant", "may impact") with no data.
   - **Benchmark claims**: if the post cites measurements, it must state JDK/runtime, methodology, and where the code lives.
   - **Headings**: descriptive, not bare concept labels; a scanner reading only headings gets the takeaways.
   - **One thing to remember**: a single key takeaway is called out (blockquote or equivalent).
   - **Visuals**: ≥1 visual beyond the feature image; a visual every few hundred words; evidence/receipts preferred over decoration.
   - **Chart choice**: lightest tool used — Mermaid `xychart` for simple comparisons, `chart` block for interactive/multi-series, table/inline text under ~5 numbers (a chart showing what a sentence could = decoration).
   - **Benchmark visuals**: if benchmark results exist, chart for the shape + table for exact numbers; methodology stated (JDK, iterations, code location); all numbers synced across TL;DR, table, chart, takeaways (no contradictions).
   - **Collapsible code**: full implementations and long listings sit in `<details>` blocks, not inline walls.
   - **Accessibility**: images have alt text; a diagram never carries information that exists nowhere else in the post.
   - **Code blocks**: every fence has a language tag; ≤ ~30 lines each (longer ones split per concept); 2–3 focused blocks preferred over exhaustive dumps; omissions marked.
   - **Runnable code**: no undefined variables, no forward references to types/signatures defined later, consistent arity and idioms across blocks (e.g., same constructor style), no placeholder logic, expected output shown where useful.
   - **Diagram styling**: mermaid code stays semantic — `classDef` only for meaning (terminal/action nodes), Lucide icons where steps benefit; flag decorative per-diagram restyling that belongs in the global theme.
   - **Honest trade-offs**: limitations section present for technique/pattern posts, quantified or compressed.
   - **Conclusion**: synthesizes with a takeaway + next step; FAIL if it re-lists what the post already said.
   - **NOCAY**: personal voice only where it serves content; no self-important padding.
   - **Internal links**: ≥1 link to a related post, placed where the reader would want it.
   - **Publishing checklist**: cross-check `ARTICLE_IDEAS.md` checklist items relevant to the post — PNG/JPG shareImage, `sourceCode` link, `toc: true` for long posts, `series:` if applicable, dev.to cover image + all 4 tags when cross-posting.

5. **Output format** — terse report, no preamble:

```markdown
## Standards check: <post title>

- **PASS** [title] — reason
- **WARN** [hook] — what's weak, suggested fix
- **FAIL** [conclusion] — what's missing, suggested fix

Verdict: N/N passed, M warnings, K fails. Top fix: <single highest-impact change>.
```

6. **Do not edit the post** unless the user explicitly asks after seeing the report. The check is read-only.
