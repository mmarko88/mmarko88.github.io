---
title: "Testing Best Practices in the Agentic Era"
date: 2022-09-09
draft: true
usePageBundles: false
description: "13 testing practices that matter more now that agents write code. A failing test should tell you what's wrong instantly — not after 20 minutes of debugging."
featureImage: 'images/building.png'
featureImageAlt: 'Testing best practices — a foundation for code quality in the age of AI-assisted development.'
shareImage: 'images/building.png'
tags: ["java", "testing", "junit", "best practices", "agents"]
categories: ["java", "testing"]
---

When I wrote these 13 testing practices in 2022, they were about disciplined development. Now
that coding agents write production code in my codebase, they're about **survival**. An agent
that writes code without tests, or writes tests that don't actually verify behaviour, creates
debt faster than a human ever could.

These practices haven't changed. What changed is why they're urgent.

> **The one thing to take from this post:** if an agent writes code for you and the tests pass,
> how confident are you that the code is correct? Your testing practices determine the answer.

## 1. A failing test should tell you exactly what's wrong — instantly

A test that fails with `AssertionError: expected true but was false` tells you nothing. A test
that fails with `Expected person count to be 1000 after bulk insert, but was 0 — the INSERT
statement produced no rows` tells you everything.

```java
// Bad: tells you nothing on failure
assertTrue(result);

// Good: tells you exactly what's wrong
assertEquals(1000, insertedCount,
    "Expected 1000 persons after bulk insert, but got " + insertedCount +
    " — check if TRUNCATE ran before the test");
```

**In the agentic context:** when an agent runs tests and sees a failure, a descriptive assertion
message is the difference between "agent fixes the bug in one turn" and "agent spends 5 turns
guessing."

## 2. Each test should test one thing

Not one *method* — one *behaviour*. "What am I proving with this test?" should have a
one-sentence answer. If the answer is "that the insert works and the count is right and the
data is correct," that's three tests.

## 3. Use meaningful, descriptive names

Don't describe what the test does (we can read the code). Describe **why** it does this:

```java
// Describes what (useless — we can see it's testing insert):
void testInsert() { ... }

// Describes why (useful — we know the intent):
void bulkInsert_with1000Rows_inserts1000Persons() { ... }

// Even better — underscores improve readability in test names:
void bulk_insert_with_1000_rows_inserts_all_persons() { ... }
```

When a test fails, the name should tell you whether the test needs updating (behaviour changed
intentionally) or an actual bug was introduced.

## 4. Never trust a test you haven't seen fail

Write the test. Watch it fail. Then write the production code. Then watch it pass. If you never
saw it fail, you don't know if it's testing anything — maybe the assertion is wrong, maybe the
setup is incomplete, maybe the test framework skips it.

**In the agentic context:** agents write tests that pass on the first run. *That's suspicious.*
If the test never failed, the agent may have written a test that verifies the implementation,
not the requirement.

## 5. Use assertion libraries that show the difference

Standard `assertEquals` on complex objects shows `expected: <Foo@1234> but was: <Foo@5678>`.
Libraries like AssertJ or Hamcrest show the field-by-field diff:

```java
// AssertJ (recommended for Java 17+)
assertThat(result)
    .extracting("firstName", "lastName", "years")
    .containsExactly("John", "Smith", 30);
```

The diff on failure shows *which field* is wrong, not just "objects differ."

## 6. Write tests before production code (when you can)

The progression, from worst to best:

| Level | When tests run | Trust level |
|-------|---------------|-------------|
| No testing | never | zero |
| Tests long after development | weeks later | low — tests written to pass, not to verify |
| Tests just after development | same day | medium — tests can be lazy |
| **TDD: test before code** | before the code exists | **high — test defines the requirement** |

TDD isn't always practical (UI work, exploratory code, performance benchmarks). But when it is,
the test becomes the *specification* of what the code should do. An agent reading a TDD test
knows the intent without reading the implementation.

## 7. Underscore naming for test methods

Test methods are never called from application code. They're called by the test framework and
read by humans. Underscores improve readability:

