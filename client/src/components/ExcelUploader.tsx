import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBulkCreateAttivita } from "@/hooks/use-attivita";
import { useToast } from "@/hooks/use-toast";

// Helper to parse potential Excel times or strings into standard format
function parseExcelTime(val: any): string {
  if (typeof val === 'number') {
    // Excel time fraction (e.g., 0.5 = 12:00 PM)
    const totalMinutes = Math.round(val * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    // Create a base date and set hours/minutes
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  }
  
  if (typeof val === 'string') {
    // Try to parse HH:mm or full dates
    if (val.match(/^\d{1,2}:\d{2}/)) {
      const [hh, mm] = val.split(':');
      const d = new Date();
      d.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
      return d.toISOString();
    }
    
    // Fallback to trying to parse as a normal date string
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  }
  
  return new Date().toISOString(); // Ultimate fallback
}

export function ExcelUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const { mutate: bulkCreate, isPending: isUploading } = useBulkCreateAttivita();
  const { toast } = useToast();

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
        
        // Convert to JSON
        const data: any[] = XLSX.utils.sheet_to_json(ws);
        
        // Map to our schema
        const mappedData = data.map((row) => {
          return {
            nastroId: String(row.id_nastro || row.ID_NASTRO || ""),
            idOrigine: String(row.id_punto_origine || row.ID_PUNTO_ORIGINE || ""),
            idDestinazione: String(row.id_punto_destinazione || row.ID_PUNTO_DESTINAZIONE || ""),
            orarioInizio: parseExcelTime(row.orario_inizio_attivita || row.ORARIO_INIZIO_ATTIVITA),
            orarioFine: parseExcelTime(row.orario_fine_attivita || row.ORARIO_FINE_ATTIVITA),
            tipoAttivita: String(row.tipo_attivita || row.TIPO_ATTIVITA || "Attivita"),
            idCorsa: row.id_corsa || row.ID_CORSA ? String(row.id_corsa || row.ID_CORSA) : null,
          };
        }).filter(r => r.nastroId && r.idOrigine && r.idDestinazione); // Filter out empty rows

        if (mappedData.length === 0) {
          throw new Error("No valid data found in Excel. Check column names.");
        }

        bulkCreate(mappedData);
      } catch (err: any) {
        toast({
          title: "Failed to parse Excel",
          description: err.message || "Invalid file format",
          variant: "destructive"
        });
      } finally {
        setIsParsing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset input
        }
      }
    };

    reader.readAsBinaryString(file);
  };

  const isLoading = isParsing || isUploading;

  return (
    <div>
      <input
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
      <Button 
        onClick={() => fileInputRef.current?.click()} 
        disabled={isLoading}
        className="bg-primary text-primary-foreground hover-elevate active-elevate-2 shadow-sm gap-2"
        data-testid="button-import-excel"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        Ottimizzazione
      </Button>
    </div>
  );
}
