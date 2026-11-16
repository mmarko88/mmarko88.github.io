---
title: "Fastest MS SQL Inserts — Part 6: Parallel Threads"
date: 2026-10-19
draft: true
usePageBundles: true
description: "100,000 SQL Server inserts in 321 ms by splitting the data across 4 threads with the Bulk API. Thread count sweep, concurrent-reader impact, TABLOCK trade-off."
featureImage: 'fast-insert-part6.svg' # Series-style 1200x630 hero: Parallel Bulk API at 4 threads hits 404 ms, 1.4x faster.
featureImageAlt: 'Bar chart of Parallel Bulk API insert duration as thread count sweeps from 1 to 16 — 4 threads at 404 ms is 1.4 times faster than single-threaded at 581 ms; 8 and 16 threads show diminishing returns at 426 and 439 ms.'
shareImage: 'share-part6.png' # Branded 1200x630 PNG for social crawlers.
tags: [ "java", "ms sql server", "concurrency" ]
categories: [ "java", "sql" ]
series: [ "Fastest Way to Insert Data in MS SQL" ]
seriesWeight: 6
sourceCode: 'https://github.com/mmarko88/blog-examples/tree/main/fastest-insert/part6-parallel-inserts'
---

Every strategy we've tested so far — Hibernate, JDBC, Bulk API — pushes data through a single
connection. SQL Server handles concurrent writes just fine; the bottleneck is the serial nature of
one TCP stream. Split 100k rows across 4 threads with 4 connections and the Bulk API drops from
412 ms to **321 ms**, the fastest Java-client result in the whole series.

But parallelism isn't a free lunch — threads past 4 give diminishing returns, concurrent readers
slow the writers 4x, and the TABLOCK hint changes the trade-off. Here's where the inflection
points actually are.

## The Approach

The idea is straightforward:

1. Partition the data into N chunks (one per thread)
2. Each thread opens its own connection from the HikariCP pool
3. Each thread inserts its chunk independently
4. Wait for all threads to complete

```java
@Service
public class ParallelInsertExecutor {
    private final BulkCopyRepository bulkCopyRepository;

    public void parallelBulkApiInsert(List<Person> people,
                                       TableDescriptor<Person> table,
                                       int batchSize, int threadCount) {
        List<List<Person>> chunks = partition(people, threadCount);
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        List<CompletableFuture<Void>> futures = new ArrayList<>();
        for (List<Person> chunk : chunks) {
            futures.add(CompletableFuture.runAsync(
                    () -> bulkCopyRepository.performBulkInsert(chunk, table, batchSize),
                    executor));
        }
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        executor.shutdown();
    }
}
```

**Important:** HikariCP's pool size must be at least `threadCount`, otherwise threads block waiting
for connections. The default pool size (10) is fine for up to 10 threads.

## Thread Count Sweep: Bulk API

| Threads | Avg ms | Speedup vs 1 thread |
|---------|--------|---------------------|
| 1 | 581 | 1.0x |
| 2 | 539 | 1.1x |
| 4 | 404 | 1.4x |
| 8 | 426 | 1.4x |
| 16 | 439 | 1.3x |

![Thread Count Scaling](thread_scaling.svg)

**4 threads is the sweet spot** for Bulk API. Going to 8 threads is already marginally slower, and
16 threads adds nothing — the SQL Server bulk copy engine saturates the I/O subsystem and
additional threads just add contention. (Tuning the batch size to 5,000 squeezes out another
~20%: 4 threads drops to 321 ms.)

## Thread Count Sweep: JdbcTemplate

| Threads | Avg ms | Speedup vs 1 thread |
|---------|--------|---------------------|
| 1 | 2,047 | 1.0x |
| 2 | 1,127 | 1.8x |
| 4 | 1,148 | 1.8x |
| 8 | 1,426 | 1.4x |
| 16 | 612 | 3.3x |

**JdbcTemplate benefits more from parallelism** — because each thread's PreparedStatement
batch is independent and the driver sends SQL statements over TCP. More threads = more concurrent
TCP streams = more bandwidth utilization. The 16-thread result (612 ms) ends up nearly matching
the parallel Bulk API — a 3.3x speedup over its single-thread baseline.

