---
title: "Fastest MS SQL Inserts — Part 7: Index Impact"
date: 2026-10-19
toc: true
draft: true
usePageBundles: true
description: "5 non-clustered indexes slow a bulk INSERT 7x. Measurements for compression, columnstore, GUID keys, triggers, encryption and more on SQL Server."
featureImage: 'fast-insert-part7.svg' # Series-style 1200x630 hero: 5 non-clustered indexes slow Bulk API 7x.
featureImageAlt: 'Bar chart of Bulk API insert duration against non-clustered index count — 0 indexes finishes in 625 ms, 1 index 1,367 ms, 3 indexes 3,088 ms, 5 indexes 4,386 ms (7 times slower).'
shareImage: 'share-part7.png' # Branded 1200x630 PNG for social crawlers.
tags: [ "java", "ms sql server", "indexes" ]
categories: [ "java", "sql" ]
series: [ "Fastest Way to Insert Data in MS SQL" ]
seriesWeight: 7
sourceCode: 'https://github.com/mmarko88/blog-examples/tree/main/fastest-insert/part7-index-impact'
---

Every production table has indexes. Every INSERT has to maintain them. Add 5 non-clustered indexes
to a table and the Bulk API — the fastest single-thread strategy — slows down **7x**. The other
strategies converge: with enough indexes, the choice of insert strategy stops mattering because
index maintenance dominates.

But that's only the start. The surrounding **table design decisions** matter as much: row width,
compression, columnstore, fill factor, GUID vs INT keys, change tracking, temporal history,
JSON/XML indexes, statistics auto-update, encryption, and so on all impose their own INSERT
tax — and some of them are **counter-intuitive** (compression makes inserts slower; delayed
durability backfires; sparse columns are worse than nothing when filled).

