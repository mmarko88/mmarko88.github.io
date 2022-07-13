---
title: 10 mistakes that java developers make that prevent them from being successful developers
date: 2021-06-11
draft: false
usePageBundles: true
---

![10 mistakes](10-mistakes.png)

Based on my previous experience, I created a list of 10 mistakes that developers made, preventing them from being a great developer. Here is the list:

## 1. Not writing unit tests
Developers that don’t write unit tests produce more bugs from the code they write and maintain. That leads to unstable products and client dissatisfaction.  
If you are not familiar with writing unit tests, there are some resources to get started with:
1. [https://www.vogella.com/tutorials/Mockito/article.html](https://www.vogella.com/tutorials/Mockito/article.html)
2. [https://www.baeldung.com/mockito-series](https://www.baeldung.com/mockito-series)
3. [https://www.softwaretestinghelp.com/mockito-tutorial/](https://www.softwaretestinghelp.com/mockito-tutorial/)

## 2. Not manually testing code
Even if you completely cover your code with unit tests, there is still a chance that you missed something out. It happens in practice that some error pushes through.  
It is always good practice to manually test code before pushing it for code review. By doing this, you will look at your solution from the client’s perspective. And not only that you can detect bugs, but you can also identify design problems in the development stage.

## 3. Having the mindset “This will never happen”
Developers often make mistakes when they write new code by thinking that certain scenarios in code will never happen. Eventually, it turns out that they are wrong. In those situations, applications can behave unpredictably and it can lead to bugs. Handle every scenario that code can go into.  
Defensive programming techniques will help you in that. If you are not familiar with defensive programming, you can check the following Pluralsight course: [https://www.pluralsight.com/courses/defensive-programming-java](https://www.pluralsight.com/courses/defensive-programming-java)

## 4. Not asking for feedback and not giving feedback
To improve yourself, regularly ask for feedback. You can as for feedback when you finish a ticket, or after finishing a project, or when you do a presentation… There is no bad time to ask for feedback.  
Give feedback to your colleagues. And not by telling them they are great even if you think they are not so good. Tell them areas where they can improve themselves. If the feedback is honest, they will appreciate you more.

## 5. Not checking the performance of code
Often, developers write their code, but they don’t check for performance. When code goes to production, it creates various problems. Poor performance can even crush the server.

## 6. Writing long procedural code
It is very easy to write long methods with a bunch of logic. By doing this, programmers put the same logic in many places.
Projects with a lot of small methods have much greater code reusability and are much easier to maintain.

## 7. Not being familiar with the tools
Tools are extensions of your hands. The better you know them, the more productive you will be. You should be very familiar with the IDE you use.  
Learn shortcuts, they will make you much more productive. Try learning one shortcut to a day and create your personal cheat sheet.  
Research plugins, usually you will find a plugin that will help you be even more productive. Plugins that will help you write better code in Intellij Idea are Sonar Lint, Spot bugs, and Code Metrics.

## 8. Ignoring problems in code
Developers that are working on the most successful products are changing the code all the time. Don’t be afraid to refactor code. If your code is unit tested, then there is a low probability of introducing a regression.  
But, don’t stop there. Developers often ignore problematic code that is not part of their ticket. As a developer, you are responsible to maintain an application and keep it in good shape. Because of that, fix all problems that you find.  
The best way to proceed with fixing the problem is to create a ticket and work on it with your team. The following story emphasizes why it is important not to ignore problems in code: [https://blog.codinghorror.com/the-broken-window-theory/](https://blog.codinghorror.com/the-broken-window-theory/).

## 9. Coding by accident
Developers should NEVER do a code modification and push that code in production without understanding the consequences of it. Code can produce correct results for given test values. However, there can be scenarios where it can produce unpredicted results and create serious problems.  
Coding by accident often happens when developers use features from libraries that don’t completely understand. It can also happen when the developer solves the problem without understanding the solution.

## 10. Not asking for help
Developers are not very communicative people. They like to solve problems by themselves. The era where one developer creates a complete solution from start to end is over.  
Developing software is a team activity. When you encounter a problem during programming, try to solve it by yourself. But don’t waste too much time if you can’t figure out the solution. There is a high probability that some of your colleagues already encounter the same problem and know a solution.  
If it is not the case, then you will get help and the team will understand that the problem is complex and that you need time to solve it. Involving more people will help you resolve complex problems faster. Developers that don’t ask for help, usually spend too much time on a ticket.  
Help others when you see they have problems with their ticket. As a result, the team will be more productive and people will like you more.

If you like this content, you can follow me on [Twitter](https://twitter.com/mare_milenkovic) or [LinkedIn](https://www.linkedin.com/in/marko-milenkovic-48320b59/).

