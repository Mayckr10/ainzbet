import pg from "pg";
import { config } from "./config.js";

pg.types.setTypeParser(20, (v) => Number(v)); // bigint -> number (saldos cabem com folga)
pg.types.setTypeParser(1700, (v) => Number(v)); // numeric -> number

const isLocal = /localhost|127\.0\.0\.1|\.railway\.internal/.test(config.databaseUrl);

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: isLocal || !config.databaseUrl ? undefined : { rejectUnauthorized: false },
  max: 10,
});

export type Tx = pg.PoolClient;

export async function tx<T>(fn: (c: Tx) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const r = await fn(c);
    await c.query("COMMIT");
    return r;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  first_name TEXT NOT NULL DEFAULT '',
  username TEXT,
  photo_url TEXT,
  balance BIGINT NOT NULL CHECK (balance >= 0),
  last_bonus TIMESTAMPTZ,
  last_rescue TIMESTAMPTZ,
  server_seed TEXT NOT NULL,
  server_seed_hash TEXT NOT NULL,
  client_seed TEXT NOT NULL,
  nonce INTEGER NOT NULL DEFAULT 0,
  total_wagered BIGINT NOT NULL DEFAULT 0,
  total_won BIGINT NOT NULL DEFAULT 0,
  rounds_played INTEGER NOT NULL DEFAULT 0,
  biggest_win BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS revealed_seeds (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  server_seed TEXT NOT NULL,
  server_seed_hash TEXT NOT NULL,
  client_seed TEXT NOT NULL,
  last_nonce INTEGER NOT NULL,
  revealed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS revealed_seeds_hash ON revealed_seeds(server_seed_hash);

CREATE TABLE IF NOT EXISTS rounds (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  game TEXT NOT NULL,
  status TEXT NOT NULL,              -- active | done
  bet BIGINT NOT NULL,               -- total apostado (inclui dobras, calls etc.)
  payout BIGINT NOT NULL DEFAULT 0,
  params JSONB NOT NULL DEFAULT '{}',
  state JSONB,                       -- estado secreto de jogos com várias etapas
  result JSONB,
  server_seed_hash TEXT NOT NULL,
  client_seed TEXT NOT NULL,
  nonce INTEGER NOT NULL,
  chat_instance TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS rounds_user ON rounds(user_id, id DESC);
CREATE INDEX IF NOT EXISTS rounds_active ON rounds(user_id, game) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS rounds_recent_wins ON rounds(id DESC) WHERE status = 'done' AND payout > 0;

CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  amount BIGINT NOT NULL,
  reason TEXT NOT NULL,
  round_id BIGINT,
  balance_after BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transactions_user ON transactions(user_id, id DESC);

CREATE TABLE IF NOT EXISTS group_stats (
  chat_instance TEXT NOT NULL,
  user_id BIGINT NOT NULL REFERENCES users(id),
  wagered BIGINT NOT NULL DEFAULT 0,
  profit BIGINT NOT NULL DEFAULT 0,
  biggest_win BIGINT NOT NULL DEFAULT 0,
  plays INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (chat_instance, user_id)
);
CREATE INDEX IF NOT EXISTS group_stats_profit ON group_stats(chat_instance, profit DESC);

-- estado persistente de máquinas (giros grátis, bônus pendente, multiplicadores guardados)
CREATE TABLE IF NOT EXISTS user_game_state (
  user_id BIGINT NOT NULL REFERENCES users(id),
  game TEXT NOT NULL,
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game)
);

-- Loja de Estrelas
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stars_spent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stars_donated INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_purchase_done BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_deal_day TEXT;

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  charge_id TEXT NOT NULL UNIQUE,
  user_id BIGINT NOT NULL REFERENCES users(id),
  product_id TEXT NOT NULL,
  stars INTEGER NOT NULL,
  chips BIGINT NOT NULL DEFAULT 0,
  refunded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_user ON payments(user_id, id DESC);
`;

export async function migrate() {
  await pool.query(SCHEMA);
}
