---
title: "Fastest MS SQL Inserts — Part 5: Hibernate Tuning"
date: 2026-10-19
draft: false
usePageBundles: true
description: "Persistable, StatelessSession and useBulkCopyForBatchInsert close ~90% of the gap between Hibernate and the Bulk Copy API. Measured on 100,000 SQL Server inserts."
featureImage: 'fast-insert-part5-hero.svg' # Breaker-panel card: three breakers ON (Persistable, StatelessSession, bulkCopy) — 646 ms.
featureImageAlt: 'Breaker-panel card for Hibernate inserts: PERSISTABLE, STATELESS_SESSION and BULK_COPY_FLAG switched ON — output meter reads 646 ms, down from 27,794 ms.'
shareImage: 'share-part5-v3.png' # Branded 1200x630 PNG for social crawlers.
tags: [ "java", "ms sql server", "hibernate" ]
categories: [ "java", "sql" ]
series: [ "Fastest Way to Insert Data in MS SQL" ]
seriesWeight: 5
toc: true
sourceCode: 'https://github.com/mmarko88/blog-examples/tree/main/fastest-insert/part5-hibernate-tuning'
---

In [Part 1](/post/java/mssqlserver/persist_vs_saveall/) we watched Spring Data's `saveAll()` take
~12x longer than batched `persist()` because every entity triggers a SELECT before its INSERT. In
[Part 2](/post/java/mssqlserver/fast_insert_part2/) we switched to raw JDBC and cut the time
further. But Hibernate still sits well behind — so how close can it actually get to the bare metal?

