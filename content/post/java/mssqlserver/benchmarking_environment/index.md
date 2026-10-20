---
title: "How to Set Up a Reliable Java Benchmarking Environment for SQL Server"
date: 2026-10-19
toc: true
draft: true
usePageBundles: true
description: "Your benchmark numbers are only as reliable as your environment. Hardware, OS, JVM flags, SQL Server config, and the warm-up protocol that makes the difference."
tags: ["java", "ms sql server", "benchmarks", "performance"]
categories: ["java", "sql"]
series: ["Fastest Way to Insert Data in MS SQL"]
featureImage: 'benchmarking-env-hero.svg' # Series-style card: SSD vs HDD comparison + 6-item quick-start checklist.
featureImageAlt: 'Benchmarking environment checklist: NVMe SSD at 492 ms with 3% variability vs HDD 7200 RPM at 1,840 ms with 22% variability, 3.7x slower. Quick-start: SSD, 8 GB RAM, localhost, close SSMS, plugged in, run baseline first.'
shareImage: 'share.png' # 1200x630 PNG for social crawlers.
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

### 2. CPU and processor setup

Parallel benchmarks (Part 6) need real cores. On a 4-core / 8-thread CPU, using 8 threads
gives a real speedup; using 16 doesn't, because half the "threads" share a physical core. For
single-threaded benchmarks, one fast core is enough; clock speed matters more than core count.

**Power plan:** set to **High Performance** (Windows) or `performance` governor (Linux). The
default "Balanced" plan throttles CPU frequency during I/O waits, which is exactly when an
insert benchmark is waiting for SQL Server. On Balanced, I've seen 10-15% run-to-run variance
disappear when switching to High Performance.

```powershell
# Windows — set power plan to High Performance
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c
```

```bash
# Linux — set CPU governor
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

**Turbo Boost / Precision Boost:** leave enabled. Disabling it pins the CPU to base frequency,
which is slower. The variance from turbo is small (1-3%) compared to the variance from power
plan (10-15%).

**Hyper-threading:** leave enabled. The parallel benchmarks (Part 6) show that HT threads
give a modest speedup (8 HT threads beat 4 physical cores by ~20%). Disabling HT doesn't help
benchmarks — it just makes the parallel tests slower.

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

### OS-level tuning (Windows)

These settings reduce background noise that inflates run-to-run variance:

- **Windows Defender exclusions.** Add the SQL Server data directory and the JDK's `bin/`
  folder to the real-time scanning exclusion list. Without this, Defender scans every `.mdf`
  write and every `javac` invocation.

  ```powershell
  Add-MpPreference -ExclusionPath "C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\DATA"
  Add-MpPreference -ExclusionPath "C:\Program Files\Eclipse Adoptium\jdk-17*\bin"
  ```

- **Disable Windows Search indexing** on the SQL Server data drive. The indexing service writes
  to the same drive as your database files.

- **Page file.** Leave it system-managed on the OS drive. If SQL Server and the page file are
  on the same SSD, paging spikes add noise — but on 8+ GB of RAM with a 1.4 GB Express instance,
  paging shouldn't happen.

- **Superfetch / SysMain service.** On SSDs, Windows's prefetching is unnecessary and can cause
  unexpected I/O during benchmarks. It's safe to set the service to Manual for benchmark
  sessions.

### OS-level tuning (Linux)

- **I/O scheduler:** `mq-deadline` for NVMe, `deadline` for SATA SSD. Check with
  `cat /sys/block/nvme0n1/queue/scheduler`.
- **Transparent Huge Pages (THP):** leave at default (`madvise`). Forcing `always` can cause
  latency spikes during memory-mapped operations.
- **vm.swappiness:** set to `10` (default is 60). Reduces swapping under memory pressure.

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

## Other components that influence results

Four more factors I've seen shift benchmark numbers by 5-20%:

**1. SQL Server instant file initialization.** When SQL Server grows a data file, it can either
zero-fill the new pages (slow) or mark them as available immediately (fast). Enable instant
file initialization by granting the SQL Server service account the `SE_MANAGE_VOLUME_NAME`
privilege. Without it, growing `testdb` mid-benchmark adds a multi-second stall.

```sql
-- Check if it's enabled:
EXEC sp_configure 'show advanced options', 1; RECONFIGURE;
SELECT instant_file_initialization_enabled FROM sys.dm_server_services WHERE process_id IS NOT NULL;
```

**2. SQL Server max degree of parallelism (MAXDOP).** Leave at 0 (auto) for insert benchmarks.
Setting MAXDOP=1 forces serial execution, which hurts `INSERT...SELECT` (Part 8) by 30-40%.
The optimizer knows when parallelism helps and when it doesn't.

**3. Antivirus on the data directory.** Mentioned above under Windows Defender, but other AV
products (McAfee, Symantec, CrowdStrike) have the same impact. Any AV that scans `.mdf`,
`.ldf`, or `.ndf` file writes in real time adds 5-15% overhead to every insert benchmark.

**4. Virtual machine overhead.** Running SQL Server inside a VM (Hyper-V, VMware, VirtualBox)
adds 5-10% overhead on I/O-bound workloads compared to bare metal. Docker on WSL2 is similar.
For *comparative* benchmarks (strategy A vs B), this doesn't matter — the overhead is
proportional. For *absolute* numbers, bare metal is the reference.

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
