---
title: "How to Write Case Insensitive Equals and Hash Code in Java"
date: 2023-05-08
draft: true
usePageBundles: true
featureImage: 'case_sensitive_vs_case_insensitive_hash_map.svg' # Top image on post.
featureImageAlt: 'Case sensitive vs case insensitive hash map' # Alternative text for featured image.
shareImage: 'case_sensitive_vs_case_insensitive_hash_map.svg' # For SEO and social media snippets.
tags: ["java", "hashMap"]
categories: [ "java"]
---

In the previous article I spoke about how to put string in hash map and seach it in case insensitive way. This is done by creating new wrapper class for string and by overriding hashCode and equals methods. Hash code is implemented in special way in order not to generate additional strings and because of that improve performance.

While, this is a good way to put string in hash map as a key, what should we do if we want to put an object that contains multiple strings in it. We can do it by using a wrapper class defined in previous article, but I think that we can do even better. In this case I see at least 2 things that we can do better:
1. Using wrapper class means more memory usage.
2. There are cases where you don't want or can't change String type in those classes.

In that case, we can override `equals` and `hashCode` methods in the carrier class and avoid those problems.

## Example
Let's say that we have `Person` class with fields `firstName` and `lastName`. We can override methods `equals` and `hashCode` to ignore casing.

To implement those methods, the best way is to use IDE to help you with the code, as it is genneric.

Image

But instead of using Objects.equals method, I will change it with a custom method to compare strings by not checking case sensitivity. It is the same case for the `hashCode`. We can put this in util class, in my example `StringUtils`.

```java
public record Person (String firstName, String lastName) {

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        Person person = (Person) o;

        if (!StringUtils.ciEquals(firstName, person.firstName)) return false;
        return StringUtils.ciEquals(lastName, person.lastName);
    }

    @Override
    public int hashCode() {
        int result = StringUtils.ciHashCode(firstName);
        result = 31 * result + StringUtils.ciHashCode(lastName);
        return result;
    }
}
```


Let's check how stringUtils class is implemented:

```java
public class StringUtils {
    private StringUtils() {}

    public static int ciHashCode(String stringVal) {
        if (stringVal == null) {
            return 0;
        }
        int h = 0;
        if (stringVal.length() > 0) {
            for (int i = 0; i < stringVal.length(); i++) {
                h = 31 * h + Character.toLowerCase(stringVal.charAt(i));
            }
        }
        return h;
    }

    public static boolean ciEquals(String a, String b) {
        return a == b || a != null && a.equalsIgnoreCase(b);
    }
}
```

Note that StringUtils class exists in apache commons library with the method `equalsIgnoreCase`. So, if you are using this library in your project, you don't need to write that function again.

The `hashCode` function is implemented in the same way as in the `String` class with exception that it doesn't store value of hash code in variable for caching and it puts every character to lower case in order to use it for calculation.


## Conclusion

By using those simple functions, and IDE code generator you can create class that can be stored in hash map and in other collections without considering case sensitivity. This is specifically important for storing objects as a key in a Hash map as it allow us to do it in very efficient way. And as we know, HashMaps are very efficient for searching by keys.
