// server/src/routes/admin.js
import { Router } from "express";
import { dbPath } from "../db.js";

const router = Router();

/**
 * GET /admin/download-db?secret=SEU_SEGREDO
 *
 * Baixa o arquivo SQLite que o backend está usando (dbPath).
 * Protegido com um "secret" simples via query string.
 */
router.get("/admin/download-db", (req, res) => {
  const { secret } = req.query;

  // proteção básica
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "forbidden" });
  }

  console.log(">>> Download do banco solicitado:", dbPath);

  res.download(dbPath, "ecopesca_v2_render.db", (err) => {
    if (err) {
      console.error("Erro ao enviar banco:", err);
      if (!res.headersSent) {
        return res.status(500).json({ error: "erro ao baixar banco" });
      }
    }
  });
});

export default router;
