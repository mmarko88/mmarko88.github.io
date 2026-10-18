---
title: "Fastest way to insert the data in MS SQL - Part 8 TVP and Plain JDBC"
date: 2026-10-18
draft: true
usePageBundles: true
featureImage: 'java_sending_data_to_mssql_server.jpg'
featureImageAlt: 'java sending data to mssql server'
shareImage: 'java_sending_data_to_mssql_server.jpg'
tags: [ "java", "ms sql server", "jdbc" ]
categories: [ "java", "sql" ]
series: [ "Fastest Way to Insert Data in MS SQL" ]
sourceCode: 'https://github.com/mmarko88/blog-examples/tree/main/fastest-insert/part8-tvp-jdbc'
---

## Introduction

This final part explores two approaches that bypass Hibernate entirely:

1. **Table-Valued Parameters (TVPs)** — SQL Server's native way to pass an entire result set as a
   single parameter
2. **Plain JDBC** — bare-metal PreparedStatement batching without any ORM

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

## Final Rankings: All Strategies Combined

| Rank | Strategy | 100k avg ms | Part |
|------|----------|-------------|------|
| 1 | Multi-value 400 + bulkCopy=true | **135** | 3+4 |
| 2 | Parallel Bulk API 4t | 330 | 6 |
| 3 | Multi-value 400 + 8 threads | 368 | 3+6 |
| 4 | Parallel Bulk API 8t | 434 | 6 |
| 5 | Bulk API | 492 | 2 |
| 6 | Parallel JdbcTemplate 16t | 608 | 6 |
| 7 | TVP (batch=5000) | 818 | 8 |
| 8 | StatelessSession + bulkCopy | 1,075 | 5+4 |
| 9 | JdbcTemplate + bulkCopy | 1,373 | 4 |
| 10 | Plain JDBC + bulkCopy | 1,516 | 8+4 |
| 11 | Hibernate + bulkCopy | 2,144 | 4 |
| 12 | JDBC PreparedStatement | 2,423 | 2 |
| 13 | StatelessSession | 2,650 | 5 |
| 14 | JdbcTemplate | 2,985 | 2 |
| 15 | Persistable saveAll | 3,426 | 5 |
| 16 | Plain JDBC | 3,905 | 8 |
| 17 | Hibernate persist | 4,048 | 1 |
| 18 | saveAll (original) | 27,794 | 1 |

## Key Takeaways from the Series

1. **`useBulkCopyForBatchInsert=true`** is the single most impactful optimization — one connection
   string parameter gives 2-2.5x speedup to ALL strategies.

2. **Multi-value INSERT + bulkCopy (135ms)** is the absolute fastest — combining SQL batching with
   the bulk copy protocol.

3. **Hibernate's overhead is ~3%** for batch inserts. The ORM is not the bottleneck; the network
   and database engine are.

4. **Parallelism helps 2-7x** depending on the strategy and thread count.

5. **Indexes are the hidden cost** — 5 non-clustered indexes make inserts 6-7x slower regardless
   of strategy.

6. **TVPs are underrated** — 3rd fastest single-thread strategy with a clean API.

The full benchmark code is available in the
[blog-examples](https://github.com/mmarko88/blog-examples/tree/main/fastest-insert) repository.
