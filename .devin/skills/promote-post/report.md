# Post Promotion Best Practices — Research Report

Research compiled for building a `promote-post` skill. Audience focus: **personal/dev content** (technical blog posts, OSS project updates, personal brand). Platforms: **LinkedIn, Twitter/X, Blog/SEO, Reddit/Forums (incl. Hacker News)**.

---

## 1. Core Principles (apply everywhere)

1. **Publishing is the halfway point, not the finish line.** Spend at least as much effort on distribution as on writing. Plan promotion per post, not ad hoc.
2. **Zero-click content wins.** Algorithms on X and LinkedIn downrank posts with external links. Give full value natively on the platform; earn the click rather than asking for it.
3. **Adapt per platform — never cross-post identical text.** Each platform has a "meta" (format, tone, length). The same post should be rewritten per channel.
4. **Proof-led beats opinion-led.** For dev audiences, lead with a verifiable claim: a number, before/after data, a diagram, a real bug post-mortem, reproducible code. Generic advice ("5 tips for clean code") reads as noise.
5. **First-hour engagement is the lever.** Algorithms test a post on a small audience and expand reach based on early signals (dwell time, comments, bookmarks, saves). Be present and reply fast for the first 60–90 minutes.
6. **Be a community member, not a marketer.** Especially on Reddit/HN: participate genuinely before and between self-promotions. The ~90/10 guideline (≤10% of your activity is self-promo) describes what a healthy account looks like to a moderator.
7. **Repeat promotion over weeks/months.** One announcement at launch is not a strategy. Schedule re-shares at +1 week, +1 month, +3 months, each with a different angle.
8. **Own your audience.** An email list/newsletter is the only channel you fully control; use social to feed it.

---

## 2. Launch Checklist (per post)

- [ ] **T-0 (publish):** Post goes live on own blog/site first (canonical source).
- [ ] **T+0h:** X thread summarizing the post; link in final tweet only.
- [ ] **T+0h:** LinkedIn post (native summary + image/GIF); link in post body — comment-links are now penalized (see §4).
- [ ] **T+0h:** Share in relevant Slack/Discord communities where you're already a member.
- [ ] **T+0–24h:** Submit to relevant subreddits (per subreddit rules — see §5) and/or Hacker News if genuinely interesting.
- [ ] **T+1–2 days:** Cross-post to dev.to / Hashnode / Medium with canonical URL pointing at original (see §6).
- [ ] **T+0–7d:** Answer relevant questions on Reddit/Quora/Stack Overflow where the post genuinely helps; mention it naturally.
- [ ] **Ongoing:** Schedule follow-up posts (+1 month, +3 months) with a different angle or excerpt.
- [ ] **Ongoing:** Pitch a variation as a guest post on a relevant blog for a backlink.
- [ ] If the post performs exceptionally: pin it on X profile; share to newsletter.

---

## 3. Twitter / X Playbook

**Algorithm facts:** likes ≈ 30× reply weight, retweets ≈ 20×; multiple hashtags deprioritize; visual media gives ~2× boost; external links in the main tweet get strangled; bookmarks are a strong quality signal.

**Tactics:**

- **Thread-first strategy:** Rewrite the post as a 5–8 tweet thread. Tweet 1 = hook, one sentence, no link. Each subsequent tweet = one section's key takeaway. Final tweet: "I go deeper + full code in the article: [link]".
- **Visual teaser ("trailer"):** Tweet the most striking chart/stat from the post as an image with a caption like "This one chart changed how I view X. Explanation below 👇".
- **Never start a tweet with `@`** — it gets hidden as a reply. Escape with `.` or emoji if needed.
- **Auto-plug rule:** If a tweet exceeds a likes threshold (e.g., 100), reply to it with the link (tools: Hypefury, Typefully can automate).
- **Hashtags:** 0–2 max, at the end. A wall of hashtags looks like spam and hurts ranking.
- **Timing:** Tue–Thu mornings (9–11am local audience time) is the most consistent window across studies; Wednesday strongest; Saturday weakest. Half of a tweet's views arrive within ~80 min — be online to reply.
- **Engagement bait that works on devs:** content that's "90% right, 10% wrong" — devs love correcting; interaction drives reach.
- Pin the thread to profile if it's a flagship post. Re-tweet it monthly with a fresh angle.

**Thread template:**

```
1/ I spent 3 days debugging [problem]. The fix was one line — but the lesson changed how I [do X]. 🧵

2/ [Context: what I was building, why it mattered]
3/ [What I tried first — the obvious wrong thing]
4/ [The actual root cause — with the key detail]
5/ [The fix + code snippet or screenshot]
6/ [What I'd do differently / generalizable takeaway]
7/ Full write-up with all the code: [link]
```

---

## 4. LinkedIn Playbook

**Algorithm facts (2025–26 rebuild):** feed uses LLM-based semantic matching — it reads post text AND your profile/headline to match readers by skills/interests; reach is NOT capped by follower count but depends on being "clearly about something"; measures dwell time, saves, and multi-turn comments, not just clicks; suppresses posts with external URLs.

**Tactics:**

