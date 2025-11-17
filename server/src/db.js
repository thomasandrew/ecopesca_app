// server/src/db.js
import pkg from "pg";
const { Pool } = pkg;

// DATABASE_URL vem do Render (.env em produção) ou do .env local
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL NÃO DEFINIDA! Configure no Render/Neon.");
  process.exit(1);
}

// Pool de conexões com o Neon
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // obrigatório no Neon
});

// helper para fazer queries com async/await
export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

// cria tabelas na primeira vez
export async function initDb() {
  console.log("▶️ Conectando ao PostgreSQL (Neon) e criando tabelas...");

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS registros (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      nome TEXT NOT NULL,
      nome_popular TEXT,
      tamanho_cm REAL,
      area TEXT NOT NULL,
      data TEXT NOT NULL,
      dia TEXT NOT NULL,
      turno TEXT NOT NULL,
      equipamento TEXT,
      isca TEXT,
      condicoes TEXT,
      vento TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log("✅ Banco PostgreSQL pronto e rodando!");
}
