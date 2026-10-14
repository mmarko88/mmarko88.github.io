// Waline detects Postgres via PG_DB (or POSTGRES_DATABASE) and connects via
// PG_USER/PG_PASSWORD/PG_HOST/PG_PORT/PG_SSL. The Neon marketplace integration
// instead injects POSTGRES_URL / DATABASE_URL connection strings — parse one
// into the discrete PG_* vars before waline loads.
const connUrl =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_PRISMA_URL;
if (connUrl && !process.env.PG_DB && !process.env.POSTGRES_DATABASE) {
  const u = new URL(connUrl.replace(/^postgres:/, 'postgresql:'));
  process.env.PG_DB = u.pathname.replace(/^\//, '');
  process.env.PG_USER = decodeURIComponent(u.username);
  process.env.PG_PASSWORD = decodeURIComponent(u.password);
  process.env.PG_HOST = u.hostname;
  process.env.PG_PORT = u.port || '5432';
  process.env.PG_SSL = 'true';
}

const Application = require('@waline/vercel');

module.exports = Application({
  plugins: [],
  async postSave(comment) {
    // do what ever you want after comment saved
  },
});
