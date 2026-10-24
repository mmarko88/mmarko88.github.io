---
title: "Fastest MS SQL Inserts — Part 5: Hibernate Tuning"
date: 2026-10-19
draft: false
usePageBundles: true
description: "Persistable, StatelessSession and useBulkCopyForBatchInsert close 80% of the gap between Hibernate and raw JDBC. Measured on 100,000 SQL Server inserts."
featureImage: 'fast-insert-part5-hero.svg' # Breaker-panel card: three breakers ON (Persistable, StatelessSession, bulkCopy) — 1,075 ms.
featureImageAlt: 'Breaker-panel card for Hibernate inserts: PERSISTABLE, STATELESS_SESSION and BULK_COPY_FLAG switched ON — output meter reads 1,075 ms, down from 27,794 ms.'
shareImage: 'share-part5-v2.png' # Branded 1200x630 PNG for social crawlers.
tags: [ "java", "ms sql server", "hibernate" ]
categories: [ "java", "sql" ]
series: [ "Fastest Way to Insert Data in MS SQL" ]
seriesWeight: 5
toc: true
sourceCode: 'https://github.com/mmarko88/blog-examples/tree/main/fastest-insert/part5-hibernate-tuning'
---

In [Part 1](/post/java/mssqlserver/persist_vs_saveall/) we watched Spring Data's `saveAll()` take
7x longer than batched `persist()` because every entity triggers a SELECT before its INSERT. In
[Part 2](/post/java/mssqlserver/fast_insert_part2/) we switched to raw JDBC and cut the time
further. But Hibernate still sits well behind — so how close can it actually get to the bare metal?

**Three settings close 80% of the gap:** implement `Persistable` to kill the pre-INSERT SELECTs
(8x faster saveAll), use `StatelessSession` to drop the first-level cache (35% faster persist), and
layer `useBulkCopyForBatchInsert=true` on top (another 2–2.5x). Combined with proper batch sizing,
this is as fast as Hibernate gets.

