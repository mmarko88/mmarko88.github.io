# LinkedIn Profile — Copy-Paste Draft

Profile: https://www.linkedin.com/in/marko-milenkovic/
Source of truth: `content/about.md` — keep numbers in sync with CV.

---

## 1. Headline (max 220 chars)

**Option A — recommended (keyword-first, ~128 chars):**

```
Senior Java Developer & Team Lead | Spring Boot · Hibernate · MS SQL performance | Benchmarks, not vibes — professionaldev.dev
```

**Option B (~130 chars):**

```
Senior Java Developer @ BlackRock — leading the Investment Cafe dev team | Java 17, Spring Boot 3, Hibernate 6 | professionaldev.dev
```

---

## 2. About / Summary (max 2,600 chars — draft is ~1,950)

```
Java backend engineer and team lead with 10+ years in enterprise fintech. I build and tune systems that push large amounts of data through MS SQL Server — and I write down what I measure, not what I guess.

Currently leading a dev team on Investment Cafe (BlackRock, formerly eFront) — a multi-tenant document management and investor communication platform for BlackRock's alternative investments clients.

Recent work:
• Led the Spring Boot 3 migration — 148 commits, 2,483 files: javax→Jakarta, Hibernate 5→6, OpenAPI 3
• Built the REST API layer from scratch — FundInvestor, FundFamily, DocumentTypes services
• Designed and implemented the MFA/TOTP authentication system, full lifecycle
• Built the deployment pipeline — Azure Pipelines + Terraform + AWS, blue-green deployments
• Security hardening — 58 commits: SQL injection, SSRF, path traversal, AES/GCM encryption
• Performance work that shipped — contact import bottleneck, materialized view redesign, document search

On the side:
• Building an agentic development framework on top of Devin — context budgets, specialist checkpoints, an eval harness that treats prompt changes like code changes
• Writing an 11-part series on the patterns that actually paid off

I write at professionaldev.dev:
• "Fastest Way to Insert Data in MS SQL" — 8-part benchmark series born from a real production bottleneck
• JPA/Hibernate pitfalls, JUnit 5 parallelization, JVM internals — real numbers, not vibes
• Runnable code for every post: github.com/mmarko88/blog-examples

Tech: Java 17, Spring Boot 3, Hibernate 6, MS SQL Server, Azure Pipelines, Terraform, AWS.

Open to conversations about backend performance, JVM internals, and agentic developer tooling.
```

---

## 3. Experience

### 3.1 Wiser Technologies (formerly Badin Soft)
**Title:** Senior Java Developer (Team Lead)
**Dates:** Jan 2018 – Present · Nis, Serbia

```
Senior developer and team lead on Investment Cafe at BlackRock (formerly eFront) — a multi-tenant document management and investor communication system serving BlackRock's alternative investments clients globally.

• Led a development team — coordinating work and mentoring team members
• Built the REST API layer from scratch: FundInvestor, FundFamily, DocumentTypes
• Designed the MFA/TOTP authentication system, full lifecycle
• Cloud Store POC for cloud-native S3 storage
• Led Spring Boot 3 migration: 148 commits, 2,483 files — javax→Jakarta, Hibernate 5→6, OpenAPI 3
• Built IC Full Deployment Pipeline: Azure Pipelines + Terraform + AWS EBS, blue-green deployments
• TVAS security hardening: 58 commits — SQL injection, SSRF, path traversal, AES/GCM encryption
• Performance: contact import bottleneck, materialized view redesign, document search
• Drove Flash → Spring Boot/React migration under tight deadlines
• Excel import/export module, end-to-end
• Mailing system: automated D5 emails, email archive with BCC, PII masking
• Contributed across 6 product areas: CPS Integration Services, Asset Servicer Portal, CRM Platform, Insight Core, Invest

Tech: Java 17, Spring Boot 3, Hibernate 6, Jakarta EE, MS SQL Server, Liquibase, OAuth2, Docker, Terraform, AWS, TomEE 10, OpenAPI 3, Azure Pipelines, React
```

> If Badin Soft and Wiser Technologies show as separate companies on LinkedIn, create two entries split at 2022 with the same title, or leave as one entry — the work was continuous.

### 3.2 Badin Soft — CREALOGIX E-Banking
**Title:** Senior Java Developer & Tech Lead
**Dates:** 2017 – 2018

```
E-banking application for major Swiss banks (TKB, BKB, AKB). Maintained version 2.0 across 3 major releases.

Tech: Java, Spring, Oracle DB, Git, Bitbucket
```

### 3.3 Badin Soft — Transactor HQ
**Title:** Senior Java Developer
**Dates:** 2014 – 2017

```
Three-layer fintech application (Oracle, Java Spring/MyBatis/Jersey API, Angular). Designed and developed secure, high-performance RESTful API services.

Tech: Java, Spring Boot, MyBatis, Jersey, Oracle DB, Angular
```

### 3.4 Freelance Developer
**Dates:** Dec 2011 – Apr 2014

```
Various projects in Java: Swing, GWT, JSP, JSF, Android, Apache CXF, Spring, REST.
```

---

## 4. Featured Section (pin 3–4 items)

- **professionaldev.dev** — "I write about backend performance with real benchmarks."
  https://professionaldev.dev
- **Fastest Way to Insert Data in MS SQL** — 8-part benchmark series
  https://professionaldev.dev/series/fastest-way-to-insert-data-in-ms-sql/
- **Agentic Development series** — 11-part series on building a measured agent framework
  https://professionaldev.dev/post/agentic/intro/
- **blog-examples (GitHub)** — runnable code for every post
  https://github.com/mmarko88/blog-examples
- Optional: **CV PDF**
  https://professionaldev.dev/files/Marko_Milenkovic_CV.pdf

---

## 5. Skills (pin top 3, then add the rest)

**Top 3:** Java, Spring Boot, Microsoft SQL Server

**Then add:**
Hibernate · REST APIs · SQL · Jakarta EE · Azure Pipelines · Terraform · Docker · AWS · OAuth2 · Liquibase · Git · Maven · JUnit · React · Angular · Oracle Database · PostgreSQL · Microservices · Apache Kafka · gRPC · OpenAPI · Performance Tuning · CI/CD · Spring Security · MyBatis · Jenkins · GitHub Actions

---

## 6. Education

- **MSc Computer Science** — University of Nis, 2011–2016
- **BSc Computer Science** — University of Nis, 2007–2011

---

## 7. Profile Settings Checklist

- **Profile photo:** use `assets/images/author.jpg` (or a fresh headshot — same photo as the site builds recognition)
- **Banner image:** upload `linkedin-banner/linkedin-banner.png` ("Benchmarks, not vibes" — adaptive source at `static/images/benchmarks-banner.svg`, also shown on the about page)
- **Location:** Nis, Serbia · **Industry:** Software Development
- **Website button:** add "professionaldev.dev" as the profile link (shows under the headline in Creator mode)
- **Languages:** Serbian (native), English (full professional)
- **Creator mode:** consider enabling with hashtags #java #springboot #sqlserver #performance — you already have the content cadence to back it up

---

## 8. Keep in Sync

When CV/about page numbers change (commit counts, series lengths, new roles), update:
- Headline + About bullets
- Investment Cafe experience description
- Featured links (new flagship series)
