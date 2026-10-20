---
title: "How to Set Up a Reliable Java Benchmarking Environment for SQL Server"
date: 2026-10-19
draft: true
usePageBundles: true
description: "Your benchmark numbers are only as reliable as your environment. Hardware, OS, JVM flags, SQL Server config, and the warm-up protocol that makes the difference."
tags: ["java", "ms sql server", "benchmarks", "performance"]
categories: ["java", "sql"]
series: ["Fastest Way to Insert Data in MS SQL"]
# featureImage: 'TODO.svg'
# featureImageAlt: 'TODO'
# shareImage: 'TODO.png'
---

The 4,222 benchmark runs in the
[Fastest MS SQL Inserts](/series/fastest-way-to-insert-data-in-ms-sql/) series were measured
on the same machine, under the same conditions, every time. When I varied the conditions —
ran tests during a Windows Update, let SSMS hold open a query window, forgot to close Docker
Desktop — the numbers shifted by 15-40%. Not the relative ranking (Bulk API still beat
Hibernate), but the absolute milliseconds. And absolute milliseconds are what people screenshot.

This post documents the benchmarking environment I settled on after too many "why is this run
20% slower than yesterday?" debugging sessions. It's not a JMH tutorial — JMH is excellent but
overkill for application-level insert benchmarks that each take 2-10 seconds. It's a checklist
for making your numbers *reproducible*.

> **The one thing to take from this post:** a benchmark that runs on different hardware, with
> different background processes, at different times of day, is measuring noise. Fix the
> environment first; tune the strategy second.

## Hardware: what actually matters

Four components, ranked by impact on insert benchmark variability:

### 1. Storage (biggest factor)

| Storage | INSERT 100k rows (Bulk API) | Variability (10-run CoV) |
|---------|---|---|
| NVMe SSD | 492 ms | 3.1% |
| SATA SSD | 510 ms | 4.8% |
| HDD 7200 RPM | 1,840 ms | 22% |

**An HDD makes inserts 3.7x slower** and the run-to-run variability jumps from 3% to 22%.
On an HDD, the strategy comparison is unreliable — the disk I/O noise drowns the
strategy-vs-strategy signal. Use an SSD. If you're on a laptop, your built-in NVMe is fine.

### 2. CPU cores

Parallel benchmarks (Part 6) need real cores. On a 4-core / 8-thread CPU, using 8 threads
gives a real speedup; using 16 doesn't, because half the "threads" share a physical core. For
single-threaded benchmarks, one fast core is enough; clock speed matters more than core count.

### 3. RAM

SQL Server Express uses up to 1.4 GB of buffer pool. The JVM needs 512 MB to 4 GB depending
on the GC experiment. **8 GB total** is the minimum that keeps both comfortable without paging.
If you see `tempdb` spilling more than expected, check `Task Manager` for memory pressure.

### 4. Network

**Run everything on localhost.** Any network hop between the JVM and SQL Server changes the
relative ranking of strategies. The simulated-latency experiment in Part 8 showed that even
1 ms of added RTT per batch shifts JdbcTemplate from "15% slower than Bulk API" to "35%
slower." On localhost, network latency is 0 — the benchmark measures only the insert strategy.

## Operating system

**Windows is the native environment.** SQL Server on Windows is the most-tested configuration.
The numbers in the blog series were measured on Windows 11 with SQL Server 2025 Express.

**Linux works.** SQL Server on Linux (native or Docker) produces comparable results. The main
difference is I/O scheduling: Linux's `deadline` or `mq-deadline` scheduler handles the
concurrent-writer workload (Part 6) slightly differently from NTFS.

**macOS: use Docker.**

```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong!Password" \
  -p 1433:1433 --name sql1 \
  -d mcr.microsoft.com/mssql/server:2022-latest
```

The Docker overhead adds ~5-10% to absolute numbers but doesn't change the relative ranking
between strategies. That's good enough for comparative benchmarks.

## SQL Server configuration

### What to leave at defaults

| Setting | Default | Tempting to change | Why not |
|---------|---------|--------------------|---------|
| `AUTO_UPDATE_STATISTICS` | ON | OFF ("reduce overhead") | Inserts are **50% slower** with stats off (measured in Part 7) |
| `MAXDOP` | 0 (auto) | Set to 1 ("reduce contention") | Parallelism helps INSERT...SELECT; leave it alone |
| `Recovery model` | FULL | SIMPLE ("less log") | SIMPLE is fine for benchmarks; FULL is fine too. The difference is < 5% on INSERT. |
| `Fill factor` | 100 | 70 ("leave room") | 100 is optimal for sequential INSERTs (measured in Part 7) |

### What to set explicitly

- **`tempdb` on a separate drive** from your test database if possible. Part 8's tempdb-spill
  experiment showed a 2x slowdown when tempdb and the target table compete for the same disk.
- **Max memory:** on Express, this is capped at 1.4 GB automatically. On Developer/Standard,
  set `max server memory` to leave 2 GB for the OS and JVM.
- **Lock pages in memory:** not needed for benchmarks; it's a production setting.

## JVM configuration

### Heap size

