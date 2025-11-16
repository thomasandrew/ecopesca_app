// server/src/routes/registros.js
import { Router } from "express";
import { query } from "../db.js";
import { auth } from "../middleware/auth.js";

const router = Router();

/**
 * POST /registros  (precisa de Bearer token)
 */
router.post("/", auth, async (req, res) => {
  console.log(">>> POST /registros - payload recebido:", req.body);
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

  try {
    const result = await query(
      `
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id
    `,
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
      ]
    );

    const novo = result.rows[0];
    console.log("✅ Registro inserido com sucesso. ID:", novo.id);

    return res.status(201).json({ id: novo.id });
  } catch (err) {
    console.error("❌ Erro ao inserir registro:", err.message);
    return res.status(500).json({
      error: "erro ao inserir registro",
      detail: err.message,
    });
  }
});

/**
 * GET /registros  (lista do usuário logado)
 */
router.get("/", auth, async (req, res) => {
  console.log(">>> GET /registros para user_id:", req.user.id);

  try {
    const result = await query(
      `SELECT * FROM registros WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    console.log("✅ Registros retornados:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erro ao listar registros:", err.message);
    return res.status(500).json({ error: "erro ao listar registros" });
  }
});

export default router;
