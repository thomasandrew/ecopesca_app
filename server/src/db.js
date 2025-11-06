import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "..", "ecopesca.db");
export const db = new sqlite3.Database(dbPath);

// cria tabelas na primeira execução
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS registros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
});