```xml
<!-- In pom.xml (surefire plugin) -->
<argLine>-Xmx1g -XX:TieredStopAtLevel=1</argLine>
```

`-Xmx1g` is the default for most tests. The GC experiments in Part 5 explicitly override this
to `-Xmx512m` and `-Xmx4g` to measure the impact. **Don't use `-Xms` = `-Xmx`** for benchmarks
— you want the JVM to start small and grow, which is what production does.

`-XX:TieredStopAtLevel=1` disables C2 compilation, which speeds up test startup. For
insert benchmarks where each test method runs for 2-10 seconds, the C2 warm-up time
(30-60 seconds) would dominate the measurement. In production, you'd leave C2 on.

### GC choice

Part 5 measured four GC configurations. Finding: **GC choice has essentially no impact on
insert throughput.** G1 512 MB, G1 4 GB, Parallel 2 GB, and ZGC 4 GB all produced numbers
within 5% of each other. Use the default (G1) and don't overthink it.

### Timezone and encoding

```
-Duser.timezone=UTC -Dfile.encoding=UTF-8
```

Not for performance — for determinism. String encoding differences between machines can cause
`NVARCHAR` columns to behave differently if the JVM and SQL Server disagree on the code page.
UTC prevents date-boundary edge cases in timestamps.

## What to close before running

A checklist I run mentally before every benchmark session:

- [ ] **SSMS** — close all query windows. An open query window can hold shared locks on system
  tables that add 50-200 ms of contention per batch.
- [ ] **Docker Desktop** — if SQL Server is running natively, Docker's Hyper-V backend competes
  for disk I/O. Close it.
- [ ] **Windows Update / Defender scans** — pause if possible. A full-disk scan during a
  benchmark adds 30-50% noise.
- [ ] **IDE indexing** — IntelliJ's background indexer writes to the same disk as SQL Server's
  data files. Wait for it to finish.
- [ ] **Other test runs** — don't run two benchmark sessions in parallel. The SQL Server lock
  manager is the bottleneck, not your CPU.

## Warm-up and run methodology

Each test class in the project follows this protocol:

1. **Warm-up:** 1 untimed run. This fills the JVM's JIT cache, SQL Server's buffer pool, and
   the OS file cache. Without it, the first timed run is always 20-40% slower.
2. **Timed runs:** 10 runs. Each run inserts 100,000 rows, records the wall-clock milliseconds,
   then truncates the table.
3. **Reported metric:** the **median** of the 10 timed runs. Not the mean — the median is
   robust to the occasional GC pause or I/O spike that inflates one run.
4. **Between-run cleanup:** `TRUNCATE TABLE person` + `DBCC DROPCLEANBUFFERS` (optional, for
   cold-cache experiments only).

### Why not JMH?

JMH is the gold standard for Java microbenchmarks. For insert benchmarks where each iteration
takes 2-10 seconds and involves a real database, JMH adds complexity (forking, blackholes,
state objects) that doesn't buy proportional reliability. A simple timed loop with 10 runs and
a median is sufficient when the operation under test is already measured in seconds, not
nanoseconds.

If your insert benchmarks are sub-millisecond (in-memory tables, tiny batches), use JMH. For
100,000-row bulk inserts, the methodology above is enough.

## Common pitfalls that silently invalidate results

Five mistakes I made at least once:

1. **Running benchmarks on battery power.** Laptop CPUs throttle on battery. Plug in.
2. **Comparing runs from different days without checking baseline.** Always run the baseline
   strategy (Bulk API, single thread) first. If it's 15% slower than yesterday, your
   environment changed — don't trust the other numbers.
3. **Forgetting to `TRUNCATE` between runs.** Inserting into a table with 100k existing rows
   is a different benchmark than inserting into an empty table (index maintenance, page splits).
4. **Using `System.currentTimeMillis()` on Windows.** Windows' default timer resolution is
   ~15 ms. Use `System.nanoTime()` for timing. (The project already does this.)
5. **Changing SQL Server settings mid-session.** If you toggle `AUTO_UPDATE_STATISTICS` to test
   its impact, restart the benchmark from scratch — the cached plans from the previous setting
   are still in memory.

## Quick-start checklist

Copy this into your notes before your first benchmark session:

```
[ ] SSD storage (not HDD)
[ ] 8 GB RAM minimum
[ ] SQL Server running on localhost
[ ] testdb database created
[ ] application.properties credentials set
[ ] SSMS closed (no open query windows)
[ ] Docker Desktop closed (if SQL Server is native)
[ ] Laptop plugged in
[ ] Run baseline first: mvn test -pl benchmarks -Dtest="FastestInsertApplicationTests#testBulkApiInsert"
[ ] Compare new strategy's median against baseline median
```

## Related reading

- [Fastest MS SQL Inserts — Part 1: Hibernate Batching](/post/java/mssqlserver/persist_vs_saveall/) — start of the series
- [Fastest MS SQL Inserts — Part 8: TVP, JDBC, Final Ranking](/post/java/mssqlserver/fast_insert_part8/) — full ranking and 50 takeaways
- [What Is Memory Churn and How to Avoid It in Java](/post/java/memory_churn/) — JMH methodology for sub-millisecond benchmarks (where JMH *is* the right tool)
