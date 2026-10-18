---
title: "Fastest way to insert the data in MS SQL - Part 7 Index Impact"
date: 2026-10-18
draft: true
usePageBundles: true
featureImage: 'java_sending_data_to_mssql_server.jpg'
featureImageAlt: 'java sending data to mssql server'
shareImage: 'java_sending_data_to_mssql_server.jpg'
tags: [ "java", "ms sql server", "indexes" ]
categories: [ "java", "sql" ]
series: [ "Fastest Way to Insert Data in MS SQL" ]
sourceCode: 'https://github.com/mmarko88/blog-examples/tree/main/fastest-insert/part7-index-impact'
---

## Introduction

So far, all our benchmarks ran against a table with only a primary key (the clustered index).
Production tables typically have several non-clustered indexes for query performance. Every INSERT
must update each non-clustered index's B-tree — how much does this cost?

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
| 0 | 784 | — |
| 1 | 1,829 | +133% |
| 3 | 3,632 | +363% |
| 5 | 5,290 | +575% |

### JdbcTemplate

| Indexes | Avg ms | Slowdown vs 0 |
|---------|--------|---------------|
| 0 | 4,572 | — |
| 1 | 5,672 | +24% |
| 3 | 6,614 | +45% |
| 5 | 10,330 | +126% |

### Hibernate Persist

| Indexes | Avg ms | Slowdown vs 0 |
|---------|--------|---------------|
| 0 | 3,209 | — |
| 1 | 4,676 | +46% |
| 3 | 7,563 | +136% |
| 5 | 8,564 | +167% |

## Analysis

### Bulk API is the most sensitive

With 0 indexes, Bulk API is by far the fastest (784ms). But with 5 indexes, it's 5,290ms — slower
than JdbcTemplate with 0 indexes. The reason: Bulk API uses minimal-logging INSERT operations that
bypass some of the normal logging overhead. But when non-clustered indexes exist, the engine must
update each index B-tree for every row, and this overhead dominates.

### JdbcTemplate is the most resilient

JdbcTemplate's index penalty is relatively modest: only 2.3x slower with 5 indexes vs 0. Since
JdbcTemplate sends standard INSERT statements, the SQL Server optimizer can plan the index
maintenance more efficiently.

### The crossover point

With 3+ indexes, all strategies converge to similar performance. The strategy choice matters less
when index maintenance dominates the insert cost.

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

## Summary

| Indexes | Best strategy | Avg ms |
|---------|--------------|--------|
| 0 | Bulk API | 784 |
| 1 | Bulk API | 1,829 |
| 3 | Hibernate | 7,563 (all strategies ~similar) |
| 5 | Hibernate | 8,564 (all strategies ~similar) |

Indexes are the hidden cost of bulk inserts. A table with 5 non-clustered indexes is **6-7x slower**
to insert into than a table with only a primary key, regardless of strategy.

Next: [Part 8 — TVP and Plain JDBC](/post/java/mssqlserver/fast_insert_part8/) explores
Table-Valued Parameters and bare-metal JDBC without any ORM overhead.
