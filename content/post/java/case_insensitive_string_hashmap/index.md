---
title: "How to use case insensitive string in hash map"
date: 2023-20-04
draft: true
usePageBundles: true
featureImage: '' # Top image on post.
featureImageAlt: '' # Alternative text for featured image.
shareImage: '' # For SEO and social media snippets.
---

## Introduction
By default, Microsoft SQL Server processes strings without considering their case sensitivity. Java, unlike Microsoft SQL Server, is case-sensitive which can result in problems. Specifically, on the project I'm working on, there have been numerous bugs caused by the mismatch in case sensitivity.

Generally, there are many situations where case-insensitive strings are necessary. One such example is with email addresses, which are inherently case-insensitive. Therefore, the issue of case sensitivity is not solely related to the mismatch between MS SQL Server and Java, but rather it is a more widespread concern.

In the following, I will explain how case sensitivity can cause issues in code, and how and why using a case-insensitive hash map can provide a solution.

## Example
1. The `groups` API provides a service called `GroupsService` which accepts a list of user email addresses and creates a group with those users. 
2. Each user's email address is unique in the EmailGroups database.
3. Another API called `users` is used to create new users with their email addresses and store them in a database.
4. When a request is made to the `GroupsService` service, each email address in the list is validated by checking a database using a case-insensitive search. If an email address in the list is not found in the database, an error is thrown and the error message includes the exact email address that wasn't found.
5. The `GroupsService` service is designed to handle large requests, so it employs a solution that checks email addresses in chunks, rather than one-by-one against the database.

## Implementation
1. Retrieve emails (along with any other data necessary for processing the request) from the database by filtering them using the email addresses provided in the incoming request.
2. Store the retrieved results in a Java HashMap.
3. Iterate through each email address in the incoming request and check if there is a corresponding entry in the HashMap.
4. If an entry doesn't exist for an email address, an error is thrown to the user.

We can use the following Java code to implement described behaviour:

```java
public class GroupsService {
    @Value
    private static class MemberInfo {
        int id;
        String email;
        String name;
    }
    public void createGroupWithMembership(@NonNull String groupName, @NonNull List<String> memberEmails) {
        Map<String, MemberInfo> stringMemberInfoMap = loadMemberInfoByEmails(memberEmails);

        for (String memberEmail : memberEmails) {
            if (!stringMemberInfoMap.containsKey(memberEmail)) {
                throw new IllegalArgumentException("Can't find email: '%s' in the system.");
            }
        }

    }

    private Map<String, MemberInfo> loadMemberInfoByEmails(List<String> memberEmails) {
        List<String> memberEmailsToLookupFor = memberEmails.stream().distinct().sorted().toList();
        List<MemberInfo> memberInfoList = groupRepository.loadMemberInfoByEmails(memberEmailsToLookupFor);
        return
                memberInfoList
                        .stream()
                        .collect(Collectors.toMap(MemberInfo::getEmail, Function.identity()));
    }
}
```


## The problem
Since the database is case-insensitive, it will return all emails without considering the case of the input string. However, in Java, we use a HashMap to match incoming emails with emails from the database.
The issue with this approach is that HashMap keys are case-sensitive, which means that some emails may not be found.

To illustrate the problem, consider the following example:

```text
  INPUT LIST                             HASH MAP
  (lower case emails)              (case-sensitive email keys)

  +------------------------+       +------------------------+
  |  alice@example.com      |       | alice@example.com       |   MemberInfo
  +------------------------+       +------------------------+
  |  BOB@example.com  (*)   |       | Bob@example.com         |   MemberInfo
  +------------------------+       +------------------------+
  |  charlie@example.com    |       | charlie@example.com     |   MemberInfo
  +------------------------+       +------------------------+
  |  DAVID@example.com  (*) |       | David@example.com       |   MemberInfo
  +------------------------+       +------------------------+
```
Sure, here's a clearer rewrite of the text:

In the previous example, Bob and David have different casing in their email addresses. Because the `hashCode` function generates different hash codes for the same string with different casing, the hash map will not be able to find their email addresses in the database. This can lead to errors for the user, even though we have data about both email addresses in the database.

