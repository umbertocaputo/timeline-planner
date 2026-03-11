import { useMemo, useState } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { type Attivita, type Transito } from "@shared/schema";
import { AttivitaItem } from "./AttivitaItem";
import { stringToColor } from "@/lib/color-utils";
import { getPercentageOfDay } from "./TimeUtils";
import { GripVertical, Lightbulb, Merge, Clock, MapPin, ArrowRight } from "lucide-react";
import { useMergeNastro } from "@/hooks/use-attivita";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface NastroRowProps {
  nastroId: string;
  attivitaList: Attivita[];
  allNastriMap?: Map<string, Attivita[]>;
  transitiByCorsa?: Map<string, Transito[]>;
  durataMassima?: string;
  pausaSpostamenti?: string;
}

interface BridgeCorsaInfo {
  idCorsa: string;
  idOrigine: string;
  idDestinazione: string;
  orarioInizio: string;
  orarioFine: string;
}

interface SuggestedNastro {
  nastroId: string;
  startLocation: string;
  endLocation: string;
  totalDurationMins: number;
  gapMins: number;
  bridgeCorsa?: BridgeCorsaInfo;
}

function parseDurataMassima(value: string): number | null {
  if (!value.trim()) return null;
  if (value.includes(":")) {
    const [h, m] = value.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }
  const mins = parseInt(value);
  return isNaN(mins) ? null : mins;
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Find a bridge corsa that departs from `fromLoc` after `minDepartureMs`
 * and arrives at `toLoc` before `maxArrivalMs`, with fromLoc stop
 * earlier in sequence than toLoc stop.
 */
function findBridgeCorsa(
  transitiByCorsa: Map<string, Transito[]>,
  fromLoc: string,
  toLoc: string,
  minDepartureMs: number,
  maxArrivalMs: number
): BridgeCorsaInfo | null {
  for (const [idCorsa, stops] of transitiByCorsa) {
    const sorted = [...stops].sort((a, b) => a.sequenza - b.sequenza);

    const fromStopIdx = sorted.findIndex(
      (s) => s.idPunto === fromLoc && s.orarioPartenza
    );
    if (fromStopIdx === -1) continue;

    const fromStop = sorted[fromStopIdx];
    const departureMs = new Date(fromStop.orarioPartenza!).getTime();
    if (departureMs < minDepartureMs) continue;

    const toStop = sorted.slice(fromStopIdx + 1).find(
      (s) => s.idPunto === toLoc && s.orarioArrivo
    );
    if (!toStop) continue;

    const arrivalMs = new Date(toStop.orarioArrivo!).getTime();
    if (arrivalMs > maxArrivalMs) continue;

    return {
      idCorsa,
      idOrigine: fromLoc,
      idDestinazione: toLoc,
      orarioInizio: fromStop.orarioPartenza!,
      orarioFine: toStop.orarioArrivo!,
    };
  }
  return null;
}

export function NastroRow({
  nastroId,
  attivitaList,
  allNastriMap,
  transitiByCorsa = new Map(),
  durataMassima = "",
  pausaSpostamenti = "",
}: NastroRowProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { mutate: mergeNastro, isPending: isMerging } = useMergeNastro();

  const sorted = useMemo(
    () =>
      [...attivitaList].sort(
        (a, b) =>
          new Date(a.orarioInizio).getTime() - new Date(b.orarioInizio).getTime()
      ),
    [attivitaList]
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const calculateDuration = () => {
    if (!first || !last) return "00:00";
    const diffMins = Math.floor(
      (new Date(last.orarioFine).getTime() - new Date(first.orarioInizio).getTime()) / 60000
    );
    return formatMinutes(diffMins);
  };

  const duration = calculateDuration();
  const hasLocationMismatch = first && last && first.idOrigine !== last.idDestinazione;

  // ---- Merge suggestion algorithm ----
  const suggestions = useMemo<SuggestedNastro[]>(() => {
    if (!allNastriMap || !last || !first) return [];

    const durataMassimaMinutes = parseDurataMassima(durataMassima);
    // Pausa spostamenti used only for bridge corsa window
    const pausaSpostaMinutes = pausaSpostamenti.trim() ? parseInt(pausaSpostamenti) || 10 : 10;
    const pausaSpostaMs = pausaSpostaMinutes * 60000;

    const endTime = new Date(last.orarioFine).getTime();
    const endLoc = last.idDestinazione;

    const results: SuggestedNastro[] = [];

    allNastriMap.forEach((candidateActivities, candidateId) => {
      if (candidateId === nastroId) return;

      const sortedCandidate = [...candidateActivities].sort(
        (a, b) => new Date(a.orarioInizio).getTime() - new Date(b.orarioInizio).getTime()
      );

      const candidateFirst = sortedCandidate[0];
      const candidateLast = sortedCandidate[sortedCandidate.length - 1];
      if (!candidateFirst || !candidateLast) return;

      // Candidate must start AFTER current nastro ends
      if (new Date(candidateFirst.orarioInizio).getTime() < endTime) return;

      const firstCorsaCandidate = sortedCandidate.find(
        (a) => a.tipoAttivita.toLowerCase() === "corsa in linea"
      );
      const candidateFirstCorsaStart = firstCorsaCandidate
        ? new Date(firstCorsaCandidate.orarioInizio).getTime()
        : new Date(candidateFirst.orarioInizio).getTime();

      let gapMins = 0;
      let bridgeCorsa: BridgeCorsaInfo | undefined;

      if (candidateFirst.idOrigine === endLoc) {
        // ---- Direct match (same location) — no pausa constraint ----
        gapMins =
          (new Date(candidateFirst.orarioInizio).getTime() - endTime) / 60000;
      } else {
        // ---- Bridge corsa needed — uses pausaSpostamenti ----
        if (transitiByCorsa.size === 0) return;

        const minDeparture = endTime + pausaSpostaMs;
        const maxArrival = candidateFirstCorsaStart - pausaSpostaMs;

        if (minDeparture >= maxArrival) return;

        const bridge = findBridgeCorsa(
          transitiByCorsa,
          endLoc,
          candidateFirst.idOrigine,
          minDeparture,
          maxArrival
        );

        if (!bridge) return;

        bridgeCorsa = bridge;
        gapMins =
          (new Date(bridge.orarioInizio).getTime() - endTime) / 60000;
      }

      // Total merged duration: from start of current to end of candidate
      const totalDurationMins =
        (new Date(candidateLast.orarioFine).getTime() -
          new Date(first.orarioInizio).getTime()) /
        60000;

      if (durataMassimaMinutes !== null && totalDurationMins > durataMassimaMinutes) return;

      results.push({
        nastroId: candidateId,
        startLocation: candidateFirst.idOrigine,
        endLocation: candidateLast.idDestinazione,
        totalDurationMins,
        gapMins,
        bridgeCorsa,
      });
    });

    return results.sort((a, b) => a.totalDurationMins - b.totalDurationMins);
  }, [allNastriMap, nastroId, sorted, last, first, durataMassima, pausaSpostamenti, transitiByCorsa]);

  // ---- DnD ----
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `nastro-${nastroId}`,
    data: { type: "nastro", nastroId },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    isDragging,
  } = useDraggable({
    id: `drag-nastro-${nastroId}`,
    data: { type: "nastro-handle", nastroId },
  });

  const handleMerge = (sug: SuggestedNastro) => {
    const label = sug.bridgeCorsa
      ? `Merge "${sug.nastroId}" in "${nastroId}" con corsa ponte ${sug.bridgeCorsa.idCorsa}?\n\nI tempi accessori finali del nastro corrente e iniziali del nastro suggerito verranno eliminati.`
      : `Merge "${sug.nastroId}" in "${nastroId}"?\n\nI tempi accessori finali del nastro corrente e iniziali del nastro suggerito verranno eliminati.`;

    if (confirm(label)) {
      mergeNastro({
        targetNastroId: nastroId,
        sourceNastroId: sug.nastroId,
        bridgeCorsa: sug.bridgeCorsa,
      });
      setPopoverOpen(false);
    }
  };

  return (
    <div
      ref={setDroppableRef}
      className={`
        flex h-16 border-b transition-colors duration-200 relative
        ${hasLocationMismatch
          ? "border-b-red-300 dark:border-b-red-800 bg-red-50/60 dark:bg-red-950/25"
          : "border-b-border/50 bg-card"
        }
        ${isOver ? "bg-primary/5 ring-inset ring-2 ring-primary/20" : "hover:bg-muted/10"}
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      {/* Mismatch accent bar */}
      {hasLocationMismatch && (
        <div
          className="absolute left-52 top-0 bottom-0 w-1 bg-red-500 dark:bg-red-400 z-20 pointer-events-none"
          title="Inizio e fine nastro in località diverse"
        />
      )}

      {/* Row Label */}
      <div
        className={`w-52 shrink-0 border-r flex items-center px-2 gap-1 relative z-10 group transition-colors duration-200
          ${hasLocationMismatch
            ? "border-r-red-300 dark:border-r-red-700 bg-red-50 dark:bg-red-950/40"
            : "border-r-border bg-card"
          }
        `}
      >
        <div
          ref={setDraggableRef}
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-foreground transition-colors p-1 -ml-1 rounded"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="font-semibold text-sm truncate text-foreground" title={nastroId}>
              {nastroId}
            </span>
            <span className="text-xs text-muted-foreground font-mono shrink-0" title="Durata totale nastro">
              {duration}
            </span>
          </div>
          <div className="flex items-center text-[10px] text-muted-foreground gap-1 mt-0.5">
            {first && (
              <div className="flex items-center gap-0.5 shrink-0">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stringToColor(first.idOrigine) }} />
                <span className="truncate max-w-[44px]">{first.idOrigine}</span>
              </div>
            )}
            <span className="text-border">→</span>
            {last && (
              <div className="flex items-center gap-0.5 shrink-0">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stringToColor(last.idDestinazione) }} />
                <span className="truncate max-w-[44px]">{last.idDestinazione}</span>
              </div>
            )}
          </div>
        </div>

        {/* Suggestion button */}
        {allNastriMap && (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                className={`
                  p-1 rounded transition-colors shrink-0
                  ${suggestions.length > 0
                    ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                    : "text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/50"
                  }
                `}
                title={
                  suggestions.length > 0
                    ? `${suggestions.length} nastro/i compatibile/i`
                    : "Nessun nastro compatibile"
                }
                data-testid={`button-suggest-merge-${nastroId}`}
              >
                <Lightbulb className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" side="right" align="start" sideOffset={8}>
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold">Suggerimenti merge per {nastroId}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fine nastro in{" "}
                  <span className="font-medium text-foreground">{last?.idDestinazione}</span>
                  {transitiByCorsa.size > 0 && (
                    <span className="ml-1 text-amber-600">· transiti disponibili</span>
                  )}
                </p>
              </div>

              {suggestions.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Nessun nastro compatibile trovato.
                  <br />
                  <span className="text-xs">
                    {durataMassima && (
                      <span className="block">Durata massima: {durataMassima}</span>
                    )}
                    {transitiByCorsa.size === 0 && (
                      <span className="block mt-1 text-amber-600">
                        Carica il file transiti per trovare nastri con corsa ponte.
                      </span>
                    )}
                  </span>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {suggestions.map((sug) => (
                    <div
                      key={sug.nastroId}
                      className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold">{sug.nastroId}</span>
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: stringToColor(sug.endLocation) }}
                          />
                          <span className="text-xs text-muted-foreground truncate">{sug.endLocation}</span>
                        </div>

                        {sug.bridgeCorsa && (
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-amber-700 dark:text-amber-400 bg-yellow-50 dark:bg-yellow-950/40 rounded px-1.5 py-0.5 w-fit">
                            <ArrowRight className="w-3 h-3 shrink-0" />
                            <span>
                              Corsa {sug.bridgeCorsa.idCorsa}: {sug.bridgeCorsa.idOrigine} → {sug.bridgeCorsa.idDestinazione}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            tot. {formatMinutes(sug.totalDurationMins)}
                          </span>
                          {sug.gapMins > 0 && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />
                              attesa {Math.round(sug.gapMins)}m
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 h-7 px-2 text-xs"
                        disabled={isMerging}
                        onClick={() => handleMerge(sug)}
                        data-testid={`button-do-merge-${nastroId}-${sug.nastroId}`}
                      >
                        <Merge className="w-3 h-3 mr-1" />
                        Merge
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Grid Area */}
      <div className="flex-1 relative gantt-pattern">
        {sorted.map((att) => (
          <AttivitaItem key={att.id} attivita={att} />
        ))}

        {/* Mismatch triangles between consecutive activities */}
        {sorted.map((att, idx) => {
          if (idx >= sorted.length - 1) return null;
          const next = sorted[idx + 1];
          if (att.idDestinazione === next.idOrigine) return null;
          const position = getPercentageOfDay(next.orarioInizio);
          return (
            <svg
              key={`mismatch-${att.id}-${next.id}`}
              className="absolute transition-opacity opacity-70 hover:opacity-100 pointer-events-auto"
              style={{ left: `${position}%`, top: "56px", width: "20px", height: "20px", marginLeft: "-10px" }}
              viewBox="0 0 20 20"
              title={`Mismatch: ${att.idDestinazione} → ${next.idOrigine}`}
            >
              <polygon points="10,2 20,18 0,18" fill="#dc2626" />
            </svg>
          );
        })}
      </div>
    </div>
  );
}
