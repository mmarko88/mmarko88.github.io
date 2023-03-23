---
title: "What is memory churn and how to avoid it in Java"
date: 2023-03-15
draft: true
usePageBundles: true
tags: [ "java", "peformance"]
categories: [ "java", "peformance"]
featureImage: 'fp_in_java.png' # Top image on post.
shareImage: 'fp_in_java.png' # For SEO and social media snippets.
featureImageAlt: 'How do I become proficient with functional programming in Java' # Alternative text for featured image.
---

## Introduction
Modern hardware is very good at predicting the next instructions to be executed. This kind of prediction allows CPUs to do more work in less time. One of the strategies that hardware relies on is data locality. This means that when CPU requests data from main memory, it not only retrieves the requested data, but the hardware also retrieves the data that is stored in close proximity to the requested data.

On the software side, the Java compiler is heavily optimized to assist the hardware in these optimizations. Despite these optimizations, there are cases where none of them can help us. If we as programmers don't address this issue, it can lead to degraded application performance.

Before I continue, let me tell you this:
_Don't optimize your application prematurely!_

If you don't have performance issues with your application, you don't need to optimize. However, it pays to know what can affect the performance of your application and how you can be more careful and write better performing code.

## What is memory churn
Memory churn refers to the continuous and repetitive process of creating, deleting, and reallocating memory in a computer system. It is the rate at which memory is allocated and deallocated over a certain period of time, usually measured in cycles or seconds.

Memory churn can have an impact on the overall performance of a computer system. When memory is constantly allocated and deallocated, it can lead to fragmentation of the memory space, which can result in slower performance and increased resource usage.

One common example of memory churn is in software applications that allocate and deallocate memory frequently, such as video games or web browsers. These applications can cause significant memory churn, leading to slower performance and increased resource usage over time.
Overall, minimizing memory churn is important for maintaining optimal performance and resource usage in computer systems. This can be achieved through various strategies, such as efficient memory management and reducing unnecessary memory allocations and deallocations.

The JVM runs garbage collection periodically, either when it can, because the program threads are waiting for some external event, or when it needs to, because it's run out of memory for creating new objects. Despite the automatic nature of the process, it's important to understand that it's going on, because it can be a significant part of the overhead of Java programs.

## Example of memory churn
One common example of memory churn that can occur in applications is when data is stored in a hash map with a composite key consisting of two combined strings. Let me show you an example:

Let's say that we want to fetch Person data from in-memory `Person` repository. Contents of the `PersonRepository` and the `Person` class are defined as following:

```java
@Value
public class Person {
    String firstName;
    String lastName;
    int age;
}

public class PersonRepository {

    Map<String, Person> personNameMap1 = new HashMap<>();

    public Person findPersonByFullName(String firstName, String lastName) {
        return personNameMap1.get(firstName + lastName);
    }
}

```

Note: In the examples used in this article, Lombok annotations are used to reduce the need for writing boilerplate code.

On first look, this code looks good to most of the developers. There is one performance issue that can arise if there is a massive load on the `findPersonByFullName` method. To understand the problem, let's check how the + operator for string concatenation works in java. In Java 8, this concatenation is implemented using `StringBuilder` class. So the code for string concatenation would be implemented as follows:

```java
public Person findPersonByFullName(String firstName, String lastName) {
        return personNameMap1.get(new StringBuilder().append(firstName).append(lastName).toString());
}
```


By examining the `StringBuilder` parameterless constructor, it becomes apparent that its character array is initialized with a default size of 16. If the concatenation's result exceeds this limit, a new array must be initialized, and all the data must be copied over to the new array. Finally, when the `toString()` method is called, the array is once again copied to create the resulting string.

The situation with string concatenation is better implemented in newer versions of Java, beyond Java 8. StringConcatenationUtil (proveri ovo) method is used and it is optimized to create just one character array for all the concatenations. Still, a new String needs to be created (proveri ovo) and two new character arrays are created in this process.

From the above description, it can be inferred that this code generates a considerable number of objects, which must later be cleaned up by the garbage collector. Furthermore, these objects happen to be arrays, which are relatively memory-intensive. This can lead to additional strain on the garbage collector, which must work hard to clean up all the allocated memory. As a result, memory churn may occur.

There is a simple fix for this problem. Instead of concatenating two Strings, we can create a new object that will contain key data, we can call it `PersonPk`.

```java
@Value
public class PersonPk {
    private final String firstName;
    private final String lastName;
}

```

