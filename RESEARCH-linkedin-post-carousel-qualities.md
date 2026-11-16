# What makes LinkedIn posts and carousels perform in late 2026?

**Answer:** Format choice matters less than the signals each format can produce. Images beat text (+36%) and PDF documents beat everything on reach (+22–39%) — but documents only pay off at **11+ pages**; a ≤10-page carousel underperforms the author's own average (−4%). Across studies the same qualities recur: a first-person/specific hook under ~140 chars, short whitespace-separated lines, an image or document attached, save-worthy reference content (saves are the single heaviest algorithmic signal — ~5× a like, ~2× a comment), a genuine closing question (comments outrank reactions), minimal or zero hashtags (1–2 neutral, 3+ negative), and weekly+ cadence. AI-sounding posts cost ~21% engagement.

**Confidence:** medium-high. Three independent 100k+-post datasets (AuthoredUp 3M, ligosocial 134k, Flypost 116k) agree on direction for the big claims; the strongest designs measure within-author effects. Conflicts on hook mechanics are noted below rather than averaged away.

## Why — the evidence

### Format ranking (within-author, personal profiles)

| Format | vs. text-only | Notes |
|---|---|---|
| Image | **+36%** | wins in every follower band, incl. <1,000 [1] |
| Document (PDF) | **+22%** | but ONLY at 11+ pages: 1–10 pages ≈ −4%, 11–15 ≈ +16%, 16+ ≈ +26% [1] |
| Video | +17% | pays past ~5 min; reach fell YoY [1][2] |
| Link preview | −15% | the penalty is the preview card, not the URL [1] |
| Poll | −50% | dead format [1] |

- Documents reach 1.39× and engage 1.30× the platform median — highest reach of any format — yet only ~4.9% of profiles post them: a supply-demand gap [3].
- Documents are the most-reposted format: 8.4 reposts per 100 reactions vs. 1.5 for text [1].
- Company-page data agrees on direction: native documents 6.4–7.0% engagement rate, top of all formats [2].
- **Multi-image "carousel" posts no longer exist for organic content** — PDF/PPTX/DOCX document posts are the only swipeable path [4].

### Post qualities that move numbers

Within-author effect sizes (Flypost, 116k posts) [5]:

| Quality | Effect |
|---|---|
| Personal story (something you actually did) | +33% |
| Image attached | +35% |
| "I/my/we/our" in first line | +19% |
| Concrete number/name/example | +15% |
| "You/your" in first line | −10% |
| Question as first line | −17% reactions |
| 1–2 hashtags | ~0% |
| 3+ hashtags | −7 to −8% |

Other measured qualities:

- **Hook length:** ≤40-char hooks have the highest *mean* (viral tail) but medians are flat — hook length is a variance play, not a guarantee [6][7].
- **Question openers buy comments, cost reactions:** +37% comments (Postbridge) vs −17% reactions (Flypost). Since comments outrank reactions in ranking, a *genuine* question still nets positive — a rhetorical one doesn't [5][6][8].
- **Paragraphs:** 4–6 short blocks ≈ 3× the median of 1–3 blocks (20 vs 7) [6].
- **Emoji:** median 23.5 vs 12 with/without — near-2× [6].
- **AI-sounding posts:** −21% engagement (134k posts) [9] — the slop-catalog work applies here too.
- **Tagging real people:** +35% to +126% — powerful but etiquette-sensitive [9].
- **Cadence:** posting in 75%+ of weeks grows followers 2.7%/mo vs 1.0%; ≥4 posts/week → 42 reactions/week vs 12 for <1.5 [5][9].

### The signal hierarchy (what the algorithm weights)

1. **Saves** — heaviest single signal: 1 save ≈ 5× a like, ≈ 2× a comment; a saved post → +130% follow chance; creators whose posts get saved grow ~3× faster [10]. Documents are 2.6× over-represented among saved posts [10].
2. **Comments** — especially threaded/substantive ones; 15 real comments out-travel 150 reactions [8].
3. **Dwell time** — first-class ranking signal since LinkedIn's 2019 paper; LiRank's "Long Dwell" classifier feeds it directly into distribution; every carousel swipe is a fresh dwell event [8][11].
4. **Reposts/reactions** — baseline; reposts-with-commentary > bare reposts > reactions [8].
5. **Cold-start gate:** LinkedIn's Profile Relevance requires ≥1 viral action from an *unconnected* member before recommending a post out-of-network — a 0-engagement post never leaves your network [12]. This explains our 71% in-network result.
6. **"Golden hour"** — the 60–90 min early-velocity window is widely cited [8], though Richard van der Blom disputes a literal golden hour; early velocity matters mechanically, exact timing less so [13].

### Carousel/document qualities