- **Links go in the body (2026 reversal):** the old link-in-comments workaround is now reach-penalized (up to ~80% reported) and converts ~3.4× worse than the same link in the post body. Either include the UTM-tagged link in the body, or omit it and keep the post fully native. Evidence and caveats: `RESEARCH-linkedin-best-practices.md` at repo root.
- **One idea per post.** "If a post has two ideas, it's two posts."
- **Proof in the first two lines:** a number, a screenshot, a real outcome — before any framing.
- **Best formats for dev audiences:**
  - Technical breakdown (condensed blog post — earns saves/shares)
  - Data post ("we looked at X, found Y" — before/after numbers)
  - Contrarian take *backed by evidence* (unsupported contrarianism = engagement bait)
  - Native video / screen recording 60–120s (outperforms text for reach and trust)
  - Build-in-public update (specific metrics/decisions)
- **Format:** short lines, whitespace, list-form for multiple points. Emoji as list markers OK; don't decorate every line. 3–4 hashtags max at end (hashtags don't amplify much on LinkedIn anyway).
- **First-hour plan:**
  - 0–15 min: post a pinned first comment — ask a direct question OR add the link OR frame a counterpoint. Tag 1–2 relevant people.
  - 15–45 min: reply to every comment with substance.
  - 45–60 min: add a self-reply with extra depth.
  - +6h: return once to answer stragglers.
- **Timing:** Wed strongest (also Thu/Fri); newer data shows afternoon/evening engagement (3–4pm+) has overtaken early morning. Tue–Thu 10am–noon remains a safe B2B window. Use audience timezone.
- **Cadence:** 2–4 posts/week is enough — posts recirculate for days when comments continue.
- **Groups:** share to relevant LinkedIn groups with a helpful summary; don't spam daily.

**LinkedIn post template:**

```
[Proof line: "We cut deploy time from 14 min to 90 seconds."]

[2–3 lines of context: what broke / what we changed]

What actually worked:
→ [specific decision 1]
→ [specific decision 2]
→ [the non-obvious thing]

[One honest caveat or trade-off]

Full write-up + code: [UTM-tagged link]
```

---

## 5. Reddit & Hacker News Playbook

### Reddit

