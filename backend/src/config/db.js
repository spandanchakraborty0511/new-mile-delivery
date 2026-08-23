const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  // Unexpected error on an idle client — log and let the process supervisor restart if fatal
  console.error('Unexpected PG pool error:', err);
});

// Helper that logs slow queries in development, used everywhere instead of pool.query directly
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development' && duration > 200) {
    console.warn(`[slow query] ${duration}ms: ${text}`);
  }
  return res;
};

module.exports = { pool, query };
