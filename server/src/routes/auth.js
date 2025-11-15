// server/src/routes/auth.js
import { Router } from "express";
import { db } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

// se não tiver JWT_SECRET no .env, usa um padrão de desenvolvimento
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-ecopesca";

/**
 * POST /auth/register
 * body: { name, email, password, avatarUrl? }
 */
router.post("/register", (req, res) => {
  const { name, email, password, avatarUrl } = req.body || {};

  console.log(">>> /auth/register - body:", req.body);

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "name, email e password são obrigatórios" });
  }

  const password_hash = bcrypt.hashSync(password, 10);

  const sql = `
    INSERT INTO users (name, email, password_hash, avatar_url)
    VALUES (?,?,?,?)
  `;

  db.run(
    sql,
    [name.trim(), email.trim().toLowerCase(), password_hash, avatarUrl || null],
    function (err) {
      if (err) {
        console.error("❌ Erro ao cadastrar usuário:", err.message);
        if (String(err).includes("UNIQUE")) {
          return res.status(409).json({ error: "e-mail já cadastrado" });
        }
        return res.status(500).json({ error: "erro ao cadastrar" });
      }

      console.log("✅ Usuário criado com id:", this.lastID);
      return res.status(201).json({
        id: this.lastID,
        name: name.trim(),
        email: email.trim().toLowerCase(),
      });
    }
  );
});

/**
 * POST /auth/login
 * body: { email, password }
 */
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  console.log(">>> /auth/login - body:", req.body);

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "email e password são obrigatórios" });
  }

  const emailNorm = email.trim().toLowerCase();

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [emailNorm],
    (err, user) => {
      if (err) {
        console.error("❌ Erro ao buscar usuário:", err.message);
        return res.status(500).json({ error: "erro ao buscar usuário" });
      }

      if (!user) {
        console.warn("⚠️ Login com email não encontrado:", emailNorm);
        return res.status(401).json({ error: "credenciais inválidas" });
      }

      const ok = bcrypt.compareSync(password, user.password_hash);
      if (!ok) {
        console.warn("⚠️ Senha incorreta para email:", emailNorm);
        return res.status(401).json({ error: "credenciais inválidas" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      console.log("✅ Login OK para user_id:", user.id);

      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatar_url,
        },
      });
    }
  );
});

export default router;
