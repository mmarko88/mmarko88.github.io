---
title: "TIL: String.isBlank() vs isEmpty()"
date: 2026-10-12
draft: false
tags: ["java", "til"]
categories: ["java"]
---

`" ".isEmpty()` returns **false**, but `" ".isBlank()` returns **true** — whitespace counts as blank, not empty.

```java
" ".isEmpty();   // false — length is 1
" ".isBlank();   // true  — whitespace only (Java 11+)
"abc".isBlank(); // false
```

I caught myself writing `s.trim().isEmpty()` again today. `String.isBlank()` exists since Java 11 and covers exactly this case — plus it is Unicode-aware, so `" \u00A0 ".isBlank()` also works where `trim()` misses non-breaking spaces.
