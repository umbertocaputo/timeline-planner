import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import pkg from "pg";
import { registerRoutes } from "./routes"; // tue API
import { serveStatic } from "./serveStatic"; // frontend Vite buildato

const { Client } = pkg;

const app = express();
const httpServer = createServer(app);

// Middleware base
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Log interno
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

// 🔹 Connessione al DB con SSL
const dbClient = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

dbClient.connect()
  .then(() => log("✅ DB connection successful!"))
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  });

// 🔹 Registra API routes
(async () => {
  await registerRoutes(httpServer, app);

  // Middleware gestione errori
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);

    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  // 🔹 Serve frontend Vite solo in produzione
  if (process.env.NODE_ENV === "production") {
    serveStatic(app); // punta a client/dist/public
  }

  // 🔹 Avvio server
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0" }, () => {
    log(`Server listening on port ${port}`);
    log("Ready to receive requests");
  });
})();
