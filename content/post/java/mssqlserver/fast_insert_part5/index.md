---
title: "Fastest way to insert the data in MS SQL - Part 5 Hibernate Tuning"
date: 2026-10-18
draft: true
usePageBundles: true
featureImage: 'java_sending_data_to_mssql_server.jpg'
featureImageAlt: 'java sending data to mssql server'
shareImage: 'java_sending_data_to_mssql_server.jpg'
tags: [ "java", "ms sql server", "hibernate" ]
categories: [ "java", "sql" ]
series: [ "Fastest Way to Insert Data in MS SQL" ]
sourceCode: 'https://github.com/mmarko88/blog-examples/tree/main/fastest-insert/part5-hibernate-tuning'
---

## Introduction

In [Part 1](/post/java/mssqlserver/persist_vs_saveall/) we saw that `saveAll()` was ~7x slower than
batched `persist()` because Spring Data JPA calls `merge()` on each entity — triggering a SELECT
before every INSERT. In [Part 2](/post/java/mssqlserver/fast_insert_part2/) we moved to raw JDBC and
cut the time further. But we never asked: **how close can Hibernate get to raw JDBC?**

This post explores three Hibernate tuning techniques that dramatically narrow the gap:

1. **`Persistable` interface** — eliminates the SELECT-before-INSERT problem in `saveAll()`
2. **`StatelessSession`** — bypasses the first-level cache and dirty checking entirely
3. **Batch size tuning** — finding the optimal batch size for Hibernate

## The saveAll Problem: SELECT Before INSERT

When you call `repository.saveAll(entities)`, Spring Data JPA checks each entity's ID. If the ID is
non-null, it assumes the entity might already exist and calls `EntityManager.merge()` — which issues
a `SELECT` before the `INSERT`. For 100,000 entities, that's 100,000 extra SELECTs.

### Fix: Implement Persistable

The fix is simple: make your entity implement `Persistable<T>` and always return `true` from
`isNew()`:

```java
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

| Strategy | 100k persons (avg ms) |
|----------|----------------------|
| saveAll (original, Part 1) | 27,794 |
| **saveAll + Persistable** | **3,426** |
| persist in chunks (Part 1) | 4,048 |

**Persistable makes saveAll 8x faster** — and now slightly faster than manual persist-in-chunks!
The SELECT elimination is the single biggest win.

## StatelessSession: Bare-Metal Hibernate

Hibernate's `StatelessSession` is designed for bulk operations. It bypasses:

- **First-level cache** — no entity state tracking, constant memory
- **Dirty checking** — no scanning managed entities at flush time
- **Cascading** — related entities must be inserted explicitly

```java
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

| Strategy | 100k persons (avg ms) |
|----------|----------------------|
| Hibernate persist (Part 1) | 4,048 |
| **StatelessSession** | **2,650** |
| JDBC PreparedStatement (Part 2) | 2,423 |
| JdbcTemplate (Part 2) | 2,985 |

**StatelessSession is 35% faster than regular Hibernate persist** and within striking distance of
raw JDBC. The remaining gap (~10%) is Hibernate's SQL generation and parameter binding overhead.

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

## provider_disables_autocommit

The `hibernate.connection.provider_disables_autocommit` setting tells Hibernate that the connection
pool already disabled auto-commit, skipping the `setAutoCommit(false)` JDBC round-trip per
transaction. To use it, you need both:

```properties
spring.jpa.properties.hibernate.connection.provider_disables_autocommit=true
spring.datasource.hikari.auto-commit=false
```

| Strategy | Normal | +noAutoCommit | Speedup |
|----------|--------|---------------|---------|
| Hibernate persist | 4,048 | 4,094 | None |
| Persistable saveAll | 3,426 | **2,956** | **14%** |

**Verdict: negligible for persist, modest for saveAll.** The saved round-trip is only measurable
when there are many small transactions (saveAll with frequent flushes) rather than one large batch
(persist). Not worth the configuration complexity unless you have a very specific transactional
pattern.

## Batch Size Sweet Spot

Parts 1-4 tested batch sizes of 10, 100, 1000, and 5000. A fine-grained sweep (50-2000 in steps
of 50) reveals the actual inflection points:

### Bulk API

| Batch | Avg ms | | Batch | Avg ms |
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

| Batch | Avg ms | | Batch | Avg ms |
|-------|--------|---|-------|--------|
| 50 | 6,471 | | 600 | 2,989 |
| 100 | 6,036 | | **700** | **2,847** |
| 200 | 5,291 | | 800 | 2,975 |
| 500 | 3,062 | | 1600 | 2,996 |

**JdbcTemplate:** optimal at 700, with minimal improvement past 500. Larger batches (1000+) don't
help because the driver's TCP buffer and SQL Server's batch processing saturate around 500-800 rows.

## Multi-Value Sweet Spot

[Part 3](/post/java/mssqlserver/fast_insert_part3/) showed that multi-value INSERT
(`objectsPerInsert > 1`) is much faster than single-row inserts. But what's the optimal value?
A fine-grained sweep reveals:

| objectsPerInsert | Avg ms | vs single-row |
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

## Connection String: sendStringParametersAsUnicode

Setting `sendStringParametersAsUnicode=false` in the JDBC URL tells the driver to send string
parameters as VARCHAR instead of NVARCHAR. This can help when your table has VARCHAR columns
(avoids implicit conversion), but **has no effect on NVARCHAR columns**:

| Strategy | Unicode (default) | sendStringParametersAsUnicode=false |
|----------|-------------------|-------------------------------------|
| Bulk API | 691ms | 812ms (no improvement) |
| JdbcTemplate | 3,699ms | 3,892ms (no improvement) |

If your columns are NVARCHAR, skip this setting.

## Summary

| Technique | What it does | Impact |
|-----------|-------------|--------|
| `Persistable` | Eliminates SELECT-before-INSERT in saveAll | **8x faster** saveAll |
| `StatelessSession` | Bypasses 1st-level cache + dirty checking | **35% faster** than persist |
| `+ bulkCopy=true` | Transparent bulk copy for all batch strategies | **2-2.5x faster** everything |
| `provider_disables_autocommit` | Skips setAutoCommit round-trip | **14% faster** saveAll only |
| Batch size 500-1000 | Sweet spot for most strategies | Diminishing returns past 1000 |
| objectsPerInsert = 200 | Multi-value INSERT sweet spot | **4.8x faster** than single-row |

The answer to "how close can Hibernate get to raw JDBC?" is: **very close**. StatelessSession with
bulkCopy=true closes 80% of the gap. The remaining 20% is the price of Hibernate's SQL generation
— and for most applications, that's a trade-off worth making.

Next: [Part 6 — Parallel Inserts](/post/java/mssqlserver/fast_insert_part6/) explores splitting
data across multiple threads for even higher throughput.
