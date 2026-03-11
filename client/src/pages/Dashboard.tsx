import { useState } from "react";
import { CalendarDays, Trash2, RotateCcw, History, Merge, LogIn, ArrowRight } from "lucide-react";
import { ExcelUploader } from "@/components/ExcelUploader";
import { TransitiUploader } from "@/components/TransitiUploader";
import { GanttBoard } from "@/components/GanttChart/GanttBoard";
import { useAttivita, useClearAllAttivita, useResetToSnapshot, useHasSnapshot, useMergeLogs } from "@/hooks/use-attivita";
import { useTransiti, useClearAllTransiti } from "@/hooks/use-transiti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { type MergeLogEntry } from "@shared/schema";

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function MergeLogDialog({ open, onClose, entries }: { open: boolean; onClose: () => void; entries: MergeLogEntry[] }) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.eseguiteAlle).getTime() - new Date(a.eseguiteAlle).getTime()
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Cronologia operazioni
          </DialogTitle>
        </DialogHeader>

        {sorted.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nessuna operazione effettuata dall'ultimo ripristino.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-border -mx-6 px-6">
            {sorted.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 py-3">
                <div className="mt-0.5 shrink-0">
                  {entry.tipoOperazione === "merge" ? (
                    <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                      <Merge className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                      <LogIn className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={
                        entry.tipoOperazione === "merge"
                          ? "border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400 text-[10px]"
                          : "border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400 text-[10px]"
                      }
                    >
                      {entry.tipoOperazione === "merge" ? "Merge" : "In sosta"}
                    </Badge>
                    <span className="text-sm font-semibold">{entry.sourceNastroId}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-sm font-semibold">{entry.targetNastroId}</span>
                  </div>

                  {entry.bridgeCorsaId && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Corsa ponte: {entry.bridgeCorsaId}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTimestamp(entry.eseguiteAlle)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const [sortBy, setSortBy] = useState<"name" | "start-time">("name");
  const [hideSosta, setHideSosta] = useState(false);
  const [hideTempoAccessorio, setHideTempoAccessorio] = useState(false);
  const [durataMassima, setDurataMassima] = useState("");
  const [pausaCorse, setPausaCorse] = useState("");
  const [pausaSpostamenti, setPausaSpostamenti] = useState("");
  const [showCronologia, setShowCronologia] = useState(false);

  const { data: attivitaList, isLoading } = useAttivita();
  const { data: transitiList } = useTransiti();
  const { data: snapshotInfo } = useHasSnapshot();
  const { data: mergeLogEntries } = useMergeLogs();
  const { mutate: clearAttivita, isPending: isClearingAttivita } = useClearAllAttivita();
  const { mutate: clearTransiti, isPending: isClearingTransiti } = useClearAllTransiti();
  const { mutate: resetToSnapshot, isPending: isResetting } = useResetToSnapshot();

  const isClearing = isClearingAttivita || isClearingTransiti;
  const mergeCount = mergeLogEntries?.length ?? 0;

  const handleSvuota = () => {
    if (confirm("Sei sicuro di voler eliminare tutti i dati (nastri e transiti)? Questa azione è irreversibile.")) {
      clearAttivita();
      clearTransiti();
    }
  };

  const handleRipristina = () => {
    if (confirm("Ripristinare la soluzione all'upload originale? Tutte le modifiche (merge, ecc.) andranno perse.")) {
      resetToSnapshot();
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
                  onClick={() => setShowCronologia(true)}
                  disabled={mergeCount === 0}
                  className="text-foreground border-border gap-1.5"
                  data-testid="button-cronologia"
                >
                  <History className="w-4 h-4" />
                  Cronologia
                  {mergeCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-4 min-w-4 px-1 text-[10px] font-bold rounded-full"
                    >
                      {mergeCount}
                    </Badge>
                  )}
                </Button>

                {snapshotInfo?.hasSnapshot && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRipristina}
                    disabled={isResetting}
                    className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950 border-blue-200 dark:border-blue-800"
                    data-testid="button-reset-snapshot"
                    title="Riporta i nastri allo stato dell'ultimo upload"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Ripristina
                  </Button>
                )}
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

      {/* Cronologia dialog */}
      <MergeLogDialog
        open={showCronologia}
        onClose={() => setShowCronologia(false)}
        entries={mergeLogEntries ?? []}
      />
    </div>
  );
}
