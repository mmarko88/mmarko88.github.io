---
title: "Fastest MS SQL Inserts — Quiz"
date: 2026-10-19
draft: false
type: page
layout: single
description: "Ten questions on the Fastest MS SQL Inserts series. Measure what you remember — click the answer to reveal the finding and the post it came from."
---

Ten questions covering the biggest findings from the
[Fastest MS SQL Inserts series](/all-posts/#fastest-ms-sql-inserts-series). All answers
come from measured benchmarks on SQL Server 2025 (Java 17, Spring Boot 3.3, 100,000 rows).

Click a question to reveal the answer and the post it came from. No tracking, no scoring —
just honest "did I remember this?"

---

<style>
  .quiz details { margin: 1.4rem 0; padding: 1rem 1.2rem; border-left: 4px solid #1565C0;
    background: var(--card-bg, #f8f9fa); border-radius: 4px; }
  .quiz details[open] { background: #e3f2fd; }
  .quiz summary { cursor: pointer; font-weight: 600; font-size: 1.05rem; padding: 0.3rem 0; }
  .quiz summary::marker { color: #1565C0; }
  .quiz .answer { margin-top: 0.9rem; padding-top: 0.9rem; border-top: 1px dashed #bbb; }
  .quiz .answer strong { color: #1565C0; }
  .quiz .source { font-size: 0.9rem; color: #666; margin-top: 0.6rem; font-style: italic; }
</style>
<div class="quiz">

### 1. Which single-strategy approach inserts 100,000 rows into SQL Server the fastest from Java?

<details>
<summary>Reveal answer</summary>
<div class="answer">

**Parallel Bulk API with 4 threads — 330 ms.**

The Bulk Copy protocol already minimises per-row overhead, and splitting the data across
4 connections saturates SQL Server's I/O without adding meaningful contention. Eight
threads shaves another ~100 ms; sixteen is noise.

<div class="source">Source: <a href="/post/java/mssqlserver/fast_insert_part6/">Part 6 — Parallel Threads</a></div>
</div>
</details>

### 2. There's an even faster path than that one. What is it, and when can you use it?

<details>
<summary>Reveal answer</summary>
<div class="answer">

**`INSERT INTO target SELECT ... FROM source` — 319 ms.**

If your data is already on the SQL Server (another table, a staging table, a view),
server-side `INSERT…SELECT` beats every client-driven approach because there are **no
network round-trips**. Only usable when the source lives in the database — not for data
you're pushing from an application.

<div class="source">Source: <a href="/post/java/mssqlserver/fast_insert_part8/">Part 8 — Final Ranking</a></div>
</div>
</details>

### 3. True or false: adding `OPTION (RECOMPILE)` to batched INSERTs usually improves performance.

<details>
<summary>Reveal answer</summary>
<div class="answer">

**False — it's 52× slower.**

Normal batched inserts take 2,772 ms; with `OPTION (RECOMPILE)` the same workload takes
**145,097 ms** — 2 minutes 25 seconds. Each batch forces a new plan compile, destroying
plan-cache reuse. The hint is for one-off queries with wildly varying parameters, not for
high-volume batched workloads.

<div class="source">Source: <a href="/post/java/mssqlserver/fast_insert_part8/">Part 8 — Query Plans & Latency</a></div>
</div>
</details>

### 4. You turn OFF `AUTO_UPDATE_STATISTICS` on a database because the stats maintenance keeps interrupting your bulk load. What happens to insert throughput?

<details>
<summary>Reveal answer</summary>
<div class="answer">

**It gets 50% SLOWER, not faster.**

Default (ON) averaged 2,966 ms; OFF averaged **4,474 ms**. The optimizer uses statistics
to choose INSERT plans — access paths, batch sizes, memory grants — even for simple
single-table inserts with no WHERE clause. Starving it of fresh stats forces worse plans.

<div class="source">Source: <a href="/post/java/mssqlserver/fast_insert_part7/">Part 7 — Table Design</a></div>
</div>
</details>

### 5. Spring Data's default `JpaRepository.saveAll()` was taking 27.8 seconds for 100k entities. What one change (no library swap) makes it 8× faster?

<details>
<summary>Reveal answer</summary>
<div class="answer">

**Implement `Persistable<ID>` on the entity, with `isNew() = true`.**

`saveAll` is slow because Spring Data calls `EntityManager.merge()` on every entity, which
triggers a `SELECT` before each `INSERT` to check for an existing row. When `isNew()`
returns `true`, Spring Data uses `persist()` directly — no SELECTs. Original: 27,794 ms.
With `Persistable`: 3,426 ms.

<div class="source">Source: <a href="/post/java/mssqlserver/fast_insert_part5/">Part 5 — Hibernate Tuning</a></div>
</div>
</details>

### 6. There's one connection-string flag that gives a 2–2.5× speedup to Hibernate, JdbcTemplate, StatelessSession and plain JDBC batched inserts. Which one, and what's its catch?

<details>
<summary>Reveal answer</summary>
<div class="answer">

**`useBulkCopyForBatchInsert=true`** in the JDBC URL.

The Microsoft SQL JDBC driver silently rewrites `PreparedStatement.addBatch()` calls into
the Bulk Copy protocol. **Catch: incompatible with multi-value INSERT** (`VALUES
(?,?,?),(?,?,?)...` style) — the driver rewrites single-row INSERTs only. Pick either
multi-value or `bulkCopy=true`, not both.

<div class="source">Source: <a href="/post/java/mssqlserver/fast_insert_part4/">Part 4 — Bulk Copy Flag</a>, <a href="/post/java/mssqlserver/fast_insert_part5/">Part 5</a>, <a href="/post/java/mssqlserver/fast_insert_part8/">Part 8</a></div>
</div>
</details>

### 7. How much does adding 5 non-clustered indexes to a table slow down inserts, and does the choice of client-side strategy still matter?

<details>
<summary>Reveal answer</summary>
<div class="answer">

**Inserts are 6-11× slower, and strategy choice stops mattering.**

| Indexes | Bulk API | JdbcTemplate | Hibernate |
|---------|---------:|-------------:|----------:|
| 0 | 784 ms | 4,572 ms | 3,209 ms |
| 5 | 5,290 ms (+575%) | 10,330 ms (+126%) | 8,564 ms (+167%) |

With many indexes, index maintenance dominates and strategies converge. The right fix is
**drop indexes before the load, rebuild after.**

<div class="source">Source: <a href="/post/java/mssqlserver/fast_insert_part7/">Part 7 — Index Impact</a></div>
</div>
</details>

### 8. You're on an older SQL Server driver without `SQLServerBulkCopy`. What's the fastest portable alternative?

<details>
<summary>Reveal answer</summary>
<div class="answer">

**Table-Valued Parameters (TVPs) — 818 ms at batch size 5,000.**

TVPs let you send an entire table of data as a single parameter — one network round-trip
per batch instead of N. Works with any JDBC driver that supports `java.sql.CallableStatement`.
TVPs beat every pure-JDBC strategy except the proprietary Bulk Copy API.

<div class="source">Source: <a href="/post/java/mssqlserver/fast_insert_part8/">Part 8 — TVP, JDBC, Final Ranking</a></div>
</div>
</details>

### 9. Native-compiled stored procedures feel like the fastest possible path. Why are they a trap when called from Java?

<details>
<summary>Reveal answer</summary>
<div class="answer">

**They're 21× slower when called via `addBatch` — 58,542 ms vs 2,726 ms baseline.**

Native procs are designed for the C#/.NET memory-table API, which can batch rows into one
call. From Java, each `EXEC usp_... ?, ?, ?, ?, ?` becomes its own RPC — the compilation
speed-up is swamped by per-row network round-trips. Use native procs only if you can call
them via a bulk memory-table API, not per-row.

<div class="source">Source: <a href="/post/java/mssqlserver/fast_insert_part8/">Part 8 — In-Memory OLTP & Procs</a></div>
</div>
</details>

### 10. True or false: ROW and PAGE compression on the destination table make inserts faster because less data is written to disk.

<details>
<summary>Reveal answer</summary>
<div class="answer">

**False — ROW adds 7% overhead, PAGE adds 33%.**

Compression is a **read** optimization (smaller pages → faster scans and cache hits). On
write, every row must be compressed on the way in, which costs CPU; for narrow rows like
`person`, the compression ratio is too small to earn back the CPU time. For your tables, if
inserts are the bottleneck, don't enable compression — leave it for read-heavy tables with
wide rows.

<div class="source">Source: <a href="/post/java/mssqlserver/fast_insert_part7/">Part 7 — Table Design & Logging</a></div>
</div>
</details>

</div>

---

**How did you do?**

- 10/10 — you've probably implemented this stuff already. Nice.
- 7-9/10 — solid. Skim the ones you missed to lock them in.
- Under 7/10 — [start with Part 1](/post/java/mssqlserver/persist_vs_saveall/) and work forward. Each part builds on the last.

Found a question that should be on this list? [Open an issue](https://github.com/mmarko88/mmarko88.github.io/issues) or [tweet at me](https://x.com/mare_milenkovic).
