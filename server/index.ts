import express, { type Request, Response, NextFunction, type Express } from "express";
import { createServer, type Server } from "http";
import pkg from "pg";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";

// 🔹 Fix __dirname in ESM
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 Serve frontend Vite buildato
function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "../dist/public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}. Make sure the client is built.`
    );
  }

  app.use(express.static(distPath));

  // Catch-all SPA
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// 🔹 DB Client
const { Client } = pkg;

const dbClient = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

const app = express();
const httpServer = createServer(app);

// 🔹 Middleware base
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 🔹 Funzione log
function log(message: string) {
  console.log(`[LOG] ${new Date().toISOString()} :: ${message}`);
}

// 🔹 Catch uncaught exceptions / unhandled rejections
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
  process.exit(1);
});

// 🔹 DEBUG variabili ambiente
log(`NODE_ENV: ${process.env.NODE_ENV}`);
log(`PORT: ${process.env.PORT}`);
log(`DB_HOST: ${process.env.DB_HOST}`);
log(`DB_PORT: ${process.env.DB_PORT}`);
log(`DB_USER: ${process.env.DB_USER}`);
log(`DB_NAME: ${process.env.DB_NAME}`);

// 🔹 Async main
(async () => {
  log("STEP 1: connecting to DB");
  try {
    await dbClient.connect();
    log("✅ DB connection successful!");
  } catch (err) {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  }

  log("STEP 2: registering API routes");
  try {
    await registerRoutes(httpServer, app);
    log("✅ API routes registered");
  } catch (err) {
    console.error("❌ Error registering routes:", err);
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production") {
    log("STEP 3: serving static files");
    try {
      serveStatic(app);
      log("✅ Frontend serveStatic loaded");
    } catch (err) {
      console.error("❌ serveStatic error:", err);
      process.exit(1);
    }
  }

  // 🔹 Middleware gestione errori generici
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);

    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  // 🔹 Avvio server
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0" }, () => {
    log(`Server listening on port ${port}`);
    log("Ready to receive requests");
  });
})();
