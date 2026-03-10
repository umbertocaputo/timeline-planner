import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type AttivitaInput, type AttivitaUpdateInput } from "@shared/routes";
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
      toast({ title: "Import successful", description: "Data has been loaded to the timeline." });
    },
    onError: (error) => {
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
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
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
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
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
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
      toast({ title: "Merged successfully", description: "The activities have been moved." });
    },
    onError: (error) => {
      toast({ title: "Merge failed", description: error.message, variant: "destructive" });
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
      toast({ title: "Data cleared", description: "All activities have been removed." });
    },
    onError: (error) => {
      toast({ title: "Clear failed", description: error.message, variant: "destructive" });
    }
  });
}
