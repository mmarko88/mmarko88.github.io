// Private GA4 stats endpoint for the /stats-x8k2q/ page on professionaldev.dev.
// Holds the service-account creds + STATS_PASSWORD server-side — the static
// GitHub Pages site can't keep secrets, so the password check lives here:
// no valid password -> no GA data leaves this function.
//
// POST /api/ga   Content-Type: application/json
//   { "password": "...", "days": 30 }
// -> 200 { generatedAt, days, totalPageViews, daily: [{date, views}], topPages: [{title, path, views}] }
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

const toRows = (report) =>
  (report.rows || []).map((row) => ({
    dim: row.dimensionValues.map((v) => v.value),
    views: Number(row.metricValues[0].value),
  }));

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

  try {
    const client = gaClient();
    const [daily] = await client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });
    const [pages] = await client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 25,
    });

    const dailyRows = toRows(daily);
    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      days: range,
      totalPageViews: dailyRows.reduce((s, r) => s + r.views, 0),
      daily: dailyRows.map((r) => ({ date: r.dim[0], views: r.views })),
      topPages: toRows(pages).map((r) => ({ title: r.dim[0], path: r.dim[1], views: r.views })),
    });
  } catch (err) {
    console.error('GA runReport failed:', err.message);
    return res.status(502).json({ error: 'ga_upstream_error' });
  }
};
