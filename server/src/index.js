import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.js";
import registrosRoutes from "./routes/registros.js";
import adminRoutes from "./routes/admin.js";
import { initDb } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_, res) => res.json({ ok: true, app: "ecopesca_api" }));

app.use("/auth", authRoutes);
app.use("/registros", registrosRoutes);
app.use(adminRoutes);

const PORT = process.env.PORT || 3333;

async function bootstrap() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`🚀 API rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Erro ao inicializar o banco:", err);
    process.exit(1);
  }
}

bootstrap();