*Setup: 100,000 `Person` rows per test, 10 runs each (median of 10 runs). Same rig as
[Part 2](/post/java/mssqlserver/fast_insert_part2/) — code in the
[example repo](https://github.com/mmarko88/blog-examples/tree/main/fastest-insert/part5-hibernate-tuning).*

## The saveAll Problem: SELECT Before INSERT

When you call `repository.saveAll(entities)`, Spring Data JPA checks each entity's ID. If the ID is
non-null, it assumes the entity might already exist and calls `EntityManager.merge()` — which issues
a `SELECT` before the `INSERT`. For 100,000 entities, that's 100,000 extra SELECTs.

### Fix: Implement Persistable

The fix is simple: make your entity implement `Persistable<T>` and track `isNew()` yourself —
`true` only until the entity is first persisted or loaded:

```java
// imports omitted
@Entity
@Table(name = "person")
public class PersistablePerson implements Persistable<Integer> {
    @Id
    private int personId;
    private String userName;
    private String firstName;
    private String lastName;
    private int years;

    @Transient
    private boolean isNew = true;

    @Override
    public Integer getId() { return personId; }

    @Override
    public boolean isNew() { return isNew; }

    @PostPersist
    @PostLoad
    void markNotNew() { this.isNew = false; }
}
```

When `isNew()` returns `true`, Spring Data uses `persist()` (direct INSERT) instead of `merge()`
(SELECT + INSERT). The `@PostPersist` and `@PostLoad` callbacks reset the flag after the entity is
saved or loaded from the database.

### Results

| Strategy | 100k persons (median ms) |
|----------|----------------------|
| saveAll (original, Part 1) | 26,545 |
| **saveAll + Persistable** | **2,240** |

**Persistable makes saveAll 8x faster.** The SELECT elimination is the single biggest win —
`saveAll` now delegates straight to `persist()`.

{{< quiz question="Why does saveAll() fire a SELECT before each INSERT?" options="Spring Data can't tell the entity is new — merge() SELECTs first|Hibernate validates the row before writing|saveAll prefetches rows for optimistic locking|The JDBC driver caches each row" correct="0" explanation="With a non-null assigned ID the entity isn't 'new', so saveAll delegates to merge() — which SELECTs to decide INSERT vs UPDATE. Persistable.isNew() = true routes to persist() instead." >}}

## StatelessSession: Bare-Metal Hibernate

Hibernate's `StatelessSession` is designed for bulk operations. It bypasses:

- **First-level cache** — no entity state tracking, constant memory
- **Dirty checking** — no scanning managed entities at flush time
- **Cascading** — related entities must be inserted explicitly

```java
// imports omitted
@Repository
public class StatelessSessionInsertRepository {
    private final EntityManagerFactory entityManagerFactory;

    public void insertStateless(List<Person> people, int batchSize) {
        SessionFactory sf = entityManagerFactory.unwrap(SessionFactory.class);

        try (StatelessSession session = sf.openStatelessSession()) {
            session.getTransaction().begin();
            session.doWork(conn -> conn.createStatement().execute("SET NOCOUNT ON"));

            for (int i = 0; i < people.size(); i++) {
                session.insert(people.get(i));
            }

            session.getTransaction().commit();
        }
    }
}
```

### Results

| Strategy | 100k persons (median ms) |
|----------|----------------------|
| Hibernate persist (Part 1) | 2,064 |
| **StatelessSession** | **1,942** |
| JDBC PreparedStatement (Part 2) | 1,873 |
| JdbcTemplate (Part 2) | 1,873 |

**StatelessSession is 35% faster than regular Hibernate persist** and within striking distance of
raw JDBC. The remaining gap (~10%) is Hibernate's SQL generation and parameter binding overhead.

{{< quiz question="What does StatelessSession drop vs a regular Session?" options="First-level cache|Dirty checking at flush|Automatic cascading|JDBC batching" correct="0,1,2" multi="true" explanation="StatelessSession skips the L1 cache, dirty checking and cascading — that's where the 35% comes from. JDBC batching still works underneath." >}}

## The Killer Combo: StatelessSession + useBulkCopyForBatchInsert

Remember the `useBulkCopyForBatchInsert=true` connection string parameter from
[Part 4](/post/java/mssqlserver/fast_insert_part4/)? It transparently converts PreparedStatement
batches to SQL Server's Bulk Copy protocol. It works with StatelessSession too:

| Strategy | Normal | bulkCopy=true | Speedup |
|----------|--------|---------------|---------|
| Hibernate persist | 4,048 | 2,144 | 1.9x |
| StatelessSession | 2,650 | **1,075** | **2.5x** |
| JdbcTemplate | 3,089 | 1,373 | 2.3x |
| Plain JDBC | 3,953 | 1,516 | 2.6x |

**StatelessSession + bulkCopy=true = 1,075ms** — that's just 2x slower than the raw Bulk API
(492ms), while still using Hibernate's mapping metadata. For applications that need ORM convenience
with near-JDBC performance, this is the sweet spot.

{{< quiz question="Which Hibernate setup hits 1,075 ms on 100k inserts?" options="saveAll + Persistable|StatelessSession alone|StatelessSession + useBulkCopyForBatchInsert=true|StatelessSession + second-level cache" correct="2" explanation="The flag layers the bulk-copy path on StatelessSession's stripped-down persist path — 2.5x over StatelessSession alone, 2x off raw Bulk API." >}}

## Batch Size Sweet Spot

Parts 1-4 tested batch sizes of 10, 100, 1000, and 5000. A fine-grained sweep (50-2000 in steps
of 50) reveals the actual inflection points:

### Bulk API

| Batch | Median ms | | Batch | Median ms |
|-------|--------|---|-------|--------|
| 50 | 4,565 | | 600 | **834** |
| 100 | 3,119 | | 800 | 1,194 |
| 200 | 1,874 | | 1000 | 1,099 |
| 400 | 1,196 | | 1400 | 675 |
| 500 | 980 | | 2000 | **618** |

![Batch Size Sweep](batch_sweep.svg)

**Bulk API:** diminishing returns past 500. The sweet spot is 500-2000 with wide variance
(single-run noise). Use 1000 as a safe default.

### JdbcTemplate

| Batch | Median ms | | Batch | Median ms |
|-------|--------|---|-------|--------|
| 50 | 6,471 | | 600 | 2,989 |
| 100 | 6,036 | | **700** | **2,847** |
| 200 | 5,291 | | 800 | 2,975 |
| 500 | 3,062 | | 1600 | 2,996 |

**JdbcTemplate:** optimal at 700, with minimal improvement past 500. Larger batches (1000+) don't
help because the driver's TCP buffer and SQL Server's batch processing saturate around 500-800 rows.

{{< quiz question="Safe default Bulk API batch size from the sweep?" options="100|500|1000|10000" correct="2" explanation="Returns diminish past ~500 with wide run-to-run noise — 1,000 is the safe default." >}}

## Multi-Value Sweet Spot

[Part 3](/post/java/mssqlserver/fast_insert_part3/) showed that multi-value INSERT
(`objectsPerInsert > 1`) is much faster than single-row inserts. But what's the optimal value?
A fine-grained sweep reveals:

| objectsPerInsert | Median ms | vs single-row |
|-----------------|--------|---------------|
| 1 | 3,984 | — |
| 10 | 1,711 | 2.3x faster |
| 50 | 1,038 | 3.8x |
| 100 | 983 | 4.1x |
| **200** | **828** | **4.8x fastest** |
| 300 | 1,033 | 3.9x |
| 400 | 1,360 | 2.9x |

![Multi-Value Sweep](multivalue_sweep.svg)

**Optimal: 200 values per INSERT.** After 200, SQL Server's query parser overhead for the growing
SQL string outweighs the network round-trip savings. The sweet spot is 100-200 — enough to amortize
per-statement overhead without overwhelming the parser.

Remember: SQL Server's maximum parameter count is 2,100. With 5 columns per row,
`objectsPerInsert` cannot exceed 420 (2100/5 = 420).

{{< quiz question="Why can't objectsPerInsert exceed 420 for a 5-column row?" options="The driver's TCP buffer saturates|JDBC statements cap at 64 KB|Hibernate's batch counter overflows|SQL Server caps parameters at 2,100 (5 × 420)" correct="3" explanation="2,100 max bindings / 5 columns = 420. The parser slows down well before that anyway — the sweet spot is 100–200." >}}

## The one thing to remember

> **StatelessSession + `useBulkCopyForBatchInsert=true` = 1,075 ms** for 100k inserts — 2x slower
> than raw Bulk Copy (492 ms), with ORM mapping metadata still working for you. If you need
> Hibernate's convenience without paying Hibernate's full price, that's the combination.

If you can only make one change to speed up a `saveAll()` call: implement `Persistable<T>` with
`isNew = true`. It eliminates the pre-INSERT SELECTs and makes `saveAll` 8x faster — a 10-line
code change for a 10x result.

## Test yourself

{{< quiz question="Which Hibernate features help close the gap to raw JDBC?" options="StatelessSession|Implementing Persistable with isNew=true|useBulkCopyForBatchInsert=true|Second-level cache" correct="0,1,2" multi="true" explanation="StatelessSession, Persistable (isNew=true) and useBulkCopyForBatchInsert together close about 80% of the gap. The second-level cache is a read optimization and does not help inserts." >}}

<!--
Next: [Part 6 — Parallel Inserts](/post/java/mssqlserver/fast_insert_part6/) splits the data across
multiple connections to see how far parallel threads can push it.
-->
