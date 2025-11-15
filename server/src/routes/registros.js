// server/src/routes/registros.js
import { Router } from "express";
import { db, dbPath } from "../db.js";
import { auth } from "../middleware/auth.js";

const router = Router();

/**
 * POST /registros  (precisa de Bearer token)
 */
router.post("/", auth, (req, res) => {
  console.log(">>> POST /registros - payload recebido:", req.body);
  console.log(">>> Banco em uso:", dbPath);
  console.log(">>> Usuário autenticado:", req.user);

  const {
    nome,
    nomePopular,
    tamanho_cm,
    area,
    data,
    dia,
    turno,
    equipamento,
    isca,
    condicoes,
    vento,
  } = req.body || {};

  // validação simples
  if (!nome || !area || !data || !dia || !turno) {
    console.warn("⚠️ Campos obrigatórios ausentes em /registros");
    return res.status(400).json({ error: "campos obrigatórios ausentes" });
  }

  const sql = `
    INSERT INTO registros (
      user_id,
      nome,
      nome_popular,
      tamanho_cm,
      area,
      data,
      dia,
      turno,
      equipamento,
      isca,
      condicoes,
      vento
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  db.run(
    sql,
    [
      req.user.id,
      nome,
      nomePopular || null,
      tamanho_cm ?? null,
      area,
      data,
      dia,
      turno,
      equipamento || null,
      isca || null,
      condicoes || null,
      vento || null,
    ],
    function (err) {
      if (err) {
        console.error("❌ Erro ao inserir registro:", err.message);
        return res.status(500).json({
          error: "erro ao inserir registro",
          detail: err.message,
        });
      }

      console.log("✅ Registro inserido com sucesso. ID:", this.lastID);
      return res.status(201).json({ id: this.lastID });
    }
  );
});

/**
 * GET /registros  (lista do usuário logado)
 */
router.get("/", auth, (req, res) => {
  console.log(">>> GET /registros para user_id:", req.user.id);

  db.all(
    `SELECT * FROM registros WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        console.error("❌ Erro ao listar registros:", err.message);
        return res.status(500).json({ error: "erro ao listar registros" });
      }

      console.log("✅ Registros retornados:", rows.length);
      res.json(rows);
    }
  );
});

export default router;
