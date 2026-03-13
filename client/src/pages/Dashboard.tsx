import { useState, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { CalendarDays, Trash2, RotateCcw, History, Merge, LogIn, ArrowRight, MoveRight, Bus, ListFilter, PlusCircle, ChevronDown, ChevronUp, Shuffle, Sparkles, Train, Table2, Download } from "lucide-react";
import { ExcelUploader } from "@/components/ExcelUploader";
import { TransitiUploader } from "@/components/TransitiUploader";
import { OttimizzazioneMotoreDialog } from "@/components/OttimizzazioneMotoreDialog";
import { TransitiViewerDialog } from "@/components/TransitiViewerDialog";
import { GanttBoard } from "@/components/GanttChart/GanttBoard";
import { useAttivita, useClearAllAttivita, useResetToSnapshot, useHasSnapshot, useMergeLogs, useInsertCorsa, type InsertCorsaInput } from "@/hooks/use-attivita";
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
import { type MergeLogEntry, type Transito, type Attivita } from "@shared/schema";
import { computeNastroSuggestions, type CorsaInfo as SuggCorsaInfo, type NastroSuggestion } from "@/lib/nastro-suggestions";

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
                  ) : entry.tipoOperazione === "insert-spostamento" ? (
                    <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                      <Bus className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    </div>
                  ) : entry.tipoOperazione === "move-attivita" ? (
                    <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                      <MoveRight className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    </div>
                  ) : entry.tipoOperazione === "insert-corsa" ? (
                    <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-950 flex items-center justify-center">
                      <PlusCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
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
                          : entry.tipoOperazione === "insert-spostamento"
                            ? "border-green-200 text-green-700 dark:border-green-800 dark:text-green-400 text-[10px]"
                            : entry.tipoOperazione === "move-attivita"
                              ? "border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400 text-[10px]"
                              : entry.tipoOperazione === "insert-corsa"
                                ? "border-teal-200 text-teal-700 dark:border-teal-800 dark:text-teal-400 text-[10px]"
                                : "border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400 text-[10px]"
                      }
                    >
                      {entry.tipoOperazione === "merge"
                        ? "Merge"
                        : entry.tipoOperazione === "insert-spostamento"
                          ? "Spostamento"
                          : entry.tipoOperazione === "move-attivita"
                            ? "Corsa spostata"
                            : entry.tipoOperazione === "insert-corsa"
                              ? "Inserimento"
                              : "In sosta"}
                    </Badge>
                    {entry.tipoOperazione === "insert-spostamento" ? (
                      <span className="text-sm font-semibold">
                        Nastro {entry.targetNastroId} · corsa {entry.bridgeCorsaId}
                      </span>
                    ) : entry.tipoOperazione === "insert-corsa" ? (
                      <>
                        <span className="text-sm font-semibold">Corsa {entry.sourceNastroId}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-sm font-semibold">Nastro {entry.targetNastroId}</span>
                      </>
                    ) : entry.tipoOperazione === "move-attivita" ? (
                      <>
                        <span className="text-sm font-semibold">{entry.sourceNastroId}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-sm font-semibold">{entry.targetNastroId}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-semibold">{entry.sourceNastroId}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-sm font-semibold">{entry.targetNastroId}</span>
                      </>
                    )}
                  </div>

                  {entry.bridgeCorsaId && entry.tipoOperazione === "merge" && (
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

interface CorsaInfo {
  idCorsa: string;
  idOrigine: string;
  idDestinazione: string;
  orarioPartenza: string;
  orarioArrivo: string;
}

function formatTimeFromIso(iso: string | null | undefined): string {
  if (!iso) return "--:--";
  try {
    const d = new Date(iso);
    const h = d.getUTCHours().toString().padStart(2, "0");
    const m = d.getUTCMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  } catch {
    return iso.slice(11, 16) ?? "--:--";
  }
}

function buildCorseInfoFromTransiti(transitiList: Transito[]): CorsaInfo[] {
  const byCorsa = new Map<string, Transito[]>();
  for (const t of transitiList) {
    if (!byCorsa.has(t.idCorsa)) byCorsa.set(t.idCorsa, []);
    byCorsa.get(t.idCorsa)!.push(t);
  }
  const result: CorsaInfo[] = [];
  for (const [idCorsa, fermate] of Array.from(byCorsa.entries())) {
    const sorted = [...fermate].sort((a, b) => a.sequenza - b.sequenza);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    result.push({
      idCorsa,
      idOrigine: first.idPunto,
      idDestinazione: last.idPunto,
      orarioPartenza: first.orarioPartenza ?? first.orarioArrivo ?? "",
      orarioArrivo: last.orarioArrivo ?? last.orarioPartenza ?? "",
    });
  }
  return result.sort((a, b) => a.orarioPartenza.localeCompare(b.orarioPartenza));
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h${String(m).padStart(2, "0")}m`;
}

function CorseNonAssegnateDialog({
  open,
  onClose,
  corseNonAssegnate,
  corseSuggerimenti,
  onInsert,
  isInserting,
}: {
  open: boolean;
  onClose: () => void;
  corseNonAssegnate: CorsaInfo[];
  corseSuggerimenti: Map<string, NastroSuggestion[]>;
  onInsert: (corsa: CorsaInfo, suggestion: NastroSuggestion) => void;
  isInserting: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListFilter className="w-4 h-4" />
            Corse non assegnate ai nastri
            <Badge variant="secondary" className="ml-1 text-xs">
              {corseNonAssegnate.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {corseNonAssegnate.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Tutte le corse dei transiti sono già presenti nei nastri come corse in linea.
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-border -mx-6 px-6">
            {corseNonAssegnate.map((corsa) => {
              const suggestions = corseSuggerimenti.get(corsa.idCorsa) ?? [];
              const isOpen = expanded === corsa.idCorsa;
              return (
                <div key={corsa.idCorsa} className="py-2.5" data-testid={`row-corsa-non-assegnata-${corsa.idCorsa}`}>
                  {/* Corsa info row */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold w-20 shrink-0 text-foreground">
                      {corsa.idCorsa}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-1 min-w-0">
                      <span className="truncate max-w-[72px]">{corsa.idOrigine}</span>
                      <ArrowRight className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[72px]">{corsa.idDestinazione}</span>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground shrink-0">
                      {formatTimeFromIso(corsa.orarioPartenza)} – {formatTimeFromIso(corsa.orarioArrivo)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs gap-1 shrink-0"
                      onClick={() => setExpanded(isOpen ? null : corsa.idCorsa)}
                      data-testid={`button-espandi-suggerimenti-${corsa.idCorsa}`}
                    >
                      {suggestions.length > 0 ? (
                        <>
                          <span className="text-teal-600 dark:text-teal-400 font-medium">{suggestions.length}</span>
                          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </>
                      ) : (
                        <span className="text-muted-foreground/60 text-[11px]">—</span>
                      )}
                    </Button>
                  </div>

                  {/* Suggestions panel */}
                  {isOpen && (
                    <div className="mt-2 ml-20 space-y-1.5">
                      {suggestions.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Nessun nastro disponibile con i parametri correnti.</p>
                      ) : (
                        suggestions.map((s) => (
                          <div
                            key={s.nastroId}
                            className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5"
                            data-testid={`row-suggerimento-${corsa.idCorsa}-${s.nastroId}`}
                          >
                            <span className="font-mono text-xs font-semibold text-foreground w-14 shrink-0">
                              {s.nastroId}
                            </span>
                            <span className="text-xs text-muted-foreground flex-1">
                              {formatDuration(s.newDurationMins)}
                              {(s.spostamentoPre || s.spostamentoPost) && (
                                <span className="ml-1.5 inline-flex items-center gap-0.5 text-violet-600 dark:text-violet-400">
                                  <Shuffle className="w-2.5 h-2.5" />
                                  spostamento
                                </span>
                              )}
                              {(s.newLeadingTA || s.newTrailingTA) && (
                                <span className="ml-1.5 text-orange-500 dark:text-orange-400 text-[10px]">T.A. aggiornati</span>
                              )}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950 shrink-0"
                              disabled={isInserting}
                              onClick={() => onInsert(corsa, s)}
                              data-testid={`button-inserisci-${corsa.idCorsa}-${s.nastroId}`}
                            >
                              Inserisci
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const [sortBy, setSortBy] = useState<"name" | "start-time">("name");
  const [hideSosta, setHideSosta] = useState(true);
  const [hideTempoAccessorio, setHideTempoAccessorio] = useState(false);
  const [durataMassima, setDurataMassima] = useState("08:15");
  const [pausaCorse, setPausaCorse] = useState("");
  const [pausaSpostamenti, setPausaSpostamenti] = useState("");
  const [showCronologia, setShowCronologia] = useState(false);
  const [showCorseNonAssegnate, setShowCorseNonAssegnate] = useState(false);
  const [showOttimizzazioneMotore, setShowOttimizzazioneMotore] = useState(false);
  const [showTransitiViewer, setShowTransitiViewer] = useState(false);

  const { data: attivitaList, isLoading } = useAttivita();
  const { data: transitiList } = useTransiti();
  const { data: snapshotInfo } = useHasSnapshot();
  const { data: mergeLogEntries } = useMergeLogs();
  const { mutate: clearAttivita, isPending: isClearingAttivita } = useClearAllAttivita();
  const { mutate: clearTransiti, isPending: isClearingTransiti } = useClearAllTransiti();
  const { mutate: resetToSnapshot, isPending: isResetting } = useResetToSnapshot();
  const { mutate: insertCorsa, isPending: isInsertingCorsa } = useInsertCorsa();

  const isClearing = isClearingAttivita || isClearingTransiti;
  const mergeCount = mergeLogEntries?.length ?? 0;

  // Corse in linea presenti nella soluzione corrente (per scope ottimizzazione)
  const nastriCorseIds = useMemo(() => {
    return (attivitaList ?? [])
      .filter((a) => a.tipoAttivita.toLowerCase() === "corsa in linea" && !a.isBridgeCorsa && a.idCorsa)
      .map((a) => a.idCorsa as string);
  }, [attivitaList]);

  const corseNonAssegnate = useMemo(() => {
    if (!transitiList || transitiList.length === 0) return [];
    const corseInLinea = new Set(
      (attivitaList ?? [])
        .filter((a) => a.tipoAttivita.toLowerCase() === "corsa in linea")
        .map((a) => a.idCorsa)
        .filter(Boolean)
    );
    const tutte = buildCorseInfoFromTransiti(transitiList);
    return tutte.filter((c) => !corseInLinea.has(c.idCorsa));
  }, [transitiList, attivitaList]);

  // Build lookup maps for the suggestion algorithm
  const allNastriMap = useMemo(() => {
    const map = new Map<string, Attivita[]>();
    (attivitaList ?? []).forEach((a) => {
      const existing = map.get(a.nastroId) ?? [];
      existing.push(a);
      map.set(a.nastroId, existing);
    });
    return map;
  }, [attivitaList]);

  const transitiByCorsa = useMemo(() => {
    const map = new Map<string, Transito[]>();
    (transitiList ?? []).forEach((t) => {
      const existing = map.get(t.idCorsa) ?? [];
      existing.push(t);
      map.set(t.idCorsa, existing);
    });
    return map;
  }, [transitiList]);

  const parsedPausaCorse = useMemo(() => {
    if (!pausaCorse) return 0;
    const [h, m] = pausaCorse.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  }, [pausaCorse]);

  const parsedPausaSpostamenti = useMemo(() => {
    if (!pausaSpostamenti) return 0;
    const [h, m] = pausaSpostamenti.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  }, [pausaSpostamenti]);

  const durataMassimaMinutes = useMemo(() => {
    if (!durataMassima) return null;
    const [h, m] = durataMassima.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  }, [durataMassima]);

  // Compute nastro suggestions for each unassigned corsa
  const corseSuggerimenti = useMemo(() => {
    const map = new Map<string, NastroSuggestion[]>();
    if (allNastriMap.size === 0) return map;
    for (const corsa of corseNonAssegnate) {
      const suggestions = computeNastroSuggestions(
        corsa as SuggCorsaInfo,
        allNastriMap,
        transitiByCorsa,
        parsedPausaCorse,
        parsedPausaSpostamenti,
        durataMassimaMinutes,
      );
      map.set(corsa.idCorsa, suggestions.slice(0, 5));
    }
    return map;
  }, [corseNonAssegnate, allNastriMap, transitiByCorsa, parsedPausaCorse, parsedPausaSpostamenti, durataMassimaMinutes]);

  const handleInsertCorsa = (corsa: CorsaInfo, suggestion: NastroSuggestion) => {
    const refIso = allNastriMap.get(suggestion.nastroId)?.[0]?.orarioInizio;
    if (!refIso) return;

    const normalizeDate = (iso: string) => {
      if (!iso || iso.length < 11) return iso;
      const refDate = new Date(refIso);
      const yyyy = refDate.getUTCFullYear();
      const mm = String(refDate.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(refDate.getUTCDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}T${iso.slice(11)}`;
    };

    const stops = (transitiByCorsa.get(corsa.idCorsa) ?? []).sort(
      (a, b) => a.sequenza - b.sequenza,
    );
    const firstStop = stops[0];
    const lastStop = stops[stops.length - 1];

    insertCorsa({
      nastroId: suggestion.nastroId,
      corsa: {
        idCorsa: corsa.idCorsa,
        idOrigine: corsa.idOrigine,
        idDestinazione: corsa.idDestinazione,
        orarioInizio: normalizeDate(firstStop?.orarioPartenza ?? corsa.orarioPartenza),
        orarioFine: normalizeDate(lastStop?.orarioArrivo ?? corsa.orarioArrivo),
      },
      spostamentoPre: suggestion.spostamentoPre,
      spostamentoPost: suggestion.spostamentoPost,
      deleteIds: suggestion.deleteIds,
      newLeadingTA: suggestion.newLeadingTA,
      newTrailingTA: suggestion.newTrailingTA,
    });
  };

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

  const handleDownloadSoluzione = useCallback(() => {
    if (!attivitaList || attivitaList.length === 0) return;
    const fmt = (iso: string) => {
      try {
        const d = new Date(iso);
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      } catch { return iso; }
    };
    const rows = attivitaList.map(a => ({
      id_nastro: a.nastroId,
      id_punto_origine: a.idOrigine,
      id_punto_destinazione: a.idDestinazione,
      orario_inizio_attivita: fmt(a.orarioInizio),
      orario_fine_attivita: fmt(a.orarioFine),
      tipo_attivita: a.tipoAttivita,
      id_corsa: a.idCorsa ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Soluzione");
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `soluzione_nastri_${today}.xlsx`);
  }, [attivitaList]);

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

                {transitiList && transitiList.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCorseNonAssegnate(true)}
                    className="gap-1.5 text-foreground border-border"
                    data-testid="button-corse-non-assegnate"
                  >
                    <ListFilter className="w-4 h-4" />
                    Corse non assegnate
                    {corseNonAssegnate.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="h-4 min-w-4 px-1 text-[10px] font-bold rounded-full"
                      >
                        {corseNonAssegnate.length}
                      </Badge>
                    )}
                  </Button>
                )}

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
                  onClick={handleDownloadSoluzione}
                  className="gap-2 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
                  data-testid="button-download-soluzione"
                  title="Scarica la soluzione corrente come file Excel"
                >
                  <Download className="w-4 h-4" />
                  Scarica soluzione
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
            {transitiList && transitiList.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                data-testid="button-visualizza-transiti"
                onClick={() => setShowTransitiViewer(true)}
                className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
              >
                <Table2 className="w-4 h-4" />
                Visualizza transiti
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              data-testid="button-motore-ottimizzazione"
              onClick={() => setShowOttimizzazioneMotore(true)}
              className="gap-2 border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950"
            >
              <Sparkles className="w-4 h-4" />
              Ottimizza nastri
            </Button>
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

      {/* Corse non assegnate dialog */}
      <CorseNonAssegnateDialog
        open={showCorseNonAssegnate}
        onClose={() => setShowCorseNonAssegnate(false)}
        corseNonAssegnate={corseNonAssegnate}
        corseSuggerimenti={corseSuggerimenti}
        onInsert={handleInsertCorsa}
        isInserting={isInsertingCorsa}
      />

      {/* Motore di ottimizzazione dialog */}
      <OttimizzazioneMotoreDialog
        open={showOttimizzazioneMotore}
        onOpenChange={setShowOttimizzazioneMotore}
        selectedDate={new Date().toISOString().split("T")[0]}
        nastriCorseIds={nastriCorseIds}
      />

      {/* Transiti viewer dialog */}
      <TransitiViewerDialog
        open={showTransitiViewer}
        onOpenChange={setShowTransitiViewer}
        transitiList={transitiList || []}
      />
    </div>
  );
}