## Solution 1: Use TreeMap
The solution to the problem of case-sensitive hash maps in Java is to use a TreeMap instead of a HashMap, as it can accept a custom comparator. By using a case-insensitive comparator, the TreeMap will be able to match email addresses with different casing, and the correct MemberInfo can be retrieved from the database. Here is an example of how to use a TreeMap with a custom comparator in Java:

```java
Map<String, String> mapping = new TreeMap(String::caseInsensitiveComparator);
```

While TreeMap offers good performance, it may not be as fast as HashMap for large datasets. The query time increases with the size of the dataset. However, searching the data using TreeMap is similar to performing a binary search, so the access time doesn't drop linearly. Although TreeMap provides good performance, it can't match the nearly constant O(1) access time of HashMap.

## Solution 2: Use HashMap
Unfortunately, hash maps only work based on object hash code and equals methods, and it doesn't allow for custom functions to be supplied at the constructor or in any other way. This can be limiting, and as a result, many programmers opt for TreeMap.

However, as professional developers, we can create a better implementation for case-insensitive string equals and hash code methods. There are two main approaches:

1. Convert all strings to lower/upper case. However, this creates a lot of new objects, which doubles memory usage, and we always need to lower/upper case input strings for the hash map. This can create memory churn in high-load scenarios, and it is also required to store strings with the original casing, so we need a way to map from lower/upper cased strings to the original ones. Due to all these challenges, this approach is not recommended.

2. Extend the String class and override the hashCode and equals methods. Alternatively, we can create a new type, store the string as a final local variable, and implement custom equals and hashCode methods. This approach still requires the creation of new objects, but compared to creating new strings, memory allocation is much lower.

The challenge now is to implement those two methods. For equals, we can use the equalsIgnoreCase method instead of toLowerCase, which avoids the problems mentioned above. For the hashMethod, we can copy the logic from the String class and use the lowercase version of the characters for generating the hashCode. Here is an implementation example:

```java
@RequiredArgsConstructor(staticName = "of")
public class CiString {
    @NonNull
    private final String stringVal;
    private int hash = 0;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;

        if (o == null || getClass() != o.getClass()) return false;
        CiString ciString = (CiString) o;
        return stringVal.equalsIgnoreCase(ciString.toString());
    }
    public int hashCode() {
        int h = hash;
        if (h == 0 && stringVal.length() > 0) {
            for (int i = 0; i < stringVal.length(); i++) {
                h = 31 * h + Character.toLowerCase(stringVal.charAt(i));
            }
            hash = h;
        }
        return h;
    }
    @Override
    public String toString() {
        return stringVal;
    }
}
```

As professional developers, it's important to write tests to ensure the correctness and reliability of our code. Here is an example of a test class for the case-insensitive string hash map implementation:

```java
public class CiStringTest {
       @Test
       public void nvl() {
               Assertions.assertNull(CiString.nvl(null));
               Assertions.assertNotNull(CiString.nvl(""));
       }
       @Test
       public void testEquals() {
               Assertions.assertEquals(CiString.of("String"), CiString.of("sTRING"));
               Assertions.assertNotEquals(null, CiString.of(""));
       }
       @Test
       public void testHashCode_caseInsensitive() {
               CiString lowerCase = CiString.of("sTriNg");
               CiString upperCase = CiString.of("StRING");
               Assertions.assertEquals(lowerCase.hashCode(), upperCase.hashCode());
       }
       @Test
       public void of_whenNullString_thenException() {
               NullPointerException nullPointerException = Assertions
                               .assertThrows(NullPointerException.class, () -> CiString.of(null));

               Assertions.assertEquals("stringVal is marked non-null but is null", nullPointerException.getMessage());
       }
       @Test
       public void toStringTest() {
               Assertions.assertEquals("test", CiString.of("test").toString());
       }
}
```

I'm active on Twitter and LinkedIn, and I'd love it if you could give me a follow.
You can find me on Twitter at [@mare_milenkovic](https://twitter.com/mare_milenkovic) and on LinkedIn at [mare-milenkovic](https://www.linkedin.com/in/mare-milenkovic/).