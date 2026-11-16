# Slop pattern catalog

AI-writing tells for prose posts. Adapted from EveryInc/compound-engineering-plugin
(`skills/ce-noslop/references/patterns.md`, MIT) and trimmed to what applies to a
technical blog. Rule numbers are stable ids — a removed rule leaves a gap, never renumber.

**False-positive floor.** A single device is a choice, not a tell. Flag a passage when
patterns accumulate — three or more distinct rules in a passage, or one repeated across
sections. Never flag: text inside quotation marks or code blocks, a term the domain uses
for one exact meaning, deliberate repetition for emphasis, one short sentence for
emphasis, or a heading.

**What an edit may change.** A sentence no rule fails on comes back exactly as written,
even when its neighbor is rewritten. In a failing sentence change only the span that
fails; when a deleted span holds a fact, keep the fact in plain words.

## Content

1. **Puffery.** A claim of importance stapled to an ordinary fact: "marks a turning
   point", "plays a vital role", "in today's landscape". Delete the claim, keep the fact.
2. **Trailing -ing analysis.** A clause bolted on the end explaining significance:
   "highlighting", "ensuring", "showcasing". Delete the clause; the sentence survives.
3. **Promotional adjectives.** "Vibrant", "seamless", "robust", "groundbreaking",
   "powerful yet simple". State the property or delete the claim.
4. **Vague attribution.** "Experts believe", "studies show", "widely regarded". Name the
   source or cut the claim. Never invent a source.
5. **Formulaic outlook.** A closing paragraph about the bright future. Keep one real
   limitation or plan, stated plainly; end on the last concrete fact.
6. **Setup-reversal copy.** "Ten features. Zero headaches." If the reversal was carrying
   the sentence, the sentence had no content.
7. **Faux insight.** "The part everyone misses", "what nobody tells you", "the real
   question is", "at its core". Cut the setup, let the claim stand.
8. **Commentary on the writing.** "This matters more than it sounds", "the key point
   is", "as you can see". Delete the aside; if the point is unclear, add support.
9. **Rejecting an alternative no one raised.** "Some might say", "this isn't about X".
   Remove the fake option; state the real constraint.

## Language

10. **Model vocabulary.** Delve, tapestry, testament, underscore, showcase, garner,
    interplay, intricate, foster, crucial, pivotal, moreover, leverage, utilize,
    facilitate; "landscape", "realm", "journey" as abstractions. Use the plain word.
11. **Long ways to say "is" or "has".** "Acts as", "functions as", "serves as",
    "boasts". Use the short verb.
12. **Not X but Y.** "It's not just a linter, it's a system." Nobody claimed X; state Y.
13. **Forced triads.** Three adjectives or beats when the true number is one or two.
14. **Synonym cycling.** The same thing called three names in one post. Pick one term
    and repeat it — in technical writing repetition is precision.
15. **A span that is really a list.** "From onboarding to billing" when they are two
    items, not the ends of anything. Name the items.
16. **Filler.** "In order to" = "to". "Due to the fact that" = "because". "It is
    important to note that" = nothing.
17. **Stacked hedges.** "Could potentially" = "may". One hedge, only when the
    uncertainty is real.
18. **Adverbs doing a verb's work.** "Runs quickly" → "finishes in 40 ms". Replace the
    verb or supply the number.
19. **Verbs turned into nouns.** "The migration of the data" = "migrate the data".
20. **Borrowed metaphors for ordinary operations.** A "surface" that is an API, a
    "lever" that is a flag, a "flywheel" that is a feedback loop, a "north star" that is
    a goal. Name the thing.
21. **Feeling instead of mechanism.** "Deploys feel effortless", "errors are handled
    gracefully". Name what the reader can check: "a failed deploy rolls back within one
    minute".

## Structure

22. **Dense sentences.** A sentence the reader parses twice. One idea per sentence.
23. **Passive hiding the actor.** "Queries are validated" — by whom? Keep the passive
    only when naming the actor adds nothing.
24. **Buried decision.** The conclusion arrives after its rationale. Conclusion, then
    reason, then background.
25. **Heading restated in the first sentence.** Delete the restatement; start with
    content.
26. **Summary-recap ending.** "In conclusion", a paragraph that repeats the post.
    Already covered by the standards' conclusion rule — flag once, here.
27. **Dramatic fragments.** "No priors. No nostalgia." A row of them is a pose.
28. **Colon reveal.** "The detail that makes it work: a separate grader." A colon
    belongs before a list or a quote, not as drama.

## Formatting

29. **Em dash as rhythm crutch.** Several per paragraph, or formulaic "this isn't X —
    it's Y". Use a period, comma, or split.
30. **Bold label that restates its line.** "**Performance:** performance improved."
    Convert to prose.
31. **Bold sprinkled for emphasis.** Bold only what the reader must find.
32. **Title Case headings.** Sentence case.
33. **Decorative emoji** in headings and bullets. Remove unless the post's convention
    fixes them.
34. **Bullets where two sentences read better**; headers over two-sentence sections;
    horizontal rules between every section.
35. **Curly quotes** mixed with straight ones. Straight quotes; curly quotes in code
    break copy-paste (standards already ban them there — this covers prose).

## Plain speech

42. **Clipped sentences.** Dropped articles, symbols for words, abbreviations the reader
    must decode. Fragments the format expects — table cells, figure captions — stay.
43. **Figurative phrasing.** Code given intent it does not have ("the config knows about
    the queue"). Say what happens. Literal-operation verbs (reads, rejects, validates)
    stay.
44. **Intensifiers.** "Critically", "genuinely", "simply", "actually" where the sentence
    says the same without them. Keep one when it changes the claim ("explicitly set"
    against a default).
