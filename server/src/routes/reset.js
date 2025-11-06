// server/src/routes/reset.js
import express from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";

const router = express.Router();

// helpers Promises para sqlite
const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

// Gera código 6 dígitos
const genCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /reset/request  { email }
router.post("/request", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: "E-mail é obrigatório" });

  // evita enumeração: sempre responde 200
  const user = await get("SELECT id FROM users WHERE email = ?", [email]).catch(() => null);

  const code = genCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // +10min

  await run(
    `INSERT INTO password_reset_codes (email, code, used, attempts, expires_at) 
     VALUES (?, ?, 0, 0, ?)`,
    [email, code, expiresAt]
  );

  // Aqui você enviaria e-mail de verdade; em DEV devolvemos o código para facilitar
  const payload = { ok: true };
  if (process.env.NODE_ENV !== "production") {
    payload.devCode = code;
    console.log(`[DEV] Código de reset para ${email}: ${code}`);
  }
  return res.json(payload);
});

// POST /reset/confirm  { email, code, newPassword }
router.post("/confirm", async (req, res) => {
  const { email, code, newPassword } = req.body || {};
  if (!email || !code || !newPassword)
    return res.status(400).json({ message: "Dados incompletos" });

  const row = await get(
    `SELECT * FROM password_reset_codes 
     WHERE email = ? AND used = 0 
     ORDER BY id DESC LIMIT 1`,
    [email]
  );

  if (!row) return res.status(400).json({ message: "Código inválido" });

  const now = Date.now();
  const exp = Date.parse(row.expires_at);
  if (!exp || now > exp) return res.status(400).json({ message: "Código expirado" });

  if (row.code !== String(code)) {
    await run(`UPDATE password_reset_codes SET attempts = attempts + 1 WHERE id = ?`, [row.id]);
    return res.status(400).json({ message: "Código inválido" });
  }

  // marca como usado
  await run(`UPDATE password_reset_codes SET used = 1 WHERE id = ?`, [row.id]);

  // atualiza senha do usuário
  const user = await get(`SELECT id FROM users WHERE email = ?`, [email]);
  if (!user) return res.status(400).json({ message: "Usuário não encontrado" });

  const hash = await bcrypt.hash(newPassword, 10);
  await run(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, user.id]);

  return res.json({ ok: true });
});

export default router;
