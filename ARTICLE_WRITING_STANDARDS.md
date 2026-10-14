# Article Writing Standards

Standards for professionaldev.dev posts, distilled from research on technical writing that gets read.
Core rule: **NOCAY — Nobody Cares About You.** Readers care about the content. Personal voice is allowed only when it serves the point (a real bug story, a real number, a real dead end). Never pad.

## Brevity first

- People are lazy — cut everything not necessary. If a sentence doesn't transfer knowledge, delete it.
- Target ~700–2000 words. Every section must earn its place; equal space for every section is a smell.
- Short paragraphs (max ~5 lines), short sentences, one idea per sentence.
- Code blocks under ~30 lines. Paste the 3 lines that matter, not the whole file.

## The hook (first 2–4 sentences, no heading)

The reader decides whether to stay in the first two sentences. Open a "curiosity gap":

- **Good hooks**: a concrete scenario/moment, the consequence of not knowing, a surprising claim, a question the reader now needs answered.
- **Banned openings**: dictionary definitions, "In this post we will explore…", summarizing what the post will cover, "X has become increasingly important…".
- Write the opening last, once you know what you actually said.

## Front-load the payoff

- Put the answer/recommendation near the top. Most readers scan; if the key point is in paragraph 12, nobody sees it.
- Structure that works: **problem → wrong approach / pain → solution → gotchas → takeaway**.
- Long posts get a TL;DR (2–3 sentences) at the top.

## Specificity = trust

- Real numbers beat vague claims. "Can be significant" is opinion; "3.2x more allocations" is evidence. Measure it or cut the claim.
- Name real tools and versions ("date-fns 3.2", not "a popular library").
- Dead ends and failed attempts are valuable — "I tried X, it failed because…" teaches how to think, not just what to do.
- Code must be copy-paste runnable: complete imports, no placeholder logic, show the output where useful.

## Headings and scanning

- Descriptive headings, not topic labels: "When to Use Mutable State" beats "Mutable State". Under ~8 words.
- A reader scanning only headings should still get the main takeaways.

## Emphasis

- Pick the ONE thing you most want remembered and call it out (blockquote or short standalone paragraph). Don't give 5 items equal weight.

## Visuals & interactivity

- A visual every few hundred words: code block, diagram, chart, or callout — never decoration. Media posts get ~3x the engagement of text-only.
- Every post needs ≥1 visual beyond the feature image. If a paragraph explains structure or flow, it's a diagram waiting to happen.
- **Diagrams**: Mermaid for flows, sequences, state machines (```mermaid blocks — already wired, loads only on pages that use it).
  - The global theme (neo look + site accent, light/dark aware) handles all styling — keep diagram code semantic; use `classDef` only for meaning (terminal/end states, actions vs states).
  - Lucide icons are available in nodes: `@{ icon: "lucide:...", label: "..." }` — use them when a phase/step benefits from a visual anchor.
  - Pipelines read best as pipe segments — one row per step pairing `function → resulting state`; a plain LR chain for ≤4 nodes.
- **Charts** — pick the lightest tool that does the job:
  - simple bar/line comparisons → Mermaid `xychart-beta` (zero extra JS)
  - interactive tooltips, multiple series → the `chart` fenced block (Chart.js render hook, on-demand load)
  - under ~5 numbers → a table or inline text; a chart that shows nothing a sentence couldn't is decoration
- **Benchmarks**: chart for the shape + table for exact numbers. Never a chart without stating what was measured (JDK, methodology, code location). Re-measure fresh before publishing — numbers drift between runs; sync table, chart, TL;DR, and takeaways in one pass so nothing contradicts.
- **Long code**: full implementations go in `<details>` collapsibles ("Show full implementation") — post stays scannable, full code one click away.
- **Receipts**: real terminal output, benchmark runs, error messages — an asciinema recording or screenshot beats prose claiming it happened.
- **Performance budget**: no chart/JS library on the critical path; interactivity loads per-page on demand. If a visual needs JS, its information must also exist as text or alt text.
- Accessibility: alt text on every image; a diagram never carries information that exists nowhere else.

## Titles

- Outcome/problem-driven, searchable phrasing. Pattern: `[Verb] + [specific thing] + [context]`.
- Title the post with the exact string people google when it's an error/pitfall post.
- 50–60 characters, primary keyword early — Google truncates ~60 chars.
- Specific numbers in titles get ~2.7x more clicks ("I Measured X: It's 40% Slower" beats "X Performance Considerations"). Use them when you have real data.
- "I did X. Here's what happened" outperforms "How to X" — first-person experience titles signal lived experience, not a docs rewrite. NOCAY note: the "I" earns its place only because it promises real evidence; the content must deliver it.
- Failure/mistake framing gets ~3.4x more shares than success stories. "The bug that cost me a weekend" > "How I fixed a bug."

## SEO mechanics

- `description` in front matter: 140–160 chars, unique per post, contains the keyword + a benefit. Google rewrites it often — write it anyway for when it's shown.
- URL slug: readable, keyword-rich, no dates.
- Internal links: every post links to ≥1 related post. Link where the reader would actually want it, not a "read more" dump at the end.
- `shareImage`: PNG/JPG only — social crawlers ignore SVG/WebP on some platforms.

## Code blocks

- Always tag the language on fenced blocks (```java, ```bash, ```text for output).
- 2–3 focused blocks outperform 10+. Show the interesting 10 lines, not the boring 100 — link the repo for the full file.
- Split long examples into separate blocks, each with a sentence explaining why that step exists.
- Mark deliberate omissions (`// existing settings`) so readers know it's intentional.
- No forward references: a snippet shouldn't use types, records, or signatures defined later in the post. Keep arity and idioms consistent across blocks — pick `new BigDecimal("0.9")` and stick to it everywhere.
- Show expected output where the reader would want to verify (command output, return values).
- Beware smart quotes — never paste code through word processors; curly quotes silently break copy-paste.

## Evidence over adjectives

- Screenshots/receipts (real terminal output, metrics, diffs, error messages) get ~4x more engagement than text-only. Proof beats decoration — a diagram that explains counts; a stock image doesn't.
- Benchmarks attract traffic, but only with methodology transparency: what you tested, on what JDK/hardware, how many iterations, and where the code lives.
- Challenging a popular opinion gets engagement — but only with data. Contrarian without proof is clickbait.

## Length and tags

- Word-count sweet spot: ~1200–1800 words. Under ~500 reads as thin; much over 2000 needs to earn it.
- Cross-posting to dev.to: always use a cover image (~7x more likely to get reactions) and all 4 tag slots.

## Conclusion

- Synthesize, don't restate. No re-listing what the post already said.
- End with one takeaway + a next step (repo link, related post, thing to try). No "In conclusion…".

## Honesty

- Keep the trade-offs/limitations section — it's a differentiator. But quantify it or compress it.
- Take a stance. Admit what you don't know ("I still don't know why X") — it's more credible than hedging everything.
