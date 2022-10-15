---
title: "Setting Up Junit 5 Parallel Test Execution With Maven"
date: 2022-09-17
draft: true
usePageBundles: true
featureImage: 'mvn_config.png' # Top image on post.
featureImageAlt: 'Feature image - maven configuration example' # Alternative text for featured image.
shareImage: 'mvn_config.png' # For SEO and social media snippets.
---

# Introduction
We need fast build pipelines. This is because we need fast feedback from our pipeline. If there is something wrong with our code we want our pipeline to fail fast. In order to accomplish that, you may decide to allow parallel test execution for tests in you project. This post describes how to do that with Maven and Junit 5 tests.

# Getting Started With Junit 5 And Maven

To get started with Junit 5 you need to import following dependency into the project:

```xml

<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter-engine</artifactId>
    <version>5.9.0</version>
    <scope>test</scope>
</dependency>
```

At the time of writing this article, version *5.9.0* is the newest, but you should
check [maven repository](https://mvnrepository.com/artifact/org.junit.jupiter/junit-jupiter-engine) for newer version.
Notice, that library is imported in *test* scope as there is no need for this library to be in production code because it is only used for running tests.

# Running tests in parallel
Maven offers you two ways for running tests in parallel:

1. By starting multiple JVM instances
2. By using multiple threads in the same JVM instance

## 1. By using the parallel parameter
The setup for parallel test execution is very straightforward. Just include the following parameter:

```xml

<forkCount>2</forkCount>
```

It must have value greater than 1 in order to enable parallel execution. It is important to know that parallel execution is achieved by starting multiple JVM child processes. This has multiple consequences, and it can affect your
decision to use this method. Maven starts multiple JVM instances, and this means that it consumes more memory. On the other hand, each thread has its own memory space, and it accomplishes greater level of test's
independence as the data between the processes cannot be shared. You can use this method when you need to use in-memory database for your unit tests.

In the previous example parameter ````forkCount```` has fixed positive integer value which represents number of forks. Of course, most of the projects are shared between developers, and we don't know how many cores other developers will have on their machine. In order to better use their hardware, it would be great if we can set this parameter to create number of forks that depends on a number of cores on CPU. Maven supports this, and you can configure it in the following way:

```xml

<forkCount>1C</forkCount>
```

This configuration instructs Maven to create one fork for each core. If your CPU has two virtual threads per core, you can also enter ```2C``` in order to utilize maximum CPU resources. Or if you don't want to utilize ```100%``` of your CPU, you can enter ```0.5C``` which will instruct Maven to create forks for the half of CPU cores. 

## 2. By setting up Junit multi-thread execution

Maven uses plugins nearly for everything. This is also the case for running a project tests. To run project tests Maven uses the Surefire plugin. Unfortunately, it uses old version the plugin by default, and which doesn't support Junit5 tests execution. So, we need to import newer version of this plugin to Maven. In order to include newer version of this plugin we need to configure Maven. This can be done by adding following XML to the ````pom.xml````:

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

The ```xml``` in quite self-descriptive. We add new plugin that is located in ```build->pluginManagement->plugins``` section of Maven ```pom.xml```. Again, here we import the newest version of surefire plugin at the time of writing this article, and you can check [this url](https://mvnrepository.com/artifact/org.apache.maven.plugins/maven-surefire-plugin/3.0.0-M7) for newer version.

Now, when we have newer version of surefire plugin loaded we can continue to configure Maven for multithreaded tests execution. 

In the official Maven documentation, in order to achieve this, you need to use ```parallel, threadCount``` and ```useUnlimitedThreads``` parameters . I tried all of these parameters, but nothing worked with Junit 5. By checking official documentation for Maven Surefire and Junit 5 we can conclude that Junit 5 supports new multithreaded execution model (which is still in preview phase). So, in order to configure multithreaded execution, we
need to configure Junit5 also. This can be done by setting up properties in maven configuration.

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

Another option is to create ```junit-platform.properties``` file, put it into ```test/resources``` folder and put all the properties in that file instead of ```pom.xml```.

It is enough just to set ```junit.jupiter.execution.parallel.enabled=true``` in order to allow parallel tests execution. But, if you try running test after setting up this parameter value to ```true``` you will be surprised to see that tests are still running sequentially. Reason for this is because there are 2 strategies in which you can allow parallel execution in
tests.

1. Junit can assume that all tests are sequential, and only ones that are annotated with ```@Execution(CONCURRENT)``` will be executed in parallel. You can use this annotation on a class or test method in order to enable parallel execution.
2. You can set parameter ```junit.jupiter.execution.parallel.mode.default = concurrent```. In this case, all tests will
   execute in parallel by default except ones annotated with ```ExecutionMode.SAME_THREAD```.

### How many threads Junit will use for parallel execution?

This is also configurable property ```junit.jupiter.execution.parallel.config.strategy=dynamic``` and it also has default value ```dynamic```. Strategy can be also ```fixed``` or ```custom```. If we set up ```fixed``` value for this
property, then we also need to set up value for
the ```junit.jupiter.execution.parallel.config.fixed.parallelism=<positive integer>```. This is not scalable
solution, and we should use ```dynamic``` value in order to more utilize hardware.

```dynamic``` property also has connected property that influences how many threads will be created. ```junit.jupiter.execution.parallel.config.dynamic.factor=<positive decimal number>```. Factor to be multiplied
by the number of available processors/cores to determine the desired parallelism for the dynamic configuration strategy.

# Conclusion
Parallel test execution can speed up your build significantly, but you need to be careful when enabling it as it will not always provide you with better performance. This is because the tests may use the same resource, and they can wait to each other to access it. Because of that it is always good idea to test and check everything.

Another bigger problem with parallel tests is if the tests are not independent, there can be [flaky tests](https://www.techtarget.com/whatis/definition/flaky-test) that are very hard to debug and identify.

If you liked this post, you can follow me on [Twitter](https://twitter.com/mare_milenkovic) or [LinkedIn](https://www.linkedin.com/in/marko-milenkovic-48320b59/) for more content.

# Resources
[Maven documentation](https://maven.apache.org/surefire/maven-surefire-plugin/examples/fork-options-and-parallel-execution.html)
[Junit guide](https://junit.org/junit5/docs/snapshot/user-guide/#writing-tests-parallel-execution)
[JUnit5 Parallel Execution of tests](https://antkorwin.com/junit5/junit5_parallel_execution.html)

