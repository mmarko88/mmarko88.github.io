---
title: Fastest way to insert data in ms sql server database
date: 2023-10-18
draft: true
usePageBundles: true
featureImage: 'parralel_tests_maven_junit5.png' # Top image on post.
featureImageAlt: 'Feature image - maven configuration example' # Alternative text for featured image.
shareImage: 'parallel_tests_maven_junit5.png' # For SEO and social media snippets.
tags: ["java", "hibernate", "sql", "ms sql server" ]
categories: [
    "java",
    "performance",
    "sql"
]
---

As a Java web developers, we usually develop services using Spring boot and Hibernate to develop applications. We rely on Hibernate to store our data in the database. Hibernate doesn't do this most efficiently, especially if we need to store array of data. There are properties to improve speed of inserting data that drastically improve speed, but is this enough? Can we do better? And how fast is Hibernate compared to raw SQL inserts?

I will compare 2 different methods of storing data:
1. With Hibernate, using batching parameter.
2. By using prepared statement.


