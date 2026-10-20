---
title: "Fastest MS SQL Inserts — Part 8: TVP, JDBC, Final Ranking"
date: 2026-10-19
toc: true
draft: false
usePageBundles: true
description: "100,000 SQL Server inserts in 319 ms with INSERT…SELECT, 330 ms with Parallel Bulk API. Ranking of 110+ configurations and 50 takeaways from the series."
featureImage: 'fast-insert-final-ranking.svg'
featureImageAlt: 'Benchmark ranking for 100,000 SQL Server inserts: Parallel Bulk API using four threads is fastest at 330 milliseconds; the next four strategies range from 368 to 492 milliseconds.'
shareImage: 'share-part8.png' # Branded 1200x630 social-share card showing the Part 8 final-ranking chart.
tags: [ "java", "ms sql server", "jdbc" ]
categories: [ "java", "sql" ]
series: [ "Fastest Way to Insert Data in MS SQL" ]
sourceCode: 'https://github.com/mmarko88/blog-examples/tree/main/fastest-insert/part8-tvp-jdbc'
---

## Executive Summary

This series benchmarks **110+ insert strategies and tuning knobs** on SQL Server 2025 Express
(Windows, Java 17, Spring Boot 3.3) over **4,222 individual benchmark runs**. Here's the TL;DR:

### The 10 highest-impact decisions (in order)

