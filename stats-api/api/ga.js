// Private GA4 stats endpoint for the /stats-x8k2q/ page on professionaldev.dev.
// Holds the service-account creds + STATS_PASSWORD server-side — the static
// GitHub Pages site can't keep secrets, so the password check lives here:
// no valid password -> no GA data leaves this function.
//
// POST /api/ga   Content-Type: application/json
//   { "password": "...", "days": 30 }              -> global dashboard payload
//   { "password": "...", "days": 30, "page": "/post/x/" }  -> per-post payload
// -> 401 wrong/missing password, 429 rate limited, 502 GA upstream error
const crypto = require('node:crypto');
const { GoogleAuth } = require('google-auth-library');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const ALLOWED_ORIGINS = new Set([
  'https://www.professionaldev.dev',
  'https://professionaldev.dev',
  'http://localhost:1313', // hugo server
  'http://127.0.0.1:1313',
]);

// Best-effort per-IP limiter — resets on cold start, still stops casual hammering.
const WINDOW_MS = 60_000;
const MAX_REQS = 20;
const hits = new Map();

// Tiny per-warm-instance payload cache — spares GA quota + makes reloads instant.
const CACHE_TTL = 300_000; // 5 min
const payloadCache = new Map();
function cached(key) {
  const e = payloadCache.get(key);
  return e && e.at > Date.now() - CACHE_TTL ? e.data : null;
}

function rateLimited(ip) {
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || now - e.start > WINDOW_MS) {
    hits.set(ip, { start: now, n: 1 });
    return false;
  }
  return ++e.n > MAX_REQS;
}

