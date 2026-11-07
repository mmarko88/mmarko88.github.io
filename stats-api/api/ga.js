// Private GA4 stats endpoint for the /stats-x8k2q/ page on professionaldev.dev.
// Holds the service-account creds + STATS_PASSWORD server-side — the static
// GitHub Pages site can't keep secrets, so the password check lives here:
// no valid password -> no GA data leaves this function.
//
// POST /api/ga   Content-Type: application/json
//   { "password": "...", "days": 30 }
// -> 200 {
//      generatedAt, days,
//      totals:   { pageViews, sessions, users, newUsers, avgSessionDuration, bounceRate, engagementRate },
//      daily:    [{ date, views, sessions, users }],
//      topPages: [{ title, path, views, users }],
//      sources:  [{ source, sessions }],
//      countries:[{ country, users }],
//      devices:  [{ device, sessions }],
//      loyalty:  [{ type, users }]        // new vs returning
//    }
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

module.exports = async (req, res) => {
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

  const { password, days } = req.body || {};
  if (!passwordOk(password)) return res.status(401).json({ error: 'unauthorized' });

  const range = Math.min(Math.max(parseInt(days, 10) || 30, 7), 365);
  const property = `properties/${process.env.GA_PROPERTY_ID}`;
  const dateRanges = [{ startDate: `${range}daysAgo`, endDate: 'today' }];
  const byMetric = (name) => [{ metric: { metricName: name }, desc: true }];

  try {
    const client = gaClient();
    const [totalsRes, dailyRes, pagesRes, sourcesRes, countriesRes, devicesRes, loyaltyRes] =
      await Promise.all([
        client.runReport({
          property, dateRanges,
          metrics: [
            { name: 'screenPageViews' }, { name: 'sessions' }, { name: 'activeUsers' },
            { name: 'newUsers' }, { name: 'averageSessionDuration' },
            { name: 'bounceRate' }, { name: 'engagementRate' },
          ],
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
      ]);

    const [totals, daily, pages, sources, countries, devices, loyalty] =
      [totalsRes, dailyRes, pagesRes, sourcesRes, countriesRes, devicesRes, loyaltyRes]
        .map((r) => r[0]);

    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      days: range,
      totals: {
        pageViews: metric(totals, 0),
        sessions: metric(totals, 1),
        users: metric(totals, 2),
        newUsers: metric(totals, 3),
        avgSessionDuration: metric(totals, 4),
        bounceRate: metric(totals, 5),
        engagementRate: metric(totals, 6),
      },
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
    });
  } catch (err) {
    console.error('GA runReport failed:', err.message);
    return res.status(502).json({ error: 'ga_upstream_error' });
  }
};
