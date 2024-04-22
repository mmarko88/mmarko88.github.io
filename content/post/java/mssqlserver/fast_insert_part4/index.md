---
title: Fastest Way To Insert the Data in MS SQL – Part 4 – `useBulkCopyForBatchInsert` parameter performance impact
date: 2024-04-17
draft: true
usePageBundles: true
featureImage: 'java_sending_data_to_mssql_server.jpg' # Top image on post.
featureImageAlt: 'java sending data to mssql server' # Alternative text for featured image.
shareImage: 'java_sending_data_to_mssql_server.jpg' # For SEO and social media snippets.
tags: [ "java", "ms sql server" ]
categories: [ "java", "sql" ]
---

In the previous posts we concluded that the bulk insert and
multi-value batched inserts are the fastest way to insert data into
MS SQL server. But, before we close these series, there is another 
option to check.

MS SQL server introduced parameter `useBulkCopyForBatchInsert` that
will turn on bulk api for batched inserts. This is done in database
driver level, so it should work with regular parametrized inserts
and also with Hibernate inserts. 

In this post, we will check the performance impact of the parameter
on Hibernate inserts and jdbc inserts, by comparing them with regular
batch inserts, manual Bulk API usage and multi-value jdbc inserts.

Code used for examples is the same as in previous posts so it won't be
listed. 

I run the tests to insert `1.000.000` `Person` objects with different
batch sizes (`100`, 1.000`, 10.000` and `20.000`). Each test 
is executed 10 times and median time is calculated. With parameter
turned on, the results are the following:


| MethodName        | MedianDuration | BatchSize |
|-------------------|----------------|-----------|
| Jdbc Template     | 5752           | 20000     |
| Jdbc Template     | 5897           | 10000     |
| Jdbc Template     | 7361.5         | 1000      |
| Hibernate Persist | 8019.5         | 10000     |
| Hibernate Persist | 8025.5         | 20000     |
| Hibernate Persist | 9491           | 1000      |
| Jdbc Template     | 39273.5        | 100       |
| Hibernate Persist | 41904          | 100       |

The Jdbc Template insert is again faster by around 2 seconds for
each batch size, even in case of batch size `100`. 

This proves that Hibernate adds overhead of processing, and it is 
probably overhead related to entity state tracking.

Based on those results, the difference is not big. So let's compare
those results with regular batch inserts.

| MethodName        | MedianDuration | BatchSize |
|-------------------|----------------|-----------|
| Jdbc Template400  | 4113.5         | 100       |
| Jdbc Template     | 14118.5        | 20000     |
| Jdbc Template     | 14320          | 10000     |
| Jdbc Template     | 14683.5        | 1000      |
| Hibernate Persist | 16186          | 20000     |
| Hibernate Persist | 16198.5        | 10000     |
| Hibernate Persist | 16825          | 1000      |
| Jdbc Template     | 16981.5        | 100       |
| Hibernate Persist | 21830          | 100       |


The performance difference can be seen visually:

![Batch insert vs Bulk api parameter insert](bulkParamVsRegularBatchInsert.png)

We can see that with jdbc batching parameter turned on, 
the performance is much better. We can see that it is behaving
 similar like BulkApi from previous post and it is logical
as this parameter is using the same API.

When compared with Jdbc Template insert with `400` persons inserted
per statement (`2.000` bind parameters). We can see that it has the 
the best performance.

Be cautious because
