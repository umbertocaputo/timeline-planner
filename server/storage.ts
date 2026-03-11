import { db } from "./db";
import {
  attivita,
  attivitaSnapshot,
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
  insertNastroInSosta(hostNastroId: string, guestNastroId: string, sostaId: number): Promise<boolean>;
  clearAllAttivita(): Promise<void>;
  // Snapshot
  snapshotAttivita(attivitaList: InsertAttivita[]): Promise<void>;
  resetToSnapshot(): Promise<Attivita[]>;
  hasSnapshot(): Promise<boolean>;
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
    // Clear existing attivita and replace with new data (fresh import)
    await db.delete(attivita);
    const inserted = await db.insert(attivita).values(attivitaList).returning();
    // Automatically take a snapshot of the fresh import
    await this.snapshotAttivita(attivitaList);
    return inserted;
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
    const targetAll = await db.select().from(attivita).where(eq(attivita.nastroId, targetNastroId));
    const sourceAll = await db.select().from(attivita).where(eq(attivita.nastroId, sourceNastroId));

    const sortByStart = (list: Attivita[]) =>
      [...list].sort((a, b) => new Date(a.orarioInizio).getTime() - new Date(b.orarioInizio).getTime());

    const targetSorted = sortByStart(targetAll);
    const sourceSorted = sortByStart(sourceAll);

    const lastCorsaIdx = [...targetSorted].map((a, i) => ({ a, i }))
      .reverse()
      .find(({ a }) => a.tipoAttivita.toLowerCase() === "corsa in linea")?.i ?? -1;

    const targetToDelete = targetSorted
      .slice(lastCorsaIdx + 1)
      .filter(a => a.tipoAttivita.toLowerCase() === "tempo accessorio")
      .map(a => a.id);

    const firstCorsaIdxSource = sourceSorted.findIndex(
      a => a.tipoAttivita.toLowerCase() === "corsa in linea"
    );

    const sourceToDelete = sourceSorted
      .slice(0, firstCorsaIdxSource < 0 ? 0 : firstCorsaIdxSource)
      .filter(a => a.tipoAttivita.toLowerCase() === "tempo accessorio")
      .map(a => a.id);

    if (targetToDelete.length > 0) {
      await db.delete(attivita).where(inArray(attivita.id, targetToDelete));
    }

    if (sourceToDelete.length > 0) {
      await db.delete(attivita).where(inArray(attivita.id, sourceToDelete));
    }

    await db
      .update(attivita)
      .set({ nastroId: targetNastroId })
      .where(eq(attivita.nastroId, sourceNastroId));

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

  async insertNastroInSosta(
    hostNastroId: string,
    guestNastroId: string,
    sostaId: number
  ): Promise<boolean> {
    const guestAll = await db.select().from(attivita).where(eq(attivita.nastroId, guestNastroId));
    const sortByStart = (list: Attivita[]) =>
      [...list].sort((a, b) => new Date(a.orarioInizio).getTime() - new Date(b.orarioInizio).getTime());
    const guestSorted = sortByStart(guestAll);

    // Remove leading TA from guest
    const firstCorsaIdx = guestSorted.findIndex(
      a => a.tipoAttivita.toLowerCase() === "corsa in linea"
    );
    const guestHeadToDelete = guestSorted
      .slice(0, firstCorsaIdx < 0 ? 0 : firstCorsaIdx)
      .filter(a => a.tipoAttivita.toLowerCase() === "tempo accessorio")
      .map(a => a.id);

    // Remove trailing TA from guest
    const lastCorsaIdx = [...guestSorted].map((a, i) => ({ a, i }))
      .reverse()
      .find(({ a }) => a.tipoAttivita.toLowerCase() === "corsa in linea")?.i ?? -1;
    const guestTailToDelete = guestSorted
      .slice(lastCorsaIdx + 1)
      .filter(a => a.tipoAttivita.toLowerCase() === "tempo accessorio")
      .map(a => a.id);

    const toDelete = [...guestHeadToDelete, ...guestTailToDelete];
    if (toDelete.length > 0) {
      await db.delete(attivita).where(inArray(attivita.id, toDelete));
    }

    // Delete the sosta from host
    await db.delete(attivita).where(eq(attivita.id, sostaId));

    // Move remaining guest activities to host
    await db
      .update(attivita)
      .set({ nastroId: hostNastroId })
      .where(eq(attivita.nastroId, guestNastroId));

    return true;
  }

  async clearAllAttivita(): Promise<void> {
    await db.delete(attivita);
  }

  // Snapshot methods
  async snapshotAttivita(attivitaList: InsertAttivita[]): Promise<void> {
    await db.delete(attivitaSnapshot);
    if (attivitaList.length > 0) {
      await db.insert(attivitaSnapshot).values(attivitaList);
    }
  }

  async resetToSnapshot(): Promise<Attivita[]> {
    const snapshot = await db.select().from(attivitaSnapshot);
    if (snapshot.length === 0) return [];

    await db.delete(attivita);
    const toInsert = snapshot.map(({ id: _id, ...rest }) => rest);
    const inserted = await db.insert(attivita).values(toInsert).returning();
    return inserted;
  }

  async hasSnapshot(): Promise<boolean> {
    const [row] = await db.select().from(attivitaSnapshot).limit(1);
    return !!row;
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
