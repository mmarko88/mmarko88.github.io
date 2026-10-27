# Should we build a "skill writer" that drafts posts to `ARTICLE_WRITING_STANDARDS.md`?

**Answer:** Yes — but as a thin generation-time layer, not a copy of the standards doc. Best practice converges on a writer skill that front-loads what post-hoc review can't fix cheaply (hook-first structure, exemplar posts, banned openers, "never invent numbers"), then hands the draft to the existing `/check-standards` as a separate verification pass. Keep the two as distinct invocations — the evidence says the external, rubric-grounded critic is what makes the loop work, and same-pass self-critique actively hurts output.

**Confidence:** medium-high — three independent sources (an empirical paper, a production agent deployment, practitioner playbooks) plus this repo's own compiled research all land on the same architecture. The residual uncertainty is *how much* it helps you specifically, which depends on your current draft-failure rate.

## Why

1. **Generation and verification should be separate passes.** In controlled experiments, GPT-4 critiquing its own answers in the same loop *degraded* performance across every domain tested, while an external verifier produced substantial gains — and even plain re-prompting against a sound verifier retained most of the benefit [1]. Translation: a skill that writes AND marks its own homework buys little; a writer skill feeding the already-existing `/check-standards` (a fresh context with an explicit rubric) matches the architecture that works.

2. **Production writing agents already use this exact split.** Vercel's marketing-agent template — a lead agent routing to channel-specialist skills — keeps voice in one owned context document, shared writing rules defined *once* in a shared config (never restated per skill), banned words enforced by a lint tool rather than suggested, and a rubric review pass on every draft before a human sees it [2]. Your repo already has the equivalents: `ARTICLE_WRITING_STANDARDS.md` = the owned doc, `/check-standards` = the rubric pass. The missing piece is only the generation-side skill.

3. **What belongs in a writer skill is what a critic can't fix cheaply.** Practitioner guidance for AI-facing style guides: condense the rules to a prompt-sized block, keep a small library of approved exemplar pieces to paste in, write bans as paired avoid/use-instead entries, and give claims their own rule — statistics and product claims must be human-supplied, never model-generated [3]. A structural failure (weak hook, payoff buried at the end) found by `/check-standards` means rewriting, not editing — so the skill's job is to prevent those, not to recheck them.

4. **Exemplars beat instructions.** Your own compiled research: agents pattern-match aggressively on worked examples (highest-leverage context); constraining output to approved parts measured ~95% compliance while pasting the whole guide into the prompt was the *worst* strategy; and each ban lands better when paired with a positive exemplar [4]. The skill should point at 2–3 of your best posts rather than restating rules.

5. **Your standards are unusually generation-hostile in one good way.** "Real numbers over vague claims" and "benchmark methodology stated" cannot be generated — they must be measured. A writer skill that knows to insert `<TODO: measure>` placeholders and ask for inputs is safer than one that confidently fabricates plausible JMH results. This is the single most important rule to encode, and it aligns with the practitioner rule that claims must come from a supplied fact sheet [3].

## What would change this

- **If your drafts already pass `/check-standards` with 0–1 warnings consistently**, the skill's marginal value drops to near zero — the audit loop is already catching nothing. The trigger metric is your historical FAIL/WARN rate on first drafts.
- **If you rarely use the agent to draft** (you write prose yourself and the agent only audits/edits), a writer skill solves a problem you don't have.

## Considered and rejected

- **Copy the standards into the skill file.** Rejected: creates a stale duplicate, and whole-guide-in-prompt is empirically the weakest context strategy [4]. The skill should *read* `ARTICLE_WRITING_STANDARDS.md` fresh — same pattern `/check-standards` already uses (".windsurf/workflows/check-standards.md" step 2).
- **Merge writer + checker into one workflow.** Rejected: same-context self-critique degrades output [1]. Two invocations, two contexts.
- **Full auto-publish pipeline.** Rejected: claims/numbers need human-supplied measurements [3], and shipped creative output keeps a human gate [4 — Fiverr lesson]. The skill drafts; you measure and approve.
- **Machine lint for checkable rules** (banned phrases, missing fence language tags, word count, `description` length). Not rejected — deferred. The Vercel pattern says machine-checkable rules should be *enforced by tooling*, not left to model compliance [2]. Cheap to add later; a script, not a skill.

## Open

- **Which posts are the exemplars?** Needs your pick — candidates: the `agent-skills` series. Highest-leverage single decision in the skill.
- **Your actual first-draft failure rate** — worth tallying WARN/FAIL counts from recent `/check-standards` runs to size the benefit before building.
- **Skill file format**: `.windsurf/workflows/write-post.md` fits the existing repo pattern; a formal SKILL.md format only matters if you want portability to other agents.

## Recommended shape (if built)

`.windsurf/workflows/write-post.md`, steps: take topic + your notes/links → read `ARTICLE_WRITING_STANDARDS.md` fresh → read 1–2 named exemplar posts → produce outline of takeaway-carrying headings for your approval → draft with `<TODO: measure>` for any unmeasured number (never invent) → end by invoking `/check-standards` on the draft.

## Sources

[1] On the Self-Verification Limitations of Large Language Models on Reasoning and Planning Tasks: https://arxiv.org/abs/2402.08115
[2] How to keep AI-generated marketing content on brand (Vercel): https://vercel.com/i/keep-ai-generated-marketing-on-brand
[3] Brand Voice Guidelines for AI-Generated Content (rework.com): https://resources.rework.com/libraries/ai-for-marketing/ai-brand-voice-guidelines
[4] AGENT_RESEARCH.md §1, §2, §5 (local, this repo — itself citing arXiv 2402.01727, CHI EA'26 3798616, agenticdesign.school)
