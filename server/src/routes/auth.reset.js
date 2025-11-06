// server/routes/auth.reset.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import db from "../db.js";

const router = Router();

// util: envia e-mail (ou faz fallback para console.log)
async function sendEmail(to, subject, html) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST  !SMTP_PORT  !SMTP_USER  !SMTP_PASS  !SMTP_FROM) {
    console.log("==[DEV EMAIL]==============================");
    console.log(`Para: ${to}`);
    console.log(`Assunto: ${subject}`);
    console.log(html);
    console.log("==========================================");
    return;
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  await transporter.sendMail({ from: SMTP_FROM, to, subject, html });
}

// gera um código de 6 dígitos
const genCode = () => String(Math.floor(100000 + Math.random() * 900000));

// POST /auth/forgot  { email }
router.post("/forgot", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Informe o e-mail." });

  // cheque se existe usuário
  db.get(`SELECT id, name FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: "DB error" });

    // resposta é SEMPRE a mesma (para não revelar se o e-mail existe)
    const finish = (devCode) =>
      res.json({
        ok: true,
        message: "Se o e-mail existir, enviaremos um código de verificação.",
        ...(process.env.NODE_ENV !== "production" && { devCode }), // útil para testes
      });

    // se não existir, responde igual (sem vazar info)
    if (!user) return finish();

    const code = genCode();
    // expira em 15 minutos
    db.run(
      `INSERT INTO password_reset_codes (email, code, expires_at)
       VALUES (?, ?, DATETIME('now', '+15 minutes'))`,
      [email, code],
      async (err2) => {
        if (err2) return res.status(500).json({ error: "DB error" });
        const html = `
          <p>Olá${user?.name ? , ${user.name} : ""}!</p>
          <p>Seu código de recuperação é: <b style="font-size:20px">${code}</b></p>
          <p>Ele expira em 15 minutos.</p>
        `;
        try {
          await sendEmail(email, "Código para recuperar a senha", html);
        } catch (e) {
          console.log("sendEmail error:", e?.message || e);
        }
        finish(process.env.NODE_ENV !== "production" ? code : undefined);
      }
    );
  });
});

// POST /auth/reset  { email, code, new_password }
router.post("/reset", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const code = String(req.body?.code || "").trim();
  const newPassword = String(req.body?.new_password || "");

  if (!email  !code  !newPassword)
    return res.status(400).json({ error: "Dados incompletos." });
  if (newPassword.length < 6)
    return res.status(400).json({ error: "Senha precisa ter 6+ caracteres." });

  // pega o último código não usado para esse e-mail
  db.get(
    `SELECT * FROM password_reset_codes
     WHERE email = ? AND used = 0
     ORDER BY created_at DESC LIMIT 1`,
    [email],
    async (err, row) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!row) return res.status(400).json({ error: "Código inválido." });

      const now = new Date();
      const expires = new Date(row.expires_at);
      if (now > expires) return res.status(400).json({ error: "Código expirado." });

      if (row.attempts >= 5)
        return res.status(429).json({ error: "Muitas tentativas. Solicite outro código." });

      if (row.code !== code) {
        // incrementa tentativas
        db.run(`UPDATE password_reset_codes SET attempts = attempts + 1 WHERE id = ?`, [row.id]);
        return res.status(400).json({ error: "Código inválido." });
      }

      // marca como usado
      db.run(`UPDATE password_reset_codes SET used = 1 WHERE id = ?`, [row.id], (err2) => {
        if (err2) return res.status(500).json({ error: "DB error" });

        // atualiza a senha do usuário
        bcrypt.hash(newPassword, 10).then((hash) => {
          db.run(`UPDATE users SET password_hash = ? WHERE email = ?`, [hash, email], (err3) => {
            if (err3) return res.status(500).json({ error: "DB error" });
            return res.json({ ok: true, message: "Senha alterada com sucesso." });
          });
        });
      });
    }
  );
});

export default router;