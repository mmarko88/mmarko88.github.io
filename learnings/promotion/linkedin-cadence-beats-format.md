---
title: LinkedIn carousel format is fine — cadence and saveability are the bottlenecks
date: 2026-11-16
category: promotion
problem_type: wrong_assumption
applies_when:
  - Evaluating LinkedIn post performance or choosing a promotion format
  - Designing a linkedin-carousel deck
retire_when: At least 6 posts have been promoted with stats pulled via post-pulse — then replace this with per-format data
tags: [linkedin, carousel, promotion, engagement, saves, cadence]
---

# LinkedIn: cadence beats format; design carousels for saves

Assumed "views but few reactions" meant the PDF-carousel approach was wrong. Pulled the
actual analytics (713 followers): the Part 5 document post got 217 impressions (~30% of
followers — decent distribution), 5 reactions (~2.3%, normal band for document posts),
0 comments, 0 reposts, **0 saves**, 0 followers gained. It was also the only post in
365 days, and it drove ~zero site traffic (GA spike predated go-live; UTM link
unverified).

What the data actually says:

- **Cadence is the bottleneck.** One post a year means every post starts cold — no
  engagement history for the algorithm, no trained audience. Post per published post.
- **Saves are the carousel engagement metric**, and 0 is the real format signal: the
  deck wasn't worth keeping. Target 8–12 slides (6 was thin) and make the last slide a
  standalone cheat-sheet worth saving.
- **The pinned-comment routine was skipped** (0 comments) — `linkedin-post` prescribes
  a discussion question ~15 min after go-live plus first-hour replies. Run it every
  time.
- Keep the link in the post body (skill's ~80% comment-link penalty stands) and verify
  the UTM tag survives so `/post-pulse` can see LinkedIn→blog traffic.
