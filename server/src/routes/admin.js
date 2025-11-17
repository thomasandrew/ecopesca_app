// server/src/routes/admin.js
import { Router } from "express";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

/**
 * GET /admin/download-db?secret=SEU_SEGREDO
 *
 * Antes fazia download do arquivo SQLite.
 * Agora avisamos que o banco está no Neon e deve ser exportado por lá.
 */
router.get("/admin/download-db", (req, res) => {
  const { secret } = req.query;

  // proteção básica com ADMIN_SECRET
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "forbidden" });
  }

  console.log(">>> /admin/download-db chamado (PostgreSQL / Neon)");

  return res.status(501).json({
    error:
      "Download direto do banco foi desativado. O banco agora está no Neon (PostgreSQL). " +
      "Use o painel do Neon para exportar os dados.",
  });
});

export default router;