## The Ultimate Combination: Multi-Value + Parallel

What happens when we combine multi-value inserts (400 values per INSERT, from
[Part 3](/post/java/mssqlserver/fast_insert_part3/)) with parallel threads?

| Strategy | Avg ms |
|----------|--------|
| Multi-value 400, 1 thread | 662 |
| Multi-value 400, 4 threads | 490 |
| Multi-value 400, 8 threads | 418 |
| Parallel Bulk API, 4 threads | 321 |

Multi-value 400 + 8 threads (418 ms) gets close to parallel Bulk API (321 ms) — and the
multi-value approach works with any JDBC driver, not just MS SQL Server's Bulk API.

**Important caveat:** Multi-value INSERT is **incompatible** with `useBulkCopyForBatchInsert=true`
(see [Part 8](/post/java/mssqlserver/fast_insert_part8/) for details). You must choose one or the
other — both are excellent, but they cannot be combined.

## Scaling to 1 Million Rows

| Strategy | 100k rows | 1M rows | Scales linearly? |
|----------|-----------|---------|-----------------|
| Bulk API (single) | 412 | 4,286 | ~10.4x (yes) |
| Parallel Bulk API 4t | 321 | 3,077 | ~9.6x (yes) |
| TVP | 626 | 6,705 | ~10.7x (yes) |
| JdbcTemplate | 1,979 | 6,775 | ~3.4x (sublinear!) |

All strategies scale roughly linearly with data size. JdbcTemplate actually gets *better* at scale
because the fixed overhead (connection setup, batch compilation) is amortized over more rows.

## Practical Considerations

**Connection pool sizing:** Set `spring.datasource.hikari.maximum-pool-size` to at least your
thread count. Setting it too high wastes SQL Server connections.

**ID generation:** If using application-generated IDs, ensure no collisions across threads. In our
test, each thread gets a distinct partition so IDs don't overlap.

**Error handling:** If one thread fails, the others may have already committed. Use a
`CountDownLatch` or check futures for exceptions before declaring success.

**Lock contention:** SQL Server uses row-level locking for INSERTs by default. You won't get table
locks unless you're inserting into the same page from many threads simultaneously with very small
rows.

## Concurrent Reads During Insert

In production, tables aren't idle during bulk loads — other sessions are reading. How much does
concurrent reading impact insert performance?

| Scenario | Bulk API (avg ms) |
|----------|------------------|
| No concurrent reads | 606 |
| 4 reader threads (SELECT COUNT/AVG) | **2,511** (4.1x slower) |

**Concurrent readers slow inserts by 4x**, even when readers use `WITH (NOLOCK)`. The slowdown
comes from I/O contention and SQL Server's latch management on the data pages being written.

**TABLOCK hint** can help here — it acquires a table-level lock that prevents readers entirely,
allowing uninterrupted bulk insertion:

| Hint | JDBC batch (avg ms) |
|------|-------------------|
| No hint (row locks) | 1,992 |
| `WITH (TABLOCK)` | **1,863** (6% faster) |

Trade-off: TABLOCK blocks all other writers AND readers during the insert. Use it only for dedicated
bulk load windows.

## The one thing to remember

> **4 threads × Bulk API = 321 ms.** You can't go meaningfully faster from a Java client. 8 threads
> is already noise; 16 is slower. Multi-value INSERT at 400 rows per statement × 8
> threads gets 418 ms without needing the Bulk API at all.

If your load window overlaps with concurrent SELECTs, parallel inserts take ~4x longer. Use
`WITH (TABLOCK)` for dedicated windows — otherwise, pick 4 threads and move on.

## Test yourself

{{< quiz question="How many threads is the sweet spot for Parallel Bulk API inserts?" options="1-2 threads|4-8 threads|16 threads|One thread per row" correct="1" explanation="4 threads hit 321 ms (404 ms at the default batch size); 8 threads was noise and 16 threads was slower. 4-8 is the practical sweet spot." >}}

Next: [Part 7 — Index Impact](/post/java/mssqlserver/fast_insert_part7/) measures the hidden cost
of non-clustered indexes during bulk loads.
