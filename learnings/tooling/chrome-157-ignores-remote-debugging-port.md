---
title: Chrome 157 ignores --remote-debugging-port even on a symlinked default profile
date: 2026-11-16
category: tooling
problem_type: defect
applies_when:
  - Running linkedin-post (its CDP prereq) or any Chrome automation on this machine
  - Scraping a logged-in site through the user's Chrome
retire_when: A retest shows Chrome accepts --remote-debugging-port with the symlinked default profile again — retest before the next linkedin-post run
tags: [chrome, cdp, playwright, linkedin-post, applescript, automation]
---

# Chrome 157 ignores `--remote-debugging-port` even on a symlinked default profile

`linkedin-post`'s prereq says restarting Chrome with
`--user-data-dir=<symlink to real profile> --remote-debugging-port=9222` works —
"Proven end-to-end 2026-11-11". Today on Chrome 157.0.8103.51 it does not: process
launches with the args, but nothing listens on 9222 and no `DevToolsActivePort` file
appears — the same wall `post-to-x` documented earlier (Chrome ≥136 detects the
default profile through the symlink).

**Fallback that works today** (used to scrape LinkedIn analytics): the `post-to-x`
AppleScript path — `osascript -l JavaScript` driving `Application("Google Chrome")`,
open a `chrome.Tab({url})`, then `tab.execute({javascript: ...})`. Requires Chrome's
"Allow JavaScript from Apple Events" — already enabled on this machine. Good for
read-only scraping; it cannot drive the compose UI the way CDP could.

**Rule:** before the next `linkedin-post` run, retest the CDP port. If still dead, the
schedule flow needs an AppleScript rewrite or a non-default-profile workaround.
