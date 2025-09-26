import { Router } from "express";
import { db } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

// POST /auth/register
router.post("/register", (req, res) => {
  const { name, email, password, avatarUrl } = req.body || {};
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "name, email e password são obrigatórios" });
  }

  const password_hash = bcrypt.hashSync(password, 10);

  const sql = `INSERT INTO users (name, email, password_hash, avatar_url) VALUES (?,?,?,?)`;
  db.run(
    sql,
    [name.trim(), email.trim().toLowerCase(), password_hash, avatarUrl || null],
    function (err) {
      if (err) {
        if (String(err).includes("UNIQUE"))
          return res.status(409).json({ error: "e-mail já cadastrado" });
        return res.status(500).json({ error: "erro ao cadastrar" });
      }
      return res.status(201).json({ id: this.lastID, name, email });
    }
  );
});

// POST /auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res
      .status(400)
      .json({ error: "email e password são obrigatórios" });

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [email.trim().toLowerCase()],
    (err, user) => {
      if (err) return res.status(500).json({ error: "erro ao buscar usuário" });
      if (!user) return res.status(401).json({ error: "credenciais inválidas" });

      const ok = bcrypt.compareSync(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: "credenciais inválidas" });

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );
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
