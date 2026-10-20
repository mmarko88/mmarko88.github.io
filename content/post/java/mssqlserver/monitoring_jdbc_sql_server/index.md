---
title: "How to Monitor JDBC Communication With SQL Server"
date: 2026-10-19
draft: true
usePageBundles: true
description: "Three tools to see what your Java app sends to SQL Server: DMV connection stats, Extended Events, JDBC driver logging. Real data from 6 insert strategies."
tags: ["java", "ms sql server", "jdbc", "monitoring", "tds"]
categories: ["java", "sql"]
series: ["Fastest Way to Insert Data in MS SQL"]
# featureImage: 'TODO.svg'
# featureImageAlt: 'TODO'
# shareImage: 'TODO.png'
---

When two of our insert strategies finished in the same elapsed time but one used 4 network
reads while the other used 55, I realized the benchmarks in the
[Fastest MS SQL Inserts](/series/fastest-way-to-insert-data-in-ms-sql/) series were measuring
the *result* without seeing the *mechanism*. To understand *why* TVP was fast, I needed to see
what the JDBC driver actually sent over the wire — and what SQL Server did with it.

This post documents three complementary tools I used to observe the communication between a Java
application and SQL Server. None of them require Wireshark or special drivers. All of them are
available on a standard developer machine.

> **The one thing to take from this post:** you don't need a packet sniffer to understand what
> your app sends to SQL Server. A DMV query, an Extended Events session, or a JDBC logging flag
> tells you everything you need — and the data is more useful than raw TCP.

## Tool 1: DMV connection statistics (fastest, zero setup)

SQL Server exposes live network statistics per connection through the `sys.dm_exec_connections`
and `sys.dm_exec_sessions` dynamic management views. One query, no setup, no tracing
infrastructure.

```sql
SELECT
    c.net_packet_size,
    c.num_reads,        -- TDS packets received from client
    c.num_writes,       -- TDS packets sent to client
    s.total_elapsed_time,
    s.reads AS logical_reads,
    s.writes AS logical_writes,
    s.row_count
FROM sys.dm_exec_connections c
JOIN sys.dm_exec_sessions s ON s.session_id = c.session_id
WHERE s.session_id = @@SPID;
```

### What each column means

| Column | What it tells you |
|--------|-------------------|
| `net_packet_size` | The negotiated TDS packet size (default 8058 bytes). A larger packet carries more rows per round-trip. |
| `num_reads` | Total TDS packets the server **received** from the Java app during this session. Each `addBatch()` call, each Bulk Copy row, each TVP data table generates reads. |
| `num_writes` | Total TDS packets the server **sent back** — acknowledgments, result sets, error responses. Fewer writes = less server-to-client chatter. |
| `logical_reads` | Data pages read from the buffer pool. High values mean SQL Server is checking existing data (merge operations, constraint checks, index lookups). |
| `logical_writes` | Data pages written. Correlates with the actual rows being inserted. |
| `row_count` | Rows affected by the last statement. Not cumulative — snapshot per query. |

### How I use it in benchmarks

I query the DMV **before and after** each insert, then compute the delta:

```java
private void captureConnectionStats(String label) {
    List<Map<String, Object>> stats = jdbcTemplate.queryForList(
        "SELECT c.net_packet_size, c.num_reads, c.num_writes, " +
        "s.reads AS logical_reads, s.writes AS logical_writes " +
        "FROM sys.dm_exec_connections c " +
        "JOIN sys.dm_exec_sessions s ON s.session_id = c.session_id " +
        "WHERE s.session_id = @@SPID"
    );
    System.out.printf("[TDS] %s: reads=%s writes=%s%n",
        label, stats.get(0).get("num_reads"), stats.get(0).get("num_writes"));
}

@Test
void strategy_bulkApi() {
    captureConnectionStats("BEFORE");
    fastInsertService.insertBulkApi(people, batchSize);
    captureConnectionStats("AFTER");
}
```

