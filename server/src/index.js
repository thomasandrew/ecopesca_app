// server/src/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.js";
import registrosRoutes from "./routes/registros.js";
import resetRoutes from "./routes/reset.js"; // <- ADICIONE

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_, res) => res.json({ ok: true, app: "ecopesca_api" }));
app.use("/auth", authRoutes);
app.use("/registros", registrosRoutes);
app.use("/reset", resetRoutes); // <- ADICIONE

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
