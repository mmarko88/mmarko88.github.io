# Why did the dev server keep losing CSS (and JS)?

**Answer:** libsass emits a UTF-8 BOM into the compiled CSS. `resources.Fingerprint` hashes the
with-BOM bytes for the filename and `integrity` attribute, but `hugo server` intermittently
writes/serves the file *without* the BOM → sha512 mismatch → the browser blocks the stylesheet
(and the fingerprinted JS bundle, same failure). Fix shipped: local partial overrides drop
`integrity`/`crossorigin` on first-party assets and switch `Permalink` → `RelPermalink`.
**Confidence:** high — reproduced and byte-diffed locally (served file exactly 3 bytes short = BOM).

## Why — reasoning, evidence attached to each step [1][2]

- `getStylesBundle.html` (hugo-clarity) pipes `sass → ExecuteAsTemplate → css.Sass (libsass) →
  Fingerprint sha512`. The fingerprinted name + `integrity` reflect the pipeline output, which
  contains the BOM (`ef bb bf`).
- The dev server served the same filename with BOM-less bytes → `integrity` check fails →
  browser refuses to apply the CSS. JS bundle failed identically (verified: `integrity match:
  False` on `bundle.<hash>.js`).
- SRI on same-origin, first-party assets provides ~no security value — it exists to verify
  third-party/CDN-hosted resources [2]. Hugo's own docs example only fingerprints+integrity in
  production; dev mode uses plain `RelPermalink` [2].
- `Permalink` emitted absolute `http://localhost:1313/...` URLs → through any proxy/preview
  (different origin), SRI forced a CORS fetch Hugo doesn't answer — second, independent failure.

## What would change this

If assets were ever served from a third-party CDN, restoring SRI for *those* assets would be
justified — keep it off for same-origin.

## Considered and rejected

- **Strip BOM before fingerprinting** (`getStylesBundle` override + `resources.FromString`):
  makes hash honest, but leaves SRI fragile to every other post-fingerprint mutation —
  CRLF conversion (documented SRI breakage [3]), CDN/proxy auto-minify [4]. Larger override for
  weaker benefit.
- **Migrate to `css.DartSass`**: libsass is deprecated, but dart-sass-embedded isn't installed
  and would become a new local+CI dependency. Worth doing later for sass features, not for this.
- **`integrity=""` blank value**: works but leaves misleading markup; removing the attribute
  entirely is cleaner.

## Open

- Exact Hugo code path that drops the BOM on dev-server republish (intermittent, cache-related).
  Repro: `hugo server` on hugo-clarity, watch `public/css/styles.<hash>.css` across rebuilds —
  file shrinks by 3 bytes while fingerprint name stays.

## Sources

[1] css.Sass — Hugo docs (libsass transpiler, deprecated): https://gohugo.io/functions/css/sass/
[2] resources.Fingerprint — Hugo docs (SRI generation, RelPermalink dev idiom): https://gohugo.io/functions/resources/fingerprint/
[3] "Theme not loading for GitHub Pages site" — CRLF breaks integrity: https://discourse.gohugo.io/t/theme-not-loading-for-github-pages-site/29691
[4] Stack Overflow — CDN minification breaks integrity: https://stackoverflow.com/questions/65040931/
