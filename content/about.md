+++
sidebar = false
singleColumn = true
title = "About Me"
description = "Marko Milenkovic — Senior Java Developer & Team Lead writing about backend performance, SQL Server, JUnit and JVM internals."
date = "2022-07-10"
aliases = ["about-us", "contact", "now"]
author = "Marko Milenkovic"
[[resources]]
src = "../images/marko_milenkovic.jpg"
+++

{{< figure src="../images/benchmarks-banner.svg" alt="Benchmarks, not vibes — 27,794 ms down to 1,075 ms" >}}

{{< figure src="../images/marko_milenkovic.jpg" width="200" class="roundedEdges" >}}

## What I Do

I'm **Marko Milenkovic**, a Senior Java Developer & Team Lead with 10+ years of professional experience in backend development and 15+ years in software development. Based in Nis, Serbia.

Specialist in REST API design, platform migrations, CI/CD engineering, and application security across enterprise fintech products involving large-scale data processing. Focused on sharing knowledge and helping Java developers optimize their work — writing clean, secure, and performant code.

## What I Write About

This site is where I document what I actually learn and measure:

- **Performance benchmarks** — real numbers, not vibes (see the [Fastest Way To Insert Data in MS SQL](/series/fastest-way-to-insert-data-in-ms-sql/) series)
- **JPA/Hibernate & databases** — the pitfalls that cost hours in production
- **Testing** — JUnit 5, parallelization, test-suite speed
- **Short lessons** — quick notes land in [TIL](/til/)

Runnable code for posts lives in [blog-examples](https://github.com/mmarko88/blog-examples).

## Elsewhere

- **LinkedIn**: [marko-milenkovic](https://www.linkedin.com/in/marko-milenkovic/)
- **X (Twitter)**: [@mare_milenkovic](https://x.com/mare_milenkovic)
- **GitHub**: [mmarko88](https://github.com/mmarko88)
- **dev.to**: [mmarko88](https://dev.to/mmarko88)
- **RSS**: [index.xml](/index.xml)

---

## What I'm Doing Now

*Last updated: October 2026*

### Building an agentic development framework

My main focus right now is building an **agentic development framework** on top of
[Devin](https://devin.ai) — the one powering real work on a 4,000-file Spring Boot codebase.
It's a measurement-first setup: context budgets, specialist checkpoints, read-only subagents,
and an eval harness that treats prompt changes like code changes.

- Writing the 11-part [Agentic Development series](/post/agentic/intro/) on patterns that actually paid off
- Running the eval harness against every PR touching skills or rules — three real regressions caught before rollout
- Experimenting with cheaper-model subagents for exploration tasks (5x cost reduction, no accuracy loss on measured research questions)
- Thinking about the next cliff: what's the shape of a 50x-cheaper tool-restricted agent?

### Day job

- Java backend engineering on multi-tenant SQL Server workloads — Hibernate 6, Spring Boot 3, JDBC Bulk API
- Performance tuning: the [Fastest MS SQL Inserts](/post/java/mssqlserver/fast_insert_part8/) series grew out of a real bottleneck I shipped a fix for
- Code review on security remediation and database migrations

### Website

- Keeping this site measured and honest: SEO, OG cards, structured data, image budgets
- Experimenting with Instagram-style like hearts instead of opacity dimming — small UX wins that compound

### Reading & exploring

- Java virtual threads — where they actually help (hint: not everywhere; the hype is uneven)
- Hibernate 6 performance pitfalls — the next post series
- The [TIL feed](/til/) is where loose notes and short lessons land before they become posts

*Inspired by [nownownow.com](https://nownownow.com/about) — a page that answers "what are you up to these days?"*

---

## CV

> Download the full PDF: **[Marko_Milenkovic_CV.pdf](/files/Marko_Milenkovic_CV.pdf)**

### Employment History

#### Senior Java Developer & Team Lead — Investment Cafe
**Badin Soft (2018–2022) → Wiser Technologies (2022–Present)**
*2018 — Present*

Team lead and core maintainer of the **Investment Cafe** platform at **BlackRock** (formerly eFront) — a multi-tenant document management and investor communication system serving BlackRock's alternative investments clients globally.

- Led a development team, coordinating work and guiding team members
- Built the **REST API layer from scratch**: FundInvestor, FundFamily, and DocumentTypes services
- Designed and implemented the **MFA/TOTP authentication system** — full lifecycle
- Created the **Cloud Store POC** for cloud-native S3 storage
- Led the **Spring Boot 3 migration** (148 commits, 2,483 files): javax→Jakarta, Hibernate 5→6, OpenAPI 3
- Built the **IC Full Deployment Pipeline** (Azure Pipelines + Terraform + AWS EBS) with Blue-Green deployments
- Spearheaded **TVAS security hardening** (58 commits): SQL injection, SSRF, path traversal, AES/GCM encryption
- Delivered major **performance improvements**: Contact Import bottleneck, materialized view redesign, Document Search
- Drove the **Flash → Spring Boot/React migration** under tight deadlines
- Designed and implemented the **Excel import/export module** end-to-end
- Improved the **mailing system**: automated D5 emails, email archive with BCC, PII masking
- Contributed across **6 product areas** beyond IC: CPS Integration Services, Asset Servicer Portal, CRM Platform, Insight Core, Invest

*Tech: Java 17, Spring Boot 3, Hibernate 6, Jakarta EE, MSSQL, Liquibase, OAuth2, Docker, Terraform, AWS EBS, TomEE 10, OpenAPI 3, CyberArk, SonarQube, Veracode, Azure Pipelines, React, .NET/C#*

#### Senior Java Developer & Tech Lead — CREALOGIX E-Banking
**Badin Soft** | *2017–2018*

E-banking application for major Swiss banks (TKB, BKB, AKB). Maintained version 2.0 across 3 major releases.

*Tech: Java, Spring, Oracle DB, Git, Bitbucket*

#### Senior Java Developer — Transactor HQ
**Badin Soft** | *2014–2017*

Three-layer fintech application (Oracle, Java Spring/MyBatis/Jersey API, Angular). Designed and developed secure, high-performance RESTful API services.

*Tech: Java, Spring Boot, MyBatis, Jersey, Oracle DB, Angular*

#### Freelance Developer
*December 2011 — April 2014*

Various projects in Java: Swing, GWT, JSP, JSF, Android, Apache CXF, Spring, REST.

### Education

- **Master's Degree** — Computer Science, University of Nis (2011–2016)
- **Bachelor's Degree** — Computer Science, University of Nis (2007–2011)

### Technical Skills

**Languages:** Java, SQL, PL/SQL, JavaScript, C#/.NET, Python, C/C++

**Frameworks:** Spring (Core, MVC, Boot, Security, Batch, Cloud, WebFlux), Hibernate, MyBatis, Jakarta EE, EJB, OAuth2

**Web:** REST, SOAP, OpenAPI 3, gRPC, Microservices, Kafka, React, Angular

**Databases:** MS SQL Server, Oracle DB, PostgreSQL, H2, Azure Cosmos DB, Liquibase

**DevOps:** Docker, Terraform, Azure Pipelines, GitHub Actions, Jenkins, AWS (EBS, S3, CloudWatch), SonarQube, Veracode

**Tools:** Git, Maven, IntelliJ IDEA, JMeter, Postman, Splunk, CyberArk

### Languages

- **Serbian** — Native
- **English** — Full Professional Proficiency
