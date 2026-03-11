import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

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

  return httpServer;
}