This post measures them all. If you only read the first table, [index count](#results) is the
headline — but the rest of the post is where the surprises live.

## The Test

We create 0, 1, 3, or 5 non-clustered indexes on the `person` table, then run the same 100,000-row
insert with three strategies: Bulk API, JdbcTemplate, and Hibernate persist.

```java
@Service
public class IndexBenchmarkHelper {
    private final JdbcTemplate jdbcTemplate;

    // Five indexes representing realistic patterns
    private static final List<IndexDef> ALL_INDEXES = Arrays.asList(
        new IndexDef("IX_person_username",        "person", "user_name"),
        new IndexDef("IX_person_lastname",        "person", "last_name"),
        new IndexDef("IX_person_firstname",       "person", "first_name"),
        new IndexDef("IX_person_years",           "person", "years"),
        new IndexDef("IX_person_name_composite",  "person", "last_name, first_name")
    );

    public void setIndexCount(int count) {
        dropAllIndexes();
        for (int i = 0; i < count; i++) {
            createIndex(ALL_INDEXES.get(i));
        }
    }
}
```

The indexes represent a mix of:
- **Selective** columns (username — unique values)
- **Low-selectivity** columns (years — few distinct values)
- **Composite** indexes (last_name + first_name)

## Results

### Bulk API

| Indexes | Avg ms | Slowdown vs 0 |
|---------|--------|---------------|
| 0 | 625 | — |
| 1 | 1,367 | +119% |
| 3 | 3,088 | +394% |
| 5 | 4,386 | +602% |

### JdbcTemplate

| Indexes | Avg ms | Slowdown vs 0 |
|---------|--------|---------------|
| 0 | 2,178 | — |
| 1 | 2,976 | +37% |
| 3 | 4,467 | +105% |
| 5 | 5,933 | +172% |

### Hibernate Persist

| Indexes | Avg ms | Slowdown vs 0 |
|---------|--------|---------------|
| 0 | 2,638 | — |
| 1 | 3,295 | +25% |
| 3 | 4,897 | +86% |
| 5 | 6,392 | +142% |

![Index Impact](index_impact.svg)

## Analysis

### Bulk API is the most sensitive

With 0 indexes, Bulk API is by far the fastest (625 ms). But with 5 indexes, it's 4,386 ms — slower
than JdbcTemplate with 0 indexes. The reason: Bulk API uses minimal-logging INSERT operations that
bypass some of the normal logging overhead. But when non-clustered indexes exist, the engine must
update each index B-tree for every row, and this overhead dominates.

### JdbcTemplate is the most resilient

JdbcTemplate's index penalty is relatively modest: only 2.7x slower with 5 indexes vs 0, compared
to Bulk API's 7x. Since JdbcTemplate sends standard INSERT statements, the SQL Server optimizer
can plan the index maintenance more efficiently.

### The crossover point

Bulk API stays fastest at every index count — but its lead over JdbcTemplate shrinks from 3.5x
(0 indexes) to 1.35x (5 indexes). The strategy choice matters less when index maintenance
dominates the insert cost.

## Practical Implications

1. **Drop indexes before bulk loads** if possible. Recreating them after is often faster than
   maintaining them during the insert.

2. **Choose your strategy based on your table's index count:**
   - 0-1 indexes: Bulk API is king
   - 3+ indexes: JdbcTemplate or Hibernate — the overhead is comparable
   - Many indexes: Consider `ALTER INDEX ... DISABLE` before load, then rebuild

3. **Composite indexes cost the same** as single-column indexes for insert overhead. A composite
   index on `(last_name, first_name)` costs the same as two separate single-column indexes.

4. **Filtered indexes** (with a WHERE clause) are cheaper — they only need updating when the
   inserted row matches the filter.

## Index count: the summary

| Indexes | Fastest strategy | Avg ms | Slowdown vs 0 |
|---------|------------------|--------|---------------|
| 0 | Bulk API | 625 | — |
| 1 | Bulk API | 1,367 | 2.2x |
| 3 | Bulk API | 3,088 | 4.9x |
| 5 | Bulk API | 4,386 | 7.0x |

A table with 5 non-clustered indexes is 2.4-7x slower to load than one with just the clustered PK,
depending on strategy — and even at 5 indexes, Bulk API still wins. The actionable advice stays the
same: **disable non-essential indexes before bulk loads, rebuild them after**.

## Beyond Indexes: Table Design & Logging Choices

The index count is only one dimension of INSERT cost. Below are 10 more table-design decisions
that each add their own tax, in order of magnitude:

### Row size impact

Wider rows = proportionally slower inserts, regardless of strategy:

| Row Type | Columns | ~Row Size | 100k rows (avg ms) |
|----------|---------|-----------|-------------------|
| Narrow (person) | 5 | ~60 bytes | 2,030 |
| Wide (20 cols) | 17 | ~1.5 KB | 3,321 (1.6x slower) |
| LOB (NVARCHAR(MAX)) | 7 | ~3 KB | 6,280 (3.1x slower per row, 50k rows) |

LOB columns (NVARCHAR(MAX)) force row-overflow storage and out-of-row allocation, adding
significant I/O overhead beyond the raw data size increase.

![Row Size & Compression](row_compression.svg)

### Data compression

SQL Server supports ROW and PAGE compression on tables:

| Compression | 100k rows (avg ms) | vs None |
|-------------|-------------------|---------|
| None | 2,033 | — |
| ROW | 2,298 | +13% slower |
| PAGE | 2,546 | +25% slower |

**Compression makes inserts slower**, not faster. The CPU overhead of compressing each row or page
outweighs any I/O savings. For narrow rows like our `person` table, compression adds cost without
meaningful space savings. Compression is a read optimization (smaller pages = faster scans), not a
write optimization.

### Columnstore index

Columnstore indexes store data in compressed column segments rather than row pages. They excel at
analytical queries but have different insert characteristics:

| Table Type | Batch Size | 100k rows (avg ms) |
|------------|-----------|-------------------|
| B-tree (clustered PK) | 1,000 | 2,030 |
| Columnstore | 1,000 | 4,293 (2.1x slower) |
| Columnstore | 5,000 | 4,181 (2.1x slower) |

Columnstore inserts are slower because data goes into a **delta store** (a hidden B-tree rowgroup)
until it reaches ~1 million rows, then gets compressed into a columnstore segment. Larger batch
sizes used to help by filling the delta store faster — on this run the benefit was marginal.

### Heap + TABLOCK (minimal logging)

A heap table (no clustered index) with the TABLOCK hint enables minimal logging in SIMPLE/BULK_LOGGED
recovery mode:

| Table | Hint | 100k rows (avg ms) |
|-------|------|-------------------|
| Clustered PK (person) | None | 2,030 |
| Clustered PK (person) | TABLOCK | 1,862 (8% faster) |
| Heap (no PK) | None | 2,244 |
| Heap (no PK) | TABLOCK | 2,069 (8% faster) |

The heap is modestly slower than the clustered table (~10%) — without a clustered index, SQL Server
uses IAM-driven allocation which adds some page contention. TABLOCK shaves ~8% in both cases. A
clustered table with TABLOCK is still fastest overall.

### BCP (bcp.exe) — the external baseline

The `bcp` command-line utility is SQL Server's native bulk loader:

```bash
bcp testdb.dbo.person in data.txt -c -t"\t" -S localhost,1433 -U weblogic -P weblogic -b 1000
```

| Method | 100k rows (avg ms) |
|--------|-------------------|
| BCP utility | **1,270** |
| Java Bulk API | 560 |
| Java parallel Bulk API 4t | 321 |

**BCP (1,270 ms) is more than 2x slower than the Java Bulk API (560 ms).** This is because BCP
reads from a flat file (disk I/O) while our Java tests generate data in memory. BCP also does not
parallelize across connections. The Java Bulk API over in-memory data is the actual performance
ceiling.

### Fill factor tuning

The clustered index fill factor controls how full each page is filled during index creation/rebuild.
Lower fill factor = more empty space per page = fewer page splits during random-key inserts, at the
cost of more pages (larger table size, more I/O on reads).

| Fill Factor | Bulk API (avg ms) | JdbcTemplate (avg ms) |
|-------------|-------------------|----------------------|
| 50 | 698 | 2,116 |
| 70 | 567 | 2,071 |
| 90 | 572 | 2,073 |
| **100 (default)** | **556** | **2,078** |

**Fill factor 100 is fastest for sequential inserts** — which makes sense: our test inserts
monotonically increasing IDs, so there are no page splits regardless of fill factor. Lower fill
factors just waste space. Lower fill factors (70-80) help when you have **random-key inserts** or
heavy update patterns that cause page splits.

### Partitioning & SWITCH

SQL Server partitioning splits a table into independent chunks on-disk. The **SWITCH PARTITION**
command atomically swaps a staging table into a partition — a **metadata-only operation** that
takes milliseconds regardless of row count:

```sql
-- Partition function and scheme
CREATE PARTITION FUNCTION pf_person(INT) AS RANGE LEFT FOR VALUES (25000, 50000, 75000);
CREATE PARTITION SCHEME ps_person AS PARTITION pf_person ALL TO ([PRIMARY]);

-- SWITCH operation (metadata-only, no data movement)
ALTER TABLE person_staging SWITCH TO person_partitioned PARTITION 4;
```

| Method | 100k rows (avg ms) |
|--------|-------------------|
| Direct insert into partitioned table | 2,134 |
| SWITCH pattern (bulk-load heap, then SWITCH) | 2,209 (~tie) |

On this run the two paths tied — when direct inserts are already fast, staging the data twice
buys no throughput. The real value of the SWITCH pattern is **zero-downtime bulk loads** — the
main table stays queryable throughout the load, and the final swap is a metadata-only operation.

**Caveat:** The staging table must have an identical schema plus a CHECK constraint matching the
target partition's range. Both tables must live on the same filegroup.

![Fill Factor & Partitioning](fillfactor_partition.svg)

### Clustered key: INT vs GUID

The clustered key defines the physical order of rows on disk. Random keys (like UUIDs) cause page
splits — new rows must be inserted into the middle of existing pages, so SQL Server has to split
a full page in two and copy half the rows.

| Clustered Key | 100k rows (avg ms) | Notes |
|---------------|-------------------|-------|
| **INT sequential** (baseline) | **2,027** | No page splits |
| GUID sequential (`NEWSEQUENTIALID()`) | 2,250 (+11%) | Monotonic — no page splits |
| GUID random (`UUID.randomUUID()`) | 2,630 (+30%) | Page splits all over the index |

**The 30% penalty for random GUIDs is actually small** — because we inserted into an *empty* table.
On an existing populated table, random GUIDs can be 2-5x slower as the index grows and new
insertions hit densely-packed pages. If you must use GUIDs, prefer `NEWSEQUENTIALID()` on
SQL Server or an "ordered GUID" (UUIDv7/ULID) on the application side.

### Change Tracking

SQL Server **Change Tracking** is a lightweight CDC alternative that records *which rows* were
modified (not the changed values). It's enabled per-database and per-table:

```sql
ALTER DATABASE testdb SET CHANGE_TRACKING = ON (CHANGE_RETENTION = 2 DAYS, AUTO_CLEANUP = ON);
ALTER TABLE person_ct ENABLE CHANGE_TRACKING WITH (TRACK_COLUMNS_UPDATED = OFF);
```

| Scenario | 100k rows (avg ms) |
|----------|-------------------|
| No change tracking | 2,036 |
| **Change Tracking enabled** | **3,109 (53% slower)** |

Change Tracking has significant insert overhead — each row generates an internal side-table entry
with the operation and version. Enable it only if downstream consumers actually need the change
feed. For audit alone, temporal tables are cheaper.

**Note:** Full **Change Data Capture (CDC)** — which records entire row values — is Enterprise-only
and would have even higher overhead than CT.

### Temporal (system-versioned) tables

Temporal tables automatically track row history in a shadow table. Every INSERT, UPDATE and DELETE
writes to both the current table and the history table:

```sql
CREATE TABLE person_temporal (
    person_id INT PRIMARY KEY,
    user_name NVARCHAR(30), first_name NVARCHAR(10),
    last_name NVARCHAR(15), years INT,
    ValidFrom DATETIME2 GENERATED ALWAYS AS ROW START NOT NULL,
    ValidTo DATETIME2 GENERATED ALWAYS AS ROW END NOT NULL,
    PERIOD FOR SYSTEM_TIME (ValidFrom, ValidTo)
) WITH (SYSTEM_VERSIONING = ON);
```

| Scenario | 100k rows (avg ms) |
|----------|-------------------|
| Plain table | 2,165 |
| **Temporal table (SYSTEM_VERSIONED)** | **3,022 (+40%)** |

**Surprisingly cheap** — only 40% overhead for full point-in-time history. Compare that to the
`AFTER INSERT` trigger approach from [Part 8](/post/java/mssqlserver/fast_insert_part8/) which was
2.5x slower. For audit requirements, temporal tables are the right answer.

For pure inserts the history table doesn't receive rows (only updates/deletes populate it), so the
overhead is almost entirely the extra period column maintenance.

![Storage Patterns](storage_patterns.svg)

### Filtered & INCLUDE indexes

Not all non-clustered indexes are created equal. Two variations can dramatically cut insert cost:

- **Filtered index** — only indexes rows matching a WHERE clause (`WHERE years >= 50`)
- **INCLUDE index** — stores extra columns only at the leaf level (not in the sort key)

| Index Type | 100k rows (avg ms) | vs no index |
|------------|-------------------|-------------|
| No index (baseline) | 2,007 | — |
| **Filtered** (only ~17% of rows match) | **2,774** | **+38%** |
| Full non-clustered | 2,885 | +44% |
| INCLUDE | 2,965 | +48% |
| Composite 3-column | 2,966 | +48% |

**Filtered indexes are still the cheapest option**: most rows never touch the index, so it adds the
least maintenance work. The margin over a full index was smaller on this run (~4% of total time) —
the per-statement cost dominates. If your queries only need "the senior customers", only index them.

**INCLUDE and composite now cost the same** (+48% each) — the leaf-level storage saving is lost in
the noise at this row size.

### Computed columns

Computed columns are either **PERSISTED** (materialized on write) or **non-persisted** (computed on read).

```sql
CREATE TABLE person_computed (
    person_id INT PRIMARY KEY, user_name NVARCHAR(30), first_name NVARCHAR(10),
    last_name NVARCHAR(15), years INT,
    full_name AS (first_name + N' ' + last_name) PERSISTED,
    years_bucket AS (CASE WHEN years < 30 THEN N'young' ELSE N'old' END)
)
```

| Scenario | 100k rows (avg ms) |
|----------|-------------------|
| Plain table | 2,012 |
| Table with 1 persisted + 1 non-persisted computed column | 2,073 |

**Essentially free.** The persisted column's string concatenation adds negligible CPU cost compared
to I/O. The non-persisted column costs nothing on insert — it's evaluated on reads. Use them freely
for derived values; they're much cleaner than application-side computations and support indexing.

### Trace flag 610

TF 610 is a legacy trace flag that enables minimally-logged bulk inserts into clustered tables.

| Setting | 100k rows (avg ms) |
|---------|-------------------|
| TF 610 OFF + TABLOCK | 1,843 |
| TF 610 ON + TABLOCK | 1,824 |

**No measurable difference** for our workload. Why? TF 610 helps `BULK INSERT`, `INSERT INTO ...
SELECT`, and `BCP` operations — not regular `INSERT` statements with `addBatch()`. The MS SQL JDBC
driver's Bulk Copy API already uses minimal logging when applicable. Skip this flag unless you're
using `BULK INSERT` or `BCP` directly.

### Delayed durability

`DELAYED_DURABILITY = FORCED` makes transaction commits asynchronous — the log flush happens on a
background timer instead of synchronously at COMMIT. Risk: a crash loses recent transactions.

| Setting | 100k rows (avg ms) |
|---------|-------------------|
| DISABLED (default) | 2,010 |
| **FORCED** | **2,996 (49% SLOWER!)** |

**Counter-intuitive finding.** Delayed durability makes our test *slower*, not faster. Why?

Delayed durability batches multiple small transactions' log flushes together. It helps workloads
with **many frequent small COMMITs** (think OLTP with per-row inserts). Our test uses **one large
transaction**, so there's nothing to batch — DD just adds coordination overhead without any benefit.

**Takeaway:** DD is a per-transaction optimization. For bulk inserts, use fewer, larger
transactions instead of enabling DD on frequent small ones.

![Index Varieties & Logging](index_varieties.svg)

### XML vs JSON columns

Semi-structured data in SQL Server comes in two flavors:
- **XML column type**: Schema-less XML with built-in XQuery support, validation on insert
- **JSON stored as NVARCHAR(MAX) + `CHECK (ISJSON(data) = 1)`**: Lightweight JSON validation

| Column Type | 100k rows (avg ms) | vs baseline |
|-------------|-------------------|-------------|
| JSON (NVARCHAR + ISJSON check) | 3,878 | +91% |
| **XML column** | **6,013** | **+196%** |

**XML is 1.6x slower than JSON** for the same semantic payload. XML columns:
- Parse the XML into a native tree representation on insert
- Validate well-formedness
- Store in an optimized binary tree format (not the original string)

If you need semi-structured storage, prefer JSON (NVARCHAR + ISJSON) unless you specifically need
XQuery, XPath or XML schema validation.

### Sparse columns

Sparse columns are SQL Server's optimization for tables with many mostly-NULL columns:

| Column type / fill pattern | 100k rows (avg ms) |
|---------------------------|-------------------|
| Non-sparse, mostly NULL | 2,090 |
| **Sparse, mostly NULL** | **2,234** (+7% — essentially tied) |
| Non-sparse, mostly filled | 3,518 |
| **Sparse, mostly filled** | **3,912** (+11% slower!) |

**Surprise:** sparse columns offer **no insert benefit when NULL-heavy** (expected tie) but are
**11% SLOWER when filled**. Sparse columns use a special on-disk representation that's efficient for
NULL storage but more expensive when the column has a value. Use SPARSE only when:
- The column is **>95% NULL** on real data
- You're optimizing storage (sparse saves disk space) rather than insert speed

### AUTO_UPDATE_STATISTICS

```sql
ALTER DATABASE testdb SET AUTO_UPDATE_STATISTICS { ON | OFF }
```

| Setting | 100k rows (avg ms) |
|---------|-------------------|
| **AUTO_UPDATE_STATISTICS = ON** (default) | **2,038** |
| AUTO_UPDATE_STATISTICS = OFF | 2,053 (+1% — no measurable difference) |

On this run, turning stats OFF made no measurable difference for the insert itself — an older run
showed a 50% penalty from worse INSERT plans, so this seems workload- and engine-dependent. Either
way there's no upside to disabling it.

**Takeaway:** leave AUTO_UPDATE_STATISTICS on. It costs nothing on the write path and protects
your read queries from stale plans.

### Server-side encryption (ENCRYPTBYPASSPHRASE)

SQL Server supports server-side encryption via `ENCRYPTBYKEY`, `ENCRYPTBYPASSPHRASE`, etc. We tested
with 3 encrypted columns per row (user_name, first_name, last_name):

| Scenario | 100k rows (avg ms) |
|----------|-------------------|
| Plain insert | 2,054 |
| **3 columns ENCRYPTBYPASSPHRASE** | **12,076 (5.9x slower)** |

Encryption is CPU-expensive. The actual AES-256 operations happen server-side, consuming SQL
Server CPU. Minimize the number of encrypted columns and consider:
- **Always Encrypted** — client-side encryption (CPU cost moves to the app)
- **TDE** — database-level encryption (works at page level, lower per-row overhead)
- **Column-level encryption** only on actual PII, not every text field

![Column Types, Stats & Encryption](column_types.svg)

### ID Generation Strategies

How you generate primary keys matters more than you might think:

| Strategy | 100k rows (avg ms) | vs app-generated |
|----------|-------------------|------------------|
| **App-generated INT** (baseline) | **2,029** | — |
| IDENTITY column | 2,528 | +25% |
| SET IDENTITY_INSERT ON (explicit values) | 2,598 | +28% |
| SEQUENCE object (DEFAULT) | 3,544 | +75% |
| **IDENTITY + `RETURN_GENERATED_KEYS`** | **2,851** | **+41%** |

**App-side ID generation wins**. The surprises:
- `RETURN_GENERATED_KEYS` is a significant tax (+41% over app-generated, +13% over plain IDENTITY)
  — many ORMs set it by default so they can populate the entity's `id` field. If you don't need
  the generated IDs back, suppress it.
- `SET IDENTITY_INSERT ON` costs more than you'd expect — the mode toggle isn't free, and the engine
  has to validate uniqueness against the identity seed.
- SEQUENCE objects are convenient but add a DEFAULT lookup per row — a 75% penalty on this run,
  making them the most expensive option here.

**Recommendation:** generate IDs on the application side (ULID, Snowflake, pre-fetched sequence
batch, or a `SELECT NEXT VALUE FOR seq FROM GENERATE_SERIES(1,1000)` pre-fetch pattern) for the
fastest batched inserts.

### Foreign Keys

| Scenario | 100k rows (avg ms) |
|----------|-------------------|
| No FK constraint at all | 2,065 |
| **FK disabled** (`NOCHECK CONSTRAINT`) | **2,186** (+6%) |
| **FK trusted** (`WITH CHECK CHECK CONSTRAINT`) | **2,600** (+26%) |

Trusted (enforced) foreign keys cost about 26% — the engine validates every row's `dept_id` against
the `department` table. Disabled FKs still cost a small 6% because the optimizer treats them as
*untrusted* and may generate different plans.

**For large bulk loads with known-good data:** disable FK constraints, load, then re-enable with
`WITH CHECK` to re-validate. The re-validation is faster than per-row checking.

### Batch Retry Patterns

Real-world data often has bad rows. How you handle one bad row in a batch has dramatic cost:

| Pattern | 10k rows, 1 duplicate (avg ms) |
|---------|-------------------------------|
| **Abort batch on error** (clearBatch, continue) | **227** |
| **Insert per-row** (catch, skip, continue) | **1,371 (6x slower)** |

The abort-on-error pattern completes in 227 ms because each 1,000-row sub-batch that contains a bad
row is simply discarded (we lose up to 999 good rows per bad row). The per-row pattern inserts
9,999 of 10,000 rows but takes 6x longer.

**The right answer depends on your data integrity requirements:**
- **Known-good data**: use the batch pattern — if any row fails, there's a bug upstream.
- **Dirty data with some bad rows**: use smaller batches (100 instead of 1000) so you lose less on
  each failure; the per-row path should be reserved for the final retry pass.
- **Zero tolerance for data loss**: stage into a temp table, VALIDATE then move to the real table.

![ID Generation & Foreign Keys](identity_fk.svg)

### Temp table staging

A common ETL pattern: INSERT into a heap temp table, then INSERT-SELECT into the real table:

| Method | 100k rows (avg ms) |
|--------|-------------------|
| Direct insert | 2,024 |
| Temp table staging | 2,626 (30% slower) |

**Staging is slower for simple inserts** because you're writing data twice. It's useful when you need
to validate, deduplicate, or transform data before loading — not for raw throughput.

## The one thing to remember

> **Table design dominates insert speed once you have more than one non-clustered index.** Five
> indexes slows inserts up to 7x — far more than any client-side strategy change can recover. If
> your bulk load is slow, drop indexes first, retry; then look at the client.

Most other table-design knobs save or cost 10-50% each. The exceptions worth remembering:
server-side encryption (5.9x slower), AFTER INSERT triggers (2.5x slower), XML columns
(1.6x slower than JSON), and Change Tracking (53% slower).

## Test yourself

{{< quiz question="Which settings should you leave at their defaults for fast inserts?" options="AUTO_UPDATE_STATISTICS (ON)|MAXDOP|Fill factor (100)|The number of non-clustered indexes during the load" correct="0,1,2" multi="true" explanation="Leave AUTO_UPDATE_STATISTICS on, MAXDOP and fill factor at defaults. Non-clustered indexes are the thing to drop before a bulk load: 5 of them slow inserts up to 7x." >}}

{{< quiz question="Does ROW compression make inserts faster?" options="Yes, less data to write|No, it adds about 13% overhead|Only with columnstore|It has no measurable effect" correct="1" explanation="Compression is a read-side optimization. ROW adds about 13% and PAGE about 25% overhead on inserts because the engine compresses on write." >}}

Next: [Part 8 — TVP and Plain JDBC](/post/java/mssqlserver/fast_insert_part8/) covers
Table-Valued Parameters, bare-metal JDBC, and the final rankings across all 110+ configurations.
