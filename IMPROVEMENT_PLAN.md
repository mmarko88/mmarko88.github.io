# Website Improvement Plan

## 1. Quiz questions per post (using `{{< quiz >}}` shortcode)

### MS SQL Insert Series

| Part | Quiz question | Type | Correct |
|------|--------------|------|---------|
| **1 — Hibernate Batching** | "What makes `saveAll()` 8x slower than `persist()` with batching?" | single | "SELECT before each INSERT (merge semantics)" |
| **1** | "What's the right batch size for 100k rows?" | single | "1,000 — sweet spot between memory and round-trips" |
| **2 — JDBC Strategies** | "Which JDBC strategy is fastest for bulk inserts?" | single | "Bulk Copy API (492 ms)" |
| **3 — Multi-Value** | "How many values per INSERT statement is the sweet spot?" | single | "200" |
| **4 — Bulk Copy Flag** | "What flag gives 2.5x speedup to batched inserts?" | single | "useBulkCopyForBatchInsert=true" |
| **4** | "Is this flag compatible with multi-value INSERT?" | single | "No — they're incompatible" |
| **5 — Hibernate Tuning** | "Which Hibernate features close the gap to raw JDBC?" (multi) | multi | "StatelessSession, Persistable, useBulkCopy" |
| **6 — Parallel Threads** | "How many threads is the sweet spot for Parallel Bulk API?" | single | "4-8 threads" |
| **7 — Index Impact** | "Which settings should you leave at default?" (multi) | multi | "AUTO_UPDATE_STATISTICS, MAXDOP, Fill factor 100" |
| **7** | "Does ROW compression make inserts faster?" | single | "No — it adds 7% overhead" |
| **8 — TVP, Final Ranking** | "What's the absolute fastest insert path?" | single | "INSERT...SELECT (319 ms, server-side)" |
| **8** | "Why is OPTION(RECOMPILE) dangerous with batches?" | single | "52x slower — forces plan recompile per batch" |

### Other posts

| Post | Quiz question | Type |
|------|--------------|------|
| **Safe Zip Extraction** | "What's the correct way to check for Zip Slip?" (multi) | multi: getCanonicalFile on both + Path.startsWith |
| **Memory Churn** | "What causes memory churn in Java?" | single: short-lived allocations breaking cache locality |
| **Case-Insensitive HashMap** | "Why not just call toLowerCase() on every get()?" | single: creates a new String on every lookup |
| **JUnit 5 Parallel Tests** | "When do parallel tests NOT help?" | single: shared resource contention |

### Implementation plan
1. Write the shortcode calls for each post (estimated: 2-3 per post × 18 posts = ~40 quiz questions)
2. Place each at the end of the post, before "Related reading"
3. Group by difficulty: 1 easy, 1 tricky per post minimum

## 2. Open in Codespaces badge

Add to every MS SQL series post:

```markdown
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/mmarko88/blog-examples?quickstart=1)
```

Also add to the repo README at the top.

## 3. TOC on long posts

Add `toc: true` to front matter of:
- Part 7 (3,770 words)
- Part 8 (5,266 words)
- Benchmarking environment (2,218 words)
- JMH post (1,753 words — borderline)
- Safe Zip Extraction (2,116 words)

## 6. Series navigation widget

Create a Hugo partial that renders a "Part 3 of 8 · ← Part 2 | Part 4 →" bar at the bottom of each series post. Use Hugo's `.CurrentSection.Pages` or the `series` taxonomy.

## 7. Dark mode share cards

Generate a second set of share.pngs with dark backgrounds for social platforms that render dark cards. OR accept that most platforms render on white — low priority.

## 11. Analytics dashboard (/stats/)

A public page showing:
- Post view counts (from Waline API or localStorage)
- Most-popular posts (sorted by reactions)
- Quiz completion rates (from localStorage)
- Series completion tracking

Client-side only — no server needed. JavaScript reads Waline API for reaction counts and localStorage for quiz data.

## Saved for next session

- **4.** Section-level progress bar
- **5.** Copy code button
- **8.** Benchmark calculator (JS + CSV)
- **9.** Newsletter-gated deep content
- **10.** Automated social-card generation from front matter
