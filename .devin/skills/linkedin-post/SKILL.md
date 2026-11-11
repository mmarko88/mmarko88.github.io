# linkedin-post

Schedule a LinkedIn document (PDF carousel) post from the user's own logged-in Chrome via CDP + Playwright. Proven end-to-end 2026-11-11.

## Inputs

- `PDF` — path to carousel PDF (from /linkedin-carousel, usually `content/post/.../out/carousel.pdf`)
- `TITLE` — document title (≤58 chars)
- `BODY` — post body (arrow-list style; include the UTM-tagged link in the body — link-in-comments is now penalized ~80% and converts ~3.4× worse, mid-2026 data)
- `COMMENT` — pinned-comment text: a discussion-seeding question, no bare URL (can't be scheduled — manual, ~15 min after go-live)
- `WHEN` — local date/time; LinkedIn scheduler uses the browser's local timezone

## Prereqs

```sh
python3 -m venv /tmp/pw-venv && /tmp/pw-venv/bin/pip -q install playwright
```

## Flow

1. **Restart Chrome with CDP.** Chrome ≥136 ignores `--remote-debugging-port` on the default profile — symlink the profile dir to bypass:

   ```sh
   osascript -e 'tell application "Google Chrome" to quit'; sleep 5
   pkill -x "Google Chrome" 2>/dev/null; sleep 2   # if still running
   ln -sfn "$HOME/Library/Application Support/Google/Chrome" /tmp/chrome-cdp-profile
   nohup "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-cdp-profile &
   sleep 4; curl -s localhost:9222/json/version    # must answer
   ```

   Login/tabs persist — it's the same profile. Afterwards: `pkill -x "Google Chrome"`, then `rm -rf /tmp/chrome-cdp-profile` (Chrome may materialize the symlink into a real dir — deleting it is safe), `open -a "Google Chrome"`.

2. **Run `schedule_post.py`** (this directory) with env vars `LI_PDF`, `LI_TITLE`, `LI_BODY`, `LI_DATE` (mm/dd/yyyy), `LI_TIME` (e.g. `10:00 AM`). It connects via `chromium.connect_over_cdp("http://localhost:9222")`, works on `pages[-1]`, and stops before the final Schedule click unless `LI_COMMIT=1`.

3. **Verify** — script screenshots each stage to /tmp. Final check: composer → clock → "Scheduled" tab lists the post with correct date/time, title, page count.

## LinkedIn DOM map (new compose UI, /sharing/compose)

- Open composer: `button[name='Start a post']` (from feed) or goto `/sharing/compose`
- Toolbar: `button[aria-label='Expand content types']` reveals more icons
- **Document is an `<a>`, not a button**: `a[aria-label='Document']` → "Share a document" dialog → click text "Choose file" inside `page.expect_file_chooser()` → `set_files(PDF)`
- Title field: `input[placeholder*='descriptive title']` → `fill(TITLE)` → `button` "Done"
- Body editor: `[contenteditable='true']` (role=textbox) → `fill()` works; `inner_text` reports doubled `\n` per paragraph — cosmetic only, rendering is correct
- Schedule: `a[aria-label='Scheduled']` (clock icon) → dialog with two **text inputs**: input[0] = date (placeholder `mm/dd/yyyy`), input[1] = time (`10:00 AM` format). Preview line `Posting at ...` must show target before confirming
- **Quirk**: clicking/filling the time input opens `[data-testid='time-picker-menu']` which overlays Confirm and intercepts all pointer clicks. Fix: click the "10:00 AM" menu option, or JS-click Confirm: `btns.find(b => b.innerText.trim()==='Confirm').click()` — hit-testing bypassed
- After Confirm: "Post" becomes "Schedule" → click → toast "Post scheduled. View scheduled posts"

## After go-live (manual, cannot be scheduled)

- ~T+15 min: paste `COMMENT` as first comment, pin it
- Reply to every comment fast for the first hour (see promote-post report.md)

## Gotchas

- Reminders.app via osascript hangs on permission prompt — user declined reminders; keep the comment text in chat instead
- Scheduling is in the browser's local timezone (Mac = Europe/Belgrade = CET)
