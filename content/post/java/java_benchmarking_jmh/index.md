---
title: "Java Benchmarking With JMH: What Each Parameter Does and Why"
date: 2026-10-19
draft: true
usePageBundles: true
description: "JMH explained from first principles: why warm-up iterations exist, what each @Benchmark parameter controls, and when to use JMH vs a simple timed loop."
tags: ["java", "benchmarks", "performance", "jmh"]
categories: ["java", "performance"]
featureImage: 'jmh-hero.svg' # Three problem/solution cards: JIT→Warmup, Dead-code→Blackhole, Pollution→Fork + when-to-use matrix.
featureImageAlt: 'Three JMH solutions to benchmark problems: warm-up iterations fix JIT noise, Blackhole.consume() prevents dead-code elimination, @Fork isolates benchmarks. Decision matrix: nanoseconds use JMH, seconds use timed loop.'
shareImage: 'share.png' # 1200x630 PNG for social crawlers.
---

When I started the
[Fastest MS SQL Inserts](/series/fastest-way-to-insert-data-in-ms-sql/) series, the first
question I had to answer wasn't "which strategy is fastest?" It was: **how do I measure it
reliably?** Java has a well-known answer to this — JMH (Java Microbenchmark Harness) — but
knowing *that* JMH exists doesn't tell you *why* it works, or *when* it's the right tool.

This post walks through JMH from first principles: what happens when Java code gets "warm,"
why naively timing a loop gives wrong answers, what each JMH parameter controls, and when a
simpler approach (timed loop + median) is good enough.

> **The one thing to take from this post:** JMH isn't magic. It's a controlled way to deal
> with JIT compilation, GC pauses, and OS noise. Understanding *why* it does what it does
> lets you decide when you need it and when you don't.

## Why you can't just time a loop

The simplest benchmark anyone writes:

```java
long start = System.nanoTime();
for (int i = 0; i < 1_000_000; i++) {
    someMethod();
}
long elapsed = System.nanoTime() - start;
```

Three problems with this:

**1. JIT compilation changes what you're measuring.** The JVM starts by interpreting bytecode.
After ~10,000 invocations, the C1 compiler kicks in with a fast, basic compilation. After
~40,000, C2 recompiles with full optimizations (inlining, escape analysis, loop unrolling).
Your first million iterations execute progressively faster code — the loop is measuring a
*mix* of interpreted, C1, and C2 performance. Production runs on C2-compiled code only.

**2. Dead-code elimination.** If `someMethod()` returns a value you never use, the JIT compiler
may eliminate the call entirely. Your benchmark measures... nothing. You get ~0 ns/op and
wonder why your code is infinitely fast.

**3. GC pauses.** A garbage collection pause in the middle of the loop inflates the elapsed
time. One GC adds 10-100 ms; if your loop takes 500 ms total, that's a 20% error from a
single pause.

## How JMH solves each problem

JMH was created by Aleksey Shipilev (OpenJDK performance engineer) specifically to produce
reliable Java benchmarks. It handles the three problems above, plus several more subtle ones.

### Warm-up iterations (solving JIT compilation)

JMH runs your benchmark in two phases:

```java
@Warmup(iterations = 5, time = 1, timeUnit = TimeUnit.SECONDS)
@Measurement(iterations = 10, time = 1, timeUnit = TimeUnit.SECONDS)
```

- **Warm-up iterations:** run the benchmark but *throw away* the results. This gives the JIT
  compiler time to optimize your code to the C2-compiled steady state. By the end of warm-up,
  the hot path is fully compiled.
- **Measurement iterations:** run the benchmark and *record* the results. By now, the code is
  stable — you're measuring production-quality compiled code, not the compilation process.

**How many warm-up iterations?** The default (5 × 1 second) is usually sufficient for most
Java code to reach C2 compilation. If your benchmark involves complex class loading or
framework initialization (like Spring Boot), you may need 10-20 warm-up iterations. The way
to tell: if the first two measurement iterations are consistently faster or slower than the
rest, you need more warm-up.

### Blackhole (solving dead-code elimination)

