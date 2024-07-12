---
title: Functional Programming Antipatterns Notes
date: 2024-05-11
draft: true
usePageBundles: true
featureImage: 'fp_antipatterns.png' # Top image on post.
featureImageAlt: 'functional programming antipatterns by Victor Rentea' # Alternative text for featured image.
shareImage: 'fp_antipatterns.png' # For SEO and social media snippets.
tags: ["java", "java developers", "mistakes", "java mistakes", "developers mistakes", "functional programming"]
categories: [
    "java", "functional programming"
]
---

What is functional programming? definition
f(x) can be replaced by the body of function anywhere it appears in the code? = referentially transparent.
Moving functions to data instead moving data to functions

Reactive = Functional Reactive programming => extreeme
- Gets very complicated
- We have virtual threads that solve the same problem

- Functions should be pure. It means:
 - No side effects
 - Same input => same output
Data structures should be immutable

### 1. Long lived mutable data
- Trying to make Hibernate entities immutable
- Memory churn for to many clones repeatedly. For example, create each time new list when adding new element. 
- If immutable object gets too large -> it gets fragmented.
- Big constructors -> Builders ==> Lombok. Other languages have named parameters so there is a no big need for builders. ToBuilder is a code smell.
```java
var obj2 = obj1.toBuilder().a(1).b(2)....build();
```
There should be semantic why `a` and `b` are changed together.
=> Prefer semantic methods that can guard constraints.
```java
builder.fullName("first", "last"); // hand crafted builder
```
or better
```java
var obj2 = obj1.withFullName("First", "Last"); // semantic "wither"
```

Discover new types (deeper model)
```java
var obj2 = obj1.renamedWith(new FullName("F", "L"));
```
### 2. Mutant pipeline
// Project: clean_code_java
// Package: victor.training.cleancode.fp.MutantPipeline



### 2. 