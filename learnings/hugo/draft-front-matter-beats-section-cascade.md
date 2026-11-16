---
title: Page-level draft:true overrides the section cascade — parked posts must not keep it
date: 2026-11-16
category: hugo
problem_type: wrong_assumption
applies_when:
  - Moving a post between content/drafts/, content/ideas/, and content/post/
  - A page that should render fails to appear under hugo or hugo server -D
retire_when: Hugo changes front-matter precedence so cascaded values override page-level keys
tags: [hugo, drafts, ideas, cascade, front-matter, post-lifecycle]
---

# Page-level `draft: true` overrides the section cascade

Assumed that parking a post under `content/drafts/` (cascade: `draft: true`) or
`content/ideas/` (cascade: `noindex` + sitemap disable) fully controlled visibility.
It does not when the post itself carries `draft: true` in its own front matter —
page-level keys win over every cascade, so a post moved to `content/ideas/` with the
flag still set never renders under any Hugo flag.

Found when 28 "drafts" turned out to be living in `content/post/**` with explicit
`draft: true`, invisible to both `hugo` and `hugo server -D` page lists.

Rule for `post-lifecycle` moves: strip `draft: true` / `draft = true` when moving a
post **out** of `content/drafts/`; never rely on the destination section's cascade to
unset a page-level key.
