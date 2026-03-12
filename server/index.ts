import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import pkg from "pg";
import path from "path";
import fs from "fs";

// 🔹 Import tue API routes
import { registerRoutes } from "./routes";

// 🔹 Serve frontend Vite buildato
function serveStatic(app: express.Express) {
  const distPath = path.resolve(__dirname, "../dist/public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}. Make sure the client is built.`
    );
  }

  app.use(express.static(distPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const { Client } = pkg;

const app = express();
const httpServer = createServer(app);

// 🔹 Middleware base
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 🔹 Funzione log
function log(message: string) {
  console.log(`[LOG] ${new Date().toISOString()} :: ${message}`);
}

// 🔹 DEBUG: variabili ambiente
console.log("DEBUG: Environment variables:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);

// 🔹 Connessione DB con SSL
const dbClient = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }, // obbligatorio su Render
});

(async () => {
  try {
    await dbClient.connect();
    log("✅ DB connection successful!");
  } catch (err) {
    console.error("❌ DB connection failed:", err);
    process.exit(1); // crash con log dettagliato
  }

  // 🔹 Registra API routes
  try {
    await registerRoutes(httpServer, app);
    log("✅ API routes registered");
  } catch (err) {
    console.error("❌ Error registering routes:", err);
    process.exit(1);
  }

  // 🔹 Serve frontend in produzione
  if (process.env.NODE_ENV === "production") {
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
