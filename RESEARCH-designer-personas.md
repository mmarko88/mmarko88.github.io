# Designer personas for image/concept generation — does the roster hold up?

**Answer:** Persona-based generation is a *diversity* instrument, not a *quality* instrument — and the evidence is unusually consistent on both halves. The roster design in `DESIGNER_PERSONAS.md` (one persona per variant, generated in parallel, task-relevant spec fields) matches what studies measure as effective. Two refinements apply: personas should differ on many orthogonal traits, and spec text should contain only task-relevant attributes — irrelevant persona details measurably degrade output.

**Confidence:** high — multiple independent studies (HCI, NLP, design-science venues) converge; the quality boundary is supported by several null/negative results, which is strong evidence because it survives publication bias.

## Why

### Personas work for diversity — that's the verified mechanism

- GPT-4 idea pools are less diverse than human brainstorm pools by default; persona assignment is among the best fixes, and CoT can *reduce* diversity by funneling through one reasoning path [1].
- Persona-driven diversity compounds at the pool level: 300 plots from 10 personas — intra-persona cosine similarity 0.92, **inter-persona 0.20** [2]. One persona = one neighborhood; the roster IS the diversity.
- For design concepts specifically: parallel prompts (one persona each) and sequential prompting both beat collective prompting (all personas in one prompt) for concept diversity [3]. `/cover-image`'s one-variant-per-persona-in-parallel is the validated configuration.

### Personas do NOT buy quality — and bad persona design costs

- 162 personas × 2,410 factual questions: no average performance gain; effects are largely random [4]. Persona prompting is volatile on reasoning tasks — can drop performance; negated personas sometimes match positive ones [5][6].
- **Irrelevant attributes hurt:** names, hobbies, demographic dressing degraded performance up to ~30 percentage points [7]. In-domain, work-related role descriptions are the most robust [4][7].
- Implication: personas exist to spread the candidate pool; the self-check + human pick carries the quality bar. They are not a substitute for either.

### What the persona spec should contain

- **Vary many orthogonal traits.** The 0.20-similarity pool came from personas differing across cultural background, thinking tools, genre preference, interests — not just job titles [2]. Our roster varies on lens (what to look at), mechanism (how to generate), visual language, and ban — orthogonal by construction.
- **Concrete/ordinary beats aspirational.** "Ordinary" personas produced more unique categories than "creative entrepreneur" personas [8] — a named craft discipline outperforms "be a genius designer."
- **Specialized roles > one generalist.** A creator/expert/doer agent team outperformed a single general agent in a designer-ideation experiment [9]; role separation maps to real creative teams (generation, evaluation, feedback are distinct functions [10]).
- **Humans orchestrate.** Practitioners paired with agent teams ended up directly orchestrating rather than letting them run autonomously [11] — consistent with the generate→self-check→user-picks flow.

## What would change this

If variants were produced by separate model calls with no shared context (true sub-agents), sequential/collective strategies might behave differently [3]. Current execution is one model generating all variants with persona specs — parallel prompting — which is the strongest-tested configuration anyway.

## Considered and rejected

- **Richer personas (backstory, demographics, names)** — rejected: irrelevant attributes measurably degrade output [7]; adds tokens without diversity benefit.
- **Personas as quality boosters ("act like a master designer")** — rejected: evidence shows null-to-negative quality effects; role-playing doesn't confer skill [4][5][6].
- **A dedicated evaluator persona judging before the human sees the set** — the reviewer self-check already plays this role; adding an LLM judge before a trivial human glance buys nothing at this scale. (AGENT_RESEARCH: LLM-as-judge goes last, never alone.)

## Open

- Whether the six personas exhaust the useful perspective space — unknown until a few runs show which personas produce winners. The data loop: track which persona's variant gets picked per post.

## Sources

[1] Prompting Diverse Ideas: Increasing AI Idea Variance (arXiv): https://doi.org/10.48550/arxiv.2402.01727
[2] Using Generative AI Personas Increases Collective Diversity in Human Ideation (arXiv): https://arxiv.org/html/2504.13868v1
[3] Enhancing design concept diversity: multi-persona prompting strategies for LLMs (Design Science, Cambridge): https://doi.org/10.1017/dsj.2025.10037
[4] Personas in System Prompts Do Not Improve Performances of LLMs (EMNLP Findings): https://aclanthology.org/2024.findings-emnlp.888.pdf
[5] "You are a brilliant mathematician" Does Not Make LLMs Act Like One (OpenReview): https://openreview.net/pdf?id=sVaRgmH8FE
[6] Rethinking Role-play Prompting in Mathematical Reasoning Tasks: https://doi.org/10.1145/3688864.3689149
[7] Principled Personas: Defining and Measuring Persona Prompting Effects (EMNLP): https://aclanthology.org/2025.emnlp-main.1364.pdf
[8] Examining and Addressing Barriers to Diversity in LLM-Generated Ideas (arXiv): https://arxiv.org/html/2602.20408
[9] Specialized AI Agents vs General AI Agent for Designer Ideation (Springer CCD): https://dl.acm.org/doi/10.1007/978-3-031-93733-0_12
[10] Understanding Human–Multi-Agent Team Formation for Creative Work (ACM): https://doi.org/10.1145/3772318.3791166
[11] Design Activity Simulation with Multiple Communicative AI Agents (CUI): https://pokristensson.com/pubs/YangEtAlCUI2025.pdf
