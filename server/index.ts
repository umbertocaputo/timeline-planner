import express, { type Request, Response, NextFunction, type Express } from "express";
import { createServer } from "http";
import pkg from "pg";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static"; // Usa solo questa
import path from "path";

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
});
process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
});

// 🔹 DEBUG immediato per capire se il file viene eseguito
console.log("DEBUG: index.ts partito");
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
    // NON uscire subito: continuiamo per debug
  }

  log("STEP 2: registering API routes");
  try {
    await registerRoutes(httpServer, app);
    log("✅ API routes registered");
  } catch (err) {
    console.error("❌ Error registering routes:", err);
  }

  if (process.env.NODE_ENV === "production") {
    log("STEP 3: serving static files");
    try {
      serveStatic(app);
      log("✅ Frontend serveStatic loaded");
    } catch (err) {
      console.error("❌ serveStatic error:", err);
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