**Three settings close ~90% of the gap to the [raw Bulk Copy API](/post/java/mssqlserver/fast_insert_part2/):** implement [`Persistable`](#fix-implement-persistable) to kill
the pre-INSERT SELECTs (~12x faster saveAll), use [`StatelessSession`](#statelesssession-bare-metal-hibernate) to drop the first-level cache
(near raw-JDBC speed), and layer [`useBulkCopyForBatchInsert=true`](/post/java/mssqlserver/fast_insert_part4/) on top (another ~2–3x). Combined with proper batch sizing,
this is as fast as Hibernate gets.

*Setup: 100,000 `Person` rows per test, median of 10 runs — Temurin JDK 21, SQL Server 2025
Developer on Ubuntu, i5-4690K pinned to one core at 3.5 GHz (same rig as
[Part 2](/post/java/mssqlserver/fast_insert_part2/)). Code in the
[example repo](https://github.com/mmarko88/blog-examples/tree/main/fastest-insert/part5-hibernate-tuning).*

## The saveAll Problem: SELECT Before INSERT

When you call `repository.saveAll(entities)`, Spring Data JPA checks each entity's ID. If the ID is
non-null, it assumes the entity might already exist and calls [`EntityManager.merge()`](/post/java/mssqlserver/persist_vs_saveall/) — which issues
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

When `isNew()` returns `true`, Spring Data uses [`persist()`](/post/java/mssqlserver/persist_vs_saveall/) (direct INSERT) instead of `merge()`
(SELECT + INSERT). The `@PostPersist` and `@PostLoad` callbacks reset the flag after the entity is
saved or loaded from the database.

### Results: saveAll ~12x faster

| Strategy | 100k persons (median ms) |
|----------|----------------------|
| [saveAll](/post/java/mssqlserver/persist_vs_saveall/) (original, Part 1) | 26,545 |
| **saveAll + [Persistable](#fix-implement-persistable)** | **2,140** |

**Persistable makes saveAll ~12x faster.** The SELECT elimination is the single biggest win —
`saveAll` now delegates straight to `persist()`. That also means the batched
[`entityManager.persist()`](/post/java/mssqlserver/persist_vs_saveall/) loop from Part 1 (2,064 ms) is
the *same* implementation — just a manual way to reach the identical code path — so it's not
listed separately below.

{{< quiz question="Why does saveAll() fire a SELECT before each INSERT?" options="Hibernate validates each row before writing|The entity isn't marked new — merge() SELECTs first|saveAll prefetches rows for optimistic locking|The JDBC driver caches each row" correct="1" explanation="With a non-null assigned ID the entity isn't 'new', so saveAll delegates to merge() — which SELECTs to decide INSERT vs UPDATE. Persistable.isNew() = true routes to persist() instead." >}}

## StatelessSession: Bare-Metal Hibernate

Hibernate's `StatelessSession` is designed for bulk operations. It bypasses:

- **First-level cache** — no entity state tracking, constant memory
- **Dirty checking** — no scanning managed entities at flush time
- **Cascading** — related entities must be inserted explicitly

```java
// imports and constructor omitted
@Repository
public class StatelessSessionInsertRepository {
    private final EntityManagerFactory entityManagerFactory;

    public void insertStateless(List<Person> people) {
        SessionFactory sf = entityManagerFactory.unwrap(SessionFactory.class);

        try (StatelessSession session = sf.openStatelessSession()) {
            session.getTransaction().begin();

            for (int i = 0; i < people.size(); i++) {
                session.insert(people.get(i));
            }

            session.getTransaction().commit();
        }
    }
}
```

### Results: within ~1% of raw JDBC

| Strategy | 100k persons (median ms) |
|----------|----------------------|
| [saveAll](/post/java/mssqlserver/persist_vs_saveall/) (original, Part 1) | 26,545 |
| saveAll + [Persistable](#fix-implement-persistable) | 2,140 |
| **StatelessSession** | **1,850** |

**StatelessSession adds another ~14% on top of the Persistable fix** (1,850 vs 2,140 ms) — ~14x
faster than the `saveAll` we started with. No first-level cache, no dirty checking: the per-entity
bookkeeping `Persistable` couldn't remove is gone.

{{< quiz question="What does StatelessSession drop vs a regular Session?" options="First-level cache|Dirty checking at flush|Automatic cascading|JDBC batching" correct="0,1,2" multi="true" explanation="StatelessSession skips the L1 cache, dirty checking and cascading — that's most of the overhead a regular Session carries. JDBC batching still works underneath." >}}

{{< quiz question="When is StatelessSession the wrong tool?" options="Bulk inserts over ~10k rows at once|Entities with manually assigned IDs|Transactions shorter than a few ms|Rows needing cascades to related entities" correct="3" explanation="StatelessSession drops cascading — related entities need explicit insert() calls. Bulk volume is exactly what it's built for." >}}

## The Killer Combo: StatelessSession + useBulkCopyForBatchInsert

Remember the [`useBulkCopyForBatchInsert=true`](/post/java/mssqlserver/fast_insert_part4/) connection string parameter from
Part 4? It transparently converts PreparedStatement
batches to SQL Server's [Bulk Copy protocol](/post/java/mssqlserver/fast_insert_part2/). It works with [StatelessSession](#statelesssession-bare-metal-hibernate) too:

| Strategy | Normal | bulkCopy=true | Speedup |
|----------|--------|---------------|---------|
| saveAll + [Persistable](#fix-implement-persistable) | 2,140 | 1,078 | 2.0x |
| [StatelessSession](#statelesssession-bare-metal-hibernate) | 1,850 | **646** | **2.9x** |

```chart
{
  "type": "bar",
  "data": {
    "labels": ["saveAll+Persistable", "StatelessSession"],
    "datasets": [
      { "label": "bulkCopy flag off (ms)", "data": [2140, 1850], "backgroundColor": "#8b9bb4" },
      { "label": "bulkCopy flag on (ms)", "data": [1078, 646], "backgroundColor": "#1a5fb4" }
    ]
  },
  "options": {
    "plugins": { "title": { "display": true, "text": "100k inserts — bulkCopy flag off vs on (median ms)" } }
  }
}
```

**StatelessSession + bulkCopy=true = 646 ms** — that's ~30% off the [raw Bulk API](/post/java/mssqlserver/fast_insert_part2/)
(499 ms), while still using Hibernate's mapping metadata. For applications that need ORM convenience
with near-JDBC performance, this is the sweet spot.

{{< quiz question="Which Hibernate setup hits 646 ms on 100k inserts?" options="saveAll + Persistable|plain StatelessSession|StatelessSession + bulkCopy flag|StatelessSession + L2 cache" correct="2" explanation="The flag layers the bulk-copy path on StatelessSession's stripped-down persist path — ~3x over StatelessSession alone, ~1.3x off raw Bulk API." >}}

## What batch size should you use?

The knob that matters is `hibernate.jdbc.batch_size` — that's what controls the JDBC
batch the driver actually sends. We swept it for every strategy above (100k inserts,
median of 10, CPU locked at 3.5 GHz).

| `jdbc.batch_size` | saveAll+Persistable | StatelessSession | saveAll+Persistable + bulkCopy | Stateless + bulkCopy |
|------------------:|--------------------:|-----------------:|-------------------------------:|---------------------:|
| 1                 |              fails |           fails |                         13,931 |                 fails |
| 10                |               3,542 |            3,236 |                         19,894 |               19,615 |
| 50                |               2,705 |            2,402 |                          6,001 |                5,823 |
| 100               |               2,418 |            2,106 |                          3,578 |                3,266 |
| 500               |               2,234 |            1,960 |                          1,499 |                1,280 |
| 1,000             |           **2,198** |        **1,896** |                      **1,074** |                  844 |
| 5,000             |               2,146 |            1,846 |                          1,078 |              **638** |
| 10,000            |               2,140 |            1,846 |                          1,096 |                  633 |
| 50,000            |               2,302 |            1,882 |                          1,080 |                  844 |

**Bold** = diminishing-returns knee — the last batch size that still buys a significant
win before gains flatten or regress.

Three takeaways:

- **`batch_size=1` isn't broken — our `SET NOCOUNT ON` is.** NOCOUNT suppresses
  SQL Server's row-count token, so the driver's `executeUpdate()` returns `-1`
  and Hibernate's insert expectation (row count = 1) fails — `StaleStateException`.
  saveAll+Persistable only failed because the stateless test poisoned the pooled
  connection first (it passes in isolation). Strip NOCOUNT and bs=1 just runs
  unbatched at ~14 s.
- **Without the flag, batch size barely matters** once you're at ~500+. The plain
  paths sit at ~1.8–2.4 s; round-trips only hurt below ~100 (3.2–3.5 s at 10).
- **With `useBulkCopyForBatchInsert`, batch size *is* the tuning knob.** Each
  `executeBatch()` becomes one bulk-copy stream, so `batch_size=10` is the cliff
  edge: 10,000 tiny streams, ~20 s — *slower than `batch_size=1`*, which skips
  batching entirely. [StatelessSession + bulkCopy](#the-killer-combo-statelesssession--usebulkcopyforbatchinsert) bottoms out at **~10,000** (633 ms).

One gotcha remains if you keep `SET NOCOUNT ON`: `batch_size` unset or 1 fails
the same way — set it to 5,000–10,000.

## How do these times compare to earlier posts?

Same rig, same 100k scale — the unflagged numbers sit within a few percent of
[Part 2's October re-benchmark](/post/java/mssqlserver/fast_insert_part2/):

| Match-up (100k rows, large batch) | Earlier posts | Part 5 | Verdict |
|-----------------------------------|---------------|--------|---------|
| StatelessSession vs raw JDBC      | JdbcTemplate 1,873 ([Part 2 re-run](/post/java/mssqlserver/fast_insert_part2/)) | **1,850** | within ~1% — ORM tax gone |
| `saveAll + Persistable` vs `persist()` | Hibernate persist 2,064 ([Part 1 re-run](/post/java/mssqlserver/persist_vs_saveall/)) | 2,140 | ~4% apart — same code path, as expected |
| Hibernate + bulkCopy vs raw Bulk API | Bulk Copy API 499 ([Part 2](/post/java/mssqlserver/fast_insert_part2/)) | 646 / 1,078 | ~30% off for StatelessSession, ~2.2x for the regular session |

Batch sizes are each post's large-batch optimum (~5,000–10,000); the Bulk API itself
wobbles 360–500 ms across runs.

- **Rankings held for three years — absolute times didn't.** The JDBC and Hibernate paths run
  ~20–25% slower than the 2023 originals — environment drift (kernel mitigations, SQL Server 2025
  on Linux).
- **StatelessSession really is bare-metal Hibernate.** ~1% off JdbcTemplate means the
  entity-tracking tax is gone — what's left is SQL generation and parameter binding.
- **`saveAll + Persistable` is `persist()`.** A ~4% gap on identical code is pure run-to-run
  noise — the delegation does exactly what it promises and nothing more.
- **Raw Bulk API still wins — but barely for Hibernate.** StatelessSession + flag comes within
  ~30% (646 vs 499); the regular session path lands ~2.2x off (1,078). The flag's ~2–3x speedup
  also matches [Part 4](/post/java/mssqlserver/fast_insert_part4/), measured there at 1M rows.
- **[Part 3](/post/java/mssqlserver/fast_insert_part3/)'s multi-value INSERT still beats the ORM
  path** — ~450 ms at 400 objects per statement, under 646 and using nothing but plain JDBC.
  It costs you hand-written SQL; StatelessSession keeps the ORM mapping.

## The one thing to remember

> **StatelessSession + [`useBulkCopyForBatchInsert=true`](/post/java/mssqlserver/fast_insert_part4/) = 646 ms** for 100k inserts — ~30% off
> [raw Bulk Copy](/post/java/mssqlserver/fast_insert_part2/) (499 ms), with ORM mapping metadata still working for you. If you need
> Hibernate's convenience without paying Hibernate's full price, that's the combination.

If you can only make one change to speed up a `saveAll()` call: implement [`Persistable<T>`](#fix-implement-persistable) with
`isNew = true`. It eliminates the pre-INSERT SELECTs and makes `saveAll` ~12x faster — a 10-line
code change for a ~12x result.

## Test yourself

{{< quiz question="Which Hibernate features help close the gap to raw JDBC?" options="StatelessSession|Implementing Persistable with isNew=true|useBulkCopyForBatchInsert=true|Second-level cache" correct="0,1,2" multi="true" explanation="StatelessSession, Persistable (isNew=true) and useBulkCopyForBatchInsert together close about 90% of the gap. The second-level cache is a read optimization and does not help inserts." >}}

<!--
Next: [Part 6 — Parallel Inserts](/post/java/mssqlserver/fast_insert_part6/) splits the data across
multiple connections to see how far parallel threads can push it.
-->
