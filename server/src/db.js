// server/src/db.js
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

sqlite3.verbose();

// __dirname compatível com ES Modules (dentro de server/src)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👉 NOME DO ARQUIVO DO BANCO
const DB_FILENAME = "ecopesca_v2.db";

// caminho ABSOLUTO do banco (um nível acima de src → pasta server)
export const dbPath = path.resolve(__dirname, "..", DB_FILENAME);

// Log pra você ver no terminal qual arquivo está sendo usado
console.log(">>> USANDO BANCO EM:", dbPath);

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("⚠️ Erro ao abrir/criar o banco SQLite:", err);
  } else {
    console.log("✅ Conectado ao SQLite:", dbPath);
  }
});

// cria tabelas na primeira execução
db.serialize(() => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
    (err) => {
      if (err) {
        console.error("❌ Erro ao criar tabela users:", err.message);
      } else {
        console.log("✅ Tabela 'users' OK");
      }
    }
  );

  db.run(
    `
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
  `,
    (err) => {
      if (err) {
        console.error("❌ Erro ao criar tabela registros:", err.message);
      } else {
        console.log("✅ Tabela 'registros' OK");
      }
    }
  );
});
