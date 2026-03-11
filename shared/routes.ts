import { z } from 'zod';
import { insertAttivitaSchema, attivita, insertTransitoSchema, transiti, mergeLog } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  attivita: {
    list: {
      method: 'GET' as const,
      path: '/api/attivita' as const,
      responses: {
        200: z.array(z.custom<typeof attivita.$inferSelect>()),
      },
    },
    bulkCreate: {
      method: 'POST' as const,
      path: '/api/attivita/bulk' as const,
      input: z.array(insertAttivitaSchema),
      responses: {
        201: z.array(z.custom<typeof attivita.$inferSelect>()),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/attivita/:id' as const,
      input: insertAttivitaSchema.partial(),
      responses: {
        200: z.custom<typeof attivita.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/attivita/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    moveNastro: {
      method: 'PUT' as const,
      path: '/api/nastri/:oldNastroId/move/:newNastroId' as const,
      input: z.object({}),
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
    mergeNastro: {
      method: 'POST' as const,
      path: '/api/nastri/merge' as const,
      input: z.object({
        targetNastroId: z.string(),
        sourceNastroId: z.string(),
        bridgeCorsa: z.object({
          idCorsa: z.string(),
          idOrigine: z.string(),
          idDestinazione: z.string(),
          orarioInizio: z.string(),
          orarioFine: z.string(),
        }).optional(),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
    insertInSosta: {
      method: 'POST' as const,
      path: '/api/nastri/insert-in-sosta' as const,
      input: z.object({
        hostNastroId: z.string(),
        guestNastroId: z.string(),
        sostaId: z.number(),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
    moveAttivita: {
      method: 'POST' as const,
      path: '/api/attivita/move' as const,
      input: z.object({
        attivitaId: z.number(),
        fromNastroId: z.string(),
        toNastroId: z.string(),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    insertSpostamento: {
      method: 'POST' as const,
      path: '/api/nastri/insert-spostamento' as const,
      input: z.object({
        nastroId: z.string(),
        idCorsa: z.string(),
        idOrigine: z.string(),
        idDestinazione: z.string(),
        orarioInizio: z.string(),
        orarioFine: z.string(),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    clearAll: {
      method: 'DELETE' as const,
      path: '/api/attivita' as const,
      responses: {
        204: z.void(),
      }
    },
    resetToSnapshot: {
      method: 'POST' as const,
      path: '/api/attivita/reset-snapshot' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    hasSnapshot: {
      method: 'GET' as const,
      path: '/api/attivita/has-snapshot' as const,
      responses: {
        200: z.object({ hasSnapshot: z.boolean() }),
      },
    },
  },
  mergeLog: {
    list: {
      method: 'GET' as const,
      path: '/api/merge-log' as const,
      responses: {
        200: z.array(z.custom<typeof mergeLog.$inferSelect>()),
      },
    },
  },
  transiti: {
    list: {
      method: 'GET' as const,
      path: '/api/transiti' as const,
      responses: {
        200: z.array(z.custom<typeof transiti.$inferSelect>()),
      },
    },
    bulkCreate: {
      method: 'POST' as const,
      path: '/api/transiti/bulk' as const,
      input: z.array(insertTransitoSchema),
      responses: {
        201: z.array(z.custom<typeof transiti.$inferSelect>()),
        400: errorSchemas.validation,
      },
    },
    clearAll: {
      method: 'DELETE' as const,
      path: '/api/transiti' as const,
      responses: {
        204: z.void(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type AttivitaInput = z.infer<typeof api.attivita.bulkCreate.input>;
export type AttivitaUpdateInput = z.infer<typeof api.attivita.update.input>;
export type AttivitaResponse = z.infer<typeof api.attivita.list.responses[200]>;
export type TransitiInput = z.infer<typeof api.transiti.bulkCreate.input>;
export type MergeNastroInput = z.infer<typeof api.attivita.mergeNastro.input>;
export type InsertInSostaInput = z.infer<typeof api.attivita.insertInSosta.input>;