### Our results (1,000 rows, batch size 100)

| Strategy | Network Reads (delta) | Network Writes (delta) | Interpretation |
|----------|:---:|:---:|---|
| **TVP** | **4** | **4** | 1 stored-proc call = 1 round-trip for all 1,000 rows |
| **Plain JDBC addBatch** | **4** | **4** | Batched into 1 RPC call per batch group |
| **Multi-value INSERT (200)** | 39 | 7 | 5 SQL statements (1,000 / 200), each parsed and planned |
| **Bulk API** | 38 | 28 | Many TDS Bulk Copy packets (row-by-row framing) |
| **JdbcTemplate** | 36 | 16 | ~10 batch commands with acknowledgments |
| **Hibernate persist** | **55** | **35** | Most chatty — flush/clear cycles, entity-state sync |

The surprise: **TVP and Plain JDBC produce just 4 network reads for 1,000 rows.** Hibernate
generates 14x more. The bulk-copy protocol is chattier than TVP because each row occupies its
own TDS frame, even though the elapsed time is faster (the TDS frames are cheaper to parse than
SQL commands).

### When to use DMV stats

- **Quick sanity check** during development — "is my batch really batching?"
- **Comparing strategies** — the delta reveals whether the driver is sending one big blob or
  many small ones.
- **Production monitoring** — query the DMV periodically to watch for chatty connections.

### Limitations

- Cumulative per session, not per query. You need the before/after delta.
- `num_reads`/`num_writes` count TDS packets, not SQL statements. One TDS packet can carry
  multiple SQL statements.
- Doesn't tell you *what* was inside each packet — for that, use Extended Events or JDBC
  logging.

## Tool 2: SQL Server Extended Events (server-side capture)

Extended Events (XE) is SQL Server's built-in tracing infrastructure. It captures what SQL
Server *receives* — the parsed SQL commands, the RPC calls, the timing and row counts — at the
server side.

### Setting up the capture

```sql
CREATE EVENT SESSION TDS_Benchmark ON SERVER
ADD EVENT sqlserver.sql_batch_completed (
    ACTION (sqlserver.session_id, sqlserver.sql_text, sqlserver.database_name,
            package0.event_sequence)
    WHERE sqlserver.database_name = N'testdb'
),
ADD EVENT sqlserver.rpc_completed (
    ACTION (sqlserver.session_id, sqlserver.sql_text, package0.event_sequence)
    WHERE sqlserver.database_name = N'testdb'
)
ADD TARGET package0.event_file (SET filename = N'C:\temp\tds_benchmark.xel', max_file_size = 64)
WITH (MAX_MEMORY = 4096 KB, MAX_DISPATCH_LATENCY = 1 SECONDS);

ALTER EVENT SESSION TDS_Benchmark ON SERVER STATE = START;
```

### What to capture

| Event | What it tells you |
|-------|-------------------|
| `sql_batch_completed` | A SQL text batch (one or more statements) finished. Captures the SQL text, duration, CPU, reads, writes, row count. |
| `rpc_completed` | A stored procedure or parameterized query finished via an RPC call. TVP and `addBatch()` use this path. |
| `sql_batch_starting` | When the batch started — useful for timing analysis. |

### How to read the captured data

```sql
-- Stop the session when done
ALTER EVENT SESSION TDS_Benchmark ON SERVER STATE = STOP;

-- Query the file target (much faster than ring_buffer for large captures)
SELECT
    event_data.value('(event/@name)[1]', 'varchar(50)') AS event_type,
    event_data.value('(event/data[@name="duration"]/value)[1]', 'bigint') AS duration_us,
    event_data.value('(event/data[@name="row_count"]/value)[1]', 'bigint') AS row_count,
    LEFT(event_data.value('(event/data[@name="statement"]/value)[1]', 'nvarchar(max)'), 200) AS sql_text
FROM sys.fn_xe_file_target_read_file('C:\temp\tds_benchmark*.xel', NULL, NULL, NULL)
CROSS APPLY (SELECT CAST(event_data AS xml)) AS t(event_data);
```

