import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { ottimizza, type OttimizzazioneParams, type CorsaInput } from "./optimizer";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ---- Attivita ----
  app.get(api.attivita.list.path, async (req, res) => {
    const data = await storage.getAttivitaList();
    res.json(data);
  });

  app.post(api.attivita.bulkCreate.path, async (req, res) => {
    try {
      const input = api.attivita.bulkCreate.input.parse(req.body);
      const data = await storage.bulkCreateAttivita(input);
      res.status(201).json(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.put(api.attivita.update.path, async (req, res) => {
    try {
      const input = api.attivita.update.input.parse(req.body);
      const id = Number(req.params.id);
      const existing = await storage.getAttivita(id);
      if (!existing) return res.status(404).json({ message: "Attivita non trovata" });
      const updated = await storage.updateAttivita(id, input);
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete(api.attivita.delete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getAttivita(id);
      if (!existing) return res.status(404).json({ message: "Attivita non trovata" });
      await storage.deleteAttivita(id);
      res.status(204).end();
    } catch (err) {
      throw err;
    }
  });

  app.put(api.attivita.moveNastro.path, async (req, res) => {
    try {
      const { oldNastroId, newNastroId } = req.params;
      await storage.moveNastro(oldNastroId, newNastroId);
      res.status(200).json({ success: true });
    } catch (err) {
      throw err;
    }
  });

  // Smart merge: handles TA cleanup and bridge corsa insertion
  app.post(api.attivita.mergeNastro.path, async (req, res) => {
    try {
      const input = api.attivita.mergeNastro.input.parse(req.body);
      await storage.mergeNastro(input.targetNastroId, input.sourceNastroId, input.bridgeCorsa);
      res.status(200).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  // Insert guest nastro inside a sosta of host nastro
  app.post(api.attivita.insertInSosta.path, async (req, res) => {
    try {
      const input = api.attivita.insertInSosta.input.parse(req.body);
      await storage.insertNastroInSosta(input.hostNastroId, input.guestNastroId, input.sostaId);
      res.status(200).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  // Move single attivita to a different nastro (with logging)
  app.post(api.attivita.moveAttivita.path, async (req, res) => {
    try {
      const input = api.attivita.moveAttivita.input.parse(req.body);
      await storage.moveAttivita(input.attivitaId, input.fromNastroId, input.toNastroId);
      res.status(200).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  // Insert a corsa di spostamento to fix a mismatch within a nastro
  app.post(api.attivita.insertSpostamento.path, async (req, res) => {
    try {
      const input = api.attivita.insertSpostamento.input.parse(req.body);
      await storage.insertSpostamento(input.nastroId, {
        idCorsa: input.idCorsa,
        idOrigine: input.idOrigine,
        idDestinazione: input.idDestinazione,
        orarioInizio: input.orarioInizio,
        orarioFine: input.orarioFine,
      });
      res.status(200).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  // Insert an unassigned corsa into a nastro (with optional spostamenti and TA rebuild)
  app.post(api.attivita.insertCorsa.path, async (req, res) => {
    try {
      const input = api.attivita.insertCorsa.input.parse(req.body);
      await storage.insertCorsa(
        input.nastroId,
        input.corsa,
        input.spostamentoPre ?? null,
        input.spostamentoPost ?? null,
        input.deleteIds,
        input.newLeadingTA ?? null,
        input.newTrailingTA ?? null,
      );
      res.status(200).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete(api.attivita.clearAll.path, async (req, res) => {
    try {
      await storage.clearAllAttivita();
      res.status(204).end();
    } catch (err) {
      throw err;
    }
  });

  // Snapshot / reset
  app.get(api.attivita.hasSnapshot.path, async (req, res) => {
    const has = await storage.hasSnapshot();
    res.json({ hasSnapshot: has });
  });

  app.post(api.attivita.resetToSnapshot.path, async (req, res) => {
    try {
      await storage.resetToSnapshot();
      res.status(200).json({ success: true });
    } catch (err) {
      throw err;
    }
  });

  // ---- Merge log ----
  app.get(api.mergeLog.list.path, async (req, res) => {
    const data = await storage.getMergeLog();
    res.json(data);
  });

  // ---- Transiti ----
  app.get(api.transiti.list.path, async (req, res) => {
    const data = await storage.getTransitiList();
    res.json(data);
  });

  app.post(api.transiti.bulkCreate.path, async (req, res) => {
    try {
      const input = api.transiti.bulkCreate.input.parse(req.body);
      const data = await storage.bulkCreateTransiti(input);
      res.status(201).json(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete(api.transiti.clearAll.path, async (req, res) => {
    try {
      await storage.clearAllTransiti();
      res.status(204).end();
    } catch (err) {
      throw err;
    }
  });

  app.get("/api/download-dump", (req, res) => {
    const dumpPath = path.resolve(process.cwd(), "dump_nastri.sql");
    if (!fs.existsSync(dumpPath)) {
      res.status(404).json({ error: "File dump non trovato" });
      return;
    }
    res.setHeader("Content-Disposition", "attachment; filename=dump_nastri.sql");
    res.setHeader("Content-Type", "text/plain");
    res.sendFile(dumpPath);
  });

  app.get("/api/download/excel-uploader", (_req, res) => {
    const filePath = path.resolve(process.cwd(), "client/src/components/ExcelUploader.tsx");
    res.setHeader("Content-Disposition", "attachment; filename=ExcelUploader.tsx");
    res.setHeader("Content-Type", "text/plain");
    res.sendFile(filePath);
  });

  app.get("/api/download/server-index", (_req, res) => {
    const filePath = path.resolve(process.cwd(), "server/index.ts");
    res.setHeader("Content-Disposition", "attachment; filename=index.ts");
    res.setHeader("Content-Type", "text/plain");
    res.sendFile(filePath);
  });

  // ---- Ottimizzazione ----

  const ottimizzazioneParamsSchema = z.object({
    durataMassimaNastroMinuti: z.number().int().min(60).max(960).default(495),
    durataMinimaNoastroMinuti: z.number().int().min(0).max(960).default(315),
    durataTempoAccessorioInizioMinuti: z.number().int().min(0).max(120).default(30),
    durataTempoAccessorioFineMinuti: z.number().int().min(0).max(120).default(20),
    durataMinimaSostaMinuti: z.number().int().min(0).max(60).default(5),
    data: z.string(),
    deposito: z.string().default(""),
    localitaTermine: z.array(z.string()).default([]),
  });

  const corsaInputSchema = z.object({
    idCorsa: z.string(),
    idOrigine: z.string(),
    idDestinazione: z.string(),
    orarioInizio: z.string(),
    orarioFine: z.string(),
  });

  const ottimizzazioneRequestSchema = z.object({
    corse: z.array(corsaInputSchema).min(1),
    params: ottimizzazioneParamsSchema,
  });

  // Anteprima (non salva nel DB)
  app.post("/api/ottimizzazione/anteprima", async (req, res) => {
    try {
      console.log("[ottimizzazione] body keys:", Object.keys(req.body || {}), "corse count:", req.body?.corse?.length ?? "n/a");
      const { corse, params } = ottimizzazioneRequestSchema.parse(req.body);
      const result = ottimizza(corse as CorsaInput[], params as OttimizzazioneParams);
      console.log("[ottimizzazione] risultato: nastri=", result.nastriGenerati, "corse=", result.corseAssegnate);
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error("[ottimizzazione] Zod error:", err.errors);
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Errore ottimizzazione:", err);
      res.status(500).json({ message: "Errore interno durante l'ottimizzazione" });
    }
  });

  // Applica — cancella attività esistenti e salva i nastri ottimizzati
  app.post("/api/ottimizzazione/applica", async (req, res) => {
    try {
      const { corse, params } = ottimizzazioneRequestSchema.parse(req.body);
      const result = ottimizza(corse as CorsaInput[], params as OttimizzazioneParams);

      // Raccoglie tutte le attività da inserire
      const tutteLeAttivita = result.nastri.flatMap(n => n.attivita).map(a => ({
        nastroId: a.nastroId,
        idOrigine: a.idOrigine,
        idDestinazione: a.idDestinazione,
        orarioInizio: a.orarioInizio,
        orarioFine: a.orarioFine,
        tipoAttivita: a.tipoAttivita,
        idCorsa: a.idCorsa,
        isBridgeCorsa: a.isBridgeCorsa,
      }));

      const saved = await storage.bulkCreateAttivita(tutteLeAttivita);
      res.status(201).json({ attivita: saved, riepilogo: result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Errore applica ottimizzazione:", err);
      res.status(500).json({ message: "Errore interno durante l'applicazione" });
    }
  });

  return httpServer;
}
