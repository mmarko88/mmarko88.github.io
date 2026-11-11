#!/usr/bin/env python3
"""Schedule a LinkedIn document post via CDP-attached Chrome.

Prereqs: venv with playwright; Chrome running with --remote-debugging-port=9222
and --user-data-dir=<symlink to real profile>. See SKILL.md.

Env:
  LI_PDF    path to PDF (required)
  LI_TITLE  document title (required)
  LI_BODY   post body text (required)
  LI_DATE   mm/dd/yyyy (required)
  LI_TIME   e.g. "10:00 AM" (required)
  LI_COMMIT if "1", click final Schedule; otherwise stop after Confirm (dry run)
"""
import os, sys, time
from playwright.sync_api import sync_playwright

PDF   = os.environ["LI_PDF"]
TITLE = os.environ["LI_TITLE"]
BODY  = os.environ["LI_BODY"]
DATE  = os.environ["LI_DATE"]
TIME  = os.environ["LI_TIME"]
COMMIT = os.environ.get("LI_COMMIT") == "1"

pw = sync_playwright().start()
browser = pw.chromium.connect_over_cdp("http://localhost:9222")
page = browser.contexts[0].pages[-1]

# 1. composer (open if needed)
if "sharing/compose" not in page.url:
    page.goto("https://www.linkedin.com/feed/", wait_until="domcontentloaded")
    time.sleep(4)
    page.get_by_role("button", name="Start a post").first.click()
    time.sleep(2)

# 2. attach document
page.locator("button[aria-label='Expand content types']").click()
time.sleep(1)
doc = page.locator("a[aria-label='Document']").first
try:
    with page.expect_file_chooser(timeout=6000) as fc_info:
        doc.click()                     # opens "Share a document" dialog
        time.sleep(1)
        page.get_by_text("Choose file", exact=True).click()
    fc_info.value.set_files(PDF)
except Exception:
    page.locator("input[type='file']").first.set_input_files(PDF)
time.sleep(6)

# 3. title
t = page.locator("input[placeholder*='descriptive title']")
t.fill(TITLE)
page.get_by_role("button", name="Done", exact=True).click()
time.sleep(2)

# 4. body
ed = page.locator("[contenteditable='true']").first
ed.click(); ed.fill(BODY); time.sleep(1)

# 5. schedule
page.locator("a[aria-label='Scheduled']").click()
time.sleep(2)
inputs = page.locator("input")
inputs.nth(0).fill(DATE)
inputs.nth(1).fill(TIME)
time.sleep(1)
prev = page.locator("text=/^Posting at/")
print("PREVIEW:", prev.inner_text() if prev.count() else "NOT FOUND")

# time-picker menu may overlay Confirm -> JS click bypasses hit-testing
ok = page.evaluate("""() => {
  const b = [...document.querySelectorAll('button')]
    .find(b => (b.innerText||'').trim() === 'Confirm');
  if (b) { b.click(); return true; } return false;
}""")
assert ok, "Confirm not found"
time.sleep(2)

if COMMIT:
    page.get_by_role("button", name="Schedule", exact=True).click()
    time.sleep(3)
    print("SCHEDULED")
else:
    print("DRY RUN — review, then rerun with LI_COMMIT=1")

page.screenshot(path="/tmp/li_final.png")
pw.stop()
