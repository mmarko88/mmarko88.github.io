# Session Summary — October 19, 2026

A single-day deep-dive that took the `fastest-insert` blog series from 4 planned parts to 8 published parts, then audited and polished the entire site (SEO, content, images, cross-links, structured data).

## By the numbers

| Dimension | Count |
|-----------|-------|
| Benchmark test classes written | 18 |
| Benchmark test methods | ~120 |
| Individual benchmark runs | **4,222** |
| SVG charts generated (programmatically) | 17 |
| Branded 1200×630 social-share cards | **17 posts × 1 each** |
| Blog Parts 5-8 drafted, polished, published | 4 |
| Blog takeaways distilled into Part 8 | **50** |
| SEO fixes: titles shortened over 60 chars | 10 |
| SEO fixes: meta descriptions added | 12 |
| Posts given cross-links to related reading | 5 |
| Mermaid diagrams added | 2 |
| Images compressed (sharp + mozjpeg) | 3 (**-1,399 KB** total) |
| Commits pushed | 20+ across two repos |

## What was built

### Benchmark infrastructure (blog-examples repo)

A production-grade JMH-adjacent harness for SQL Server insert strategies:

- **18 test classes** covering: Hibernate persist/saveAll, Bulk API, JdbcTemplate, PreparedStatement, TVP, Plain JDBC, StatelessSession, Persistable saveAll, parallel inserts (1-16 threads), batch-size sweep, multi-value sweep, index impact (0-5 indexes), compression, columnstore, fill factor, partitioning, SWITCH, isolation levels, delayed durability, RCSI, SNAPSHOT, MERGE, triggers, async pipeline, In-Memory OLTP, BULK INSERT, stored procs, check constraints, OPTION(RECOMPILE), latency simulation, INSERT…SELECT, bulk-copy options, GUID vs INT keys, foreign-keys, batch retry patterns, XML/JSON indexes, tempdb spill, computed columns, trace flag 610, sparse columns, AUTO_UPDATE_STATISTICS, server-side encryption, change tracking, temporal tables
- **4,222 runs** aggregated into CSVs for the series + an exec summary
- **17 SVG charts** generated from a pure-Python script (no deps)

### Blog content (mmarko88.github.io repo)

- **Parts 5-8** written from scratch, polished against `ARTICLE_WRITING_STANDARDS.md`, published (`draft:false`)
- **Executive Summary** at top of Part 8 with top-10 highest-impact decisions, top-7 counter-intuitive findings, and the absolute-fastest paths
- **Final ranking** of 33 strategies (fastest / mid-tier / slow-and-anti-patterns) at the end of Part 8
- **50 numbered takeaways** across the series
- Cross-links added to 5 one-off posts (zip ↔ memory_churn, teen_mistakes ↔ soft_skills, start_fp ↔ data_to_functions, etc.)
- **Mermaid diagrams**: zip-extraction flow (6 thresholds), Hibernate entity-lifecycle state machine

### Site-wide SEO + presentation

- 10 titles shortened to ≤60 chars (Parts 2 and 4 went from 116c and 108c respectively down to 54c)
- 12 meta descriptions added (now 100% coverage, all 140-160 chars)
- Site-level `description`, `keywords`, `author` added to `params.toml`
- `enableGitInfo = true` + `showLastmod = true` — git-driven "Last updated" badges, zero per-post maintenance
- Fixed `peformance` → `performance` tag typo in memory_churn
- Fixed wrong `featureImageAlt` in memory_churn (was copy-pasted from a different post)
- JSON-LD `author.url` now explicit

### Image optimization

- 3 oversized shareImages compressed with sharp + mozjpeg:
  - `soft_skills.jpg`: 759 KB → **47 KB** (-94%)
  - `extract_zip.jpg`: 649 KB → **31 KB** (-95%)
  - `fp_data_oriented.jpg`: 143 KB → **74 KB** (-48%)
- All 17 posts given a branded 1200×630 PNG social-share card (consistent title bar + hero + footer, each under 100 KB)
- Parts 2-7 given unique `featureImage` per post (previously all shared the same generic JPG)

### Research & documentation

- `RESEARCH_SITE_AUDIT.md` — external best-practice research (Google starter guide, web.dev, overreacted, daverupert, css-tricks, IndieWeb, Ahrefs, Backlinko) compared against the live site, with prioritized recommendations
- Benchmark CSVs committed (`benchmark-results.csv` = 4,222 rows, `benchmark-summary.csv` = ~270 aggregated)
- 17 SQL query scripts for repeatable results analysis

## Headline findings (burned into the brain)

1. **INSERT…SELECT (same server) = 319 ms** for 100k rows — the fastest overall path.
2. **Parallel Bulk API 4 threads = 330 ms** — the fastest Java-client path.
3. **`OPTION (RECOMPILE)` with batched inserts = 52× slower** (145 s vs 2.8 s). Don't.
4. **Natively compiled stored procs are 21× slower from Java** — they're designed for the .NET memory-table API, not JDBC's `addBatch`.
5. **`AUTO_UPDATE_STATISTICS = OFF` makes inserts 50% slower**, not faster. The optimizer uses stats even for simple INSERTs.
6. **Compression (ROW +7%, PAGE +33%) makes inserts slower** — compression is a read-side optimization.
7. **One connection-string flag — `useBulkCopyForBatchInsert=true` — gives 2–2.5× speedup** to every batched-INSERT strategy. Incompatible with multi-value INSERT.
8. **Spring Data `saveAll()` is 8× faster** when the entity implements `Persistable<T>` with `isNew = true` (eliminates the SELECT-before-INSERT).
9. **Snapshot isolation (RCSI) accelerates Bulk API 40% but slows JDBC 27%** (version-store overhead).
10. **BCP from a file is slower than the Java Bulk API** on in-memory data; file I/O dominates.

## Repo state at session end

- **blog-examples** `1aee435` — up to date, working tree clean
- **mmarko88.github.io** `e3ea444` — up to date, working tree clean

Full timeline reconstructed via `git log --oneline --since="2026-10-19"` on both repos.
