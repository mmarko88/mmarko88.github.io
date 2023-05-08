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


How to put objects of a class in a hashMap that 


Object {
String s1;
String s2;
}

Condition: caseInsesensitive compare

HashMap 


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