function passwordOk(given) {
  const expected = process.env.STATS_PASSWORD || '';
  if (!expected || typeof given !== 'string' || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

let _client;
function gaClient() {
  if (!_client) {
    _client = new BetaAnalyticsDataClient({
      auth: new GoogleAuth({
        credentials: {
          client_email: process.env.GA_CLIENT_EMAIL,
          // Vercel env vars store the key's newlines as a literal \n sequence.
          private_key: (process.env.GA_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        },
      }),
    });
  }
  return _client;
}

// Rows -> [{ dim: [..], metrics: [numbers] }] preserving requested order.
const toRows = (report) =>
  (report.rows || []).map((row) => ({
    dim: row.dimensionValues.map((v) => v.value),
    metrics: row.metricValues.map((v) => Number(v.value)),
  }));

const metric = (report, i) => Number(report.rows?.[0]?.metricValues?.[i]?.value || 0);

const exact = (fieldName, value) => ({
  filter: { fieldName, stringFilter: { value, matchType: 'EXACT' } },
});

module.exports = async (req, res) => {
  res.setHeader('X-Stats-API-Version', '3'); // deployed-version probe: curl -i
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'rate_limited' });

  const { password, days, page } = req.body || {};
  if (!passwordOk(password)) return res.status(401).json({ error: 'unauthorized' });

  const range = Math.min(Math.max(parseInt(days, 10) || 30, 7), 365);
  const property = `properties/${process.env.GA_PROPERTY_ID}`;
  const dateRanges = [{ startDate: `${range}daysAgo`, endDate: 'today' }];
  const byMetric = (name) => [{ metric: { metricName: name }, desc: true }];

  const cacheKey = typeof page === 'string' && page.startsWith('/')
    ? `p:${range}:${page.slice(0, 200)}`
    : `g:${range}`;
  const hit = cached(cacheKey);
  if (hit) return res.status(200).json(hit);

  try {
    const client = gaClient();

    // ---- Per-post mode --------------------------------------------------
    if (typeof page === 'string' && page.startsWith('/')) {
      const pagePath = page.slice(0, 200);
      const onPage = exact('pagePath', pagePath);
      const [tRes, dRes, sRes, cRes, devRes] = await Promise.all([
        client.runReport({
          property, dateRanges, dimensionFilter: onPage,
          metrics: [
            { name: 'screenPageViews' }, { name: 'activeUsers' },
            { name: 'userEngagementDuration' }, { name: 'newUsers' },
          ],
        }),
        client.runReport({
          property, dateRanges, dimensionFilter: onPage,
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        }),
        // sources of sessions that LANDED on this post (sessions are landing-scoped)
        client.runReport({
          property, dateRanges, dimensionFilter: exact('landingPage', pagePath),
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'sessions' }],
          orderBys: byMetric('sessions'),
          limit: 10,
        }),
        client.runReport({
          property, dateRanges, dimensionFilter: onPage,
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: byMetric('activeUsers'),
          limit: 8,
        }),
        client.runReport({
          property, dateRanges, dimensionFilter: onPage,
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'sessions' }],
          orderBys: byMetric('sessions'),
        }),
      ]);
      const [pt, pd, ps, pc, pdev] = [tRes[0], dRes[0], sRes[0], cRes[0], devRes[0]];
      const users = metric(pt, 1);
      const body = {
        version: 3,
        generatedAt: new Date().toISOString(),
        days: range,
        page: pagePath,
        totals: {
          views: metric(pt, 0),
          users,
          newUsers: metric(pt, 3),
          avgEngagementTime: users ? metric(pt, 2) / users : 0,
        },
        daily: toRows(pd).map((r) => ({ date: r.dim[0], views: r.metrics[0], users: r.metrics[1] })),
        sources: toRows(ps).map((r) => ({ source: r.dim[0], sessions: r.metrics[0] })),
        countries: toRows(pc).map((r) => ({ country: r.dim[0], users: r.metrics[0] })),
        devices: toRows(pdev).map((r) => ({ device: r.dim[0], sessions: r.metrics[0] })),
      };
      payloadCache.set(cacheKey, { at: Date.now(), data: body });
      return res.status(200).json(body);
    }

    // ---- Global dashboard ------------------------------------------------
    const totalsMetrics = [
      { name: 'screenPageViews' }, { name: 'sessions' }, { name: 'activeUsers' },
      { name: 'newUsers' }, { name: 'averageSessionDuration' },
      { name: 'bounceRate' }, { name: 'engagementRate' },
      { name: 'sessionsPerUser' }, { name: 'screenPageViewsPerSession' },
    ];
    const [
      totalsRes, prevTotalsRes, dailyRes, pagesRes, sourcesRes,
      countriesRes, devicesRes, loyaltyRes,
      heatRes, techRes, screensRes, acqRes,
    ] = await Promise.all([
      client.runReport({ property, dateRanges, metrics: totalsMetrics }),
      // previous period, same length: (2*range)daysAgo .. (range+1)daysAgo
      client.runReport({
        property,
        dateRanges: [{ startDate: `${range * 2}daysAgo`, endDate: `${range + 1}daysAgo` }],
        metrics: totalsMetrics,
      }),
      client.runReport({
        property, dateRanges,
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }, { name: 'activeUsers' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      client.runReport({
        property, dateRanges,
        dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
        orderBys: byMetric('screenPageViews'),
        limit: 25,
      }),
      client.runReport({
        property, dateRanges,
        dimensions: [{ name: 'sessionSource' }],
        metrics: [{ name: 'sessions' }],
        orderBys: byMetric('sessions'),
        limit: 12,
      }),
      client.runReport({
        property, dateRanges,
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: byMetric('activeUsers'),
        limit: 15,
      }),
      client.runReport({
        property, dateRanges,
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }],
        orderBys: byMetric('sessions'),
      }),
      client.runReport({
        property, dateRanges,
        dimensions: [{ name: 'newVsReturning' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: byMetric('activeUsers'),
      }),
      // day-of-week x hour heatmap (sessions)
      client.runReport({
        property, dateRanges,
        dimensions: [{ name: 'dayOfWeek' }, { name: 'hour' }],
        metrics: [{ name: 'sessions' }],
      }),
      // OS + browser pairs
      client.runReport({
        property, dateRanges,
        dimensions: [{ name: 'operatingSystem' }, { name: 'browser' }],
        metrics: [{ name: 'sessions' }],
        orderBys: byMetric('sessions'),
        limit: 10,
      }),
      client.runReport({
        property, dateRanges,
        dimensions: [{ name: 'screenResolution' }],
        metrics: [{ name: 'sessions' }],
        orderBys: byMetric('sessions'),
        limit: 8,
      }),
      // acquisition: where NEW readers first came from
      client.runReport({
        property, dateRanges,
        dimensions: [{ name: 'firstUserSource' }],
        metrics: [{ name: 'newUsers' }],
        orderBys: byMetric('newUsers'),
        limit: 10,
      }),
    ]);

    const [
      totals, prevTotals, daily, pages, sources, countries, devices, loyalty,
      heat, tech, screens, acq,
    ] = [
      totalsRes, prevTotalsRes, dailyRes, pagesRes, sourcesRes,
      countriesRes, devicesRes, loyaltyRes,
      heatRes, techRes, screensRes, acqRes,
    ].map((r) => r[0]);

    const pack = (r) => ({
      pageViews: metric(r, 0),
      sessions: metric(r, 1),
      users: metric(r, 2),
      newUsers: metric(r, 3),
      avgSessionDuration: metric(r, 4),
      bounceRate: metric(r, 5),
      engagementRate: metric(r, 6),
      sessionsPerUser: metric(r, 7),
      pageViewsPerSession: metric(r, 8),
    });

    const body = {
      version: 3,
      generatedAt: new Date().toISOString(),
      days: range,
      // v1 field kept for backward compatibility with older cached pages
      totalPageViews: metric(totals, 0),
      totals: pack(totals),
      prevTotals: pack(prevTotals),
      daily: toRows(daily).map((r) => ({
        date: r.dim[0], views: r.metrics[0], sessions: r.metrics[1], users: r.metrics[2],
      })),
      topPages: toRows(pages).map((r) => ({
        title: r.dim[0], path: r.dim[1], views: r.metrics[0], users: r.metrics[1],
      })),
      sources: toRows(sources).map((r) => ({ source: r.dim[0], sessions: r.metrics[0] })),
      countries: toRows(countries).map((r) => ({ country: r.dim[0], users: r.metrics[0] })),
      devices: toRows(devices).map((r) => ({ device: r.dim[0], sessions: r.metrics[0] })),
      loyalty: toRows(loyalty).map((r) => ({ type: r.dim[0], users: r.metrics[0] })),
      heatmap: toRows(heat).map((r) => ({ dow: Number(r.dim[0]), hour: Number(r.dim[1]), sessions: r.metrics[0] })),
      tech: toRows(tech).map((r) => ({ os: r.dim[0], browser: r.dim[1], sessions: r.metrics[0] })),
      screens: toRows(screens).map((r) => ({ res: r.dim[0], sessions: r.metrics[0] })),
      acquisition: toRows(acq).map((r) => ({ source: r.dim[0], newUsers: r.metrics[0] })),
    };
    payloadCache.set(cacheKey, { at: Date.now(), data: body });
    return res.status(200).json(body);
  } catch (err) {
    console.error('GA runReport failed:', err.message);
    return res.status(502).json({ error: 'ga_upstream_error' });
  }
};