```java
// Standard camelCase (hard to parse visually):
void insertBulkApiWithBatchSize1000InsertsAllPersons() { ... }

// Underscored (scans instantly):
void insert_bulkApi_batchSize1000_insertsAllPersons() { ... }
```

Different naming conventions for different contexts. Production code uses camelCase; test code
uses whatever makes the intent clearest.

## 8. Naming convention: input_condition_result

The pattern I settled on:

```
{input or scenario} _ {condition} _ {expected result}
```

Examples:
```java
void year_divisibleBy4ButNotBy100_isLeapYear() { ... }
void bulkInsert_withZeroRows_insertsNothing() { ... }
void zipExtraction_withMaliciousPath_throwsSecurityException() { ... }
```

## 9. Tests as executable specifications

> "For tests to drive development they must do more than just test that code performs its
> required functionality: they must clearly express that required functionality to the reader."

A well-written test class reads like a specification document. Anyone — developer, reviewer,
agent — should be able to read the test class and understand what the system is supposed to do,
without reading the implementation.

## 10. Group related tests with inner classes

When a test class grows large, use inner classes (JUnit 5 `@Nested`) to group tests by the
behaviour they verify:

```java
class BulkInsertServiceTest {

    @Nested
    class WhenBatchSizeIs1000 {
        @Test void inserts_all_100k_persons() { ... }
        @Test void completes_in_under_2_seconds() { ... }
    }

    @Nested
    class WhenBatchSizeIsZero {
        @Test void throws_illegalArgument() { ... }
    }

    @Nested
    class WhenTableHas5Indexes {
        @Test void takes_6x_longer_than_noIndex() { ... }
    }
}
```

The nesting shortens method names (the outer class provides context) and makes the test output
read like a tree of behaviours.

## 11. Code coverage: the metric that lies to you

Coverage levels, ranked by what they actually prove:

| Coverage type | What it means | What it proves |
|---------------|---------------|----------------|
| **Function coverage (100%)** | every function was called | almost nothing |
| **Statement coverage (75%)** | 3 of 4 statements executed | some paths work |
| **Branch coverage (50%)** | half the if/else branches taken | some decisions work |
| **Path coverage (25%)** | a quarter of execution paths taken | some combinations work |

High coverage does not mean high quality. A test with 100% statement coverage can still miss
the bug — it depends on *which* statements matter and *which* assertions you wrote.

**The trap:** code written in a more functional style (no mutable state, no branching) naturally
has higher coverage per test. That doesn't mean it's better tested — it means coverage is
measuring less. Don't optimize for the metric; optimize for the assertions.

> *"The first principle is that you must not fool yourself — and you are the easiest person to
> fool."* — Richard Feynman

## 12. What changes when an agent writes your tests

Three new practices for the agentic era:

**1. Verify the test independently.** When an agent writes a test, run it, then break the
production code intentionally. Does the test fail? If it still passes, the test isn't testing
what you think.

**2. Require the agent to show a failing test first.** The agent should demonstrate the test
failing *before* writing the fix. This is TDD, but enforced by policy: "show me the red test
before the green one." My framework has a rule for this.

**3. Review agent-generated test assertions, not just code.** Agents write correct-looking tests
that assert on implementation details instead of behaviour. A test that asserts
`verify(mock).someInternalMethod()` is a mock-coupling test, not a behaviour test. Check that
the assertions verify *outcomes*, not *mechanisms*.

## 13. The practices that didn't change

Everything above applied in 2022 and applies in 2026. What changed isn't the practices — it's
the *speed at which bad tests compound*. An agent that writes 50 tests a day can create 50
tests that don't verify anything, 50 tests that couple to implementation, or 50 tests that
clearly specify behaviour.

The testing practices you enforce determine which kind you get.

## Related reading

- [Setting up JUnit 5 Parallel Test Execution With Maven](/post/java/java_multithread_junit5/) — faster CI with parallel tests
- [10 Mistakes Java Developers Make Early On](/post/java/teen_mistakes/) — #1 is "not writing unit tests"
- [Agentic Development: What Actually Works](/post/agentic/intro/) — how the agent framework enforces "red test before green"
