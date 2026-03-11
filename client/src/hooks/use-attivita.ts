import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type AttivitaInput, type AttivitaUpdateInput, type MergeNastroInput, type InsertInSostaInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useAttivita() {
  return useQuery({
    queryKey: [api.attivita.list.path],
    queryFn: async () => {
      const res = await fetch(api.attivita.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attivita");
      return api.attivita.list.responses[200].parse(await res.json());
    },
  });
}

export function useHasSnapshot() {
  return useQuery({
    queryKey: [api.attivita.hasSnapshot.path],
    queryFn: async () => {
      const res = await fetch(api.attivita.hasSnapshot.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check snapshot");
      return api.attivita.hasSnapshot.responses[200].parse(await res.json());
    },
  });
}

export function useMergeLogs() {
  return useQuery({
    queryKey: [api.mergeLog.list.path],
    queryFn: async () => {
      const res = await fetch(api.mergeLog.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch merge log");
      return api.mergeLog.list.responses[200].parse(await res.json());
    },
  });
}

export function useBulkCreateAttivita() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: AttivitaInput) => {
      const res = await fetch(api.attivita.bulkCreate.path, {
        method: api.attivita.bulkCreate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to import data");
      }
      return api.attivita.bulkCreate.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.attivita.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.attivita.hasSnapshot.path] });
      queryClient.invalidateQueries({ queryKey: [api.mergeLog.list.path] });
      toast({ title: "Import avvenuto con successo", description: "Dati caricati nella timeline." });
    },
    onError: (error) => {
      toast({ title: "Import fallito", description: (error as Error).message, variant: "destructive" });
    }
  });
}

export function useUpdateAttivita() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & AttivitaUpdateInput) => {
      const url = buildUrl(api.attivita.update.path, { id });
      const res = await fetch(url, {
        method: api.attivita.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update attivita");
      return api.attivita.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.attivita.list.path] });
    },
    onError: (error) => {
      toast({ title: "Aggiornamento fallito", description: (error as Error).message, variant: "destructive" });
    }
  });
}

export function useDeleteAttivita() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.attivita.delete.path, { id });
      const res = await fetch(url, { method: api.attivita.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete attivita");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.attivita.list.path] });
    },
    onError: (error) => {
      toast({ title: "Eliminazione fallita", description: (error as Error).message, variant: "destructive" });
    }
  });
}

export function useMoveNastro() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ oldNastroId, newNastroId }: { oldNastroId: string, newNastroId: string }) => {
      const url = buildUrl(api.attivita.moveNastro.path, { oldNastroId, newNastroId });
      const res = await fetch(url, {
        method: api.attivita.moveNastro.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to move nastro");
      return api.attivita.moveNastro.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.attivita.list.path] });
      toast({ title: "Merge completato", description: "Le attività sono state spostate." });
    },
    onError: (error) => {
      toast({ title: "Merge fallito", description: (error as Error).message, variant: "destructive" });
    }
  });
}

export function useMergeNastro() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: MergeNastroInput) => {
      const res = await fetch(api.attivita.mergeNastro.path, {
        method: api.attivita.mergeNastro.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Merge fallito");
      }
      return api.attivita.mergeNastro.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.attivita.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.mergeLog.list.path] });
      toast({ title: "Merge completato", description: "Nastri uniti, tempi accessori rimossi." });
    },
    onError: (error) => {
      toast({ title: "Merge fallito", description: (error as Error).message, variant: "destructive" });
    }
  });
}

export function useInsertInSosta() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: InsertInSostaInput) => {
      const res = await fetch(api.attivita.insertInSosta.path, {
        method: api.attivita.insertInSosta.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Inserimento fallito");
      }
      return api.attivita.insertInSosta.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.attivita.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.mergeLog.list.path] });
      toast({ title: "Inserimento completato", description: "Nastro inserito nella sosta, tempi accessori rimossi." });
    },
    onError: (error) => {
      toast({ title: "Inserimento fallito", description: (error as Error).message, variant: "destructive" });
    }
  });
}

export function useClearAllAttivita() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.attivita.clearAll.path, { method: api.attivita.clearAll.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to clear data");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.attivita.list.path] });
      toast({ title: "Dati eliminati", description: "Tutte le attività sono state rimosse." });
    },
    onError: (error) => {
      toast({ title: "Eliminazione fallita", description: (error as Error).message, variant: "destructive" });
    }
  });
}

export function useResetToSnapshot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.attivita.resetToSnapshot.path, {
        method: api.attivita.resetToSnapshot.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reset to snapshot");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.attivita.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.mergeLog.list.path] });
      toast({ title: "Soluzione ripristinata", description: "I dati sono stati riportati all'upload originale." });
    },
    onError: (error) => {
      toast({ title: "Ripristino fallito", description: (error as Error).message, variant: "destructive" });
    }
  });
}
