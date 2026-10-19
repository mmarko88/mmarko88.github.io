---
title: "All Posts"
date: 2026-10-19
draft: false
description: "Every post on professionaldev.dev, grouped by topic — the Fastest MS SQL Inserts series, Java performance, fundamentals, and career."
---

Every post on this site, grouped by topic. For the chronological feed, see
[the home page](/) or the [RSS feed](/index.xml).

## Fastest MS SQL Inserts (series)

A measured deep-dive into how to insert data into SQL Server from Java — **8 parts, 4,222
benchmark runs, 50 takeaways**. Start with Part 1 if you're new; Part 8 contains the
executive summary and final ranking of 33 strategies.

| # | Post | Key finding |
|---|------|-------------|
| 1 | [Hibernate Batching](/post/java/mssqlserver/persist_vs_saveall/) | Batched `persist()` is **6.6× faster** than default `saveAll()` |
| 2 | [JDBC Strategies](/post/java/mssqlserver/fast_insert_part2/) | Bulk API wins at **492 ms** vs 2,423 ms for JDBC PreparedStatement |
| 3 | [Multi-Value INSERT](/post/java/mssqlserver/fast_insert_part3/) | 200 values per statement is the **sweet spot** (4-5× faster than single-row) |
| 4 | [Bulk Copy Flag](/post/java/mssqlserver/fast_insert_part4/) | One connection-string flag — `useBulkCopyForBatchInsert=true` — gives **2-2.5× speedup** |
| 5 | [Hibernate Tuning](/post/java/mssqlserver/fast_insert_part5/) | `Persistable` + `StatelessSession` close **80%** of the gap to raw JDBC |
| 6 | [Parallel Threads](/post/java/mssqlserver/fast_insert_part6/) | **4 threads × Bulk API = 330 ms** — the Java-client ceiling |
| 7 | [Index Impact](/post/java/mssqlserver/fast_insert_part7/) | 5 non-clustered indexes slow inserts **11×** regardless of strategy |
| 8 | [TVP, JDBC, Full Ranking](/post/java/mssqlserver/fast_insert_part8/) | **INSERT…SELECT = 319 ms** — the absolute fastest overall path |

## Java performance

| Post | Key finding |
|------|-------------|
| [What Is Memory Churn and How to Avoid It in Java](/post/java/memory_churn/) | Short-lived allocations break CPU cache locality; two patterns to fix |
| [Data-Oriented Programming in Java: Move Data to Functions](/post/java/data_to_functions/) | Immutable records + pure functions beat deep object hierarchies |

## Java fundamentals

| Post | Key finding |
|------|-------------|
| [Safe Zip Extraction in Java: Zip Slip, Bombs, Limits](/post/java/extract_zip_stream_best_practices/) | 6 thresholds to enforce before touching disk or memory |
| [How to Use Case Insensitive String in Hash Map](/post/java/case_insensitive_string_hashmap/) | Custom wrapper class — no new strings, no copies |
| [How to Write Classes With Multiple Case Insensitive Strings](/post/java/case_insenstive_hash_code/) | Memory-efficient alternatives to per-field wrappers |
| [Setting up Junit 5 Parallel Test Execution With Maven](/post/java/java_multithread_junit5/) | Surefire config + the catch of shared resources |

## Learning & career

| Post | Key finding |
|------|-------------|
| [How to Learn Functional Programming in Java](/post/java/start_fp_in_java/) | The FP patterns that stuck in production code — and the ones that didn't |
| [10 Mistakes Java Developers Make Early On](/post/java/teen_mistakes/) | Not writing tests, no refactoring, no code reviews, no asking for help |
| [Why Should You, as a Software Developer, Learn Soft Skills?](/post/soft_skills/) | Five concrete reasons soft skills matter more than you think |

## Test your knowledge

Think you've got the series down? Try the [Fastest MS SQL Inserts quiz](/quiz/) — 10
questions, with answers linked back to the right post.