```java
@Benchmark
public void measure(Blackhole bh) {
    bh.consume(someMethod());  // compiler cannot eliminate this
}
```

`Blackhole.consume()` accepts the return value of your method and does *just enough* with it
that the JIT compiler can't prove the method is unused. It's a carefully designed sink — it
doesn't actually do meaningful work, but the compiler can't prove that at compile time.

**Without Blackhole:** the JIT may inline `someMethod()`, see that the result is unused, and
eliminate the call. You'd be benchmarking an empty loop.

### Forking (solving process-level interference)

```java
@Fork(value = 3, warmups = 1)
```

JMH runs each benchmark in a **separate JVM process** (a "fork"). This prevents:

- **Profile pollution:** JIT optimizations from one benchmark method leaking into another. If
  method A and method B share a call site, running A first can cause the JIT to de-optimize B.
- **Class-loading side effects:** loading classes in one benchmark shouldn't affect the timing
  of another.

`Fork(3)` means: run the benchmark in 3 separate JVM processes, each starting fresh. The
results are aggregated across forks.

**How many forks?** 3 is the default and usually sufficient. For benchmarks where you suspect
OS-level variance (disk I/O, thread scheduling), more forks smooth out the noise. For SQL
insert benchmarks where each iteration takes seconds, 1 fork is often enough.

## The key JMH annotations explained

### @BenchmarkMode

```java
@BenchmarkMode(Mode.AverageTime)  // default: report avg time per operation
// or Mode.Throughput       — operations per second
// or Mode.SampleTime       — distribution of times (p50, p99, etc.)
// or Mode.SingleShotTime   — time a single invocation (no looping)
```

**For SQL insert benchmarks:** `Mode.AverageTime` or `Mode.SingleShotTime`. Each insert of
100k rows takes 0.3-10 seconds — one invocation is a full benchmark. `Mode.Throughput`
(ops/sec) is more natural for sub-microsecond operations.

### @OutputTimeUnit

```java
@OutputTimeUnit(TimeUnit.MILLISECONDS)
```

Controls the unit of the reported numbers. For insert benchmarks measured in seconds,
`MILLISECONDS` is the natural choice. For nanosecond-level operations, use `NANOSECONDS`.

### @State

```java
@State(Scope.Thread)     // one state instance per thread
@State(Scope.Benchmark)  // shared across all threads
```

State objects hold the data your benchmark operates on (the list of persons, the database
connection, the configuration). `Scope.Thread` creates a separate instance per thread — safe
for mutable state. `Scope.Benchmark` shares one instance across all threads — use for
read-only shared resources (a connection pool, a configuration object).

**For SQL insert benchmarks:** `Scope.Benchmark` for the `DataSource` (shared pool),
`Scope.Thread` for the `List<Person>` (each thread gets its own data to insert).

### @Param

```java
@Param({"100", "1000", "5000", "10000"})
int batchSize;
```

Runs the benchmark once for each parameter value. JMH generates a separate benchmark method
for each combination. This is how the
[batch-size sweep in Part 5](/post/java/mssqlserver/fast_insert_part5/) would look in JMH —
one annotation instead of a manual loop.

### @Threads

```java
@Threads(4)
```

Runs the benchmark concurrently with N threads. Combined with `@State(Scope.Thread)`, each
thread gets its own state object. This is how the
[parallel inserts in Part 6](/post/java/mssqlserver/fast_insert_part6/) would look in JMH.

## When to use JMH vs. a simple timed loop

This is the question I get most often. My rule:

| Operation under test | JMH? | Why |
|----------------------|------|-----|
| Nanosecond-level (String concat, collection lookup, math) | **Yes** | JIT, dead-code, and GC effects dominate. You'll get wrong answers without JMH. |
| Microsecond-level (JSON parse, regex, small SQL query) | **Probably** | JIT compilation matters less but dead-code elimination still bites. |
| Millisecond-level (HTTP call, medium SQL query, file I/O) | **Maybe** | The operation is long enough that JIT and GC are noise, not signal. A timed loop with warm-up might suffice. |
| Second-level (bulk insert, batch ETL, report generation) | **No** | JMH's overhead and complexity don't buy proportional reliability. A simple timed loop (1 warm-up + 10 runs + median) works. |

