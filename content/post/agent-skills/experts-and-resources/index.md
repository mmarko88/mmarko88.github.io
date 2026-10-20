---
title: "Agentic Development Experts and Resources: Who to Follow and What to Study"
date: 2026-10-22
draft: true
usePageBundles: true
description: "The researchers, practitioners, and open-source projects shaping how coding agents work. A curated list of who to follow, where they post, and which resources are worth your time."
tags: ["agents", "ai", "resources", "community"]
categories: ["agents"]
series: ["Agent Skills"]
# featureImage: 'hero.svg'
# shareImage: 'share.png'
---

When I started building agent skills, I made every mistake from scratch. Months later I found
that most of them were documented — by researchers, by tool builders, by practitioners who'd
already burned the same hours. The problem wasn't lack of information; it was not knowing where
to look.

This post is the reading list I wish I'd had on day one.

> **The one thing to take from this post:** the agentic development field moves fast, but the
> people doing the most useful work are surprisingly consistent. Follow the practitioners who
> publish their failures, not just their wins.

## The researchers

These are the people producing the foundational work on why agents behave the way they do — the
papers that explain what you're seeing in practice.

### Shunyu Yao

**Where:** Twitter/X ([@ShunyuYao12](https://x.com/ShunyuYao12)), Papers on arXiv

Author of **ReAct** (Reasoning + Acting) — the paper that formalized the loop most coding agents
use today: think → act → observe → think. If your agent alternates between reasoning and tool
calls, it's doing ReAct whether it knows it or not.

Also co-authored **Tree of Thoughts** and contributed to agent evaluation frameworks. His work
is dense but foundational — worth reading at least the ReAct abstract to understand why agents
reason between tool calls instead of planning everything upfront.

**Key paper:** *ReAct: Synergizing Reasoning and Acting in Language Models* (ICLR 2023)

### Andrew Ng

**Where:** [deeplearning.ai](https://www.deeplearning.ai/), Twitter/X ([@AndrewYNg](https://x.com/AndrewYNg)), The Batch newsletter

Popularized the term **agentic workflows** and published a clear taxonomy of agent design
patterns: reflection, tool use, planning, and multi-agent collaboration. His short courses on
DeepLearning.AI are the fastest path from "I've heard of agents" to "I understand the
architecture."

His framework for thinking about agentic patterns (reflection, tool use, planning, multi-agent)
is the mental model most practitioners use, even if they don't cite it explicitly.

**Key resource:** *Agentic Design Patterns* talk series (free on DeepLearning.AI)

### Huang et al. (self-correction research)

**Where:** arXiv, ICLR proceedings

The team behind the **"Large Language Models Cannot Self-Correct Reasoning Yet"** paper. This
is the research that explains why having an agent review its own output doesn't work — the
finding I wrote about in [Why Your Coding Agent Needs a Different Critic](/post/agentic/different-critic/).

If you only read one paper on agent limitations, make it this one. It saves you from building
a self-review system that feels like it should work but doesn't.

**Key paper:** *Large Language Models Cannot Self-Correct Reasoning Yet* (ICLR 2024)

## The practitioners

These are people building and shipping with coding agents, publishing what actually works
(and what doesn't).

### Simon Willison

**Where:** [simonwillison.net](https://simonwillison.net/), Twitter/X ([@simonw](https://x.com/simonw)), Mastodon

The most prolific documentor of LLM tool usage in practice. Creator of **llm** (CLI tool for
interacting with language models) and **datasette**. His blog posts are meticulous experiments:
he tries something, measures it, reports the result including failures.

What makes his work valuable for agent skill building: he treats prompts as engineering
artifacts. His posts on system prompts, tool definitions, and structured output are directly
applicable to skill writing.

**Start here:** His posts tagged "prompt engineering" and "Claude" — they're practical
experiments, not theory.

### Swyx (Shawn Wang)

**Where:** [latent.space](https://www.latent.space/) (podcast + newsletter), Twitter/X ([@swyx](https://x.com/swyx))

Runs the **Latent Space** podcast — the best source for long-form interviews with people
building AI tools. His AI engineer framework categorizes the landscape: infrastructure, models,
and applications. For agent skills specifically, his episodes with tool builders (Cursor, Devin,
Cline, Windsurf teams) give insider perspective on how these tools expect skills/rules to be
written.

Also coined the concept of **"AI Engineer"** as a distinct role — useful framing for
understanding where agent skill building fits in the development workflow.

**Start here:** Latent Space podcast episodes with coding agent builders.

### Thorsten Ball

**Where:** [registerspill.thorstenball.com](https://registerspill.thorstenball.com/), Twitter/X ([@thorstenball](https://x.com/thorstenball))

Thorsten works at Zed (the editor) on their AI integration and writes candidly about what
works and what doesn't when embedding AI into developer tools. His posts on context window
management and prompt design are grounded in real product experience.

**Start here:** His blog posts on building AI features in Zed.

### Ethan Mollick

**Where:** [oneusefulthing.org](https://www.oneusefulthing.org/), Twitter/X ([@emollick](https://x.com/emollick))

Wharton professor studying how AI changes work. Not a coding-agent specialist, but his research
on **how humans and AI collaborate effectively** applies directly. His work on delegation
patterns, verification habits, and the "jagged frontier" of AI capability helps you understand
*when* to use an agent and when to code it yourself.

**Start here:** *Co-Intelligence* (book) and his Substack posts on AI at work.

### Harper Reed

**Where:** [harper.blog](https://harper.blog/), Twitter/X ([@harper](https://x.com/harper))

Former CTO of Obama's 2012 campaign and Threadless. Published practical guides on using AI
agents for software development. His approach to prompt crafting and project planning
with agents is pragmatic — focused on what ships rather than what's theoretically possible.

**Start here:** His posts on AI-assisted development workflows.

## Open-source skill repositories and references

### Cursor Directory

**URL:** [cursor.directory](https://cursor.directory/)

Community-curated collection of Cursor rules for different frameworks and languages. This is the
closest thing to a "skill marketplace" that exists today. Browse it for:
- Rules for your specific framework (Spring Boot, React, Django, etc.)
- Patterns for how other teams structure their rules
- Ideas for rules you haven't thought of

### Awesome CursorRules

**URL:** [github.com/PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules)

Curated GitHub repo of Cursor rule files. More opinionated than cursor.directory — the
maintainers filter for quality. Good for studying how experienced users structure their rules.

### Anthropic's prompt engineering guide

**URL:** [docs.anthropic.com/en/docs/build-with-claude/prompt-engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering)

Anthropic's official guide on how to write effective prompts for Claude. Since many coding
agents run on Claude, this is effectively the "how to write skills" manual from the model
provider. Pay special attention to the sections on:
- System prompts (directly applicable to rules/skills)
- Tool use (how the model decides which tool to call)
- Chain of thought (when to ask for reasoning vs direct output)

### OpenAI's prompt engineering guide

**URL:** [platform.openai.com/docs/guides/prompt-engineering](https://platform.openai.com/docs/guides/prompt-engineering)

Similar to Anthropic's guide but for GPT models. Useful if your agent runs on OpenAI. The
tactics on structured output and few-shot examples translate directly to skill writing.

### ExpeL and Agent Workflow Memory (academic)

Two papers worth reading if you want to understand how agent skills could eventually self-improve:

- **ExpeL** (*arXiv:2308.10144*) — Extract reusable insights from agent trajectories. The idea:
  after each session, automatically identify patterns that worked and codify them as rules.
- **Agent Workflow Memory** (*arXiv:2409.07429*) — Induce commonly-reused routines from past
  action sequences. Similar concept: mine the agent's own history for skill candidates.

These are research directions, not production tools yet. But they describe where the field is
heading — agents that build their own skills from experience.

## Where to keep learning

### Newsletters

| Newsletter | Author | Focus |
|-----------|--------|-------|
| **The Batch** | Andrew Ng | AI industry overview, weekly |
| **Latent Space** | Swyx | Deep dives on AI engineering |
| **One Useful Thing** | Ethan Mollick | AI at work, research-backed |
| **Simon Willison's TIL** | Simon Willison | Practical LLM experiments |
| **Ahead of AI** | Sebastian Raschka | ML research summaries |

### Communities

- **r/LocalLLaMA** (Reddit) — surprisingly good discussion on practical LLM usage
- **Cursor Forum** (forum.cursor.com) — rule sharing and troubleshooting
- **Devin Community** (Discord/docs) — skill building discussion
- **AI Engineer Discord** (via Latent Space) — practitioners sharing production setups

### Conferences and talks

- **AI Engineer Summit** — practitioner-focused, not research-focused
- **DeepLearning.AI short courses** — free, hands-on, updated frequently

## A learning path

If you're starting from zero and want to be productive with agent skills in two weeks:

**Week 1: Foundations**
1. Read Andrew Ng's Agentic Design Patterns overview (1 hour)
2. Read Anthropic's prompt engineering guide, system prompts section (30 min)
3. Set up 5-10 project rules in your tool of choice (30 min)
4. Run 3-5 sessions with the rules active, noting where the agent still fails

**Week 2: Skills**
5. Read the [previous post in this series](/post/agent-skills/creating-your-first/) for skill
   templates
6. Write your first investigate skill based on a real failure from Week 1
7. Write a review/critic skill
8. Browse [cursor.directory](https://cursor.directory/) for rules specific to your stack
9. Read 2-3 of Simon Willison's experiment posts for calibration

After two weeks you'll have working rules and skills, a reading pipeline for staying current,
and — most importantly — your own measured experience of what works for your specific codebase.

That's worth more than any expert's recommendation, including this one.

**Previous in this series:** [Creating Your First Agent Skills](/post/agent-skills/creating-your-first/)

**Related:** [Agentic Development: What Actually Works in Legacy Java](/post/agentic/intro/) —
the 10-part series going deeper on specific patterns.
