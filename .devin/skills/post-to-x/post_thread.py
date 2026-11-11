#!/usr/bin/env python3
"""Post an X thread via AppleScript-injected JS in the user's Chrome.

Prereqs:
  - Chrome running, logged into x.com
  - View > Developer > "Allow JavaScript from Apple Events" enabled
  - JXA bridge: chrome_js.jxa (this directory)

Usage:
  python3 post_thread.py tweets.json [--img /path/img.png] [--url https://x.com/U/status/ID]

tweets.json = ["tweet 1", "tweet 2", ...]
  --url  skip main post; reply-chain onto existing tweet ID
  --img  attach image to tweet 1 (only when posting the main tweet)
"""
import base64, json, os, subprocess, sys, tempfile, time

JXA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chrome_js.jxa")
SET_URL = ("tell application \"Google Chrome\" "
           "to set URL of active tab of front window to \"%s\"")


def js_file(payload):
    fd, p = tempfile.mkstemp(suffix=".js")
    with os.fdopen(fd, "w") as f:
        f.write(payload)
    out = subprocess.run(["osascript", "-l", "JavaScript", JXA, p],
                         capture_output=True, text=True)
    os.unlink(p)
    return out.stdout.strip()


def goto(url):
    subprocess.run(["osascript", "-e", SET_URL % url], capture_output=True)
    time.sleep(6)


FILL = """(() => {
  try {
    const dlg = [...document.querySelectorAll("[role='dialog']")]
      .find(d => d.getBoundingClientRect().width > 0);
    const ed = dlg.querySelector("[data-testid='tweetTextarea_0']")
      || [...dlg.querySelectorAll("[data-testid^='tweetTextarea_'][contenteditable]")].pop();
    if (!ed) return "NO ED";
    ed.focus();
    const sel = window.getSelection();
    sel.selectAllChildren(ed);
    document.execCommand("delete", false, null);
    const lines = %s.split("\\n");
    lines.forEach((l, j) => {
      if (l.length) document.execCommand("insertText", false, l);
      if (j < lines.length - 1) document.execCommand("insertParagraph", false, null);
    });
    return JSON.stringify({len: ed.innerText.length});
  } catch(e) { return "ERR:" + e.message; }
})()"""

POST_CLICK = """(() => {
  const dlg = [...document.querySelectorAll("[role='dialog']")]
    .find(d => d.getBoundingClientRect().width > 0);
  const b = dlg.querySelector("[data-testid='tweetButton']");
  if (!b || b.disabled) return "btn disabled/missing";
  b.click();
  return "posted";
})()"""

REPLY_LAST = """(() => {
  const arts = [...document.querySelectorAll("article[data-testid='tweet']")];
  const last = arts[arts.length-1];
  const rb = last.querySelector("[data-testid='reply']");
  rb.click();
  return "replied to article " + (arts.length-1);
})()"""

ARTICLES = """JSON.stringify([...document.querySelectorAll("article[data-testid='tweet']")].map(a => ({
  txt: (a.innerText||"").slice(0,60),
  url: (a.querySelector("a[href*='/status/']")||{}).href || ""
})))"""

MAIN_TWEET_URL = """(() => {
  const t = [...document.querySelectorAll("[data-testid='tweet']")][0];
  const link = t && t.querySelector("a[href*='/status/']");
  return link ? link.href : "";
})()"""


def fill(text):
    return js_file(FILL % json.dumps(text))


def attach_image(path):
    b64 = base64.b64encode(open(path, "rb").read()).decode()
    name = os.path.basename(path)
    mime = "image/png" if name.endswith(".png") else "image/jpeg"
    payload = """(() => {
      const dlg = [...document.querySelectorAll("[role='dialog']")]
        .find(d => d.getBoundingClientRect().width > 0) || document;
      const bin = atob("%s");
      const arr = new Uint8Array(bin.length);
      for (let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
      const f = new File([arr], "%s", {type:"%s"});
      const dt = new DataTransfer(); dt.items.add(f);
      const inp = [...dlg.querySelectorAll("input[type=file]")][0];
      inp.files = dt.files;
      inp.dispatchEvent(new Event("change", {bubbles:true}));
      return "files:" + inp.files.length;
    })()""" % (b64, name, mime)
    return js_file(payload)


def main():
    tweets = json.load(open(sys.argv[1]))
    args = sys.argv[2:]
    img = args[args.index("--img")+1] if "--img" in args else None
    url = args[args.index("--url")+1] if "--url" in args else None

    if not url:
        goto("https://x.com/compose/post")
        print("fill main:", fill(tweets[0]))
        if img:
            print("image:", attach_image(img))
            time.sleep(4)
        print("post:", js_file(POST_CLICK))
        time.sleep(4)
        goto("https://x.com/home")
        url = js_file(MAIN_TWEET_URL).strip('"')
        print("main tweet:", url)
        tweets = tweets[1:]

    for i, tw in enumerate(tweets):
        goto(url)  # fresh load — stale timeline misdirects replies
        print(f"reply click {i+2}:", js_file(REPLY_LAST))
        time.sleep(2.5)
        print("fill:", fill(tw))
        time.sleep(1)
        print("post:", js_file(POST_CLICK))
        time.sleep(4)
        arts = json.loads(js_file(ARTICLES) or "[]")
        if arts:
            url = arts[-1]["url"]
            print("chained ->", url)

    print("DONE")


if __name__ == "__main__":
    main()
