---
title: "Data Oriented Programming in Java basics"
date: 2022-20-07
draft: true
---


## Taming objects

Much times Objects are source of complexity. 

Author of Data-Oriented programming

blog.klipse.tech

## What is?
Set of best practices that reduce complexity of information systems by threating data as a first-class citizen.

What is complexity?

* Computational complexity \
 The amount of machine resources (e.g. CPU, memory) required to run a program.
* System complexity \
 The amount of brain resources required to understand a system.

DOO is specialy usefull for information systems
Web services
Web workers that listen to events, process the data and passes that data to other workers.

# What makes an information system complex?
Class diagrams are the problem. Library example. They are complex

Many kind of arrows
- Association
- Composition
- Inheritance
- Usage

Classic/traditional OOP program in Java.

# Separate Code from data

2 simple diagrams. 

What makes this system less complex?
- Separation of concerns
- Code diagram
  - Stateless (static)
  - Only usage relation
- Data diagram constraints
  - Only association and composition

By separating code from data, we reduce system complexity.
Instead of having all data encapsulated in one class + method in the same.
We will have two classes.
One class for the data.
One class for the code.

## What makes code hard to understand?

By reference or by value?

** In Java, object references are passed by value **

[code]
var asimov = new AuthorData(...)
asimov2 = AuthorCode.toUpperLastName(asimov)
is asimov lastName = to asimov2 last name
[code]

### What about thread safety?

### In DOP
We thread data as a value Values never change.

Main benefits of immutable data

1. Inherently Thread-safe
2. No side-effects

### Ways to achive immutable data in Java

1. Lombok @value annotation 
2. records - Java 14+

DOP is not a new paradigm. Embraced for years from experts. Even Java core team embrases usage of DOP.

Benefits of Immutable data in Java.

1. No mutations!
2. No unpleasant surprises
3. No need to do a defensive copy!
4. Thread-safe!
5. No race conditions!
6. No need to protect with lock

### Java libraries that embrace Data-Oriented programming


JSON - deep copy - maybe article about it?

DOP in JAVA

CODE
 Static Methods
 Instance methods - we don't allow
Data
 Immutable data 
  Records
  @value
 Mutable - no
source: https://slides.klipse.tech/reveal/site/dop-java-sou-java.html#/data_oriented_programming_in_java
Book: https://www.manning.com/books/data-oriented-programming

