import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Route, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBulkCreateTransiti, useTransiti, useClearAllTransiti } from "@/hooks/use-transiti";
import { useToast } from "@/hooks/use-toast";

function parseTransitoTime(val: any): string | undefined {
  if (val === undefined || val === null || val === "") return undefined;

  if (typeof val === "number") {
    const totalMinutes = Math.round(val * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  }

  if (typeof val === "string") {
    if (val.match(/^\d{1,2}:\d{2}/)) {
      const [hh, mm] = val.split(":");
      const d = new Date();
      d.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
      return d.toISOString();
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  return undefined;
}

export function TransitiUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const { mutate: bulkCreate, isPending: isUploading } = useBulkCreateTransiti();
  const { mutate: clearAll, isPending: isClearing } = useClearAllTransiti();
  const { data: transitiList } = useTransiti();
  const { toast } = useToast();

  const hasTransiti = transitiList && transitiList.length > 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        const mapped = data.map((row) => {
          const idCorsa = String(row.IDCorsa ?? row.idCorsa ?? row.ID_CORSA ?? "");
          const idPunto = String(row.IDPunto ?? row.idPunto ?? row.ID_PUNTO ?? "");
          const sequenza = parseInt(String(row.Sequenza ?? row.sequenza ?? row.SEQUENZA ?? "0"));

          return {
            idCorsa,
            idPunto,
            sequenza: isNaN(sequenza) ? 0 : sequenza,
            orarioArrivo: parseTransitoTime(row.OrarioArrivo ?? row.orarioArrivo ?? row.ORARIO_ARRIVO) ?? null,
            orarioPartenza: parseTransitoTime(row.OrarioPartenza ?? row.orarioPartenza ?? row.ORARIO_PARTENZA) ?? null,
            salitaDiscesaPasseggeri: String(row.SalitaDiscesaPassegeri ?? row.salitaDiscesaPasseggeri ?? row.SALITA_DISCESA ?? ""),
          };
        }).filter(r => r.idCorsa && r.idPunto);

        if (mapped.length === 0) {
          throw new Error("Nessun dato valido trovato. Verifica i nomi delle colonne: IDCorsa, IDPunto, Sequenza, OrarioArrivo, OrarioPartenza, SalitaDiscesaPassegeri");
        }

        bulkCreate(mapped as any);
      } catch (err: any) {
        toast({
          title: "Errore parsing transiti",
          description: err.message || "Formato file non valido",
          variant: "destructive",
        });
      } finally {
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsBinaryString(file);
  };

  const isLoading = isParsing || isUploading;

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="gap-2"
        data-testid="button-import-transiti"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Route className="w-4 h-4" />
        )}
        {hasTransiti ? "Aggiorna transiti" : "Importa transiti"}
      </Button>
      {hasTransiti && (
        <span className="text-xs text-muted-foreground">
          {transitiList.length} transiti
          <button
            onClick={() => {
              if (confirm("Eliminare tutti i transiti?")) clearAll();
            }}
            disabled={isClearing}
            className="ml-1 text-destructive hover:underline"
            data-testid="button-clear-transiti"
          >
            (elimina)
          </button>
        </span>
      )}
    </div>
  );
}
