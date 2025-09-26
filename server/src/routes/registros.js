import { Router } from "express";
import { db } from "../db.js";
import { auth } from "../middleware/auth.js";

const router = Router();

// POST /registros  (precisa de Bearer token)
router.post("/", auth, (req, res) => {
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

  if (!nome || !area || !data || !dia || !turno) {
    return res.status(400).json({ error: "campos obrigatórios ausentes" });
  }

  const sql = `
    INSERT INTO registros (user_id, nome, nome_popular, tamanho_cm, area, data, dia, turno,
                           equipamento, isca, condicoes, vento)
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
      if (err) return res.status(500).json({ error: "erro ao inserir registro" });
      return res.status(201).json({ id: this.lastID });
    }
  );
});

// GET /registros (lista do usuário logado)
router.get("/", auth, (req, res) => {
  db.all(
    `SELECT * FROM registros WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "erro ao listar registros" });
      res.json(rows);
    }
  );
});

export default router;
