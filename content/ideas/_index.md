---
title: Ideas
description: Parking lot for post ideas — visible at /ideas/ but excluded from menus, post lists, search and feeds.
noindex: true
sitemap:
  disable: true
cascade:
  - noindex: true
  - sitemap:
      disable: true
---

Ideas parked here render at `/ideas/` but are excluded from menus, the post list, RSS, the search index, and the sitemap. Reachable by direct URL only.

To promote an idea into a real draft, `git mv` it to `content/drafts/` and remove the inherited `noindex`/sitemap flags.
