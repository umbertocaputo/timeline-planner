import { db } from "./db";
import {
  attivita,
  transiti,
  type Attivita,
  type InsertAttivita,
  type UpdateAttivitaRequest,
  type Transito,
  type InsertTransito,
} from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

export interface IStorage {
  // Attivita
  getAttivitaList(): Promise<Attivita[]>;
  getAttivita(id: number): Promise<Attivita | undefined>;
  createAttivita(attivitaData: InsertAttivita): Promise<Attivita>;
  bulkCreateAttivita(attivitaList: InsertAttivita[]): Promise<Attivita[]>;
  updateAttivita(id: number, updates: UpdateAttivitaRequest): Promise<Attivita>;
  deleteAttivita(id: number): Promise<void>;
  moveNastro(oldNastroId: string, newNastroId: string): Promise<boolean>;
  mergeNastro(
    targetNastroId: string,
    sourceNastroId: string,
    bridgeCorsa?: {
      idCorsa: string;
      idOrigine: string;
      idDestinazione: string;
      orarioInizio: string;
      orarioFine: string;
    }
  ): Promise<boolean>;
  clearAllAttivita(): Promise<void>;
  // Transiti
  getTransitiList(): Promise<Transito[]>;
  bulkCreateTransiti(transitiList: InsertTransito[]): Promise<Transito[]>;
  clearAllTransiti(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAttivitaList(): Promise<Attivita[]> {
    return await db.select().from(attivita);
  }

  async getAttivita(id: number): Promise<Attivita | undefined> {
    const [result] = await db.select().from(attivita).where(eq(attivita.id, id));
    return result;
  }

  async createAttivita(attivitaData: InsertAttivita): Promise<Attivita> {
    const [result] = await db.insert(attivita).values(attivitaData).returning();
    return result;
  }

  async bulkCreateAttivita(attivitaList: InsertAttivita[]): Promise<Attivita[]> {
    if (attivitaList.length === 0) return [];
    return await db.insert(attivita).values(attivitaList).returning();
  }

  async updateAttivita(id: number, updates: UpdateAttivitaRequest): Promise<Attivita> {
    const [updated] = await db
      .update(attivita)
      .set(updates)
      .where(eq(attivita.id, id))
      .returning();
    return updated;
  }

  async deleteAttivita(id: number): Promise<void> {
    await db.delete(attivita).where(eq(attivita.id, id));
  }

  async moveNastro(oldNastroId: string, newNastroId: string): Promise<boolean> {
    await db
      .update(attivita)
      .set({ nastroId: newNastroId })
      .where(eq(attivita.nastroId, oldNastroId));
    return true;
  }

  async mergeNastro(
    targetNastroId: string,
    sourceNastroId: string,
    bridgeCorsa?: {
      idCorsa: string;
      idOrigine: string;
      idDestinazione: string;
      orarioInizio: string;
      orarioFine: string;
    }
  ): Promise<boolean> {
    // Load both sets of activities
    const targetAll = await db.select().from(attivita).where(eq(attivita.nastroId, targetNastroId));
    const sourceAll = await db.select().from(attivita).where(eq(attivita.nastroId, sourceNastroId));

    const sortByStart = (list: Attivita[]) =>
      [...list].sort((a, b) => new Date(a.orarioInizio).getTime() - new Date(b.orarioInizio).getTime());

    const targetSorted = sortByStart(targetAll);
    const sourceSorted = sortByStart(sourceAll);

    // Find last "corsa in linea" in target — remove all TA that come AFTER it
    const lastCorsaIdx = [...targetSorted].map((a, i) => ({ a, i }))
      .reverse()
      .find(({ a }) => a.tipoAttivita.toLowerCase() === "corsa in linea")?.i ?? -1;

    const targetToDelete = targetSorted
      .slice(lastCorsaIdx + 1)
      .filter(a => a.tipoAttivita.toLowerCase() === "tempo accessorio")
      .map(a => a.id);

    // Find first "corsa in linea" in source — remove all TA that come BEFORE it
    const firstCorsaIdxSource = sourceSorted.findIndex(
      a => a.tipoAttivita.toLowerCase() === "corsa in linea"
    );

    const sourceToDelete = sourceSorted
      .slice(0, firstCorsaIdxSource < 0 ? 0 : firstCorsaIdxSource)
      .filter(a => a.tipoAttivita.toLowerCase() === "tempo accessorio")
      .map(a => a.id);

    // Delete trailing TA from target
    if (targetToDelete.length > 0) {
      await db.delete(attivita).where(inArray(attivita.id, targetToDelete));
    }

    // Delete leading TA from source
    if (sourceToDelete.length > 0) {
      await db.delete(attivita).where(inArray(attivita.id, sourceToDelete));
    }

    // Move remaining source activities to target nastro
    await db
      .update(attivita)
      .set({ nastroId: targetNastroId })
      .where(eq(attivita.nastroId, sourceNastroId));

    // Insert bridge corsa if provided
    if (bridgeCorsa) {
      await db.insert(attivita).values({
        nastroId: targetNastroId,
        idCorsa: bridgeCorsa.idCorsa,
        idOrigine: bridgeCorsa.idOrigine,
        idDestinazione: bridgeCorsa.idDestinazione,
        orarioInizio: bridgeCorsa.orarioInizio,
        orarioFine: bridgeCorsa.orarioFine,
        tipoAttivita: "corsa ponte",
        isBridgeCorsa: true,
      });
    }

    return true;
  }

  async clearAllAttivita(): Promise<void> {
    await db.delete(attivita);
  }

  // Transiti
  async getTransitiList(): Promise<Transito[]> {
    return await db.select().from(transiti);
  }

  async bulkCreateTransiti(transitiList: InsertTransito[]): Promise<Transito[]> {
    if (transitiList.length === 0) return [];
    return await db.insert(transiti).values(transitiList).returning();
  }

  async clearAllTransiti(): Promise<void> {
    await db.delete(transiti);
  }
}

export const storage = new DatabaseStorage();
