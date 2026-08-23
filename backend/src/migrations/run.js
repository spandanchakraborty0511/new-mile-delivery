/**
 * Minimal migration runner.
 * Applies .sql files in this folder in filename order, tracks what's already
 * run in a schema_migrations table, and skips anything already applied.
 * Good enough for an assignment submission; swap for node-pg-migrate/knex
 * if this grows into a real production project.
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
require('dotenv').config();

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    VARCHAR(255) PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations() {
  const { rows } = await pool.query('SELECT filename FROM schema_migrations');
  return new Set(rows.map((r) => r.filename));
}

async function runMigrations() {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(__dirname)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // relies on numeric prefixes: 001_, 002_, ...

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip (already applied): ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`applied: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`FAILED: ${file}`);
      console.error(err.message);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  console.log('All migrations up to date.');
  await pool.end();
}

runMigrations();