Note that this class _must_ implement `equals` and `hashCode` methods to be used as a key for a hash map. The `@Value` annotation that is used in the class is a Lombok annotation, and it is used to shorten the code. You can find more details about it on the following link: [https://projectlombok.org/features/Value](lombok).


By creating new objects with references to existing strings (rather than creating new strings), we can reduce the burden on the garbage collector. This, in turn, can improve performance.

In the end, I compared the performance of both methods and recorded the following results:

This is the code:
```java
@Fork(warmups = 0, value = 1)
@BenchmarkMode(Mode.Throughput)
@OutputTimeUnit(TimeUnit.SECONDS)
@Measurement(time = 10, iterations = 5)
@Warmup(iterations = 5, time = 1)
public class MemoryChurnBench {
    @State(Scope.Benchmark)
    public static class InputParams {
        PersonRepository personRepository = new PersonRepository();
        private static final int totalItems = 10_000;

        @Param({"5", "10", "100", "1000"})
        private int nameLength;

        List<Person> personList;

        public InputParams() {
        }

        @Setup(Level.Trial)
        public void createRandomList() {
            personList = new ArrayList<>(totalItems);
            Set<String> generated = new HashSet<>();
            for (int i = 0; i < totalItems; i++) {
                String firstName = getUniqueFirstName(generated);
                String lastName = getUniqueLastName(generated);
                Person person = new Person(firstName, lastName, i);
                personList.add(person);
            }
        }

        private String getUniqueLastName(Set<String> generated) {
            String firstName;
            do {
                firstName = getLastName(nameLength);
            }
            while (generated.contains(firstName));
            return firstName;
        }

        private String getUniqueFirstName(Set<String> generated) {
            String firstName;
            do {
                firstName = getFirstName(nameLength);
            }
            while (generated.contains(firstName));
            return firstName;
        }

        public String getFirstName(int i) {
            return getString("F:", i);
        }

        private static String getString(String prefix, int length) {
            return prefix + RandomStringUtils.random(length, true, true);
        }

        public String getLastName(int i) {
            return getString("L:", i);
        }
    }


    @Benchmark
    public void getFromRepo1(InputParams params, Blackhole b) {
        for (int i = 0; i < params.totalItems; i++) {
            Person person = params.personList.get(i);
            b.consume(params.personRepository.findPerson1(person.getFirstName(), person.getLastName()));
        }
    }

    @Benchmark
    public void getFromRepo2(InputParams params, Blackhole b) {
        for (int i = 0; i < params.totalItems; i++) {
            Person person = params.personList.get(i);
            b.consume(params.personRepository.findPerson2(person.getFirstName(), person.getLastName()));
        }
    }
}
```

```textmate
java 8
Benchmark                      (nameLength)   Mode  Cnt      Score      Error  Units
MemoryChurnBench.getFromRepo1             5  thrpt    5  3267.292 ±   50.175  ops/s
MemoryChurnBench.getFromRepo1            10  thrpt    5  2574.766 ±   82.879  ops/s
MemoryChurnBench.getFromRepo1           100  thrpt    5   396.770 ±    0.144  ops/s
MemoryChurnBench.getFromRepo1          1000  thrpt    5    36.668 ±    0.038  ops/s
MemoryChurnBench.getFromRepo2             5  thrpt    5  7191.861 ±  309.090  ops/s
MemoryChurnBench.getFromRepo2            10  thrpt    5  7351.695 ± 1102.214  ops/s
MemoryChurnBench.getFromRepo2           100  thrpt    5  7111.327 ±  124.943  ops/s
MemoryChurnBench.getFromRepo2          1000  thrpt    5  7081.891 ±   96.655  ops/s


java 18
Benchmark                      (nameLength)   Mode  Cnt      Score      Error  Units
MemoryChurnBench.getFromRepo1             5  thrpt    5   3092.809 ±  876.977  ops/s
MemoryChurnBench.getFromRepo1            10  thrpt    5   3239.492 ±  490.134  ops/s
MemoryChurnBench.getFromRepo1           100  thrpt    5   2548.812 ±   49.490  ops/s
MemoryChurnBench.getFromRepo1          1000  thrpt    5    259.983 ±    1.492  ops/s
MemoryChurnBench.getFromRepo2             5  thrpt    5  12556.708 ±  552.116  ops/s
MemoryChurnBench.getFromRepo2            10  thrpt    5  12829.118 ± 1430.996  ops/s
MemoryChurnBench.getFromRepo2           100  thrpt    5  12496.112 ±  724.722  ops/s
MemoryChurnBench.getFromRepo2          1000  thrpt    5  11440.174 ± 1138.656  ops/s

```


