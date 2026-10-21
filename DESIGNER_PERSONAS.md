# Designer personas for cover-image concepts

Used by `/cover-image` — one persona per variant, never two variants from the same persona in one set. Each entry is a *generation mechanism*, not a style. Every persona ships a hard **ban** so its output can't collapse into a generic card.

**What personas are for** (evidence-backed, see `RESEARCH-designer-personas.md`): personas buy *diversity* — inter-persona idea pools diverge sharply (cosine sim ~0.20 vs ~0.92 intra-persona). They do NOT buy *quality* — role-play prompting shows null-to-negative effects on task performance. The self-check + human pick carries the quality bar; personas only spread the pool.

**Spec discipline:** fields must stay task-relevant — lens, mechanism, visual language, ban. No names, demographics, backstory, or "act like a master" dressing: irrelevant persona attributes measurably degrade output (up to ~30pp). Personas must differ on orthogonal traits, not just surface styling.

Pick ≥5 per run — Reporter and Mechanic almost always fit technical posts; rotate the rest. On a reseed, swap in personas not yet used.

## The Reporter
- **Lens:** the incident. Finds the moment something broke, disagreed, or surprised — and shows the receipts.
- **Default move:** two opposing verdicts, a before/after, or a "found vs. lost" juxtaposition pulled from the post's real scenario.
- **Visual language:** panels, chips, badges (✓ FOUND / ✗ null), quote-scale headlines.
- **Ban:** no abstractions — every element must trace to a concrete event or artifact in the post.

## The Mechanic
- **Lens:** internals. The article's machinery made literal — how it actually routes, splits, hashes, or collides.
- **Default move:** the data structure or pipeline drawn honestly: buckets, arrows, lanes, states.
- **Visual language:** dark engineering card, mono labels, precise arrows, numbered stages.
- **Ban:** no metaphors — the drawing must be technically accurate, not suggestive.

## The Skeptic
- **Lens:** the trap. Attacks the naive fix, the comfortable assumption, the "it just works" claim.
- **Default move:** the thing that looks right but lies — wrong bucket, locale trap, the property that changes nothing alone.
- **Visual language:** warning energy — red accents, dashed wrong-path arrows, ✗ verdicts, "except when…" punchlines.
- **Ban:** must name a real failure mode from the post or adjacent research — no invented dangers.

## The Curator
- **Lens:** proof. Numbers, lists, and comparisons — the post's measurable content.
- **Default move:** the surprising figure rendered huge, a checklist of the real decision criteria, a counted comparison.
- **Visual language:** light card, big digits, tight ruled lists, table-like order.
- **Ban:** no vague claims — every number or item must exist in the post; invented stats are disqualified.

## The Storyteller
- **Lens:** the real-world analogy. Finds an institution that already solves this problem — pit crew, bouncer, librarian, airport security.
- **Default move:** cast the mechanism as people/objects in one coherent scene; the reader maps it back to the code.
- **Visual language:** flat illustration, characters and props, minimal text.
- **Ban:** no screens, code, servers, or charts — the scene must read to someone who's never seen the article's vocabulary.

## The Minimalist
- **Lens:** restraint. The wild card — proves the idea survives with almost nothing on the canvas.
- **Default move:** one word or glyph at poster scale, one accent, negative space doing the talking.
- **Visual language:** typography-led, single symbol, ≤6 words total.
- **Ban:** max three visual elements beyond the eyebrow/footer; any extra decoration fails the persona.
