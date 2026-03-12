import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // percorso corretto per il frontend buildato da Vite
  const distPath = path.resolve(process.cwd(), "dist/public");
  console.log("🔹 serveStatic: checking path", distPath);

  if (!fs.existsSync(distPath)) {
    console.error("❌ serveStatic: dist folder not found!");
    throw new Error(
      `Could not find the build directory: ${distPath}. Make sure to build the client first.`
    );
  } else {
    console.log("✅ serveStatic: dist folder exists");
  }

  app.use(express.static(distPath));
  console.log("🔹 serveStatic: express.static middleware registered");

  // catch-all per SPA
  app.get("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    console.log("🔹 serveStatic: sending index.html from", indexPath);

    if (!fs.existsSync(indexPath)) {
      console.error("❌ serveStatic: index.html not found!");
      res.status(500).send("index.html not found");
      return;
    }

    res.sendFile(indexPath);
  });

  console.log("✅ serveStatic: catch-all route registered");
}
