---
title: "Testing best practices"
date: 2022-09-09
draft: true
usePageBundles: true

[//]: # (featureImage: 'fp_in_java.png' # Top image on post.)
[//]: # (featureImageAlt: 'How do I become proficient with functional programming in Java' # Alternative text for featured image.)
[//]: # (shareImage: 'fp_in_java.png' # For SEO and social media snippets.)
---

1. A failing test should tell you exactly what is wrong quickly, without you having to spend a lot of time analyzing the failure.
2. Each test should test one thing. What I want to show with this test? Name it properly.
3. Use meaningful, descriptive names.
Don't just describe what the test does either (we can read the code), tell us why it does this. This can help decide whether a test should be updated in line with changed functionality or whether an actual failure that should be fixed has been found.
4. Never trust a test you haven't seen fail.
5. Matcher libraries, such as HamCrest, can help provide detailed information about the difference between expected and actual result.
6. Write test before you write production code.
no testing
test long after development
test just after development
TDD test before developing new code
7. You can use underscore in the method names in order to improve readability. Different conventions for different context. Those tests are newer called from other code that the framework.
8. Naming convention
inputPatternName Is result
A_year_divisible_by_4_but_not_by_100_is_a_leap_year
9. For tests to drive development they must do more than just test that code performs its required functionality: they must clearly express that required functionality to the reader.
That is, they must be clear specifications of the required functionality.
10. Create subclasses for the similar tests or tests that test the same functionality if you have a big class (way of groupping the tests). This will help you in shortening the method name.
11. Code coverage:
function coverage 100%
75% statement coverage
50% branch coverage
25% path coverage
def fizzbuzz(n):
result = ''
if n % 3 == 0:
    result += 'Fizz'
if n % 5 == 0:
    result += 'Buzz'
if not result:
    result = str(n)
return result
12. Example 2
def fizzbuzz(n):
if n % 15 == 0:
    return 'FizzBuzz'
elif n % 3 == 0:
    return 'Fizz'
elif n% 5 == 0:
    return 'Buzz'
else
    return str(n)
If you use more functional flow style, rather than accumulating state. Statistics can mislead you that you have bigger coverage.

13. The first principle is that you must not fool yourself - and you are the easiest person to fool. (Richard Feynman)
