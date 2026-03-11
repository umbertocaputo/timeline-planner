import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
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
  isBridgeCorsa: boolean("is_bridge_corsa").default(false),
});

export const insertAttivitaSchema = createInsertSchema(attivita).omit({ id: true });

export type Attivita = typeof attivita.$inferSelect;
export type InsertAttivita = z.infer<typeof insertAttivitaSchema>;
export type UpdateAttivitaRequest = Partial<InsertAttivita>;

// Snapshot of the original uploaded attivita (used by the "Ripristina" button)
export const attivitaSnapshot = pgTable("attivita_snapshot", {
  id: serial("id").primaryKey(),
  nastroId: text("nastro_id").notNull(),
  idOrigine: text("id_punto_origine").notNull(),
  idDestinazione: text("id_punto_destinazione").notNull(),
  orarioInizio: text("orario_inizio_attivita").notNull(),
  orarioFine: text("orario_fine_attivita").notNull(),
  tipoAttivita: text("tipo_attivita").notNull(),
  idCorsa: text("id_corsa"),
  isBridgeCorsa: boolean("is_bridge_corsa").default(false),
});

// Transiti (transit stops for each corsa)
export const transiti = pgTable("transiti", {
  id: serial("id").primaryKey(),
  idCorsa: text("id_corsa").notNull(),
  idPunto: text("id_punto").notNull(),
  sequenza: integer("sequenza").notNull(),
  orarioArrivo: text("orario_arrivo"),
  orarioPartenza: text("orario_partenza"),
  salitaDiscesaPasseggeri: text("salita_discesa_passeggeri"),
});

export const insertTransitoSchema = createInsertSchema(transiti).omit({ id: true });

export type Transito = typeof transiti.$inferSelect;
export type InsertTransito = z.infer<typeof insertTransitoSchema>;
