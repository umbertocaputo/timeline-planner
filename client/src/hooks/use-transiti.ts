import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type TransitiInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useTransiti() {
  return useQuery({
    queryKey: [api.transiti.list.path],
    queryFn: async () => {
      const res = await fetch(api.transiti.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transiti");
      return api.transiti.list.responses[200].parse(await res.json());
    },
  });
}

export function useBulkCreateTransiti() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: TransitiInput) => {
      const res = await fetch(api.transiti.bulkCreate.path, {
        method: api.transiti.bulkCreate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to import transiti");
      }
      return api.transiti.bulkCreate.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.transiti.list.path] });
      toast({ title: "Transiti importati", description: `${data.length} transiti caricati con successo.` });
    },
    onError: (error) => {
      toast({ title: "Import transiti fallito", description: (error as Error).message, variant: "destructive" });
    }
  });
}

export function useClearAllTransiti() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.transiti.clearAll.path, {
        method: api.transiti.clearAll.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to clear transiti");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transiti.list.path] });
      toast({ title: "Transiti eliminati" });
    },
  });
}
