---
title: "What Is Memory Churn and How to Avoid It in Java"
date: 2023-04-04
draft: false
usePageBundles: true
tags: [ "java", "peformance"]
categories: [ "java", "peformance"]
featureImage: 'memory.svg' # Top image on post.
shareImage: 'memory.svg' # For SEO and social media snippets.
featureImageAlt: 'How do I become proficient with functional programming in Java' # Alternative text for featured image.
---

## Introduction
Modern hardware is very good at predicting the next instructions to be executed. This kind of prediction allows CPUs to do more work in less time. One of the strategies that hardware relies on is data locality. This means that when CPU requests data from main memory, it not only retrieves the requested data, but the hardware also retrieves the data that is stored in proximity to the requested data.

On the software side, the Java compiler is heavily optimized to assist the hardware in these optimizations. Despite these optimizations, there are cases where none of them can help us. If we as programmers don't address this issue, it can lead to degraded application performance.

Before I continue, let me tell you this:

`Don't optimize your application prematurely!`

If you don't have performance issues with your application, you don't need to optimize. However, it pays to know what can affect the performance of your application and how you can be more careful and write better performing code.

## What Is Memory Churn?
Memory churn refers to the continuous and repetitive process of creating, deleting, and reallocating memory in a computer system. It is the rate at which memory is allocated and deallocated over a certain period of time, usually measured in cycles or seconds.

Memory churn can have an impact on the overall performance of a computer system. When memory is constantly allocated and deallocated, it can lead to fragmentation of the memory space, which can result in slower performance and increased resource usage.

One common example of memory churn is in software applications that allocate and deallocate memory frequently, such as video games or web browsers. These applications can cause significant memory churn, leading to slower performance and increased resource usage over time.
Overall, minimizing memory churn is important for maintaining optimal performance and resource usage in computer systems. This can be achieved through various strategies, such as efficient memory management and reducing unnecessary memory allocations and deallocations.

The JVM runs garbage collection periodically, either when it can, because the program threads are waiting for some external event, or when it needs to, because it's run out of memory for creating new objects. Despite the automatic nature of the process, it's important to understand that it's going on, because it can be a significant part of the overhead of Java programs.

## Example of Memory Churn
One common example of memory churn that can occur in applications is when data is stored in a hash map with a composite key consisting of two combined strings. Let me show you an example:

Let's say that we want to fetch a person data from in-memory `Person` repository. Contents of the `PersonRepository` and the `Person` class are defined as following:

```java
@Value
public class Person {
    String firstName;
    String lastName;
    int age;
}

public class PersonRepository {

    Map<String, Person> personNameMap = new HashMap<>();

    public Person findPersonByFullName(String firstName, String lastName) {
        return personNameMap.get(firstName + lastName);
    }
    /*...*/
}
```

