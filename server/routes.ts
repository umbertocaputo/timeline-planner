import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.attivita.update.path, async (req, res) => {
    try {
      const input = api.attivita.update.input.parse(req.body);
      const id = Number(req.params.id);
      
      const existing = await storage.getAttivita(id);
      if (!existing) {
        return res.status(404).json({ message: "Attivita non trovata" });
      }

      const updated = await storage.updateAttivita(id, input);
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.attivita.delete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getAttivita(id);
      if (!existing) {
        return res.status(404).json({ message: "Attivita non trovata" });
      }

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

  app.delete(api.attivita.clearAll.path, async (req, res) => {
    try {
      await storage.clearAllAttivita();
      res.status(204).end();
    } catch (err) {
      throw err;
    }
  });

  return httpServer;
}
