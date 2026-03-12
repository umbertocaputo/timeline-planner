import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import pkg from "pg";

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

// 🔹 Test connessione al DB con SSL
(async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432", 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }, // 🔹 SSL obbligatorio su Render
  });

  try {
    await client.connect();
    log("✅ DB connection successful!");
    await client.end();
  } catch (err) {
    console.error("❌ DB connection failed:", err);
    process.exit(1); // crash con log dettagliato per debug
  }

  // 🔹 Avvio server minimo per test porta
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0" }, () => {
    log(`Server listening on port ${port}`);
    log("Ready to receive requests (debug mode)");
  });
})();
