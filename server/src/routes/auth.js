import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { query } from "../db.js";

dotenv.config();

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-ecopesca";

router.post("/register", async (req, res) => {
  const { name, email, password, avatarUrl } = req.body || {};

  console.log(">>> /auth/register - body:", req.body);

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "name, email e password são obrigatórios" });
  }

  const nameNorm = name.trim();
  const emailNorm = email.trim().toLowerCase();
  const password_hash = bcrypt.hashSync(password, 10);

  try {
    const result = await query(
      `
      INSERT INTO users (name, email, password_hash, avatar_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email
    `,
      [nameNorm, emailNorm, password_hash, avatarUrl || null]
    );

    const user = result.rows[0];

    console.log("✅ Usuário criado com id:", user.id);

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error("❌ Erro ao cadastrar usuário:", err.message);

    if (String(err.message).includes("duplicate key")) {
      return res.status(409).json({ error: "e-mail já cadastrado" });
    }

    return res.status(500).json({ error: "erro ao cadastrar" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  console.log(">>> /auth/login - body:", req.body);

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "email e password são obrigatórios" });
  }

  const emailNorm = email.trim().toLowerCase();

  try {
    const result = await query(
      `SELECT * FROM users WHERE email = $1`,
      [emailNorm]
    );

    const user = result.rows[0];

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
  } catch (err) {
    console.error("❌ Erro ao buscar usuário:", err.message);
    return res.status(500).json({ error: "erro ao buscar usuário" });
  }
});

export default router;