### What the events reveal

For each insert strategy, the XE trace shows:

- **Hibernate persist:** many `sql_batch_completed` events — one per batch flush cycle, each
  containing an `INSERT` statement with parameters.
- **TVP:** one `rpc_completed` event per stored-procedure call. The SQL text shows
  `EXEC usp_InsertPersons @persons = ...` — the entire data table sent as a single parameter.
- **Bulk API:** no `sql_batch_completed` events at all — Bulk Copy uses the TDS Bulk Load
  protocol, which is invisible to `sql_batch_completed`. You need the `bulk_insert_completed`
  event instead.

### Limitations

- Ring buffer target is slow for large captures (999+ events = XML parsing timeout). Use a
  **file target** (`event_file`) for anything more than a quick check.
- Bulk Copy operations don't fire `sql_batch_completed` — they use a different TDS protocol
  path. Add `sqlserver.bulk_insert_completed` to see them.
- XE adds ~1-3% overhead to the captured workload. Acceptable for analysis; don't leave it on
  in production benchmarks.

## Tool 3: JDBC driver TDS logging (client-side view)

The Microsoft JDBC Driver for SQL Server has built-in TDS-level logging. When enabled, it logs
every TDS command the driver sends — the exact framing, parameters, and protocol messages.

### Enabling it

Add these parameters to your JDBC URL:

```
jdbc:sqlserver://localhost:1433;databaseName=testdb;
  encrypt=true;trustServerCertificate=true;
  logger=java.util.logging.Logger;
  loggerLevel=FINE
```

Or configure programmatically via `java.util.logging`:

```java
Logger.getLogger("com.microsoft.sqlserver.jdbc").setLevel(Level.FINE);
```

### What it shows

With logging at `FINE`, the driver logs:
- Every TDS packet sent and received (direction, size, type)
- SQL text sent to the server
- Parameter bindings for parameterized queries
- Bulk Copy frame headers and row counts
- TVP data table metadata and row packaging

At `FINEST`, you get hex dumps of the raw TDS bytes — useful for protocol-level debugging but
very verbose.

### When to use JDBC logging vs. Extended Events

| Question | Use this tool |
|----------|---------------|
| "What SQL does my app send?" | Extended Events (`sql_batch_completed`) |
| "How does the driver package the data?" | JDBC logging (TDS frame structure) |
| "How many network round-trips per batch?" | DMV `num_reads` / `num_writes` |
| "What does SQL Server do with what it receives?" | Extended Events (`rpc_completed` + execution stats) |

The three tools are complementary. DMV stats give you the count; XE gives you the server's
view; JDBC logging gives you the client's view. Use all three and compare.

## Putting it together: a monitoring workflow

For any new insert strategy I benchmark, I run this three-step workflow:

1. **DMV before/after** — how many TDS packets did the insert produce? (5 seconds)
2. **XE file capture** — what SQL commands or RPC calls did SQL Server process? (30 seconds)
3. **JDBC FINE logging** — how did the driver package the data? (enable, run one insert, read the log)

The first step is enough for most comparisons. The second adds "what" to the "how many." The
third is only needed when the protocol-level framing matters (Bulk Copy vs. TVP vs. regular
INSERT).

## Related reading

- [Fastest MS SQL Inserts — Part 8: TVP, JDBC, Final Ranking](/post/java/mssqlserver/fast_insert_part8/) — the series this data supports
- [How to Set Up a Reliable Benchmarking Environment](/post/java/mssqlserver/benchmarking_environment/) — environment setup for repeatable results
- [Java Benchmarking With JMH](/post/java/java_benchmarking_jmh/) — when to use JMH vs the timed-loop approach
