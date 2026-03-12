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

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION");
  console.error(err);
  console.error(err.stack);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION");
  console.error(err);
});

(async () => {
  try {
    console.log("STEP 0: starting server bootstrap");

    console.log("STEP 1: connecting to DB");
    await dbClient.connect();
    log("✅ DB connection successful!");

    console.log("STEP 2: registering API routes");
    await registerRoutes(httpServer, app);
    log("✅ API routes registered");

    console.log("STEP 3: serving static files if production");
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
      log("✅ Frontend serveStatic loaded");
    }

    console.log("STEP 4: adding error handler");
    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Internal Server Error:", err);

      if (res.headersSent) return next(err);
      return res.status(status).json({ message });
    });

    console.log("STEP 5: starting HTTP server");
    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen({ port, host: "0.0.0.0" }, () => {
      log(`Server listening on port ${port}`);
      log("Ready to receive requests");
    });

    // Eventi globali per logging crash
    process.on("uncaughtException", (err) => {
      console.error("UNCAUGHT EXCEPTION:", err);
    });
    process.on("unhandledRejection", (reason) => {
      console.error("UNHANDLED REJECTION:", reason);
    });

  } catch (err) {
    console.error("FATAL ERROR DURING BOOTSTRAP:", err);
    process.exit(1);
  }
})();
