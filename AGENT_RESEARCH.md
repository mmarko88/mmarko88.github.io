# Agent research: creativity, design, research, exemplars

Compiled Oct 2026. Four questions researched; citations at the bottom.

## 1. Making agents creative

LLM idea pools are measurably *less* diverse than human brainstorm pools (cosine similarity 0.255–0.432 for GPT-4 vs 0.243 for humans) — creativity's failure mode is sameness, not quality [1]. What increases variance:

- **Personas beat plain prompting.** Asking the model to generate from different personas/materials/histories produces the most diverse pools. Chain-of-Thought, by contrast, can *reduce* diversity — it funnels everything through one reasoning path [1].
- **Burst + reseed, never one shot.** The obvious ideas all live in burst 1. Mandatory second round: rotate the operators/personas, feed the pooled ideas back as "title + one-line mechanism" (bare titles under-specify — generators re-invent the same mechanism under a new name), instruct "only what has NOT been said" [2].
- **Stop conditions, not vibes:** stop when ≥2 bursts done AND pool gate met, when non-duplicate yield <20%, or at 4 bursts hard cap [2].
- **Constraint + direction = creativity.** "No constraint = no traction." Pick a named creative method (SCAMPER, inversion, analogy), set one hard constraint, generate 3, ship 1 [3].
- **Multi-agent split of creative labor** — EMNLP 2025 survey: divergent exploration (each agent gets a distinct perspective and explores independently, no early filtering), iterative refinement (proposer/reviewer/implementer roles in cycles — HoLLMwood's Writer/Editor/Actor), collaborative synthesis [4].
- **Warning:** repeated LLM brainstorming may erode a human's long-term originality — keep humans generating first, AI second (Group-AI Brainwriting does exactly this) [4].

## 2. Designer agents

The recurring failure is *generic* output — "vibe-designed" UI that ignores the org's system. Fixes in order of measured impact:

- **Registry > context > instruction.** CHI'26 study: giving the agent pre-built compliant components hit 95% compliance; injecting task-relevant style-guide excerpts second; pasting the whole guide into the prompt worst [5]. Lesson: constrain output to approved parts, don't hope the prompt educates.
- **Build a design harness, not a longer prompt.** Encode: brand identity, available components, banned patterns, exemplar outputs, and executable checks. The prompt then only carries what's genuinely new [6].
- **Anti-slop contract = 5 layers** (all five, they fail independently): identity in concrete terms; explicit ban list written as *observables* ("no purple gradient heroes", not "avoid looking AI"); positive exemplars with captions saying what to copy; executable checks (regex/AST, DOM probes, visual diff); short human rubric for what scripts can't score [7].
- **LLM-as-judge goes last, never alone** — fixed rubric bullets, citations to DOM/screenshot evidence, and static bans still fail closed regardless of judge prose [7].
- **Context categories agents need** [8]: named design tokens (never raw hex), component contracts (canonical component + allowed variants), worked examples (agents pattern-match aggressively — highest-leverage context), explicit anti-patterns, accessibility as non-negotiables, copy rules.
- **Rules as typed records, not prose** — a rule is `{key, type, value, usage, assets}` with context variants (`dark-background` swaps the token value), plus a pre-ship check endpoint that refuses with reasons + suggestions [9].

## 3. Online-research agents

Production pattern is hierarchical, not monolithic [10][11]:

- **Planner / Coordinator / Executors.** Planner decomposes and reflects; Coordinator assigns, aggregates, verifies; Executors do grounded actions (search, fetch, code). Decouples strategy from execution, enables parallelism, keeps the planner's context clean over long horizons [11].
- **LangChain's reference workflow:** plan with todos → save the request to file → delegate each aspect to a context-isolated sub-agent (never research in the orchestrator) → synthesize with deduplicated numbered citations → verify against the saved request [10].
- **Dynamic outline, not static pipeline** — WebWeaver (SOTA on DeepResearch Bench): planner interleaves evidence acquisition with outline refinement; two-stage filtering (title/snippet → distilled summary); evidence goes to a structured memory bank, writer retrieves only what each section needs — kills long-context noise and citation hallucination [12].
- **Report hygiene** [10]: no self-referential language ("I found…"), prose over bullets, unique URL = one citation number across all findings, sequential numbering, `### Sources` section.
- **Simple fact-finding → 1 sub-agent; multi-faceted → parallel sub-agents.** Batch similar tasks into one todo [10].

## 4. Best agent examples — and what breaks

Documented real deployments [13][14]:

| Agent | Does | What breaks |
|---|---|---|
| Klarna assistant | Resolves chats in 23 markets (~700 FTE volume) | Complex cases; reopened human hiring 2025 |
| Intercom Fin | Tickets, refunds, account updates | Resolution tracks your ticket mix, not vendor average |
| Ramp merchant agent | Re-matches misclassified transactions | Constrained action set precisely because it would drift |
| Uber Finch | Finance Qs in Slack via SQL | Self-admitted hallucination |
| Copilot cloud agent | Issue → branch → PR in Actions env | Network firewall doesn't cover MCP servers |
| Claude Code | Codebase edits, terminal, git | Approval fatigue — users approve 93% of prompts |
| OpenAI deep research | Hundreds of sources → cited report | Weak confidence calibration |
| Devin | Ships well-scoped tickets end-to-end | Trajectory drift on long horizons — Cognition's core engineering problem [15] |

## 5. Cross-cutting patterns

- **The fence makes autonomy affordable.** Every successful agent is bounded — Ramp's fixed action set, refund caps, ephemeral environments. Blast radius = tool surface [13].
- **Under-specification is the default input.** Users give context the agent lacks; clarifying and intent inference matter more than raw capability [15].
- **Trajectories need monitoring.** Long-horizon agents drift; detection + steering is infrastructure, not a nice-to-have [15].
- **Evals enable model swaps.** Cognition keeps a long eval set specifically so "we don't regress on product behaviors" when changing models [15].
- **Human gate on creative/shipped output.** Fiverr: AI output = first draft always; AI writes the test safety net, humans review with full understanding [14].
- **Diversity requires explicit machinery** in generation tasks (§1); **conformity requires explicit machinery** in design tasks (§2). Same pattern, opposite sign — the agent defaults to the mean either way.

## Applied to this repo

- `/cover-image` already follows the burst pattern (2–3 variants, user picks) and brand-token constraints; a second reseed burst ("only what hasn't been proposed") is the obvious upgrade.
- `/check-standards` is the executable-checks layer; pairing each ban with a positive exemplar is the missing piece per [7].
- A future `/research` skill would follow the LangChain shape: todos → parallel sub-agent searches → dedup-cited report → verify against the saved request.

## Sources

[1] Prompting Diverse Ideas: Increasing AI Idea Variance (arXiv 2402.01727)
[2] agent-skills: ideate/rules/divergence.md (github.com/mthines/agent-skills)
[3] Creative Ideation skill docs (hermes-agent.nousresearch.com)
[4] Creativity in LLM-based Multi-Agent Systems: A Survey (EMNLP 2025)
[5] Design System-Compliant UI Generation with LLM Agents (CHI EA'26, ACM 3798616)
[6] Build a Design Harness Before You Prompt (agenticdesign.school)
[7] Anti-Slop Brand Contracts: Encoding Taste as Eval Criteria (agenticdesign.school)
[8] Design Systems for AI Agents and AI-Generated UI (kilo.ai)
[9] How to give AI agents your brand guidelines (artbucket.io)
[10] Build a deep research agent (docs.langchain.com/oss/python/deepagents/deep-research)
[11] RL Foundations for Deep Research Systems: A Survey (arXiv 2509.06733)
[12] WebWeaver: Structuring Web-Scale Evidence with Dynamic Outlines (arXiv 2509.13312)
[13] AI Agents Examples: 8 Real Deployments and What Breaks (idealogic.io)
[14] Fiverr Lessons From Adopting Agentic AI in R&D (Fiverr Engineering, Medium)
[15] Cognition case study (claude.com/customers/cognition)
