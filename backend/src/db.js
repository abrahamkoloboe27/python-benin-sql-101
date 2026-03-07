const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('❌  DATABASE_URL est manquant — ajoutez l\'URL de connexion Supabase dans les variables d\'environnement.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Initialize schema (creates tables if they don't already exist)
const ready = pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS query_history (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query         TEXT    NOT NULL,
    executed_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rows_returned INTEGER DEFAULT 0,
    has_error     BOOLEAN DEFAULT FALSE
  );

  CREATE INDEX IF NOT EXISTS idx_history_user
    ON query_history(user_id, executed_at DESC);

  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower
    ON users (LOWER(username));
`).catch((err) => {
  console.error('❌  Impossible d\'initialiser le schéma PostgreSQL :', err.message);
  process.exit(1);
});

module.exports = { pool, ready };
