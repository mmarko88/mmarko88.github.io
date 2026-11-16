---
name: post-lifecycle
description: Manage post lifecycle — draft in content/drafts/, publish to content/post/, park abandoned posts in deleted/
---

# Post lifecycle: drafts → published → deleted

Usage:
- `/post-lifecycle new <slug>` — scaffold a new draft post
- `/post-lifecycle publish <slug>` — move a draft to its final `content/post/` location
- `/post-lifecycle delete <slug>` — park a draft or published post in `deleted/`
- `/post-lifecycle restore <slug>` — bring a parked post back to `content/drafts/`

## Conventions

| Location | Purpose | Built? |
|----------|---------|--------|
| `content/drafts/` | Work in progress | Only with `hugo server -D`, at `/drafts/<slug>/` |
| `content/post/` | Published posts | Always |
| `deleted/` (repo root, outside `content/`) | Parked/abandoned | Never — Hugo can't see it under any flag |

- `content/drafts/_index.md` and nothing else defines the section; it cascades `draft: true`,
  so drafts need no per-post flag. The same is **not** needed in `deleted/` — it lives outside
  `content/` entirely.
- Page bundles everywhere: `<slug>/index.md` plus assets (featureImage, share.png, charts) as
  relative filenames in the same folder.
- blog-examples repo mirrors the convention: parked modules live in `deleted/` and are removed
  from the parent `pom.xml` `<modules>` list (re-add to restore).

## Steps

### new

1. Scaffold the bundle:
   ```bash
   mkdir content/drafts/<slug>
   # copy front matter from archetypes/post.md into content/drafts/<slug>/index.md
   ```
   Set `usePageBundles: true`, fill `title`, `description`, `tags`, `categories`, `date`.
   Leave `draft:` alone — the section cascade handles it.
2. Write the post. Preview with `hugo server -D` → `http://localhost:1313/drafts/<slug>/`.
3. Iterate against `ARTICLE_WRITING_STANDARDS.md` (`/check-standards` once drafted — it resolves
   slugs inside `content/`, so it works on drafts).

### publish

1. Pick the final path: `content/post/<topic>/<slug>/` (e.g. `content/post/java/mssqlserver/`).
2. `git mv content/drafts/<slug> content/post/<topic>/<slug>`
3. Ensure no stale `draft: true` in front matter; set `date` to publish date.
4. `hugo --quiet` → verify the post renders at `/post/<topic>/<slug>/` and appears in section lists.

### delete

- Unfinished draft: `git mv content/drafts/<slug> deleted/<slug>`
- Retired published post: `git mv content/post/<topic>/<slug> deleted/<slug>` — its URL will 404;
  grep inbound links first: `grep -rn "<slug>" content/`, and note them so they can be fixed or
  redirected later.
- Nothing else needed — `deleted/` is outside `content/` so no Hugo flag touches it.

### restore

`git mv deleted/<slug> content/drafts/<slug>` (or straight to its `content/post/` path to
republish directly). Re-check front matter (`date`, `draft`) after the move.

## Verification

- `hugo --quiet` exits clean.
- `find public -path "*deleted*"` is always empty — production and `-D` alike.
- `find public -path "*drafts*"` is empty after `hugo`, populated after `hugo -D`.
- `git status` shows renames (`R`), not delete+add — history stays attached to moved files.
