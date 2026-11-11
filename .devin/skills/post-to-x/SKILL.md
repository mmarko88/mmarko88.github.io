# post-to-x

Post an X (Twitter) thread from the user's logged-in Chrome via AppleScript-injected JavaScript. Built 2026-11-11 after CDP and synthetic-event approaches both failed.

## Why not CDP/Playwright

- Chrome ≥136 ignores `--remote-debugging-port` on the default profile; symlinked `--user-data-dir` gets canonicalized → still detected as default → port dead.
- `nohup`-spawned Chrome hits TCC EPERM writing `SingletonLock` inside `~/Library/Application Support` (our shell's responsible-process context is denied there; `ls` on that dir also fails). `open -na` launches with Chrome's own TCC identity → works on real profile, but port still dead.
- `defaults write com.google.Chrome RemoteDebuggingAllowed` does NOT take effect (needs managed prefs, root).
- Playwright `launch_persistent_context` on a fresh dir works, but user can't/won't log into X there.
- macOS UI scripting + screencapture: no Accessibility/Screen-Recording grant.

## The working path

1. User enables **View → Developer → "Allow JavaScript from Apple Events"** in Chrome (one-time toggle).
2. Drive the tab with `osascript -l JavaScript chrome_js.jxa <payload.js>` — executes the file in the active tab, prints the last-expression value.

## DOM map (x.com, Draft.js composer)

- Editor: `[data-testid='tweetTextarea_0']` (contenteditable, role=textbox). Thread slots: `_1`, `_2`…
- **Text input — ONLY execCommand works.** Per line: `execCommand("insertText", false, line)`, between lines: `execCommand("insertParagraph")`. One multi-line insertText call corrupts (partial revert). State oracle: `tweetButton` `.disabled===false` and `addButton` appears = Draft.js state synced.
- FAILS for text: synthetic `ClipboardEvent('paste')` (clipboardData via defineProperty — unreadable), `InputEvent('beforeinput')`, React fiber injection (no `__react*` keys exposed anywhere).
- **`tweetButton` (Post) accepts `.click()`** → posts, dialog closes.
- **`addButton` (`+`, "Add post") rejects synthetic clicks** — isTrusted-gated. Same for `•••` menus / Delete — those need REAL user clicks.
- **Thread workaround: replies ARE a thread.** Click `[data-testid='reply']` on the last `article[data-testid='tweet']` → reply composer (same textarea + tweetButton) → fill → `.click()` Post → repeat. ALWAYS reload the status URL and re-map `article`s before each reply — the timeline cache is stale and will redirect replies to the wrong parent.
- Image attach: `input[type=file]` exists in composer; `input.files = dt.files` (DataTransfer with real File) + `change` event — real path, works.
- Schedule dialog buttons: likely isTrusted-gated too (untested) — user clicks or skip scheduling.
- Two identical `[role='dialog']` render at once; scope queries to the one with `getBoundingClientRect().width > 0`.

## Usage

```sh
# tweets.json: ["tweet 1 text", "tweet 2", "...", "..."]
python3 post_thread.py tweets.json [--img /path/img.png] [--url https://x.com/USER/status/ID]
```

- Without `--url`: posts tweet 1 from /compose/post, then replies-chain the rest.
- With `--url`: skips posting tweet 1, replies-chain starting from that tweet.
- `--img`: attaches image to tweet 1 (must run before any reply posts).

## Proven gotchas

- JSON-escape tweet text into the JS payload (raw newlines inside '...' = SyntaxError → execute returns null).
- `execute javascript` returns `null` on any thrown exception — wrap payloads in try/catch and return the error string.
- Verify each post by re-loading the status page and checking `article[data-testid='tweet']` count/text.
