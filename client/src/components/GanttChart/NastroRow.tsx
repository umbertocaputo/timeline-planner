import { useMemo, useState } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { type Attivita } from "@shared/schema";
import { AttivitaItem } from "./AttivitaItem";
import { stringToColor } from "@/lib/color-utils";
import { getPercentageOfDay } from "./TimeUtils";
import { GripVertical, Lightbulb, Merge, Clock, MapPin } from "lucide-react";
import { useMoveNastro } from "@/hooks/use-attivita";
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
  durataMassima?: string;
  pausaMinima?: string;
}

interface SuggestedNastro {
  nastroId: string;
  startLocation: string;
  endLocation: string;
  totalDurationMins: number;
  gapMins: number;
}

function parseDurataMassima(value: string): number | null {
  if (!value.trim()) return null;
  // Support hh:mm format
  if (value.includes(":")) {
    const [h, m] = value.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }
  // Support plain minutes
  const mins = parseInt(value);
  return isNaN(mins) ? null : mins;
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function NastroRow({
  nastroId,
  attivitaList,
  allNastriMap,
  durataMassima = "",
  pausaMinima = "",
}: NastroRowProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { mutate: moveNastro } = useMoveNastro();

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
    const diffMs =
      new Date(last.orarioFine).getTime() -
      new Date(first.orarioInizio).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return formatMinutes(diffMins);
  };

  const duration = calculateDuration();
  const hasLocationMismatch =
    first && last && first.idOrigine !== last.idDestinazione;

  // ---- Merge suggestion algorithm ----
  const suggestions = useMemo<SuggestedNastro[]>(() => {
    if (!allNastriMap || !last || !first) return [];

    const durataMassimaMinutes = parseDurataMassima(durataMassima);
    const pausaMinimaMinutes = pausaMinima.trim()
      ? parseInt(pausaMinima) || 10
      : 10;

    const currentDurationMins =
      (new Date(last.orarioFine).getTime() -
        new Date(first.orarioInizio).getTime()) /
      60000;

    // Last "corsa in linea" in current nastro
    const lastCorsaAttuale = [...sorted]
      .reverse()
      .find((a) => a.tipoAttivita.toLowerCase() === "corsa in linea");

    const results: SuggestedNastro[] = [];

    allNastriMap.forEach((candidateActivities, candidateId) => {
      if (candidateId === nastroId) return;

      const sortedCandidate = [...candidateActivities].sort(
        (a, b) =>
          new Date(a.orarioInizio).getTime() - new Date(b.orarioInizio).getTime()
      );

      const candidateFirst = sortedCandidate[0];
      const candidateLast = sortedCandidate[sortedCandidate.length - 1];
      if (!candidateFirst || !candidateLast) return;

      // Must start from the same location as current nastro ends
      if (candidateFirst.idOrigine !== last.idDestinazione) return;

      // Must start after current nastro ends
      if (
        new Date(candidateFirst.orarioInizio).getTime() <
        new Date(last.orarioFine).getTime()
      )
        return;

      // Check pause between last corsa of current and first corsa of candidate
      const firstCorsaCandidate = sortedCandidate.find(
        (a) => a.tipoAttivita.toLowerCase() === "corsa in linea"
      );

      let gapMins = Infinity;
      if (lastCorsaAttuale && firstCorsaCandidate) {
        gapMins =
          (new Date(firstCorsaCandidate.orarioInizio).getTime() -
            new Date(lastCorsaAttuale.orarioFine).getTime()) /
          60000;
        if (gapMins < pausaMinimaMinutes) return;
      }

      // Calculate total merged duration
      const candidateDurationMins =
        (new Date(candidateLast.orarioFine).getTime() -
          new Date(candidateFirst.orarioInizio).getTime()) /
        60000;
      const totalDurationMins = currentDurationMins + candidateDurationMins;

      // Check total duration constraint
      if (durataMassimaMinutes !== null && totalDurationMins > durataMassimaMinutes)
        return;

      results.push({
        nastroId: candidateId,
        startLocation: candidateFirst.idOrigine,
        endLocation: candidateLast.idDestinazione,
        totalDurationMins,
        gapMins: gapMins === Infinity ? 0 : gapMins,
      });
    });

    return results.sort((a, b) => a.totalDurationMins - b.totalDurationMins);
  }, [allNastriMap, nastroId, sorted, last, first, durataMassima, pausaMinima]);

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

  return (
    <div
      ref={setDroppableRef}
      className={`
        flex h-16 border-b-2 transition-colors duration-200
        ${hasLocationMismatch ? "border-b-destructive bg-destructive/5" : "border-b-border/50 bg-card"}
        ${isOver ? "bg-primary/5 ring-inset ring-2 ring-primary/20" : "hover:bg-muted/10"}
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      {/* Row Label */}
      <div className="w-52 shrink-0 border-r border-border flex items-center px-2 gap-1 relative bg-card z-10 group">
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

        {/* Merge suggestion button */}
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
            <PopoverContent
              className="w-80 p-0"
              side="right"
              align="start"
              sideOffset={8}
            >
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold">Suggerimenti merge per {nastroId}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nastri che iniziano da <span className="font-medium text-foreground">{last?.idDestinazione}</span>
                </p>
              </div>

              {suggestions.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Nessun nastro compatibile trovato.
                  <br />
                  <span className="text-xs">Controlla i parametri di durata e pausa.</span>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y divide-border">
                  {suggestions.map((sug) => (
                    <div key={sug.nastroId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold">{sug.nastroId}</span>
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: stringToColor(sug.endLocation) }}
                          />
                          <span className="text-xs text-muted-foreground truncate">{sug.endLocation}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            tot. {formatMinutes(sug.totalDurationMins)}
                          </span>
                          {sug.gapMins > 0 && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />
                              pausa {Math.round(sug.gapMins)}m
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 h-7 px-2 text-xs"
                        onClick={() => {
                          if (
                            confirm(
                              `Merge Nastro "${sug.nastroId}" in "${nastroId}"?`
                            )
                          ) {
                            moveNastro({
                              oldNastroId: sug.nastroId,
                              newNastroId: nastroId,
                            });
                            setPopoverOpen(false);
                          }
                        }}
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

        {/* Mismatch indicators (red triangles) */}
        {sorted.map((att, idx) => {
          if (idx >= sorted.length - 1) return null;
          const next = sorted[idx + 1];
          if (att.idDestinazione === next.idOrigine) return null;
          const position = getPercentageOfDay(next.orarioInizio);
          return (
            <svg
              key={`mismatch-${att.id}-${next.id}`}
              className="absolute transition-opacity opacity-70 hover:opacity-100 pointer-events-auto"
              style={{
                left: `${position}%`,
                top: "56px",
                width: "20px",
                height: "20px",
                marginLeft: "-10px",
              }}
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
