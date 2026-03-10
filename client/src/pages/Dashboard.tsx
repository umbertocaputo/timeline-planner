import { CalendarDays, Trash2 } from "lucide-react";
import { ExcelUploader } from "@/components/ExcelUploader";
import { GanttBoard } from "@/components/GanttChart/GanttBoard";
import { useAttivita, useClearAllAttivita } from "@/hooks/use-attivita";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: attivitaList, isLoading } = useAttivita();
  const { mutate: clearAll, isPending: isClearing } = useClearAllAttivita();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 flex flex-col">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Planner Nastri Lavorativi
            </h1>
            <p className="text-sm text-muted-foreground">
              Visualizza e gestisci le tue pianificazioni
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {attivitaList && attivitaList.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Sei sicuro di voler eliminare tutti i dati? Questa azione è irreversibile.")) {
                  clearAll();
                }
              }}
              disabled={isClearing}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive hover-elevate border-destructive/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Svuota
            </Button>
          )}
          <ExcelUploader />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex-1 rounded-xl border border-border bg-card p-4 space-y-4">
            <Skeleton className="w-full h-12 rounded-lg" />
            <Skeleton className="w-full h-16 rounded-lg" />
            <Skeleton className="w-full h-16 rounded-lg" />
            <Skeleton className="w-full h-16 rounded-lg" />
          </div>
        ) : (
          <GanttBoard attivitaList={attivitaList || []} />
        )}
      </main>
    </div>
  );
}
