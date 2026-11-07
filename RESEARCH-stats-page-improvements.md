# How can we improve the stats page?

**Answer:** The highest-value upgrades are free inside the GA4 Data API you're already calling — (1) period-over-period comparison (up to 4 named date ranges in a *single* request, so cards can show ±% deltas and the chart a ghost line), (2) day-of-week/hour heatmap, and (3) richer audience dims (browser, OS, screen resolution, first-visit source). For visuals, `chartjs-plugin-annotation` adds publish-date markers. The "do nothing" alternative is embedding a Looker Studio report — free, interactive, but watermarked and it gates by Google login instead of the stats password.

**Confidence:** high — all findings are from official API docs and plugin repos.

## Why

**1. Period comparison is native — no extra requests needed.**
`runReport` accepts up to 4 `dateRanges` in one call; the response tags each row with `date_range_0/1` (or a custom `name`). [2][3] That turns the 7 summary cards into "value + delta vs previous period" and lets the daily chart overlay last period — the single most-asked-for dashboard feature, for ~30 lines of code.

**2. Unused dimensions worth surfacing.**
The API schema exposes `dayOfWeek` (0–6; note the changelog moved the start index from 1 to 0), `hour`, `dateHour`, `screenResolution`, `browser`, `operatingSystem`, `language`, `city`, `landingPage`, and acquisition dims (`firstUserSource`, `firstUserMedium`, `firstUserCampaignName`). [1] Concretely useful for a blog: a **7×24 traffic heatmap** (dayOfWeek × hour — pure CSS table, no new deps), **browser/OS breakdowns**, and **"how new readers find you"** (`firstUserSource` vs `sessionSource` tells discovery vs. habit).

**3. Unused metrics.**
`sessionsPerUser`, `screenPageViewsPerSession`, `wauPerMau`/`dauPerMau` (stickiness), `keyEvents`, `engagedSessions`, `metricAggregations` (TOTAL row) are all available in the same calls. [1]

**4. Viz layer.**
`chartjs-plugin-annotation` (v3.x supports Chart.js 4) draws labeled lines/boxes on charts — e.g., a vertical marker on a post's publish date to see its traffic spike — plus doughnut-center labels. [4] `chartjs-plugin-datalabels` prints values on segments/bars. [5] Both load via jsdelivr `+esm` like the zoom plugin already does.

**5. Cheaper/faster.**
The function currently sets `Cache-Control: no-store`; a short `private, max-age=300` (or better, `s-maxage` + the same-password caveat) would cut GA quota usage and speed repeat loads. A CSV export button is ~20 lines client-side.

**6. Considered and rejected: Looker Studio embed.**
Looker Studio connects natively to GA4, embeds via iframe, stays interactive (filters, date controls) — and would replace all custom code. [6] Rejected for now because: embedded reports always show the Looker Studio watermark; "Unlisted/anyone-with-link" sharing exposes data to whoever finds the embed URL; truly private requires each viewer to log in with an authorized Google account. [6][7] As a single-admin page, password-gated custom code is lighter. Worth revisiting if you ever want multi-page dashboards without maintaining code.

## What would change this

If the dashboard grows beyond personal use (multiple viewers, scheduled reports), Looker Studio or a dedicated tool (Plausible/Umami) beats extending the custom API path.

## Open

- Whether `keyEvents`/scroll-depth events are worth charting depends on what events the GA4 property actually fires — check in GA4 → Reports → Engagement → Events.
- GA4 quota behavior under the current 7-report burst is untested at scale; if 429s ever appear, `returnPropertyQuota` can surface them. [1]

## Sources

[1] API dimensions and metrics schema: https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema
[2] Create a report — use multiple date ranges: https://developers.google.com/analytics/devguides/reporting/data/v1/basics
[3] DateRange resource (up to 4, named ranges): https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/DateRange
[4] chartjs-plugin-annotation: https://github.com/chartjs/chartjs-plugin-annotation/
[5] Chart.js plugin/addon list: https://quickchart.io/documentation/reference/chartjs-plugins/
[6] Embed a Looker Studio report (behavior + limits): https://docs.cloud.google.com/data-studio/embed-a-report
[7] Embed access model (link setting vs credentials): https://www.datastudioformarketers.com/embed-data-studio-report/
