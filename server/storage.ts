import { db } from "./db";
import {
  attivita,
  type Attivita,
  type InsertAttivita,
  type UpdateAttivitaRequest,
} from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

export interface IStorage {
  getAttivitaList(): Promise<Attivita[]>;
  getAttivita(id: number): Promise<Attivita | undefined>;
  createAttivita(attivitaData: InsertAttivita): Promise<Attivita>;
  bulkCreateAttivita(attivitaList: InsertAttivita[]): Promise<Attivita[]>;
  updateAttivita(id: number, updates: UpdateAttivitaRequest): Promise<Attivita>;
  deleteAttivita(id: number): Promise<void>;
  moveNastro(oldNastroId: string, newNastroId: string): Promise<boolean>;
  clearAllAttivita(): Promise<void>;
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

  async clearAllAttivita(): Promise<void> {
    await db.delete(attivita);
  }
}

export const storage = new DatabaseStorage();
