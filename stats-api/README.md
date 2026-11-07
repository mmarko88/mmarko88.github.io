# stats-api — private GA4 stats endpoint

Serverless function backing the unlisted stats page at
`https://www.professionaldev.dev/stats-x8k2q/`.

The site is fully static (GitHub Pages), so the password check can't live in
the browser — it lives here. The page POSTs a password; this function verifies
it, calls the Google Analytics Data API with a service account, and returns
pageview JSON. No valid password → no data.

## One-time setup

### 1. Google Cloud + GA4

1. [Google Cloud Console](https://console.cloud.google.com/) → create (or pick) a project.
2. Enable the **Google Analytics Data API** (APIs & Services → Library).
3. Create a **service account** (IAM & Admin → Service Accounts), then create a
   **JSON key** for it and download it.
4. In **GA4 → Admin → Property → Property Access Management**, add the service
   account's email (`...@....iam.gserviceaccount.com`) with the **Viewer** role.
5. Note your **Property ID**: GA4 → Admin → Property → Property Settings —
   it's the numeric ID (not the `G-...` measurement ID).

### 2. Deploy to Vercel

**Option A — dashboard (no local install):**

1. Commit + push `stats-api/` to GitHub.
2. Vercel → **Add New → Project** → import `mmarko88/mmarko88.github.io`.
3. Set **Root Directory** to `stats-api`.
4. **Settings → Environment Variables** — add the four vars below.
5. Deploy.

**Option B — CLI (requires Node):**

```bash
cd stats-api
npm install -g vercel   # once
vercel                  # link/create the project (accept defaults)
vercel env add STATS_PASSWORD        # the page password
vercel env add GA_PROPERTY_ID        # numeric, e.g. 123456789
vercel env add GA_CLIENT_EMAIL       # service account email
vercel env add GA_PRIVATE_KEY        # "private_key" from the JSON, as one line (\n preserved literally)
vercel --prod
```

### 3. Point the site at it

If the deployed URL differs from the default
`https://mmarko88githubio-stats.vercel.app`, update `statsApiURL` in
`config/_default/params.toml`.

## Testing

```bash
curl -X POST https://<your-app>.vercel.app/api/ga \
  -H 'Content-Type: application/json' \
  -d '{"password":"<STATS_PASSWORD>","days":30}'
```

→ `401` without/with wrong password, `200` + JSON with the right one.

## Notes

- Env vars: `STATS_PASSWORD`, `GA_PROPERTY_ID`, `GA_CLIENT_EMAIL`,
  `GA_PRIVATE_KEY`.
- CORS is locked to `professionaldev.dev` (+ `localhost:1313` for `hugo server`).
- Per-IP rate limit: 20 req/min (best effort — resets on cold start).
- The page slug `stats-x8k2q` is "unlisted, not secret": noindex + excluded
  from sitemap/search, but anyone with the URL sees the login form. The GA
  data itself is what stays protected.
