---
description: Research a question online and produce a cited report
---

# Research a question online

Usage: `/research <question or topic>`.

Implements the research-agent practices in `AGENT_RESEARCH.md` (§3 + the deep-research skill sources). Output is a conclusion with evidence, not a pile of links.

## Steps

1. **Sharpen the question.** Before searching, pin down: the *decision* behind the question, the *constraints that disqualify* options, and *what form the answer takes* (recommendation, comparison, number, yes/no). If the sharpened question differs materially from what was asked, state the difference and confirm before spending effort. Pick depth: `quick` (1 authoritative source) / `standard` (2–3 cross-referenced) / `deep` (multi-hop, contradictions resolved).

2. **Plan.** `todo_list` the sub-questions — one focused aspect each. Simple fact-finding: 1 todo, no decomposition. Multi-faceted: one todo per facet so searches can run in parallel.

3. **Search in bursts, from several angles.** One phrasing returns one neighbourhood of results — vary:
   - **vocabulary** — practitioners, vendors, and academics name the same thing differently
   - **stance** — search the failure mode too ("X problems", "migrating away from X", "X postmortem"); critical sources are systematically underrepresented because vendors publish more than victims
   - **recency** — what was true three years ago may not be

   Two-stage filter: judge by title/snippet first, `read_url_content` only the promising ones. Prefer `domain` filters on `search_web` for primary sources (vendor docs, arxiv, official papers).

4. **Weigh sources, don't count them.** Ten blogs repeating one benchmark = one piece of evidence. Trace claims to their origin. Rank by: primary over secondary (docs, source, original paper); interest (who benefits if you believe this); specificity (states versions/conditions/hardware); falsifiability. SEO filler, listicles, and anonymous claims are leads, not evidence.

5. **Stop conditions** — stop searching when: the claim set has required coverage AND marginal value drops (new results are duplicates), OR hard cap ~3 search rounds. Detect loops: if queries start repeating or rephrasing yields the same domains, pivot stance or stop — don't loop.

6. **Resolve disagreement, don't average it.** Conflicts are the most informative moment. Usually: different conditions (both right at different scales/versions — find the boundary), different definitions, one is stale, or one is wrong (say so, with reason). Record unresolved conflicts; never force consensus.

7. **Report conclusion-first.** Quick questions: answer inline. Standard/deep: write `RESEARCH-<topic-slug>.md` at repo root:
   ```markdown
   # <Question>
   **Answer:** conclusion in 2–3 sentences.
   **Confidence:** high / medium / low — and what drives it.

   ## Why — reasoning, evidence attached to each step [1]
   ## What would change this — the finding that would flip the conclusion
   ## Considered and rejected — alternatives + why each lost
   ## Open — what's still unknown and what would resolve it

   ## Sources
   [1] Title: URL (one number per unique URL, sequential, no gaps)
   ```
   Rules: no self-referential language ("I found…"); every factual claim cited; **never cite a source you didn't open**; claims with <2 sources go in Open questions, not Findings; no "probably/likely" filling gaps.

8. **Verify.** Re-read the original request; confirm every aspect is addressed and the report stands alone. Present the conclusion to the user first, file path second.
