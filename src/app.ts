import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { json } from "body-parser";
import { config } from "./config/config";
import walletRoutes from "./routes/walletRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet()); // Security headers
app.use(cors(config.cors));
app.use(json({ limit: "1mb" }));

app.use(rateLimit(config.rateLimit));

app.use("/api/wallet", walletRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(errorHandler);

export default app;