- **Read the subreddit rules first.** Mechanisms vary: designated weekly self-promo threads, participation ratios, modmail pre-approval, flair/format requirements, minimum account age/karma. Check pinned rules AND recently removed posts.
- **90/10 guideline:** ≤10% of your contributions are your own stuff. Moderators check history — a profile that's all self-promo gets flagged regardless of content quality.
- **The litmus test:** would the post be worth reading if you deleted the link? If not, don't post it.
- **Disclose affiliation plainly** ("I wrote this"). Never astroturf or ask friends to upvote.
- **Best subreddits for dev content:** topic-specific subs (r/programming, r/webdev, language/tool subs) — pick ONE community where you have a real reason to be.
- **Better than link posts:** a text post containing the substance (rewritten for Reddit's conversational tone) with a single link at the end. Republishing in-part as a native post often outperforms bare links.
- **Use weekly threads** ("Self-promotion Saturday", feedback threads) where available — posting inside them is safe; outside is removed.
- When in doubt, **modmail first.** A yes from a moderator is the safest position.
- Answer related questions in the subreddit and reference the post where it genuinely answers the question.

### Hacker News

- **Regular submission vs Show HN:** blog posts/reading material are OFF-TOPIC for Show HN — submit as a normal story. Show HN is only for things people can run/try; it must be something you built personally, non-trivial, and you'll be around to discuss.
- **Title rules:** use the original title; no clickbait, no "how great it is", no gratuitous numbers ("10 Ways to X" → "Ways to X"); remove site name (it's displayed automatically).
- **Never:** solicit upvotes/comments, delete-and-repost, post generated text, automate posting, or use HN primarily for promotion.
- Deep technical content, post-mortems, benchmarks, and "how X works internally" pieces do best.
- Be present in the comments after submitting — engage curiously, don't be defensive.

### Other forums

- **Discord/Slack:** best if you're already a community member; a share doubles as a conversation starter.
- **Quora / Stack Overflow:** find questions your post answers; give a real answer inline + link for depth.

---

## 6. Blog / SEO & Syndication Playbook

- **Publish on your own domain first** and let it get indexed (even a day's head start matters) before syndicating anywhere.
- **Canonical URL on every copy, every time, no exceptions:**
  - dev.to: `canonical_url` in front matter or via API (Forem); ≤4 lowercase tags.
  - Hashnode: "original article URL" (`originalArticleURL` via API).
  - Medium: use **Stories → Import a story** (auto-sets canonical + backdates). Never copy-paste manually — no canonical gets set. Note: Medium no longer offers an API for programmatic publishing.
- **Canonical is a hint, not a directive.** Google may still rank the platform copy above yours — ordering (original indexed first) is the strongest mitigation.
- **Write posts worth sharing:** one concrete problem per post, reproducible code (with versions, repo/gist link), honest trade-offs, clear authorship (author note + GitHub profile). Best-traveling formats: internals deep-dives, real bug post-mortems, benchmarks with methodology, "I built X, here's what I learned".
- **Backlink flywheel:** shares/engagement → guest-post pitches on relevant blogs → backlinks → SEO authority for the original.

---

## 7. Timing Reference (starting defaults — verify against your own analytics)

| Platform | Best days | Best windows (audience local time) | Worst |
|---|---|---|---|
| X | Tue–Thu (Wed best) | 9–11am; also noon–6pm per Sprout | Saturday, evenings 6–11pm |
| LinkedIn | Wed, then Thu/Fri | 10am–noon or 3–4pm+ (afternoons now strong) | Early morning 6–11am weaker now |
| Reddit | Varies by subreddit | Weekday mornings US time; check sub's active hours | — |
| HN | Mon–Thu | US morning PT | Weekends (lower traffic) |

Rule: post when your audience is online so the first hour lands while they're awake — then stay online to reply.

---

## 8. Measurement

Track per post, per channel:

- **X:** impressions/views, bookmarks (top "coolness" signal), likes, retweets, link clicks.
- **LinkedIn:** dwell/reads, comments (multi-turn > single), saves, shares, profile visits.
- **Blog:** referral traffic by source (UTM-tagged short links on every share), backlinks earned.
- **Leading indicators:** early engagement velocity in first 60–90 min predicts total reach.
- Review monthly; keep a per-post promotion log (what was shared where, when, results).

---

## 9. Skill-Ready Summary (how a `promote-post` skill should operate)

Given a post URL/title, the skill should:

1. **Classify the post** — problem-solving tutorial / post-mortem / project launch / data findings → pick formats and channels accordingly.
2. **Generate per-platform drafts** (never identical text):
   - X: hook tweet + 5–7 tweet thread, link only in final tweet, optional image suggestion.
   - LinkedIn: proof-first post, whitespace formatting, UTM-tagged link in the body, pinned first comment (question only, no bare URL).
   - Reddit: conversational text-post rewrite + list of candidate subreddits with rule-check reminder.
   - HN: compliant title (strip site name, numbers) + submission timing suggestion.
3. **Emit a timed checklist** — T+0 items, T+1d syndication with canonical-URL verification, +1mo/+3mo re-share reminders.
4. **Verify before posting:** link works, canonical set, subreddit rules checked, no upvote-solicitation language, UTM tags added.
5. **Never automate actual posting to Reddit/HN** — generate drafts for the human to submit; HN explicitly forbids automated posting.

---

## Sources

- draft.dev — [The Big Blog Promotion Checklist](https://draft.dev/learn/promotion)
- GitLab Handbook — [Developer Advocacy on Social Media](https://handbook.gitlab.com/handbook/marketing/product-and-technical-marketing/developer-advocacy/social-media/)
- satelo.io — [How to Promote a Tech Blog](https://satelo.io/blog/how-to-promote-tech-blog/)
- developerrelations.com — [Ensure your content gets seen](https://developerrelations.com/talks/ensure-content-gets-seen/)
- Manning — [Writing for Developers: Blogs that get read](https://livebook.manning.com/learn/concepts/social-media-site--domain-concept/writing-for-developers)
- Sefism — [LinkedIn for Software Engineers: What Actually Works](https://www.sefism.com/blog/linkedin-for-engineers-what-actually-works/)
- Circuit — [LinkedIn Content Strategy for Developer Marketing](https://circuit.ooo/developer-marketing/linkedin-content-strategy-for-developer-marketing)
- twitip — [How to Promote Your Blog on X](https://twitip.com/using-twitter-to-promote-your-blog/)
- laurentcazanove.com — [Social media strategy for dev tools](https://laurentcazanove.com/blog/devtools-social-media-strategy)
- Liran Tal — [DevRel Engagement and GTM Tactics on X](https://lirantal.com/blog/devrel-engagement-gtm-tactics-on-x-twitter)
- partyfly — [X Algorithm Handbook](https://partyfly.github.io/x-algorithm-handbook/en/)
- nichory — [Reddit Self-Promotion Rules: What 363 Subreddits Allow](https://nichory.com/guides/reddit-self-promotion-rules)
- HN — [Show HN Guidelines](https://news.ycombinator.com/showhn.html) / [HN Guidelines](https://news.ycombinator.com/newsguidelines.html)
- querywin — [Promote on Reddit without it reading as an ad](https://www.querywin.com/blog/promote-your-product-on-reddit)
- justblogged / nvarma / marcobellingeri — cross-posting canonical-URL guides ([1](https://justblogged.com/blog/cross-posting-canonical-urls), [2](https://www.nvarma.com/blog/2026-02-10-cross-publishing-blog-posts-devto-hashnode-medium), [3](https://marcobellingeri.dev/en/writing/canonical-first/))
- Buffer — [Best Time to Post on Social Media](https://buffer.com/resources/best-time-to-post-social-media/); Twick — [Best time to post on X](https://twick.ing/blog/best-time-to-post-on-x); Voketa — [LinkedIn First-Hour Engagement](https://www.voketa.com/blog/linkedin-first-hour-engagement)