> Note: In the examples in this article, I used Lombok annotations to reduce the need for writing boilerplate code. You can find more details about it on the following [link](https://projectlombok.org/features/Value).

On first look, this code looks good to most of the developers. But, there is one performance issue that can arise if there is a massive load on the `findPersonByFullName` method. To understand the problem, let's check how the `+` operator for String concatenation works in Java. In Java 8, this concatenation is implemented using `StringBuilder` class. So the code for string concatenation would be implemented as follows:

```java
public class Person {
    /*...*/
    public Person findPersonByFullName(String firstName, String lastName) {
        return personNameMap1.get(new StringBuilder().append(firstName).append(lastName).toString());
    }
}

public class StringBuilder extends AbstractStringBuilder {
    /*...*/

    /**
     * Constructs a string builder with no characters in it and an
     * initial capacity of 16 characters.
     */
    @IntrinsicCandidate
    public StringBuilder() {
        super(16);
    }
    /*...*/
}

public class AbstractStringBuilder {
    /*...*/
    /**
     * Creates an AbstractStringBuilder of the specified capacity.
     */
    AbstractStringBuilder(int capacity) {
        if (COMPACT_STRINGS) {
            value = new byte[capacity];
            coder = LATIN1;
        } else {
            value = StringUTF16.newBytesFor(capacity);
            coder = UTF16;
        }
    }
    /*...*/
}

public class String /*...*/ {
    /*...*/
    /*
     * Package private constructor. Trailing Void argument is there for
     * disambiguating it against other (public) constructors.
     */
    String(AbstractStringBuilder asb, Void sig) {
        byte[] val = asb.getValue();
        int length = asb.length();
        if (asb.isLatin1()) {
            this.coder = LATIN1;
            this.value = Arrays.copyOfRange(val, 0, length);
        } else {
            // only try to compress val if some characters were deleted.
            if (COMPACT_STRINGS && asb.maybeLatin1) {
                byte[] buf = StringUTF16.compress(val, 0, length);
                if (buf != null) {
                    this.coder = LATIN1;
                    this.value = buf;
                    return;
                }
            }
            this.coder = UTF16;
            this.value = Arrays.copyOfRange(val, 0, length << 1);
        }
    }
    /*...*/
}
```

By examining the `StringBuilder` parameterless constructor, it becomes apparent that its character array is initialized with a default size of 16. If the concatenation's result exceeds this limit, a new array must be created and initialized. And all the data must be copied over to the new array. Finally, when the `toString` method is called, the array is once again copied to create the resulting string.

The `+` operator has much better implementation in Java 17. `StringConcatFactory.makeConcatWithConstants` method is used for strings concatenation. It further calls the method `StringConcatHelper.simpleConcat` for the special case of two strings concatenation. This method is the fastest implementation for the String concatenation that I have seen till now in Java. It is optimized to create just one character array for all the concatenations. And not only that, it uses the same character array to create a new instance of String class. This can be done only in jdk code, since the constructor for String class that accepts character array is package private. Here is the content of `simpleConcat` method.

```java
/** JDK 18 code
 * 
 *
 * Perform a simple concatenation between two objects. Added for startup
 * performance, but also demonstrates the code that would be emitted by
 * {@code java.lang.invoke.StringConcatFactory$MethodHandleInlineCopyStrategy}
 * for two Object arguments.
 *
 * @param first         first argument
 * @param second        second argument
 * @return String       resulting string
 */
@ForceInline
static String simpleConcat(Object first, Object second) {
        String s1 = stringOf(first);
        String s2 = stringOf(second);
        if (s1.isEmpty()) {
        // newly created string required, see JLS 15.18.1
        return new String(s2);
        }
        if (s2.isEmpty()) {
        // newly created string required, see JLS 15.18.1
        return new String(s1);
        }
        // start "mixing" in length and coder or arguments, order is not
        // important
        long indexCoder = mix(initialCoder(), s1);
        indexCoder = mix(indexCoder, s2);
        byte[] buf = newArray(indexCoder);
        // prepend each argument in reverse order, since we prepending
        // from the end of the byte array
        indexCoder = prepend(indexCoder, buf, s2);
        indexCoder = prepend(indexCoder, buf, s1);
        return newString(buf, indexCoder);
        }
```

From the above description, it can be inferred that the example code generates a huge number of objects (specially in java 8 example). Garbage collector needs to clean up those objects at some point in time. The greater the number of memory allocations made by an application, the more the garbage collector is required to work in order to clean them up. Furthermore, these objects happen to be arrays. It means that objects are memory heavy. This can lead to additional strain on the garbage collector. As a result, memory churn may occur.

## How Can We Fix It?
The solution would be to reduce the number of allocations. For example, we can consider creating a pool of objects that can be reused (something like thread pools). The proposed solution wouldn't work on this example, because we don't know what instances of the String object will be created.


### What Can We Do Then?
If we must allocate memory, then we should check if we can perform smaller memory allocations. We can create a new class that will contain references to existing strings. The class must implement `equals` and `hashCode` methods. Requested behaviour will be the same, but the amount of allocated memory will be significantly smaller. We can call this class `PersonPk` and implement it as follows:

```java
@Value
public class PersonPk {
    private final String firstName;
    private final String lastName;
}
```

By creating new objects with references to existing strings, we can reduce the burden on the garbage collector. This should improve performance.

In the end, I compared the performance of both methods and recorded the following results:

```textmate
Java 8
Benchmark                                 (nameLength)   Mode  Cnt     Score      Error  Units
MemoryChurnBench.getFromRepoNewObject                5  thrpt    5  6366.565 ±  342.554  ops/s
MemoryChurnBench.getFromRepoNewObject               10  thrpt    5  6365.775 ±  331.102  ops/s
MemoryChurnBench.getFromRepoNewObject              100  thrpt    5  6388.885 ±   44.873  ops/s
MemoryChurnBench.getFromRepoNewObject             1000  thrpt    5  6246.701 ±  531.240  ops/s
MemoryChurnBench.getFromRepoNewObject            10000  thrpt    5  6564.168 ± 1421.583  ops/s
MemoryChurnBench.getFromRepoStringConcat             5  thrpt    5  3151.173 ±   39.861  ops/s
MemoryChurnBench.getFromRepoStringConcat            10  thrpt    5  2531.838 ±   89.890  ops/s
MemoryChurnBench.getFromRepoStringConcat           100  thrpt    5   391.318 ±    0.190  ops/s
MemoryChurnBench.getFromRepoStringConcat          1000  thrpt    5    35.975 ±    0.039  ops/s
MemoryChurnBench.getFromRepoStringConcat         10000  thrpt    5     3.762 ±    0.001  ops/s

Java 17
Benchmark                                 (nameLength)   Mode  Cnt      Score      Error  Units
MemoryChurnBench.getFromRepoNewObject                5  thrpt    5  10286.933 ±  709.515  ops/s
MemoryChurnBench.getFromRepoNewObject               10  thrpt    5  10687.213 ±  167.468  ops/s
MemoryChurnBench.getFromRepoNewObject              100  thrpt    5  10675.250 ± 1194.855  ops/s
MemoryChurnBench.getFromRepoNewObject             1000  thrpt    5  11001.058 ± 1460.443  ops/s
MemoryChurnBench.getFromRepoNewObject            10000  thrpt    5  10464.001 ±   80.074  ops/s
MemoryChurnBench.getFromRepoStringConcat             5  thrpt    5   3036.421 ±  524.678  ops/s
MemoryChurnBench.getFromRepoStringConcat            10  thrpt    5   3133.770 ±  401.871  ops/s
MemoryChurnBench.getFromRepoStringConcat           100  thrpt    5   2291.642 ±  122.767  ops/s
MemoryChurnBench.getFromRepoStringConcat          1000  thrpt    5    238.308 ±    1.260  ops/s
MemoryChurnBench.getFromRepoStringConcat         10000  thrpt    5     28.638 ±    0.278  ops/s

```

## Conclusion
From the results above, we can draw the following conclusions:
1. The bigger the strings that are used for concatenation, the bigger the memory churn is.
2. Java 17 has an order of magnitude better performance for string concatenation compared to java 8.
3. Optimized version of code, without string concatenation, performs much better than string concatenation. This statement is true for all versions of Java.
4. Java 17 has much performs better when it comes to garbage collection.

For more stuff like this, you can follow me on [Twitter](https://twitter.com/mare_milenkovic), [LinkedIn](https://www.linkedin.com/in/mare-milenkovic/), or visit my [website](https://www.professionaldev.pro/). 

## Appendix: Java Code Used for Benchmarking
At the end, here is the code that I used to perform benchmarks:
```java
@Fork(warmups = 0, value = 1)
@BenchmarkMode(Mode.Throughput)
@OutputTimeUnit(TimeUnit.SECONDS)
@Measurement(time = 10, iterations = 5)
@Warmup(iterations = 5, time = 1)
public class MemoryChurnBench {
    private static final int TOTAL_NO_ITEMS = 10_000;

    @State(Scope.Benchmark)
    public static class InputParams {
        PersonRepository personRepository = new PersonRepository();
        @Param({"5", "10", "100", "1000", "10000"})
        private int nameLength;

        List<Pair<String, String>> searchPersonNamesList;

        public InputParams() {
        }

        @Setup(Level.Trial)
        public void createRandomList() {
            searchPersonNamesList = new ArrayList<>(TOTAL_NO_ITEMS);
            Set<String> generated = new HashSet<>();
            for (int i = 0; i < TOTAL_NO_ITEMS; i++) {
                String firstName = getUniqueFirstName(generated);
                String lastName = getUniqueLastName(generated);
                searchPersonNamesList.add(Pair.of(firstName, lastName));
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

        public void setNameLength(int nameLength) {
            this.nameLength = nameLength;
        }
    }

    @Benchmark
    public void getFromRepoStringConcat(InputParams params, Blackhole b) {
        for (int i = 0; i < TOTAL_NO_ITEMS; i++) {
            Pair<String, String> personFullName = params
                    .searchPersonNamesList
                    .get(i);
            Person repositoryPerson = params
                    .personRepository
                    .findPerson1(personFullName.left(), personFullName.right());
            b.consume(repositoryPerson);
        }
    }

    @Benchmark
    public void getFromRepoNewObject(InputParams params, Blackhole b) {
        for (int i = 0; i < TOTAL_NO_ITEMS; i++) {
            Pair<String, String> personFullName = params
                    .searchPersonNamesList
                    .get(i);
            Person repositoryPerson = params
                    .personRepository
                    .findPerson2(personFullName.left(), personFullName.right());
            b.consume(repositoryPerson);
        }
    }
}
```