The Fastest MS SQL Inserts series uses the **second-level** approach — each insert of 100k
rows takes 0.3-10 seconds. JMH's warm-up, forking, and blackholing are designed for
nanosecond measurements where the JIT and GC are the main sources of noise. For
seconds-level operations, the noise sources are different (disk I/O, SQL Server lock
contention, network latency), and JMH doesn't help with those.

## A minimal JMH setup for Java 17

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.openjdk.jmh</groupId>
    <artifactId>jmh-core</artifactId>
    <version>1.37</version>
</dependency>
<dependency>
    <groupId>org.openjdk.jmh</groupId>
    <artifactId>jmh-generator-annprocess</artifactId>
    <version>1.37</version>
    <scope>provided</scope>
</dependency>
```

```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
@Warmup(iterations = 5, time = 1)
@Measurement(iterations = 10, time = 1)
@Fork(3)
@State(Scope.Thread)
public class MyBenchmark {

    private List<String> data;

    @Setup
    public void setup() {
        data = IntStream.range(0, 10_000)
            .mapToObj(i -> "item-" + i)
            .collect(Collectors.toList());
    }

    @Benchmark
    public int measureFilter(Blackhole bh) {
        int count = 0;
        for (String s : data) {
            if (s.startsWith("item-5")) count++;
        }
        bh.consume(count);
        return count;
    }
}
```

Run with:
```bash
mvn clean install
java -jar target/benchmarks.jar
```

## What the output means

```
Benchmark                    Mode  Cnt   Score   Error  Units
MyBenchmark.measureFilter    avgt   30   42.3 ±  1.2   us/op
```

- **Mode:** `avgt` = average time per operation.
- **Cnt:** 30 = 10 measurement iterations × 3 forks.
- **Score:** 42.3 = average time per invocation.
- **Error:** ± 1.2 = 99.9% confidence interval. If the error is >10% of the score, your
  benchmark is unstable — increase iterations or forks.
- **Units:** us/op = microseconds per operation.

The **error** column is the most underrated part. A benchmark showing `42.3 ± 25.0` is
telling you the measurement is unreliable — something is varying wildly between runs (GC,
background process, cold cache). Fix the environment before trusting the number.

## The parameters I'd use for our insert benchmarks (if I used JMH)

For the Fastest MS SQL Inserts series, here's what a JMH configuration would look like — and
why I didn't use it:

```java
@BenchmarkMode(Mode.SingleShotTime)   // each op is one full 100k-row insert
@OutputTimeUnit(TimeUnit.MILLISECONDS)
@Warmup(iterations = 1)               // one untimed insert to warm cache
@Measurement(iterations = 10)         // ten timed inserts, report median
@Fork(1)                              // one JVM — the DB is the bottleneck, not the JIT
@State(Scope.Benchmark)
public class InsertBenchmark {

    @Param({"bulkApi", "jdbcTemplate", "hibernate"})
    String strategy;

    // ... setup DataSource, generate persons ...

    @Benchmark
    public void insert() {
        // delegate to the strategy under test
    }
}
```

This is functionally identical to the `FastestInsertApplicationTests` class I actually wrote
— 1 warm-up, 10 timed runs, report the median. JMH adds forking (unnecessary when the DB is
the bottleneck) and Blackhole (unnecessary when the insert has a real side effect — it writes
to the database). The manual loop is simpler and equally reliable for this use case.

**The takeaway:** use JMH when the JVM is the noise source. Use a timed loop when the
database, network, or disk is the noise source. Know which one you're fighting.

## Related reading

- [How to Set Up a Reliable Benchmarking Environment](/post/java/mssqlserver/benchmarking_environment/) — the environment checklist (hardware, OS, SQL Server, JVM)
- [What Is Memory Churn and How to Avoid It in Java](/post/java/memory_churn/) — JMH methodology for sub-millisecond benchmarks where JMH *is* the right tool
- [Fastest MS SQL Inserts — Part 8: Final Ranking](/post/java/mssqlserver/fast_insert_part8/) — the series that used the timed-loop approach instead of JMH
