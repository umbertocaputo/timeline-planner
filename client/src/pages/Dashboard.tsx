import { useState } from "react";
import { CalendarDays, Trash2 } from "lucide-react";
import { ExcelUploader } from "@/components/ExcelUploader";
import { TransitiUploader } from "@/components/TransitiUploader";
import { GanttBoard } from "@/components/GanttChart/GanttBoard";
import { useAttivita, useClearAllAttivita } from "@/hooks/use-attivita";
import { useTransiti, useClearAllTransiti } from "@/hooks/use-transiti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [sortBy, setSortBy] = useState<"name" | "start-time">("name");
  const [hideSosta, setHideSosta] = useState(false);
  const [hideTempoAccessorio, setHideTempoAccessorio] = useState(false);
  const [durataMassima, setDurataMassima] = useState("");
  const [pausaCorse, setPausaCorse] = useState("");
  const [pausaSpostamenti, setPausaSpostamenti] = useState("");
  const { data: attivitaList, isLoading } = useAttivita();
  const { data: transitiList } = useTransiti();
  const { mutate: clearAttivita, isPending: isClearingAttivita } = useClearAllAttivita();
  const { mutate: clearTransiti, isPending: isClearingTransiti } = useClearAllTransiti();

  const isClearing = isClearingAttivita || isClearingTransiti;

  const handleSvuota = () => {
    if (confirm("Sei sicuro di voler eliminare tutti i dati (nastri e transiti)? Questa azione è irreversibile.")) {
      clearAttivita();
      clearTransiti();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 flex flex-col">
      {/* Header */}
      <header className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {attivitaList && attivitaList.length > 0 && (
              <>
                <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
                  <Button
                    variant={sortBy === "name" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy("name")}
                    className="px-3"
                    data-testid="button-sort-name"
                  >
                    Per nome
                  </Button>
                  <Button
                    variant={sortBy === "start-time" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy("start-time")}
                    className="px-3"
                    data-testid="button-sort-start"
                  >
                    Per inizio
                  </Button>
                </div>
                <Button
                  variant={hideSosta ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHideSosta(!hideSosta)}
                  data-testid="button-toggle-sosta"
                  className="px-3"
                >
                  {hideSosta ? "Mostra" : "Nascondi"} sosta
                </Button>
                <Button
                  variant={hideTempoAccessorio ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHideTempoAccessorio(!hideTempoAccessorio)}
                  data-testid="button-toggle-tempo-accessorio"
                  className="px-3"
                >
                  {hideTempoAccessorio ? "Mostra" : "Nascondi"} T.A.
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSvuota}
                  disabled={isClearing}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive hover-elevate border-destructive/20"
                  data-testid="button-clear-all"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Svuota
                </Button>
              </>
            )}
            <ExcelUploader />
            <TransitiUploader />
          </div>
        </div>

        {/* Parametri merge */}
        {attivitaList && attivitaList.length > 0 && (
          <div className="flex items-center gap-4 flex-wrap bg-muted/40 border border-border rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="durata-massima" className="text-sm font-medium whitespace-nowrap">
                Durata complessiva nastro
              </Label>
              <Input
                id="durata-massima"
                type="text"
                placeholder="hh:mm"
                value={durataMassima}
                onChange={(e) => setDurataMassima(e.target.value)}
                className="w-24 h-8 text-sm font-mono"
                data-testid="input-durata-massima"
              />
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Label htmlFor="pausa-corse" className="text-sm font-medium whitespace-nowrap">
                Pausa tra corse (min)
              </Label>
              <Input
                id="pausa-corse"
                type="number"
                placeholder="10"
                min="0"
                value={pausaCorse}
                onChange={(e) => setPausaCorse(e.target.value)}
                className="w-20 h-8 text-sm"
                data-testid="input-pausa-corse"
              />
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Label htmlFor="pausa-spostamenti" className="text-sm font-medium whitespace-nowrap">
                Pausa spostamenti (min)
              </Label>
              <Input
                id="pausa-spostamenti"
                type="number"
                placeholder="10"
                min="0"
                value={pausaSpostamenti}
                onChange={(e) => setPausaSpostamenti(e.target.value)}
                className="w-20 h-8 text-sm"
                data-testid="input-pausa-spostamenti"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              si aggiornano in tempo reale
            </span>
          </div>
        )}
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
          <GanttBoard
            attivitaList={attivitaList || []}
            transitiList={transitiList || []}
            sortBy={sortBy}
            hideSosta={hideSosta}
            hideTempoAccessorio={hideTempoAccessorio}
            durataMassima={durataMassima}
            pausaCorse={pausaCorse}
            pausaSpostamenti={pausaSpostamenti}
          />
        )}
      </main>
    </div>
  );
}
