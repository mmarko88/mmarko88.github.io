---
name: promote-post
description: Draft LinkedIn + X promotion copy and a timed launch checklist for a post. Use after publish when a post needs cross-channel promotion; linkedin-carousel/post-to-x do the actual posting.
argument-hint: "<post-url-or-file>"
allowed-tools:
  - read
  - grep
  - glob
  - exec
---

Promote the post the user provides (URL or local file). Reference the full research in `report.md` in this skill directory for rationale.

## Step 1 — Ingest and classify

- If given a URL, fetch it; if a file, read it. Extract: title, the single strongest proof point (number/result/surprising finding), 3–5 key takeaways, any visuals.
- Classify the post: problem-solving tutorial / post-mortem / project launch / data findings / opinion. This determines the hook style.
- Classify the reach: broad-accessible (a pain every reader in the niche recognizes) vs. deep-niche reference (benchmark, tuning deep-dive, internals). Broad → LinkedIn genre A (single image + emoji-list); deep-niche → genre B (PDF carousel via /linkedin-carousel). Rationale: `learnings/promotion/linkedin-genre-per-post-type.md`.

## Step 2 — Generate drafts (output for user approval — never auto-post)

### X/Twitter thread
- Tweet 1: one-sentence hook leading with the proof point. No link, no leading `@`.
- Tweets 2–N: one takeaway each, short lines.
- Final tweet: "Full write-up + code here:" + UTM-tagged link.
- Suggest a visual for tweet 1 if one exists in the post.

### LinkedIn post
- First two lines: the concrete result/proof — before any framing.
- Body: short whitespace-separated lines; context → what worked (arrow-list `→` for reference posts; ✅ emoji benefit list for broad posts) → one honest caveat → an opinionated closer (a take, not just a CTA).
- **Discussion question goes IN the body** — last line, e.g. "Are you using X in your projects?" The pinned comment is a backup, not the mechanism (proven: 0 comments when seeding lived only in the pin).
- Put the UTM-tagged link IN the post body — since mid-2026, link-in-comment patterns are reach-penalized (~80% reported) and convert ~3.4× worse than in-body (see RESEARCH-linkedin-best-practices.md). If the post's only goal is raw reach, omit the link entirely rather than parking it in a comment.
- 0–2 hashtags — 1–2 measure neutral, 3+ cost ~7% (RESEARCH-linkedin-post-carousel-qualities.md). A personal brand tag is the defensible exception.
- Genre A (broad): offer a single hero image — one slide from /linkedin-carousel's generator suffices.
- Genre B (reference): offer the full carousel — saves are its metric, include a cheat-sheet slide.
- Draft a pinned first comment anyway — a substantive observation or extra data point, no bare URL.

## Step 3 — Emit the launch checklist

- Post timing: X Tue–Thu 9–11am; LinkedIn Wed or Tue/Thu 10am–noon / 3–4pm (audience timezone — ask if unknown).
- First-hour plan for both: reply to every comment fast; LinkedIn = pin comment 0–15m, reply all 15–45m, self-reply depth 45–60m, check again +6h.
- Follow-ups: X re-share +1 month with different angle; pin thread if it performs.

## Step 4 — Verify before output

- Links work and carry UTM params. No engagement-bait language. Link in LinkedIn body when the goal is clicks; still no link in tweet 1.
- Offer: "Want a carousel too? I can run /linkedin-carousel to generate the images."
