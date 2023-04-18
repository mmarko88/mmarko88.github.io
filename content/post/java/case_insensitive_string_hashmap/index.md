---
title: "How to use case insensitive string in hash map"
date: 2023-20-04
draft: true
usePageBundles: true
featureImage: '' # Top image on post.
featureImageAlt: '' # Alternative text for featured image.
shareImage: '' # For SEO and social media snippets.
---

Why is this important?
Microsoft SQL server by default stores data by not checking case sensitivity. Java is case sensitive and this can create problems. I already had a numerious bugs because of this case sensitivity mismatch. 

What the reader will get/learn from this post?

// maybe replace id's with emails
We have a lot of examples in our codebase that goes like follosing:
1. Requests comes from user.
2. Some kind of id's are passed as argument in the request.
3. We need to check if all of the id's exists in the database and if some of them doesn't exists, return the error message to the user giving him info what exacly id is not present in our system.

Checking one by one id against the database is very slow, so we are creating collections of unique ids, call the database and return array list of id's in the database with other user info required for the request processing.

The problem starts with following:
As database is case insensitive, it will return all id's by not comparing the stings by case sensitivity.
In java, we usually create hash map to match incoming ids with ids from the database. But the problem is that hash map strings are case sensitive and not all ids are found.

This illustration explains the problem:

There is easy solution in java and the solution is to use TreeMap instead of hashMap as it can accept custom comparator. Like following:

```java
Map<String, String> mapping = new TreeMap(String::caseInsensitiveComparator);
```

Tree maps have very good performances. They do the work, but they are not as fast as hash maps and the larger data is the more time is needed to query the data. Althrough, searching the data has similar speed like binary search, so the access speed will not drop linearly. The performances are very good, but it cannot compare to hash map that has nearly o(1) access speed. 

Unfortenatelly, hash map works based on object hash code and equals methods. It doesn't allow to supply custom functions at the constructor, or by any other way. This is very limiting, and because of this reason programmers usualy go through way with less resistence and use TreeMap.

But, as a professional developers we can do better and create implementation for case insensitive string equals and hash code methods.

There are following challenges:
1. We can convert all strings to lower/upper case. Following problems arise from this:
    a. We create a lot of new objects (double memory usage).
    b. We need always to lower/upper case input strings for hash map, which in high load scenarios can create memory churn. 
    c. It is requred to use and store strings with original casing, so we would need a way to map from lower/upper cased string to original one.
  Based on all of the above, it doesn't look as a good aproach.
2. We can extend String class and override hashCode and equals methods. And even better alternative is to create new type, store string as final local variable and implement custom equals and hashCode methods.

We still need to create new objects, but compared to creating new strings, this is much lower memory allocation. 

The challenge, now is how to implement those two methods.

1. For equals, we don't want to use toLowerCase, because of the problems I mentiontioned above. Instead, we can use method equalsIgnoreCase.

2. For hashMethod, we can copy the logic from the string class (open source rocks :D) and instead of using original chars for generating hashCode, we can use their lowercase version. Here is the implementation:

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

We are good citizens and we write tests. Here is the test class content:

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

