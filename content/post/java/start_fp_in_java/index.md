---
title: "How do I become proficient with functional programming in Java"
date: 2021-04-05
draft: false
usePageBundles: true
featureImage: 'fp_in_java.png' # Top image on post.
featureImageAlt: 'How do I become proficient with functional programming in Java' # Alternative text for featured image.
shareImage: 'fp_in_java.png' # For SEO and social media snippets.
---

As a Java developer, I always look for ways to improve my coding skills. I heard about functional programming (FP) back when I was a student. Then, FP was not very popular and most developers considered code written using FP to be slow.

Time has changed and today FP is very popular. Some developers are considering it to be the future of how developers write code.

FP is the most useful concept that I learned in the last several years. It helped me to become a better developer. I started writing cleaner code with fewer bugs.

# Here are the immediate benefits I got from FP:

- I sharpen my skills related to using Java Streams. It is much easier for me to work with Streams when I understand FP concepts.
- My functions that follow FP concepts are easy to understand and maintain. There is no risk to using them in a concurrent environment. The reusability of those functions is much greater.
- If you are not a fan of “if” and “for” statements, then you will like FP. It can help you write more understandable code that doesn’t include those statements. I can do more with fewer lines of code.
- The FP is a declarative paradigm. With FP you describe what you want, rather than how to get it. This means that the code is more readable, reusable, and it is easier to maintain.

# So, how I started with functional programming?
We can find a ton of material on the internet related to FP. I usually like to watch video material when I want to learn about a new subject.

I attended an online presentation hold by Venkat Subramaniam. It was a great and inspiring presentation. The good news is that you can watch it on the following link: [Functional Programming with Java 8](https://www.youtube.com/watch?v=15X0qFtBqiQ&t=135s).

After that presentation, I gained an interest in FP, so I decided to study more about FP. I watched the Pluralsight course [Functional Programming: The Big Picture](https://www.pluralsight.com/courses/functional-programming-big-picture). This course helped me understand the big picture of FP and why it matters.

The next natural step was to check if there is a course that's subject is related to implementing FP concepts in Java. I found the course [Applying Functional Programming Techniques in Java](https://www.pluralsight.com/courses/applying-functional-programming-techniques-java). It is a great course. It helped me learn, understand, and apply new FP concepts in Java.

After watching those courses, I wanted to know more about Monads. They are very important in FP. Following two videos helped me understand Monads: [Brian Beckman: Don't fear the Monad](https://www.youtube.com/watch?v=ZhuHCtR3xq8&t=14s) and [What the ƒ is a Monad?](https://youtu.be/OSuu8zBBNAA).

# Learn from Haskell
I started learning Haskell. At the end of Venkat Subramaniam's presentation, I asked him if learning Haskell will help me better understand FP concepts. The answer was something like: “Not only Haskell helped me to understand FP, Haskell LEARNED ME how to write good code”. Some developers say that learning Haskell is like learning programming again from scratch. I learned great stuff from Haskell, and it was easy and fun to get started with it. [Learn You a Haskell for Great Good!](http://learnyouahaskell.com/chapters) is a great tutorial to get started with Haskell.



# Learn some FP language
If you don’t like Haskell, don’t worry, you can learn another FP language. You can check Kotlin, Scala, F#, Clojure, Elixir, Erlang...

If you want to stick with JVM, then you can learn Kotlin, Scala, or Clojure. Kotlin and Scala support functional and OOP paradigms and Java developers can easily get started with them. Kotlin is a new language, Spring framework supports it, and some Java developers started switching to it. Because of those reasons, I suggest trying Kotlin.

Clojure is a modern Lisp variant that runs on JVM. It is useful to know that Lisp is the oldest FP language. Also, Uncle Bob is using Clojure.

# My experience with Functional Programming
To get familiar with FP, I studied and applied in practice FP concepts. The most important concepts that I learned are:

- **Immutability** - I have as many as possible immutable objects in my codebase. This leads to fewer places where I can change the state of the program. And that leads to fewer bugs.
- **Referential transparency** - I write as much as possible pure functions. Those functions are like mathematical functions. For the same input, they always have the same output.
- **Pure and unpure functions** - before FP, I was not aware of this concept. Now, I separate pure functions from unpure. It allowed me to easier test the code and improved my code reusability.
- **Function Composition** - promotes better code readability and it is easier to write code by composing functions.
- **Curried Functions** - brilliant concept, but it is not natural to use it in Java like in other FP languages. I don’t use them for now.
- **Lazy evaluation** - evaluate values when they are needed. Lambdas are the way to do a lazy evaluation in Java.
- **Higher-Order functions** - receive other functions as parameters in existing functions. Those functions are usually utility functions.
- **Map, filter, reduce pattern** - Java Stream API implements this pattern.
- **Monads** - helped me understand how to handle unpure functions safely.
- **Optional class** - FP provides an efficient solution on how to work with nullable objects. I always return the Optional object instead of null in a method that can return null.
- **Railway programming** - helped me understand how Stream API and Optional class works.

Using FP in code doesn't prevent us, developers, from writing bad code. We still need to write unit tests, have a good understanding of our task and our codebase. We still need to apply all the best practices that we learned in the past. FP is promoting good practices and makes it easier for us developers to write good and maintainable code.

I plan to further learn about FP and Java. I will continue to write posts on this subject. For updates, you can follow me on [Twitter](https://twitter.com/mare_milenkovic) or [LinkedIn](https://www.linkedin.com/in/marko-milenkovic-48320b59/).