- **Page count is the threshold:** under 11 pages the format underperforms; 11–15 is the entry band, 16+ is the best band [1]. Practitioner guidance converges on 5–15 with 6–10 called "ideal" — the big dataset says aim ≥11 [1][4][14].
- **Slide 1 is a billboard:** one specific claim/data point, high contrast, <2 s to parse, "swipe →" cue; generic titles die there [14][15].
- **Information gradient (staircase, not pyramid):** each slide must deliver more than the last; front-loading the best content kills completion [16]. Write the arc as a numbered list before designing.
- **Structure:** hook → tension → one-idea-per-slide payoff → cheat-sheet/CTA final slide [15].
- **4:5 portrait 1080×1350** for mobile feed real estate; large type — if it needs a pinch-zoom it loses [14][15].
- **Save-bait:** what gets saved teaches, clarifies, templates — checklists, settings tables, frameworks [10]. Deep-dive visuals and mini-workshop decks lead saved-content categories.
- **Hashtags don't drive carousel reach** — dwell and completion do [16].
- **Text-based PDF** (not scanned images) for screen readers [4].

## What would change this

- LinkedIn reweights the signal hierarchy (e.g., demotes saves or dwell) — watch AuthoredUp/ligosocial quarterly updates and our own `post-pulse` data.
- Our own per-genre stats contradicting the aggregates after ~6 promoted posts — sample beats population averages for our niche.
- A format shift: if multi-image carousels return, or documents get further deprioritized, genre B's rationale weakens.

## Considered and rejected

- **"Post images instead of PDF"** — moot: multi-image organic carousels are removed; image posts are a *different* (still strong, +36%) genre, not a carousel replacement [1][4].
- **"5–8 hashtags"** (earlier promote-post guidance, Durgesh-style) — data says 1–2 neutral, 3+ negative. Individual outliers exist; the aggregate says minimal. Corrected in the skill.
- **"Keep the hook short" as a rule** — it shifts variance, not median; specific > short. Keep hooks specific; don't optimize for length alone [6][7].
- **"You" in the hook** — conflicts across studies (more common in top posts, yet −10% within-author on reactions). Synthesis: "my story, your problem" — first-person frame, reader stakes — captures what both datasets reward [5][7].

## Open

- Buffer's 21.77% median carousel engagement rate is a methodology outlier (likely different denominator) — noted, not used [17].
- Whether question-openers' +comments/−reactions trade nets positive depends on your comment rate — testable on our own posts via post-pulse.
- Company-page vs personal-profile numbers diverge (Socialinsider is company pages); our data is personal.

## Implications for our pipeline (applied)

- `linkedin-carousel` updated: 8–12 slides → keep pushing toward **11–15**; cheat-sheet slide stays (save-bait).
- `promote-post` genre split validated: genre A (single image + list) exploits the +36% image effect and works at <1,000 followers; genre B (PDF carousel) only when the content can fill 11+ slides.
- `promote-post` hashtag guidance corrected: 0–2, not 5–8.
- First-person hook + concrete number is the highest-confidence opener pattern.

## Sources

[1] State of LinkedIn 2026 / Post Formats Compared — ligosocial (134,522 posts, within-author): https://ligosocial.com/research/linkedin-post-formats
[2] 2026 LinkedIn Benchmarks — Socialinsider (2.45M company-page posts): https://www.socialinsider.io/social-media-benchmarks/linkedin
[3] LinkedIn Articles vs Posts — AuthoredUp (3M posts, format table): https://authoredup.com/blog/linkedin-articles-vs-posts
[4] How to Post LinkedIn Carousels (2026) — SocialBee: https://socialbee.com/blog/how-to-post-linkedin-carousels/
[5] LinkedIn Study 116,000+ posts — Flypost press kit: https://www.flypost.io/press/linkedin-study-2026
[6] LinkedIn Report 2026, 1,990 posts — Postbridge: https://postbridge.co/en/linkedin-report-2026
[7] LinkedIn Engagement Study, 12,988 posts — Growtempo: https://www.growtempo.com/blog/linkedin-engagement-study
[8] How the LinkedIn Algorithm Works in 2026 — post.buzz: https://post.buzz/blog/linkedin-algorithm-2026
[9] State of LinkedIn 2026 — ligosocial (AI-voice −21%, cadence, tagging): https://ligosocial.com/research/state-of-linkedin-2026
[10] Saved, Not Seen — AuthoredUp (114,924 saved posts): https://authoredup.com/newsletter/uplogic-issue-2-saved-not-seen
[11] Why AI carousel makers are winning — decktopus/Medium (LiRank Long-Dwell): https://medium.com/decktopus/why-ai-carousel-makers-are-winning-the-content-game-in-2026-6be1075b2c2d
[12] Profile Relevance: Boosting Feed Relevance with LLMs — LinkedIn Engineering: https://www.linkedin.com/blog/engineering/feed/profile-relevance-boosting-feed-relevance-with-llms-at-linkedin
[13] The LinkedIn Algorithm Changed Again — Forbes/van der Blom: https://www.forbes.com/sites/jodiecook/2026/01/12/the-linkedin-algorithm-changed-again-heres-whats-new-for-2026/
[14] LinkedIn carousel best practices — Oktopost: https://www.oktopost.com/blog/linkedin-carousel-pdf-best-practices/
[15] LinkedIn Document Carousel Blueprint — SocialBoost: https://socialboostdigital.com/blog/linkedin-pdf-carousel-optimization-guide
[16] LinkedIn Carousel Mechanics — DSBI (information gradient): https://dsbi.ai/blog/linkedin-carousel-dwell-time-structure-specs-2026
[17] Buffer carousel engagement figures (methodology outlier): https://buffer.com/resources/linkedin-carousels/
