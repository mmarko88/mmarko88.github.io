---
title: Setting up Junit 5 Parallel Test Execution With Maven
date: 2022-10-15
draft: false
usePageBundles: true
featureImage: 'parralel_tests_maven_junit5.svg' # Top image on post.
featureImageAlt: 'Feature image - maven configuration example' # Alternative text for featured image.
shareImage: 'parralel_tests_maven_junit5.svg' # For SEO and social media snippets.
tags: [
    "java", "maven", "junit 5", "testing", "parallel tests", "concurrent tests", "junit testing", "java testing", "junit 5 testing", "multithreaded tests in java"
]
categories: [
    "java",
    "testing",
]
---

# Introduction
We need fast-build pipelines. This is because we need fast feedback from our pipeline in order to be more productive. If something is wrong with our code, then we want our pipeline to fail fast. To accomplish that, you may decide to allow parallel test execution for tests in your project. This post describes how to do that with Maven and Junit 5.


# Getting Started With Junit 5 and Maven

To get started with Junit 5, you need to import the following dependency into the project:

```xml

<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter-engine</artifactId>
    <version>5.9.0</version>
    <scope>test</scope>
</dependency>
```
At the time of writing this article, version *5.9.0* is the newest. You should check [maven repository](https://mvnrepository.com/artifact/org.junit.jupiter/junit-jupiter-engine) for a new version. Notice, that we imported the library in *test* scope as there is no need for this library to be in production code because we only use it for running tests.

# Running Tests in Parallel
Maven offers you two ways for running tests in parallel:

1. By starting multiple JVM instances
2. By using multiple threads in the same JVM instance

## 1. By Using the Parallel Parameter
The setup for parallel test execution is straightforward. Include the following parameter:


```xml

<forkCount>2</forkCount>
```
It must have a value greater than 1 to enable parallel execution. It is important to know that parallel execution is achieved by starting multiple JVM child processes. This has multiple consequences, and it can affect your decision to use this method. Maven starts multiple JVM instances, and this means that it consumes more memory. Each thread has its own memory space. But it accomplishes a greater level of test independence, as processes cannot share data. You can use this method when you need to use an in-memory database for your unit tests.

The parameter ````forkCount```` has a fixed positive integer value which represents the number of forks. Of course, it is usual that multiple developers work on the same project, and we don't know how many cores other developers will have on their machines. To better use hardware, it would be great if we can set this parameter to create a number of forks that depends on the number of cores on CPU. Maven supports this, and you can configure it in the following way:


```xml

<forkCount>1C</forkCount>
```
This configuration instructs Maven to create one fork for each core. If your CPU has two virtual threads per core, you can also enter ```2C```to use most CPU resources. Or if you don't want to use ```100%``` of your CPU, you can enter ```0.5C``` which will instruct Maven to create forks for the half of CPU cores. 

## 2. By Setting up Junit Multi-Thread Execution
Maven uses plugins for everything. This is also the case for running project tests. To run project tests, Maven uses the Surefire plugin. Unfortunately, it uses the old version of the plugin by default, which doesn't support Junit5 test execution. So, we need to import a newer version of this plugin to Maven. To include a newer version of this plugin, we need to configure Maven. We can do this by adding the following XML to the ````pom.xml````:

```xml

<build>
    <pluginManagement>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.0.0-M7</version>
                <configuration>
                    We will add configuration here
                </configuration>
            </plugin>
        </plugins>
    </pluginManagement>
</build>
```
The ```XML``` is quite self-descriptive. We add new plugin that is in ```build->pluginManagement->plugins``` section of Maven ```pom.xml```. We import the newest version of the surefire plugin at the time of writing this article. You can check [this url](https://mvnrepository.com/artifact/org.apache.maven.plugins/maven-surefire-plugin/3.0.0-M7) for a newer version.

Now, when we have a newer version of the surefire plugin loaded, we can continue to configure Maven for multithreaded test execution. 

In the official Maven documentation, to achieve this, you need to use ```parallel, threadCount``` and ```useUnlimitedThreads``` parameters. I tried all these parameters, but nothing worked with Junit 5. By checking official documentation for Maven Surefire and Junit 5 we can conclude that Junit 5 supports a new multithreaded execution model (which is still in the preview phase). So, to configure multithreaded execution, we need to configure Junit5 as well. We can do this by setting up properties in the Maven configuration.

```xml

<configuration>
    <properties>
        <configurationParameters>
            junit.jupiter.execution.parallel.enabled=true
            ...
        </configurationParameters>
    </properties>
</configuration>
```
Another option is to create ```junit-platform.properties``` file. Put it into ```test/resources``` folder, and put all the properties in that file instead of ```pom.xml```.

It is enough to set ``junit.jupiter.execution.parallel.enabled=true``` to allow parallel test execution. But, if you try running the test after setting up this parameter value to ```true``` it will surprise you to see that tests are still running sequentially. The reason for this is that there are 2 strategies in which you can allow parallel execution in tests.

1. Junit can assume that all tests are sequential, and only ones that are annotated with ```@Execution(CONCURRENT)``` will be executed in parallel. You can use this annotation on a class or test method to enable parallel execution.
2. You can set parameter ```junit.jupiter.execution.parallel.mode.default = concurrent```. Here, all tests will run in parallel by default except ones annotated with ```ExecutionMode.SAME_THREAD```.

### How Many Threads Junit Will Use for Parallel Execution?


This is also configurable property ```junit.jupiter.execution.parallel.config.strategy=dynamic``` and it also has default value ```dynamic```. Strategy can be also ```fixed``` or ```custom```. If we set up ```fixed``` value for this property, then we also need to set up the value for the ```junit.jupiter.execution.parallel.config.fixed.parallelism=<positive integer>```. This is not a scalable solution, and we should use ```dynamic``` value to better utilize the hardware.

```dynamic``` property also has a connected property that influences how many threads JUnit will create. ```junit.jupiter.execution.parallel.config.dynamic.factor=<positive decimal number>```. Factor to multiply by the number of processors/cores to determine the desired parallelism for the dynamic configuration strategy.

# Conclusion
Parallel test execution can speed up your build, but you must be careful when enabling it as it will not always provide you with better performance. This is because the tests may use the same resource, and they can wait for each other to access it. Because of that, it is always a good idea to test and check everything.

Another more significant problem with parallel tests is if the tests are not independent, there can be [flaky tests](https://www.techtarget.com/whatis/definition/flaky-test). They are very hard to debug and identify.

If you liked this post, you can follow me on [Twitter](https://twitter.com/mare_milenkovic) or [LinkedIn](https://www.linkedin.com/in/marko-milenkovic-48320b59/) for more content.

# Resources
[Maven documentation](https://maven.apache.org/surefire/maven-surefire-plugin/examples/fork-options-and-parallel-execution.html)

[Junit guide](https://junit.org/junit5/docs/snapshot/user-guide/#writing-tests-parallel-execution)

[JUnit5 Parallel Execution of tests](https://antkorwin.com/junit5/junit5_parallel_execution.html)

