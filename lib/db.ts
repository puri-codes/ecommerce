import { Pool, Client } from 'pg';
import crypto from 'crypto';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Missing DATABASE_URL environment variable');
}

export const pool = new Pool({ connectionString, max: 5 });

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || '2002nischal@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'abcdefgh';

function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}
export function verifyPassword(password: string, salt: string, storedHash: string) {
  return hashPassword(password, salt) === storedHash;
}

// ─── Admin auth ───────────────────────────────────────────────────────────────

export async function ensureAdminTables() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,
      password_salt text NOT NULL,
      password_hash text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      token text UNIQUE NOT NULL,
      expires_at timestamptz NOT NULL,
      created_at timestamptz DEFAULT now()
    )
  `);

  const existing = await pool.query('SELECT id FROM admin_users WHERE email = $1 LIMIT 1', [ADMIN_EMAIL]);
  if (existing.rowCount === 0) {
    const salt         = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(ADMIN_PASSWORD, salt);
    await pool.query(
      'INSERT INTO admin_users(email,password_salt,password_hash,created_at,updated_at) VALUES($1,$2,$3,now(),now())',
      [ADMIN_EMAIL, salt, passwordHash]
    );
  }
}

export async function createAdminSession(userId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  await pool.query(
    `INSERT INTO admin_sessions(user_id,token,expires_at) VALUES($1,$2,now()+interval '7 days')`,
    [userId, token]
  );
  return token;
}

export async function getAdminBySessionToken(token: string) {
  await ensureAdminTables();
  const result = await pool.query(
    `SELECT u.id,u.email FROM admin_sessions s
     JOIN admin_users u ON u.id=s.user_id
     WHERE s.token=$1 AND s.expires_at>now() LIMIT 1`,
    [token]
  );
  return result.rows[0] || null;
}

export async function revokeAdminSession(token: string) {
  await ensureAdminTables();
  await pool.query('DELETE FROM admin_sessions WHERE token=$1', [token]);
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function ensureTables() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

  // Migrate from v1 schema
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='actual_price') THEN
        DROP TABLE IF EXISTS products;
      END IF;
    END $$
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
      name          text    NOT NULL,
      slug          text    UNIQUE NOT NULL,
      description   text,
      category      text,
      gender        text    NOT NULL DEFAULT 'unisex',
      base_price    numeric NOT NULL DEFAULT 0,
      compare_price numeric,
      is_active     boolean NOT NULL DEFAULT true,
      is_featured   boolean NOT NULL DEFAULT false,
      variants      jsonb   NOT NULL DEFAULT '[]',
      image_groups  jsonb   NOT NULL DEFAULT '[]',
      meta_title    text,
      meta_description text,
      meta_keywords text,
      created_at    timestamptz NOT NULL DEFAULT now(),
      updated_at    timestamptz NOT NULL DEFAULT now()
    )
  `);

  // Idempotent column additions for existing tables
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false`);
}

export async function getProducts(activeOnly = true) {
  await ensureTables();
  const where = activeOnly ? 'WHERE is_active=true' : '';
  const res = await pool.query(`SELECT * FROM products ${where} ORDER BY created_at DESC`);
  return res.rows;
}

export async function getFeaturedProducts() {
  await ensureTables();
  const res = await pool.query(
    `SELECT * FROM products WHERE is_active=true AND is_featured=true ORDER BY created_at DESC`
  );
  return res.rows;
}

export async function getProductBySlug(slug: string) {
  await ensureTables();
  const res = await pool.query('SELECT * FROM products WHERE slug=$1 LIMIT 1', [slug]);
  return res.rows[0] ?? null;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function ensureOrdersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_name text    NOT NULL,
      phone         text    NOT NULL,
      address       text,
      items         jsonb   NOT NULL DEFAULT '[]',
      subtotal      numeric NOT NULL DEFAULT 0,
      promo_code    text,
      discount_amount numeric NOT NULL DEFAULT 0,
      status        text    NOT NULL DEFAULT 'pending',
      created_at    timestamptz NOT NULL DEFAULT now()
    )
  `);
  // Idempotent additions for existing orders table
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code text`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0`);
}

// ─── Combos ───────────────────────────────────────────────────────────────────

export async function ensureCombosTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS combos (
      id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
      name          text    NOT NULL,
      slug          text    UNIQUE NOT NULL,
      description   text,
      is_active     boolean NOT NULL DEFAULT true,
      items         jsonb   NOT NULL DEFAULT '[]',
      original_price numeric NOT NULL DEFAULT 0,
      combo_price   numeric NOT NULL DEFAULT 0,
      image_url     text,
      meta_title    text,
      meta_description text,
      created_at    timestamptz NOT NULL DEFAULT now(),
      updated_at    timestamptz NOT NULL DEFAULT now()
    )
  `);
}

export async function getCombos(activeOnly = true) {
  await ensureCombosTable();
  const where = activeOnly ? 'WHERE is_active=true' : '';
  const res = await pool.query(`SELECT * FROM combos ${where} ORDER BY created_at DESC`);
  return res.rows;
}

// ─── Promo codes ─────────────────────────────────────────────────────────────

export async function ensurePromoCodesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
      code             text    UNIQUE NOT NULL,
      discount_percent integer NOT NULL DEFAULT 10,
      max_discount     numeric,
      min_order_amount numeric NOT NULL DEFAULT 0,
      is_active        boolean NOT NULL DEFAULT true,
      expires_at       timestamptz,
      created_at       timestamptz NOT NULL DEFAULT now()
    )
  `);
}

// ─── Notification client ─────────────────────────────────────────────────────

export async function createNotificationClient() {
  const client = new Client({ connectionString });
  await client.connect();
  return client;
}
