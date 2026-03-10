import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const attivita = pgTable("attivita", {
  id: serial("id").primaryKey(),
  nastroId: text("nastro_id").notNull(),
  idOrigine: text("id_punto_origine").notNull(),
  idDestinazione: text("id_punto_destinazione").notNull(),
  orarioInizio: text("orario_inizio_attivita").notNull(),
  orarioFine: text("orario_fine_attivita").notNull(),
  tipoAttivita: text("tipo_attivita").notNull(),
  idCorsa: text("id_corsa"),
});

export const insertAttivitaSchema = createInsertSchema(attivita).omit({ id: true });

export type Attivita = typeof attivita.$inferSelect;
export type InsertAttivita = z.infer<typeof insertAttivitaSchema>;
export type UpdateAttivitaRequest = Partial<InsertAttivita>;
