---
title: "Fastest way to insert the data in MS SQL - Part 6 Parallel Inserts"
date: 2026-10-18
draft: true
usePageBundles: true
featureImage: 'java_sending_data_to_mssql_server.jpg'
featureImageAlt: 'java sending data to mssql server'
shareImage: 'java_sending_data_to_mssql_server.jpg'
tags: [ "java", "ms sql server", "concurrency" ]
categories: [ "java", "sql" ]
series: [ "Fastest Way to Insert Data in MS SQL" ]
sourceCode: 'https://github.com/mmarko88/blog-examples/tree/main/fastest-insert/part6-parallel-inserts'
---

## Introduction

Every strategy we've tested so far — Hibernate, JDBC, Bulk API — uses a single thread and a single
database connection. SQL Server handles concurrent writes well; the real bottleneck is network
round-trips and the serial nature of a single connection. What happens when we split the data across
multiple threads?

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
| 1 | 1,155 | 1.0x |
| 2 | 998 | 1.2x |
| 4 | 537 | 2.2x |
| 8 | 434 | 2.7x |
| 16 | 442 | 2.6x |

**4 threads is the sweet spot** for Bulk API. Going to 8 threads helps slightly, but 16 threads is
actually marginally slower — the SQL Server bulk copy engine saturates the I/O subsystem and
additional threads just add contention.

## Thread Count Sweep: JdbcTemplate

| Threads | Avg ms | Speedup vs 1 thread |
|---------|--------|---------------------|
| 1 | 4,048 | 1.0x |
| 2 | 3,292 | 1.2x |
| 4 | 2,407 | 1.7x |
| 8 | 1,937 | 2.1x |
| 16 | 608 | 6.7x |

**JdbcTemplate benefits much more from parallelism** — because each thread's PreparedStatement
batch is independent and the driver sends SQL statements over TCP. More threads = more concurrent
TCP streams = more bandwidth utilization. The 16-thread result (608ms) is remarkable.

## The Ultimate Combination: Multi-Value + Parallel

What happens when we combine multi-value inserts (400 values per INSERT, from
[Part 3](/post/java/mssqlserver/fast_insert_part3/)) with parallel threads?

| Strategy | Avg ms |
|----------|--------|
| Multi-value 400, 1 thread | 1,058 |
| Multi-value 400, 4 threads | 426 |
| Multi-value 400, 8 threads | 368 |
| Parallel Bulk API, 4 threads | 330 |

Multi-value 400 + 8 threads (368ms) is competitive with parallel Bulk API (330ms) — and the
multi-value approach works with any JDBC driver, not just MS SQL Server's Bulk API.

**Important caveat:** Multi-value INSERT is **incompatible** with `useBulkCopyForBatchInsert=true`
(see [Part 8](/post/java/mssqlserver/fast_insert_part8/) for details). You must choose one or the
other — both are excellent, but they cannot be combined.

## Scaling to 1 Million Rows

| Strategy | 100k rows | 1M rows | Scales linearly? |
|----------|-----------|---------|-----------------|
| Bulk API (single) | 492 | 6,225 | ~12.7x (yes) |
| Parallel Bulk API 4t | 330 | 4,427 | ~13.4x (yes) |
| TVP | 818 | 7,314 | ~8.9x (yes) |
| JdbcTemplate | 2,985 | 11,914 | ~4x (sublinear!) |

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

## Summary

| Strategy | 100k persons (avg ms) |
|----------|----------------------|
| Parallel Bulk API 8t | 434 |
| Multi-value 400 + 8t | 368 |
| Parallel Bulk API 4t | 330 |
| Parallel JdbcTemplate 16t | 608 |

Parallelism gives 2-7x speedup depending on the strategy. The optimal thread count depends on your
I/O subsystem — 4 threads is a safe default, 8 for I/O-bound workloads.

Next: [Part 7 — Index Impact](/post/java/mssqlserver/fast_insert_part7/) measures how non-clustered
indexes affect insert performance.