| # | Choice | Impact |
|---|--------|--------|
| 1 | **Batch your inserts** (any strategy ≫ auto-commit per row) | **15x** |
| 2 | **Use the Bulk Copy API** (`SQLServerBulkCopy` / `insertBulk...`) | **5-6x** vs plain JDBC |
| 3 | **Parallelize across 4 connections** | **2-3x** on top of #2 |
| 4 | **Enable `useBulkCopyForBatchInsert=true`** in the JDBC URL | **2-2.5x** |
| 5 | **Use multi-value INSERT (200 values/statement)** | **4-5x** for JDBC |
| 6 | **Drop/disable non-essential indexes** before bulk loads | up to **7x** |
| 7 | **Pick the right batch size (500-1000)** — not 10, not 10,000 | **4-5x** vs tiny batches |
| 8 | **Add `WITH (TABLOCK)` hint** for dedicated bulk-load windows | **1.3x** |
| 9 | **Use `Persistable` + `isNew=true`** if you must use Spring Data `saveAll` | **8x** |
| 10 | **Keep AUTO_UPDATE_STATISTICS = ON** (don't try to be clever) | **1.5x** |

### Top 7 counter-intuitive findings

1. **`OPTION (RECOMPILE)` makes batched inserts 52x slower** (2.4 minutes vs 3 seconds).
2. **Delayed Durability `= FORCED` makes bulk inserts 49% SLOWER**, not faster. It helps
   many-small-commits workloads, not single-large-transaction bulk loads.
3. **Natively compiled stored procs are 21x slower** when called from Java per-row via `addBatch`.
   Their design assumes the C#/.NET memory-table API.
4. **In-Memory OLTP tables don't help batched Java inserts.** They shine for concurrency, not
   batch throughput.
5. **ROW/PAGE compression make inserts slower** (+7%/+33%). Compression is a *read* optimization.
6. **BCP utility is slower than Java Bulk API** when data is in-memory. The file I/O overhead
   dominates.
7. **AUTO_UPDATE_STATISTICS = OFF makes inserts 50% SLOWER**, not faster. The optimizer needs
   stats even for simple INSERTs.

### The absolute fastest paths (if your scenario allows)

If your source data is already in SQL Server (ETL within the same database):
- **`INSERT INTO target SELECT ... FROM source` = 319 ms** (the ultimate server-side copy)

If data must come from Java:
- **Parallel Bulk API 4 threads = 330 ms** (the standalone Java winner)

### The ranking

The fastest I could get **100,000 person rows** into SQL Server from a Java application is
**330 ms** (Parallel Bulk API, 4 threads). The slowest is **27,794 ms** (Spring Data `saveAll`
without `Persistable`) — **84x slower**. Everything in between is covered in this series.

**TVP (818 ms) is the best choice when you need portability across different clients and don't
have `SQLServerBulkCopy` available.** Plain JDBC (3,905 ms) is only 3% faster than Hibernate
`persist()` — the ORM is not your bottleneck.

The rest of this post walks through every topic in the summary above, starting with two approaches
that bypass Hibernate entirely: Table-Valued Parameters and plain JDBC. After that come the
advanced topics — isolation, procs, plans, latency, snapshot concurrency, index trade-offs, and
the full ranking across 110+ configurations.

## Table-Valued Parameters (TVPs)

TVPs let you send an entire table of data as a single stored procedure or query parameter. Instead of
sending N individual INSERT statements, you send one request containing all the data.

### Setup: Create the Table Type

First, create a user-defined table type in SQL Server:

```sql
CREATE TYPE dbo.PersonTableType AS TABLE (
    person_id INT,
    user_name NVARCHAR(30),
    first_name NVARCHAR(10),
    last_name NVARCHAR(15),
    years INT
);
```

### Java Implementation

The MS SQL JDBC driver provides `SQLServerDataTable` for building TVP data:

```java
@Repository
public class TvpInsertRepository {
    private final DataSource dataSource;

    public void insertWithTvp(List<Person> people, int batchSize) {
        String sql = "INSERT INTO person (person_id, user_name, first_name, last_name, years) " +
                     "SELECT person_id, user_name, first_name, last_name, years FROM ?";

        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);

            try (CallableStatement stmt = conn.prepareCall(sql)) {
                for (int i = 0; i < people.size(); i += batchSize) {
                    int end = Math.min(i + batchSize, people.size());
                    SQLServerDataTable dataTable = buildDataTable(people.subList(i, end));
                    stmt.setObject(1, dataTable);
                    stmt.execute();
                }
                conn.commit();
            }
        }
    }

    private SQLServerDataTable buildDataTable(List<Person> people) throws SQLException {
        SQLServerDataTable dt = new SQLServerDataTable();
        dt.setTvpName("PersonTableType");
        dt.addColumnMetadata("person_id", Types.INTEGER);
        dt.addColumnMetadata("user_name", Types.NVARCHAR);
        dt.addColumnMetadata("first_name", Types.NVARCHAR);
        dt.addColumnMetadata("last_name", Types.NVARCHAR);
        dt.addColumnMetadata("years", Types.INTEGER);

        for (Person p : people) {
            dt.addRow(p.getPersonId(), p.getUserName(),
                      p.getFirstName(), p.getLastName(), p.getYears());
        }
        return dt;
    }
}
```

### TVP Advantages

- **Single round-trip per batch** — the entire data table is sent as one TDS packet
- **No 2,100-parameter limit** — unlike multi-value INSERT which hits SQL Server's max param count
- **Type-safe** — SQL Server validates the table type schema
- **Works inside transactions** — unlike `BULK INSERT` from a file

### TVP Results

| Batch Size | Avg ms |
|-----------|--------|
| 10 | 20,221 |
| 100 | 2,993 |
| 1,000 | 1,203 |
| 5,000 | 818 |

TVP at batch=5000 (818ms) is the **3rd fastest single-thread strategy** — faster than all
JDBC/Hibernate approaches, slower only than Bulk API. It's a solid middle ground.

## Plain JDBC: The Bare-Metal Baseline

How much overhead does Hibernate/JPA actually add? Let's find out with raw JDBC:

```java
@Repository
public class PlainJdbcInsertRepository {
    private final DataSource dataSource;
    private static final String INSERT_SQL =
        "INSERT INTO person (person_id, user_name, first_name, last_name, years) " +
        "VALUES (?, ?, ?, ?, ?)";

    public void insertBatch(List<Person> people, int batchSize) {
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try (PreparedStatement ps = conn.prepareStatement(INSERT_SQL)) {
                int count = 0;
                for (Person p : people) {
                    ps.setInt(1, p.getPersonId());
                    ps.setString(2, p.getUserName());
                    ps.setString(3, p.getFirstName());
                    ps.setString(4, p.getLastName());
                    ps.setInt(5, p.getYears());
                    ps.addBatch();
                    if (++count % batchSize == 0) ps.executeBatch();
                }
                if (count % batchSize != 0) ps.executeBatch();
                conn.commit();
            }
        }
    }
}
```

### The Surprising Result

| Strategy | 100k persons (avg ms) |
|----------|----------------------|
| Plain JDBC | 3,905 |
| Hibernate persist | 4,048 |
| JdbcTemplate | 2,985 |
| StatelessSession | 2,650 |

**Plain JDBC (3,905ms) is only 3% faster than Hibernate persist (4,048ms).** The ORM overhead for
batch inserts is negligible. Most of the time is spent in JDBC driver wire protocol and SQL Server's
INSERT execution, not in Hibernate's entity management.

JdbcTemplate is actually *faster* than plain JDBC because Spring's `JdbcTemplate.batchUpdate()`
uses optimized batch parameter binding that the JDBC driver can optimize further.

### With useBulkCopyForBatchInsert=true

| Strategy | Normal | bulkCopy=true | Speedup |
|----------|--------|---------------|---------|
| Plain JDBC | 3,905 | 1,516 | 2.6x |
| JdbcTemplate | 3,089 | 1,373 | 2.3x |
| StatelessSession | 2,650 | 1,075 | 2.5x |
| Hibernate persist | 4,048 | 2,144 | 1.9x |

With `bulkCopy=true`, all JDBC-based strategies converge to similar performance. The driver's bulk
copy conversion is the dominant factor, not the Java-side abstraction.

## Multi-Value INSERT and bulkCopy Don't Mix

During testing, we discovered that **multi-value INSERT** (`objectsPerInsert > 1`) is
**incompatible** with `useBulkCopyForBatchInsert=true`. When this driver flag is enabled, it
rewrites `PreparedStatement.addBatch()` calls into Bulk Copy protocol — but it expects single-row
INSERT statements with exactly `(columns)` parameters per batch entry. Multi-value INSERT SQL
(`VALUES (?,?,?),(?,?,?),(?,?,?)...`) confuses the driver because it has `(columns * N)` parameters.

This means you must choose one or the other:
- **Multi-value INSERT (400 values/statement)** — works only with `bulkCopy=false`
- **useBulkCopyForBatchInsert=true** — works only with single-row INSERT statements

Both are excellent optimizations, but they cannot be combined.

![Strategy Ranking](strategy_ranking.svg)

## Isolation, MERGE, Triggers & Async

### Snapshot isolation (READ_COMMITTED_SNAPSHOT)

RCSI changes `READ_COMMITTED` to use row versioning instead of shared locks for reads. It prevents
reader-writer blocking at the cost of version store overhead:

| Strategy | RCSI OFF | RCSI ON | Delta |
|----------|----------|---------|-------|
| Bulk API | 1,211 | **720** | **40% faster** |
| JdbcTemplate | 2,817 | 3,565 | 27% slower |

**Surprise:** RCSI dramatically helps Bulk API (fewer latches/lock contention on data pages) but
hurts JdbcTemplate (row versioning writes to tempdb). Enable RCSI if you're bulk-loading with the
Bulk Copy protocol and have concurrent readers.

### MERGE vs plain INSERT

`MERGE INTO ... USING (VALUES) WHEN MATCHED THEN UPDATE WHEN NOT MATCHED THEN INSERT` is the
canonical SQL upsert. How much does the upsert semantics cost?

| Method | 100k rows (avg ms) |
|--------|-------------------|
| Plain INSERT | 3,177 |
| MERGE upsert | 3,514 (+11%) |

The 11% overhead is the cost of the ON clause evaluation and the branching logic. For pure inserts,
use INSERT. For true upserts (where some rows may already exist), MERGE is cleaner than a
SELECT-then-INSERT/UPDATE pattern.

**Warning:** MERGE has known bugs with concurrent executions on SQL Server. Many SQL Server MVPs
recommend `INSERT ... ON EXISTING UPDATE` or explicit `IF EXISTS` patterns in production code.

### Trigger overhead

A single `AFTER INSERT` trigger that writes one audit row per insertion:

```sql
CREATE TRIGGER tr_person_trigger_insert ON person_trigger
AFTER INSERT AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO person_audit (person_id, action)
    SELECT person_id, 'INSERT' FROM inserted;
END
```

| Scenario | 100k rows (avg ms) |
|----------|-------------------|
| No trigger | 3,261 |
| With AFTER INSERT trigger | **7,023 (2.2x slower)** |

**Triggers are expensive.** Each INSERT batch now does double the work — one for the base table,
one for the audit table. Consider:
- Logging via application code instead of triggers (gives you batching and backpressure control)
- Change Data Capture (CDC) — SQL Server reads the transaction log async
- Temporal tables (built-in system-versioned history)

### Async producer-consumer pipeline

The sync baseline does CPU work (generating data) and I/O work (inserting) sequentially. A
producer-consumer pipeline overlaps them:

```java
BlockingQueue<List<Person>> queue = new ArrayBlockingQueue<>(4);
// Producer: generates batches of 1000, puts to queue
// Consumer: polls queue, inserts batch
```

| Pattern | 100k rows (avg ms) |
|---------|-------------------|
| Sync baseline (CPU then I/O) | 3,816 |
| **Async producer-consumer** | **2,676 (30% faster)** |

A single-producer, single-consumer pipeline is enough to overlap work. More consumers would help
only if the DB can accept more concurrent writers (see [Part 6](/post/java/mssqlserver/fast_insert_part6/)).

![Advanced Patterns](advanced_patterns.svg)

## In-Memory OLTP, BULK INSERT & Stored Procedures

### BULK INSERT (server-side file reader)

The `BULK INSERT` T-SQL command reads a flat file directly from the server's filesystem, bypassing
the normal INSERT codepath entirely:

```sql
BULK INSERT person FROM 'C:/ProgramData/bulk_data.txt'
WITH (FORMAT = 'CSV', FIELDTERMINATOR = '0x09', ROWTERMINATOR = '0x0a',
      BATCHSIZE = 1000, TABLOCK)
```

| Method | 100k rows (avg ms) |
|--------|-------------------|
| Ad-hoc INSERT batch | 2,734 |
| Single-threaded Bulk API | 492 |
| **BULK INSERT (T-SQL)** | **637** |

BULK INSERT nearly matches the fastest single-threaded Java path. It's **the ultimate pattern for
server-local file imports** — ETL/data warehousing scenarios where data lives on the SQL Server
machine. The file must be readable by the SQL Server service account.

### In-Memory OLTP Tables (`MEMORY_OPTIMIZED = ON`)

In-Memory OLTP tables live entirely in RAM with lock-free, latch-free access. SQL Server 2016 SP1+
makes them available in all editions, including Express.

```sql
CREATE TABLE person_memopt (
    person_id INT NOT NULL PRIMARY KEY NONCLUSTERED,
    user_name NVARCHAR(30), first_name NVARCHAR(10),
    last_name NVARCHAR(15), years INT
) WITH (MEMORY_OPTIMIZED = ON, DURABILITY = SCHEMA_AND_DATA);
```

| Scenario | 100k rows (avg ms) |
|----------|-------------------|
| Disk-based ad-hoc INSERT | 2,734 |
| **In-Memory OLTP (interpreted T-SQL batch)** | **2,726** |

**Surprise:** essentially no benefit for batch inserts from Java. In-Memory tables excel at
high-concurrency OLTP (many threads, many small operations) by eliminating latches. Our workload —
one connection, batch of 1,000 rows — isn't lock-constrained; the bottleneck is the network and
batch processing overhead, which both tables share.

### Natively Compiled Stored Procedures

Native compilation turns a stored proc into C code at creation time:

```sql
CREATE PROCEDURE usp_InsertPerson_Native (...)
WITH NATIVE_COMPILATION, SCHEMABINDING
AS BEGIN ATOMIC WITH (TRANSACTION ISOLATION LEVEL = SNAPSHOT, LANGUAGE = N'us_english')
    INSERT INTO dbo.person_memopt (...) VALUES (...);
END
```

| Scenario | 100k rows (avg ms) |
|----------|-------------------|
| In-Memory interpreted batch | 2,726 |
| **Native proc called per-row via `addBatch`** | **58,542 (21x SLOWER)** |

**Native procs are a trap for Java clients.** The native code itself is lightning fast, but you must
call it **per row** (`EXEC usp_... ?, ?, ?, ?, ?`). The JDBC driver doesn't send 100,000 `EXEC`
calls efficiently; each becomes its own RPC. The lesson: **native procs win in C#/.NET memory-table
batch APIs, not in Java JDBC**.

### Stored Procedures (interpreted) vs Ad-hoc

| Pattern | 100k rows (avg ms) |
|---------|-------------------|
| Ad-hoc INSERT (direct) | 2,734 |
| **Stored procedure (`EXEC usp_...`)** | **4,807 (76% slower)** |

A per-row stored procedure call is 76% slower than batched direct INSERT, for the same reason as
native procs: each EXEC becomes a server-side command execution with its own parameter parsing and
query plan lookup. Use procs for complex business logic, not for simple inserts.

### Check Constraints

| Scenario | 100k rows (avg ms) |
|----------|-------------------|
| Check constraints enabled | 2,954 |
| **Check constraints disabled** | **2,909** |

**Simple check constraints are essentially free.** For LEN(x) > 0 and range checks, the overhead
is negligible. Only disable constraints with `ALTER TABLE NOCHECK CONSTRAINT ALL` for complex
multi-table FK checks on large bulk loads — simple column constraints are fine to leave on.

![In-Memory OLTP, BULK INSERT & Procs](inmem_bulk.svg)

## Query Plans, Latency & INSERT…SELECT

### OPTION(RECOMPILE) — catastrophic for batches

Adding `OPTION (RECOMPILE)` to an INSERT forces SQL Server to recompile the query plan for every
execution:

| Scenario | 100k rows (avg ms) |
|----------|-------------------|
| Normal (plan cached across batches) | 2,772 |
| **`OPTION (RECOMPILE)`** | **145,097 (52x SLOWER!)** |

**Never use `OPTION (RECOMPILE)` with batched INSERTs.** Each row-group recompiles the plan,
turning a 3-second operation into a 2.4-minute one. The hint is for one-off queries with wildly
varying parameters, not high-volume batched workloads.

### Network latency simulation

Simulated by inserting `Thread.sleep(ms)` after each `executeBatch()`:

| Added latency | 100k rows (avg ms) |
|---------------|-------------------|
| 0 ms (local) | 2,759 |
| **1 ms per batch** (×100 batches) | **2,948** (+7%) |
| **5 ms per batch** (×100 batches) | **4,370** (+58%) |

Each 1 ms of round-trip latency per batch adds ~1 ms × (number of batches) overhead. On a
production WAN link with 20-50 ms RTT, 100k inserts in 1000-row batches would spend 2-5 seconds in
network overhead alone. **Larger batches amortize the latency** — the single-threaded Bulk Copy
protocol (~1 batch total) is nearly immune.

### INSERT … SELECT (data already in the server)

If your source data is already on the SQL Server (another table, a staging table, etc.), the fastest
possible path is `INSERT INTO target SELECT ... FROM source` — no client round-trips at all:

| Pattern | 100k rows (avg ms) |
|---------|-------------------|
| **`INSERT … SELECT` (plain)** | **319** |
| `INSERT … SELECT … ORDER BY` | 447 (+40% for sort) |
| Parallel Bulk API 4t | 330 |

**INSERT…SELECT is the fastest method we've benchmarked**, matching Parallel Bulk API. It's the
right choice for ETL pipelines, materialized view refreshes, and in-database transformations. The
40% ORDER BY penalty is the cost of the sort — if your clustered key already matches the ORDER BY,
the sort disappears.

### SQLServerBulkCopy option tuning

Fine-tuning `SQLServerBulkCopyOptions`:

| Option | 100k rows (avg ms) |
|--------|-------------------|
| Default (batch 1000) | 765 |
| **`batchSize = 5000`** | **535 (30% faster)** |
| `+ checkConstraints = true` | 619 |
| `+ tableLock = true` | 662 |

- **Bigger batch = fewer round-trips** — 5000 beats 1000 by 30%.
- `checkConstraints = true` adds ~15% but validates FKs/CHECKs that are normally skipped during
  bulk load (the default is `false`, meaning the loaded data is marked as untrusted).
- `tableLock = true` acquires a bulk-update lock on the table — helpful when there are concurrent
  writers, but prevents reader access during the load.

![Query Plans, Latency & INSERT…SELECT](plans_latency.svg)

## SNAPSHOT Isolation Under Write Contention

[Part 8 already covered RCSI](#snapshot-isolation-read_committed_snapshot) which turns `READ COMMITTED`
into snapshot-based. Here we test full **SNAPSHOT isolation** (`ALLOW_SNAPSHOT_ISOLATION ON` +
`SET TRANSACTION ISOLATION LEVEL SNAPSHOT`) under concurrent reads during a bulk insert.

| Scenario | Insert time | Reader throughput |
|----------|------------|-------------------|
| SNAPSHOT single writer (no readers) | 2,997 ms | — |
| **READ_COMMITTED + 4 concurrent readers** | **2,964 ms** | **~8 reads total** (blocked by writer locks) |
| **SNAPSHOT + 2 concurrent readers** | **4,638 ms (+55%)** | **~430 reads per run** |
| **SNAPSHOT + 4 concurrent readers** | **6,259 ms (+109%)** | **~1,100 reads per run** |

**The trade-off is stark:**
- With **READ_COMMITTED**: writes stay fast but readers get almost nothing (~8 reads vs 1,100).
- With **SNAPSHOT**: readers aren't blocked (135x more throughput), but writes are 2x slower due to
  version-store overhead.

Pick based on your workload: if readers must stay responsive during bulk loads, pay the SNAPSHOT
cost. If the load window is dedicated (no readers care), RC is fine.

## Partition SWITCH with Indexes

Earlier we saw [SWITCH PARTITION is a metadata-only operation](#partitioning--switch). But the
*load into staging* still has to maintain any indexes that match the target. How much does
pre-indexing the staging table cost?

| Target indexes | 100k rows total (load + SWITCH) |
|---------------|-------------------------------|
| **0 non-clustered** | **2,952 ms** |
| 1 non-clustered | 4,205 ms (+42%) |
| 3 non-clustered | 6,369 ms (+116%) |

Just like non-partitioned tables, index maintenance is the dominant cost. **If possible: load into
a heap staging table, then build the matching indexes on it right before the SWITCH** — this is
usually faster than maintaining indexes during the load.

![SNAPSHOT & SWITCH with Indexes](snapshot_switch.svg)

## Semi-Structured Indexes: XML vs JSON

Part 7 showed [XML columns cost 2.3x more than JSON for storage](#xml-vs-json-columns). What about
*indexes* on those columns?

### XML Primary Index

```sql
CREATE PRIMARY XML INDEX PXML_person_xml_idx_data ON person_xml_idx(data);
```

The XML primary index is a shredded node table — one row per XML node per document. For 100k
documents with ~5 nodes each, that's **500,000 node-table rows** maintained on every insert.

| XML column | 100k rows (avg ms) |
|-----------|-------------------|
| No XML index | 8,339 |
| **+ PRIMARY XML INDEX** | **38,265 (4.6x SLOWER!)** |

### JSON Computed-Column Index

JSON doesn't have a native index type in SQL Server. The idiomatic pattern is:

```sql
ALTER TABLE person_json_idx
    ADD years_from_json AS JSON_VALUE(data, '$.years');
CREATE INDEX IX_person_json_idx_years ON person_json_idx(years_from_json);
```

| JSON column | 100k rows (avg ms) |
|------------|-------------------|
| No JSON index | 5,774 |
| **+ computed-column INDEX** | **8,493 (+47%)** |

**JSON indexes are 10x cheaper than XML indexes** (+47% vs +359%) because JSON uses a scalar computed
column — just one indexed value per row — while the XML index shreds the entire document.

**Takeaway:** if you need to query JSON/XML by a specific field, use the JSON computed-column
pattern. XML primary indexes are only worth it for complex XQuery/XPath workloads.

## tempdb Spill (Memory Grant Starvation)

What happens when SQL Server's memory grant for a sort is insufficient and it has to spill to
tempdb? We force a tiny grant with `OPTION (MIN_GRANT_PERCENT = 0, MAX_GRANT_PERCENT = 0.001)`:

| INSERT…SELECT + ORDER BY | 100k rows (avg ms) |
|-------------------------|-------------------|
| Normal grant (in-memory sort) | 326 |
| **Tiny grant (tempdb spill)** | **657 (2x slower)** |

**Spilling to tempdb is cheaper than you'd expect.** Only 2x slower — SQL Server handles spills
gracefully with multi-pass merge sorts. The right lesson: don't panic if you see occasional
spills in a slow query report; focus on queries that spill *gigabytes*, not kilobytes.

![XML/JSON Indexes & tempdb Spill](xmljson_spill.svg)

## Final Rankings: All Strategies Combined

Across the ~110 configurations we tested, here are the headline numbers. All ran on SQL Server 2025
Express (local), Java 17 + Spring Boot 3.3, 100k rows unless noted.

### Fastest paths

| Rank | Strategy | 100k avg ms | Covered in | Notes |
|------|----------|-------------|------------|-------|
| 1 | **INSERT … SELECT** (same DB) | **319** | Part 8 | Server-side copy — no round-trips |
| 2 | Parallel Bulk API 4t | 330 | Part 6 | Fastest Java client-driven path |
| 3 | Multi-value 400 + 8 threads | 368 | Parts 3+6 | No bulkCopy flag needed |
| 4 | Multi-value 400 + 4 threads | 426 | Parts 3+6 | |
| 5 | Parallel Bulk API 8t | 434 | Part 6 | Diminishing returns past 4 threads |
| 6 | INSERT…SELECT ORDER BY | 447 | Part 8 | +40% for the sort |
| 7 | Bulk API (single thread) | 492 | Part 2 | Fastest single-thread |
| 8 | SQLServerBulkCopy batch=5000 | 535 | Part 8 | Bigger batch wins |
| 9 | Parallel Bulk API 4t + bulkCopy | 603 | Parts 6+4 | bulkCopy on bulk is redundant |
| 10 | Parallel JdbcTemplate 16t | 608 | Part 6 | |
| 11 | **BULK INSERT (T-SQL from file)** | **637** | Part 8 | Server-side file reader |
| 12 | SQLServerBulkCopy +TABLOCK | 662 | Part 8 | |
| 13 | Parallel JdbcTemplate 4t + bulkCopy | 731 | Parts 6+4 | |
| 14 | TVP (batch=5000) | 818 | Part 8 | Best portable single-thread |

### Mid-tier

| Rank | Strategy | 100k avg ms |
|------|----------|-------------|
| 15 | Multi-value 400 single thread | 1,058 |
| 16 | StatelessSession + bulkCopy | 1,075 |
| 17 | JdbcTemplate + bulkCopy | 1,373 |
| 18 | Plain JDBC + bulkCopy | 1,516 |
| 19 | Clustered + TABLOCK | 2,185 |
| 20 | Hibernate + bulkCopy | 2,144 |
| 21 | JDBC PreparedStatement | 2,423 |
| 22 | StatelessSession | 2,650 |
| 23 | In-Memory OLTP (interpreted batch) | 2,726 |
| 24 | JdbcTemplate | 2,985 |

### Slow & anti-patterns

| Rank | Strategy | 100k avg ms | Why |
|------|----------|-------------|-----|
| 25 | SWITCH + 3 indexes | 6,369 | Index maintenance in staging |
| 26 | Columnstore + batch 1000 | 8,402 | Delta store overhead |
| 27 | AFTER INSERT trigger | 7,023 | Secondary insert per row |
| 28 | XML column (no index) | 8,339 | Native XML tree parsing |
| 29 | XML + PRIMARY XML INDEX | 38,265 | Shredded node table maintenance |
| 30 | Server-side encryption (3 cols) | 15,952 | AES per row |
| 31 | Native proc per-row EXEC | 58,542 | No batching with addBatch |
| 32 | **`OPTION (RECOMPILE)` + batches** | **145,097** | Plan rebuilt per execution |
| 33 | **saveAll (original, Spring Data JPA)** | **27,794** | SELECT per entity (merge) |

**Headline: INSERT…SELECT (319 ms) is the fastest; `OPTION (RECOMPILE)` with batches is 455x
slower than the best.**

## Key Takeaways from the Series

1. **Parallel Bulk API** is the overall winner (330ms for 100k rows). The Bulk Copy API already uses
   an optimized protocol; splitting across threads adds connection-level parallelism.

2. **Multi-value INSERT + parallel threads** (368ms) is a close second and **doesn't require
   `useBulkCopyForBatchInsert`** or the Bulk Copy API — it works with any JDBC driver.

3. **`useBulkCopyForBatchInsert=true`** gives 2-2.5x speedup to single-row batch strategies. One
   connection string parameter is the easiest win. But it's incompatible with multi-value INSERT.

4. **Hibernate's overhead is ~3%** for batch inserts. The ORM is not the bottleneck; the network
   and database engine are.

5. **Parallelism helps 2-7x** depending on the strategy and thread count. 4 threads is the safe
   default; 8-16 helps JdbcTemplate more than Bulk API.

6. **Indexes are the hidden cost** — 5 non-clustered indexes make inserts 6-7x slower regardless
   of strategy. Drop and rebuild indexes for bulk loads.

7. **TVPs are underrated** — 3rd fastest single-thread strategy with a clean API, no parameter
   count limits, and works inside transactions.

8. **Batch size sweet spot is 500-1000** for most strategies. Below 200, overhead dominates; above
   1000, diminishing returns.

9. **Multi-value objectsPerInsert sweet spot is 200** — beyond that, SQL parser overhead increases
   faster than network savings decrease.

10. **Compression hurts inserts** — ROW (+7%) and PAGE (+33%) compression add CPU overhead that
    outweighs I/O savings for writes. Save compression for read-heavy tables.

11. **BCP (843ms) is slower than Java Bulk API (691ms)** for in-memory data — file I/O is the
    bottleneck, not the protocol.

12. **Concurrent readers slow inserts 2.5x** — use TABLOCK for dedicated bulk-load windows to
    prevent reader contention.

13. **Columnstore tables are 3.5x slower** for OLTP-style inserts — the delta store overhead only
    pays off at analytical query time.

14. **Auto-commit per row is 15x slower** than batched transactions — never do it.

15. **Isolation level and GC choice don't matter** for INSERT-only workloads. Default
    READ_COMMITTED + default G1 are fine; tuning them is wasted effort.

16. **Fill factor 100 is best for sequential IDs**. Lower fill factors (70-80) only help with
    random-key inserts that cause page splits.

17. **SWITCH PARTITION is the gold standard** for zero-downtime bulk loads — load a staging
    heap, then atomically metadata-swap it into a partition (milliseconds, regardless of size).

18. **RCSI (snapshot isolation) is a Bulk API accelerator**. Enable it if you use Bulk API and
    have concurrent readers — 40% faster. But it slows JDBC batches 27% due to version store
    overhead; don't enable it blindly.

19. **MERGE costs 11% over plain INSERT** for upsert semantics. Use INSERT for pure appends.

20. **AFTER INSERT triggers are 2.2x slower**. Prefer application logging, CDC, or temporal
    tables for audit trails.

21. **Async producer-consumer is 30% faster** than sync by overlapping CPU and I/O work. Even
    one producer + one consumer is enough.

22. **Random GUID clustered keys cost 19% minimum** on empty tables, far more on populated ones
    (page splits). Use `NEWSEQUENTIALID()` or an ordered GUID (UUIDv7/ULID) if you must use GUIDs.

23. **Change Tracking is expensive (62% overhead)**. Enable only if a downstream consumer actually
    reads the change feed. Full CDC (Enterprise only) is even more expensive.

24. **Temporal tables are cheap for audit (+31%)** — far better than AFTER INSERT triggers
    (+120%). The right answer for most point-in-time history requirements.

25. **Filtered indexes are 60% cheaper than full indexes** on the same column. If your queries
    only need a subset of rows, index only that subset.

26. **INCLUDE is 30% cheaper than composite** — storing columns only at the leaf level is cheaper
    than making them part of the sort key.

27. **Computed columns are essentially free** on insert (persisted +0%, non-persisted +0%). Use
    them for derived values; they're cleaner than app-side computations and support indexing.

28. **Delayed Durability can make bulk inserts SLOWER (+49%)** — it's a per-transaction
    optimization for many small commits, not for single large transactions.

29. **Trace flag 610 doesn't help regular INSERTs** — only `BULK INSERT`, `BCP`, and
    `INSERT ... SELECT` benefit. The JDBC Bulk Copy API already handles this transparently.

30. **XML columns are 2.3x slower than JSON** (NVARCHAR+ISJSON) for the same payload. Use JSON
    unless you specifically need XQuery/XPath.

31. **Sparse columns are 14% SLOWER** when columns are populated. Only use SPARSE when the column
    is >95% NULL in real data — otherwise it's a lose-lose.

32. **AUTO_UPDATE_STATISTICS = OFF makes inserts 50% slower**, not faster — the optimizer needs
    stats even for simple INSERTs. Always leave it ON.

33. **Server-side encryption (ENCRYPTBYPASSPHRASE) is 4x slower** for 3 encrypted columns. Prefer
    Always Encrypted (client-side) or TDE (page-level) for most PII protection use cases.

34. **BULK INSERT from file (637ms) rivals Java Bulk API** when data already lives on the SQL
    Server machine. The server-side bulk reader is as fast as the Java client-side protocol.

35. **In-Memory OLTP tables offer no benefit for batched Java inserts.** They shine for
    high-concurrency OLTP; our one-thread batch workload isn't lock-constrained.

36. **Natively compiled procedures are a trap for Java clients** — 21x slower when called
    per-row via `addBatch`. They're designed for the memory-table API in .NET/C#, not JDBC.

37. **Stored procedures (interpreted) are 76% slower** than direct INSERT batches. Use procs for
    complex logic, not simple row inserts.

38. **Check constraints are free** for simple column validations. Only disable them for complex
    FK validation on huge bulk loads.

39. **`RETURN_GENERATED_KEYS` costs +34%**. Suppress it in your ORM/JDBC code if you don't need
    the generated IDs back on insert.

40. **App-generated IDs beat IDENTITY and SEQUENCE** by 12-31%. Prefer ULID/Snowflake/pre-fetched
    sequence batches to server-side ID generation for the fastest batched inserts.

41. **Trusted FKs cost +21%** — disable before bulk loads, then `WITH CHECK CHECK CONSTRAINT` to
    re-validate (faster than per-row checking).

42. **Abort-on-error batches are 7.5x faster** than per-row insert retry, but you lose up to 999
    good rows per bad row. Pick based on data cleanliness and tolerance for row loss.

43. **`OPTION (RECOMPILE)` is a batch-insert killer — 52x slower.** Never use it with batched
    workloads.

44. **Network latency amortizes with larger batches.** 5 ms RTT per batch costs 500 ms over 100
    batches but 0 ms if you make it a single Bulk Copy call.

45. **`INSERT … SELECT` (server-side) is the fastest path at 319 ms** — matches Parallel Bulk API.
    If your data is already on the server, don't round-trip through the client.

46. **Bigger `SQLServerBulkCopyOptions.batchSize` wins** — 5000 beats 1000 by 30%. Default is a
    conservative starting point, not the optimum.

47. **SNAPSHOT isolation lets concurrent readers do 135x more work** during a bulk load (1,100
    reads vs 8), but writes 2x slower. Pick based on whether readers need to stay responsive.

48. **SWITCH PARTITION's load phase scales linearly with index count** — just like non-partitioned
    tables. Load into a heap, then add matching indexes right before the SWITCH.

49. **XML primary indexes are 4.6x more expensive** than JSON computed-column indexes (+359% vs
    +47%). Use JSON unless you specifically need XQuery/XPath.

50. **tempdb spills are cheap** — only 2x slower than in-memory sort. Don't panic over small spills.

## What to actually do

If you take only one thing from the whole series: **batch your inserts** and **don't fight the
protocol**. A proper batch strategy puts you within 10x of the fastest possible path on day one.
From there:

- **Data already on the server** → `INSERT…SELECT` (319 ms).
- **Pushing from Java** → Parallel Bulk API with 4 threads (330 ms), or multi-value INSERT with
  200 rows per statement if you need portability.
- **Stuck on Hibernate** → implement `Persistable<T>` and set `useBulkCopyForBatchInsert=true` —
  1,075 ms is as fast as you'll get without leaving the ORM.
- **Avoid these** → `OPTION (RECOMPILE)` with batches (145 s), AFTER INSERT triggers (2.2x),
  server-side encryption on every column (4x), per-row stored proc EXEC (76% penalty).

The full benchmark code — 18 test classes, 4,222 runs, 17 charts — is in the
[blog-examples](https://github.com/mmarko88/blog-examples/tree/main/fastest-insert) repository.
Clone it, point it at your own SQL Server, and the numbers will shift — but the rankings will
almost certainly hold.
