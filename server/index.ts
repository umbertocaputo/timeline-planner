import express, { type Request, Response, NextFunction, type Express } from "express";
import { createServer, type Server } from "http";
import pkg from "pg";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static"; // importa la versione con log

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function log(message: string) {
  console.log(`[LOG] ${new Date().toISOString()} :: ${message}`);
}

// Catch uncaught
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
});

// DEBUG variabili ambiente
log(`NODE_ENV: ${process.env.NODE_ENV}`);
log(`PORT: ${process.env.PORT}`);
log(`DB_HOST: ${process.env.DB_HOST}`);
log(`DB_PORT: ${process.env.DB_PORT}`);
log(`DB_USER: ${process.env.DB_USER}`);
log(`DB_NAME: ${process.env.DB_NAME}`);

// Wrapper di debug async
(async () => {
  try {
    log("STEP 1: connecting to DB");
    await dbClient.connect();
    log("✅ DB connected");

    log("STEP 2: registering API routes");
    await registerRoutes(httpServer, app);
    log("✅ API routes registered");

    if (process.env.NODE_ENV === "production") {
      log("STEP 3: serving static files");
      serveStatic(app);
      log("✅ Frontend serveStatic loaded");
    }

    // Middleware gestione errori
    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Internal Server Error:", err);
      if (res.headersSent) return next(err);
      return res.status(status).json({ message });
    });

    const port = parseInt(process.env.PORT || "5000", 10);
    log(`STEP 4: starting HTTP server on port ${port}`);
    httpServer.listen({ port, host: "0.0.0.0" }, () => {
      log(`✅ Server listening on port ${port}`);
      log("Ready to receive requests");
    });
  } catch (err) {
    console.error("💥 Error during server startup:", err);
  }
})();
