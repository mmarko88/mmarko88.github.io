# Designer personas for cover-image concepts

Used by `/cover-image` — one persona per variant, never two variants from the same persona in one set. Each entry is a *generation mechanism* **plus a visual style** — the lens decides what the card says, the style decides how it's drawn (evidence: `RESEARCH-cover-creativity.md` — art directors match illustrator voice to story type). Every persona ships a hard **ban** so its output can't collapse into a generic card.

**Global bans** (every persona): no generic tech iconography — gears, padlocks, robots, clouds, matrix rain, stock laptop photos — unless subverted into the post's actual point; no humor that doesn't encode the mechanism; no clip-art drift — flat illustration with brand tokens only.

**What personas are for** (evidence-backed, see `RESEARCH-designer-personas.md`): personas buy *diversity* — inter-persona idea pools diverge sharply (cosine sim ~0.20 vs ~0.92 intra-persona). They do NOT buy *quality* — role-play prompting shows null-to-negative effects on task performance. The self-check + human pick carries the quality bar; personas only spread the pool.

**Spec discipline:** fields must stay task-relevant — lens, association pass, visual language, ban. No names, demographics, backstory, or "act like a master" dressing: irrelevant persona attributes measurably degrade output (up to ~30pp). Personas must differ on orthogonal traits, not just surface styling.

**Association pass** (every persona runs it before drawing — the editorial method): take the post's mechanism as verb+object, word-associate it into another domain, cast one scene. `persist ×1000 → one network trip` → freight → crate vs 100,000 envelopes. The association list is disposable — the scene is the deliverable.

Pick ≥5 per run — **classified by post type first** (benchmark → Curator/Mechanic/Reporter; tutorial → Mechanic/Storyteller/Set Designer; postmortem → Reporter/Skeptic/Cartoonist; internals → Mechanic/Set Designer; opinion → Skeptic/Cartoonist/Minimalist). Reporter and Mechanic almost always fit technical posts; rotate the rest. On a reseed, swap in personas not yet used.

## The Reporter
- **Lens:** the incident. Finds the moment something broke, disagreed, or surprised — and shows the receipts.
- **Association pass:** the incident's nouns → evidence-frame domains (receipts, dockets, exhibits, police reports, sports scores).
- **Default move:** two opposing verdicts, a before/after, or a "found vs. lost" juxtaposition pulled from the post's real scenario.
- **Visual language:** panels, chips, badges (✓ FOUND / ✗ null), quote-scale headlines.
- **Ban:** no abstractions — every element must trace to a concrete event or artifact in the post.

## The Mechanic
- **Lens:** internals. The article's machinery made literal — how it actually routes, splits, hashes, or collides.
- **Association pass:** the machine's verbs → protocol/blueprint views (wiring diagram, state machine, packet trace) — stays literal, no metaphor.
- **Default move:** the data structure or pipeline drawn honestly: buckets, arrows, lanes, states.
- **Visual language:** dark engineering card, mono labels, precise arrows, numbered stages.
- **Ban:** no metaphors — the drawing must be technically accurate, not suggestive.

## The Skeptic
- **Lens:** the trap. Attacks the naive fix, the comfortable assumption, the "it just works" claim.
- **Association pass:** looks-like-vs-does domains (forensics, warning labels, autopsies, small print, warranty voids).
- **Default move:** the thing that looks right but lies — wrong bucket, locale trap, the property that changes nothing alone.
- **Visual language:** warning energy — red accents, dashed wrong-path arrows, ✗ verdicts, "except when…" punchlines.
- **Ban:** must name a real failure mode from the post or adjacent research — no invented dangers.

## The Curator
- **Lens:** proof. Numbers, lists, and comparisons — the post's measurable content.
- **Association pass:** the numbers → counted-world framings (per-item cost, nutrition label, receipt, scoreboard, spec sheet).
- **Default move:** the surprising figure rendered huge, a checklist of the real decision criteria, a counted comparison.
- **Visual language:** light card, big digits, tight ruled lists, table-like order.
- **Ban:** no vague claims — every number or item must exist in the post; invented stats are disqualified.

## The Storyteller
- **Lens:** the real-world analogy. Finds an institution that already solves this problem — pit crew, bouncer, librarian, airport security.
- **Association pass:** the mechanism → people-institutions (bouncer list, coat check, assembly line, customs queue) — characters required.
- **Default move:** cast the mechanism as people/objects in one coherent scene; the reader maps it back to the code.
- **Visual language:** flat illustration, characters and props, minimal text.
- **Ban:** no screens, code, servers, or charts — the scene must read to someone who's never seen the article's vocabulary.

## The Minimalist
- **Lens:** restraint. The wild card — proves the idea survives with almost nothing on the canvas.
- **Association pass:** the punchline → one glyph/word that can carry it (a numeral, an operator, a single pictogram).
- **Default move:** one word or glyph at poster scale, one accent, negative space doing the talking.
- **Visual language:** typography-led, single symbol, ≤6 words total.
- **Ban:** max three visual elements beyond the eyebrow/footer; any extra decoration fails the persona.

## The Cartoonist
- **Lens:** the absurdity. Finds the post's finding that is already ridiculous when said plainly — and draws it straight-faced.
- **Association pass:** the absurdity → deadpan comedy framing (instruction manual gone wrong, safety card, flowchart with one insane branch, "works on my machine" energy).
- **Default move:** a cartoon scene where the post's real behavior plays out as the punchline — `saveAll()` literally stopping to ask the DB "do you exist?" per row.
- **Visual language:** flat cartoon, one wry caption, speech/thought bubbles allowed; the joke IS the mechanism.
- **Ban:** no generic dev memes — the humor must encode this post's actual finding; a gag that works for any article fails.

## The Set Designer
- **Lens:** the object-level metaphor. Maps the mechanism onto a physical system with no people required — freight dock, vending machine, ticket gate, fuse box.
- **Association pass:** mechanism as verb+object → physical-world systems (shipping, plumbing, electricity, storage) — cast objects, not characters.
- **Default move:** a staged scene of objects where the physical arrangement *is* the mechanism — one crate vs 100,000 envelopes; a turnstile counting every entrant.
- **Visual language:** flat illustration, props and machinery, labeled sparingly; scene readable as a diorama.
- **Ban:** no characters — the system must carry the metaphor; if it needs a person to explain it, pick a different domain.
