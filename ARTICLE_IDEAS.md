# Article Ideas

Future post ideas for professionaldev.dev, ranked by expected traffic.
Format rule: **problem-solution posts outperform everything** — target phrases people google verbatim.

## Tier 1 — High-traffic, proven demand

1. **"Object references an unsaved transient instance — save the transient instance before flushing"**
   - SO's top Hibernate question: 1.17M views, 928 score, 35 answers (many wrong/incomplete)
   - Direct follow-up to `persist_vs_saveAll`. Cover cascade types, `CascadeType.ALL` vs `PERSIST`, `@ManyToOne` vs `@OneToMany` side, the `@Version` NULL edge case.
   - Title the post with the exact error string — people google it verbatim.

2. **N+1 problem: fetching multiple collections — "cannot simultaneously fetch multiple bags"**
   - Common 2024–2025 pain, weak answers exist (Set vs List vs EntityGraph vs `hibernate.default_batch_fetch_size`)
   - Companion benchmark post fits your style: measure each fix's actual query count + timing.

3. **"@EntityGraph silently breaks eager fetching" — LOAD vs FETCH graph semantics**
   - Asked May 2025, barely covered. One-annotation pitfall with surprising query output.
   - Great "5-minute bug" format: show broken SQL log, explain why, one-line fix.

4. **"Why your JUnit/Spring test suite is slow"**
   - Follow-up to your `java_multithread_junit5` parallel-tests post (your proven niche)
   - Cover: Spring context cache misses from `@MockBean` scatter, `@SpringBootTest` vs slice tests (`@WebMvcTest`, `@DataJpaTest`), Testcontainers static/shared containers, Surefire `forkCount` vs JUnit thread parallelism (a documented real-world 77% CI speedup case exists).

## Tier 2 — Timely / differentiating

5. **Virtual threads vs platform threads: does it matter for a DB-bound app?**
   - Your benchmark style. Key insight others bury: virtual threads move the bottleneck to the connection pool (HikariCP sizing). Perfect bridge from your MS SQL insert series — JDBC + virtual threads is an underexplored combination.

6. **Fastest Way To Insert Data in MS SQL — Part 5**
   - Series already has 4 parts + series taxonomy. Candidates: JDBC batch insert tuning (`sendStringParametersAsUnicode`), jOOQ vs raw JDBC vs Hibernate batching, inserting with `IDENTITY` sequences, or virtual-thread parallel batches.

7. **Spring 6 / Jakarta migration pitfalls**
   - Masses of 2025-era unanswered SO questions: `javax`→`jakarta` namespace, Hibernate 6 as JPA-only provider, multi-tenancy config breaks. "Migration checklist from a real project" is evergreen.

8. **HikariCP connection pool sizing in practice**
   - `pool size / hold time` math, why defaults bite, how pool size interacts with parallel tests/virtual threads. Pairs with #5.

## Tier 3 — Deepens your existing niches

9. **`equals()`/`hashCode()` gotchas with Lombok + JPA entities**
   - Extends your case-insensitive hash map posts. `@EqualsAndHashCode` on entities breaks lazy loading/collections — classic, still googled heavily.

10. **"Extracting ZIP streams" follow-up: streaming large file processing patterns**
    - Your `extract_zip_stream_best_practices` post performs; adjacent topics: `InputStream` without loading to memory, `StreamingResponseBody`, memory-churn-aware parsers (ties into `memory_churn` post).

11. **Functional pipelines in Java — the real code**
    - Finish `data_to_functions` (draft): it already has runnable benchmark code in `examples/` — publish post + link the code, mermaid pipeline diagram is already in it.

## Publishing checklist per post

- [ ] `featureImage` + `shareImage` set — **PNG/JPG only** (social crawlers ignore SVG/WebP on some platforms)
- [ ] `description` in front matter (used by JSON-LD + og:description)
- [ ] Runnable code in [blog-examples](https://github.com/mmarko88/blog-examples) repo + link both ways
- [ ] `series:` tag if part of a multi-post arc
- [ ] `toc: true` in front matter for long posts (theme renders overview box)
- [ ] Mermaid diagram instead of screenshot-for-flowchart
- [ ] Cross-post to dev.to with `canonical_url:` pointing to the professionaldev.dev URL
- [ ] Share on X/LinkedIn; refresh LinkedIn preview via Post Inspector
