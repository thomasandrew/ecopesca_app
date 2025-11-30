import { Router } from "express";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

router.get("/admin/download-db", (req, res) => {
  const { secret } = req.query;

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
