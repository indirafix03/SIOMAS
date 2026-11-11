require('dotenv').config();
const { Pool } = require('pg');
const { Sequelize } = require('sequelize');

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'jwt-secret-siomas-access-refresh-token-key-2026';
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_4fKULoCWqDc0@ep-damp-sea-a10ojkxy-pooler.ap-southeast-1.aws.neon.tech/siomas_db?uselibpqcompat=true&sslmode=require';

// PostgreSQL Pool & Sequelize ORM Instance (Connected to Neon Cloud PostgreSQL)
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000
});

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

// Ensure optional schedule/date/time metadata columns exist on announcements table
pool
  .query(`
    ALTER TABLE announcements
      ADD COLUMN IF NOT EXISTS "Kategori" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "Tanggal_Kegiatan" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "Waktu_Kegiatan" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "Lokasi" VARCHAR(255);
  `)
  .catch(() => {});

module.exports = {
  PORT,
  JWT_SECRET,
  DATABASE_URL,
  pool,
  sequelize
};

