import { useMemo, useState } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { type Attivita, type Transito } from "@shared/schema";
import { AttivitaItem } from "./AttivitaItem";
import { stringToColor } from "@/lib/color-utils";
import { getPercentageOfDay } from "./TimeUtils";
import { GripVertical, Lightbulb, Merge, Clock, MapPin, ArrowRight, LogIn } from "lucide-react";
import { useMergeNastro, useInsertInSosta } from "@/hooks/use-attivita";
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
  pausaCorse?: string;
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

interface SostaEmbeddingSuggestion {
  hostNastroId: string;
  sostaId: number;
  sostaLocation: string;
  sostaStart: string;
  sostaEnd: string;
  sostaDurationMins: number;
  guestEffectiveDurationMins: number;
  fitMarginMins: number;
}

// Current nastro IS the host: guest candidates that fit in one of its soste
interface SostaHostSuggestion {
  guestNastroId: string;
  sostaId: number;
  sostaLocation: string;
  sostaStart: string;
  sostaEnd: string;
  sostaDurationMins: number;
  guestEffectiveDurationMins: number;
  fitMarginMins: number;
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
 * Extract time-of-day in minutes from an ISO string (ignores date, uses UTC time).
 */
function isoToMinutes(iso: string): number {
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
}

/**
 * Rewrite the date portion of a transito ISO string to match the reference date
 * (taken from the attivita timestamps), so the inserted bridge corsa lands on the
 * correct day in the Gantt chart.
 */
function normalizeTransitoDate(transitoIso: string, referenceDateMs: number): string {
  const refDate = new Date(referenceDateMs);
  const yyyy = refDate.getUTCFullYear();
  const mm = String(refDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(refDate.getUTCDate()).padStart(2, "0");
  const timePart = transitoIso.slice(11); // "HH:MM:SS.mmmZ"
  return `${yyyy}-${mm}-${dd}T${timePart}`;
}

/**
 * Find a bridge corsa that departs from `fromLoc` after `minDepartureMs`
 * and arrives at `toLoc` before `maxArrivalMs`, with fromLoc stop
 * earlier in sequence than toLoc stop.
 *
 * Comparison is done on time-of-day only to avoid date mismatches between
 * transiti (which may use a different calendar date) and attivita timestamps.
 */
function findBridgeCorsa(
  transitiByCorsa: Map<string, Transito[]>,
  fromLoc: string,
  toLoc: string,
  minDepartureMs: number,
  maxArrivalMs: number
): BridgeCorsaInfo | null {
  const minDepartureMinutes = isoToMinutes(new Date(minDepartureMs).toISOString());
  const maxArrivalMinutes = isoToMinutes(new Date(maxArrivalMs).toISOString());

  for (const [idCorsa, stops] of transitiByCorsa) {
    const sorted = [...stops].sort((a, b) => a.sequenza - b.sequenza);

    const fromStopIdx = sorted.findIndex(
      (s) => s.idPunto === fromLoc && s.orarioPartenza
    );
    if (fromStopIdx === -1) continue;

    const fromStop = sorted[fromStopIdx];
    const departureMinutes = isoToMinutes(fromStop.orarioPartenza!);
    if (departureMinutes < minDepartureMinutes) continue;

    const toStop = sorted.slice(fromStopIdx + 1).find(
      (s) => s.idPunto === toLoc && s.orarioArrivo
    );
    if (!toStop) continue;

    const arrivalMinutes = isoToMinutes(toStop.orarioArrivo!);
    if (arrivalMinutes > maxArrivalMinutes) continue;

    // Normalize transito dates to the same calendar date as the attivita data
    return {
      idCorsa,
      idOrigine: fromLoc,
      idDestinazione: toLoc,
      orarioInizio: normalizeTransitoDate(fromStop.orarioPartenza!, minDepartureMs),
      orarioFine: normalizeTransitoDate(toStop.orarioArrivo!, minDepartureMs),
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
  pausaCorse = "",
  pausaSpostamenti = "",
}: NastroRowProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { mutate: mergeNastro, isPending: isMerging } = useMergeNastro();
  const { mutate: insertInSosta, isPending: isInserting } = useInsertInSosta();

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

  // True mismatch: an internal discontinuity where one activity ends at location X
  // and the very next activity starts at location Y ≠ X (without a bridge corsa bridging them).
  const hasLocationMismatch = useMemo(() => {
    if (sorted.length < 2) return false;
    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];
      if (curr.idDestinazione !== next.idOrigine) return true;
    }
    return false;
  }, [sorted]);

  // Non-circular nastro: starts and ends at different depots (informational, not an error).
  const isNonCircular = useMemo(() => {
    if (!first || !last) return false;
    return first.idOrigine !== last.idDestinazione;
  }, [first, last]);

  // ---- Merge suggestion algorithm ----
  const suggestions = useMemo<SuggestedNastro[]>(() => {
    if (!allNastriMap || !last || !first) return [];

    const durataMassimaMinutes = parseDurataMassima(durataMassima);
    // Pausa tra corse: minimum gap between last corsa of current and first corsa of candidate (same location)
    const pausaCorseMinutes = pausaCorse.trim() ? parseInt(pausaCorse) || 0 : 0;
    // Pausa spostamenti: margin used for bridge corsa departure/arrival window
    const pausaSpostaMinutes = pausaSpostamenti.trim() ? parseInt(pausaSpostamenti) || 10 : 10;
    const pausaSpostaMs = pausaSpostaMinutes * 60000;

    // Last "corsa in linea" in current nastro
    const lastCorsaAttuale = [...sorted]
      .reverse()
      .find((a) => a.tipoAttivita.toLowerCase() === "corsa in linea");

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
        // ---- Direct match (same location) ----
        // Apply pausaCorse: gap between last corsa of current and first corsa of candidate must be >= pausaCorseMinutes
        if (pausaCorseMinutes > 0 && lastCorsaAttuale && firstCorsaCandidate) {
          const corsaGapMins =
            (new Date(firstCorsaCandidate.orarioInizio).getTime() -
              new Date(lastCorsaAttuale.orarioFine).getTime()) /
            60000;
          if (corsaGapMins < pausaCorseMinutes) return;
        }
        gapMins = (new Date(candidateFirst.orarioInizio).getTime() - endTime) / 60000;
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
  }, [allNastriMap, nastroId, sorted, last, first, durataMassima, pausaCorse, pausaSpostamenti, transitiByCorsa]);

  // ---- Sosta embedding suggestions ----
  // Finds soste in OTHER nastri where the current nastro (without TA) could be inserted.
  const sostaEmbeddingSuggestions = useMemo<SostaEmbeddingSuggestion[]>(() => {
    if (!allNastriMap || !first || !last) return [];

    const firstCorsa = sorted.find(a => a.tipoAttivita.toLowerCase() === "corsa in linea");
    const lastCorsa = [...sorted].reverse().find(a => a.tipoAttivita.toLowerCase() === "corsa in linea");
    if (!firstCorsa || !lastCorsa) return [];

    const effectiveLoc = firstCorsa.idOrigine;
    // Must be circular at same location to fit inside a sosta
    if (lastCorsa.idDestinazione !== effectiveLoc) return [];

    const effectiveStartMins = isoToMinutes(firstCorsa.orarioInizio);
    const effectiveEndMins = isoToMinutes(lastCorsa.orarioFine);
    const effectiveDurationMins = effectiveEndMins - effectiveStartMins;

    const toleranceMins = 15;
    const results: SostaEmbeddingSuggestion[] = [];

    allNastriMap.forEach((candidateActivities, candidateId) => {
      if (candidateId === nastroId) return;

      const sortedCandidate = [...candidateActivities].sort(
        (a, b) => new Date(a.orarioInizio).getTime() - new Date(b.orarioInizio).getTime()
      );

      sortedCandidate.forEach(act => {
        if (act.tipoAttivita.toLowerCase() !== "sosta") return;
        if (act.idOrigine !== effectiveLoc) return;

        const sostaStartMins = isoToMinutes(act.orarioInizio);
        const sostaEndMins = isoToMinutes(act.orarioFine);
        const sostaDurationMins = sostaEndMins - sostaStartMins;

        if (sostaDurationMins < effectiveDurationMins - toleranceMins) return;

        // Guest's first corsa must start within the sosta window
        if (effectiveStartMins < sostaStartMins) return;
        if (effectiveStartMins > sostaEndMins) return;

        // Guest's last corsa end vs sosta end
        const fitMarginMins = sostaEndMins - effectiveEndMins;
        if (fitMarginMins < -toleranceMins) return;

        results.push({
          hostNastroId: candidateId,
          sostaId: act.id,
          sostaLocation: effectiveLoc,
          sostaStart: act.orarioInizio,
          sostaEnd: act.orarioFine,
          sostaDurationMins,
          guestEffectiveDurationMins: effectiveDurationMins,
          fitMarginMins,
        });
      });
    });

    return results.sort((a, b) => b.fitMarginMins - a.fitMarginMins);
  }, [allNastriMap, nastroId, sorted, first, last]);

  // ---- Sosta host suggestions ----
  // Current nastro IS the host: finds other nastri (guests) that can be inserted in its soste.
  const sostaHostSuggestions = useMemo<SostaHostSuggestion[]>(() => {
    if (!allNastriMap || !first || !last) return [];

    const toleranceMins = 15;
    const results: SostaHostSuggestion[] = [];

    // For each sosta in the current nastro
    sorted.forEach(act => {
      if (act.tipoAttivita.toLowerCase() !== "sosta") return;

      const sostaStartMins = isoToMinutes(act.orarioInizio);
      const sostaEndMins = isoToMinutes(act.orarioFine);
      const sostaDurationMins = sostaEndMins - sostaStartMins;

      // Find guest nastri that can be inserted in this sosta
      allNastriMap.forEach((candidateActivities, candidateId) => {
        if (candidateId === nastroId) return;

        const sortedCandidate = [...candidateActivities].sort(
          (a, b) => new Date(a.orarioInizio).getTime() - new Date(b.orarioInizio).getTime()
        );

        const firstCorsa = sortedCandidate.find(a => a.tipoAttivita.toLowerCase() === "corsa in linea");
        const lastCorsa = [...sortedCandidate].reverse().find(a => a.tipoAttivita.toLowerCase() === "corsa in linea");
        if (!firstCorsa || !lastCorsa) return;

        // Guest must be circular at the same location as the sosta
        if (firstCorsa.idOrigine !== act.idOrigine) return;
        if (lastCorsa.idDestinazione !== firstCorsa.idOrigine) return;

        const guestStartMins = isoToMinutes(firstCorsa.orarioInizio);
        const guestEndMins = isoToMinutes(lastCorsa.orarioFine);
        const guestDurationMins = guestEndMins - guestStartMins;

        if (sostaDurationMins < guestDurationMins - toleranceMins) return;

        // Guest's first corsa must start within the sosta window
        if (guestStartMins < sostaStartMins) return;
        if (guestStartMins > sostaEndMins) return;

        const fitMarginMins = sostaEndMins - guestEndMins;
        if (fitMarginMins < -toleranceMins) return;

        results.push({
          guestNastroId: candidateId,
          sostaId: act.id,
          sostaLocation: act.idOrigine,
          sostaStart: act.orarioInizio,
          sostaEnd: act.orarioFine,
          sostaDurationMins,
          guestEffectiveDurationMins: guestDurationMins,
          fitMarginMins,
        });
      });
    });

    return results.sort((a, b) => b.fitMarginMins - a.fitMarginMins);
  }, [allNastriMap, nastroId, sorted, first, last]);

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

  const handleInsertInSosta = (sug: SostaEmbeddingSuggestion) => {
    const label = `Inserire "${nastroId}" nella sosta di "${sug.hostNastroId}" (${sug.sostaLocation}, ${formatMinutes(sug.sostaDurationMins)})?\n\nI tempi accessori del nastro ospite verranno rimossi per fare spazio.`;
    if (confirm(label)) {
      insertInSosta({
        hostNastroId: sug.hostNastroId,
        guestNastroId: nastroId,
        sostaId: sug.sostaId,
      });
      setPopoverOpen(false);
    }
  };

  const handleInsertGuestInSosta = (sug: SostaHostSuggestion) => {
    const label = `Inserire "${sug.guestNastroId}" nella sosta di "${nastroId}" (${sug.sostaLocation}, ${formatMinutes(sug.sostaDurationMins)})?\n\nI tempi accessori del nastro ospite verranno rimossi per fare spazio.`;
    if (confirm(label)) {
      insertInSosta({
        hostNastroId: nastroId,
        guestNastroId: sug.guestNastroId,
        sostaId: sug.sostaId,
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
          : isNonCircular
            ? "border-b-amber-300 dark:border-b-amber-800 bg-amber-50/40 dark:bg-amber-950/15"
            : "border-b-border/50 bg-card"
        }
        ${isOver ? "bg-primary/5 ring-inset ring-2 ring-primary/20" : "hover:bg-muted/10"}
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      {/* Mismatch accent bar (internal discontinuity — error) */}
      {hasLocationMismatch && (
        <div
          className="absolute left-52 top-0 bottom-0 w-1 bg-red-500 dark:bg-red-400 z-20 pointer-events-none"
          title="Discontinuità interna: una o più attività consecutive non sono collegate"
        />
      )}

      {/* Non-circular accent bar (different start/end depot — informational) */}
      {!hasLocationMismatch && isNonCircular && (
        <div
          className="absolute left-52 top-0 bottom-0 w-1 bg-amber-400 dark:bg-amber-500 z-20 pointer-events-none"
          title={`Nastro non circolare: inizia a ${first?.idOrigine}, finisce a ${last?.idDestinazione}`}
        />
      )}

      {/* Row Label */}
      <div
        className={`w-52 shrink-0 border-r flex items-center px-2 gap-1 relative z-10 group transition-colors duration-200
          ${hasLocationMismatch
            ? "border-r-red-300 dark:border-r-red-700 bg-red-50 dark:bg-red-950/40"
            : isNonCircular
              ? "border-r-amber-300 dark:border-r-amber-700 bg-amber-50/60 dark:bg-amber-950/30"
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
            {isNonCircular && (
              <ArrowRight
                className="w-3 h-3 shrink-0 text-amber-500 dark:text-amber-400"
                title={`Nastro non circolare: inizia a ${first?.idOrigine}, finisce a ${last?.idDestinazione}`}
              />
            )}
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
                  ${(suggestions.length > 0 || sostaEmbeddingSuggestions.length > 0 || sostaHostSuggestions.length > 0)
                    ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                    : "text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/50"
                  }
                `}
                title={
                  (suggestions.length + sostaEmbeddingSuggestions.length + sostaHostSuggestions.length) > 0
                    ? `${suggestions.length} merge · ${sostaEmbeddingSuggestions.length} da inserire · ${sostaHostSuggestions.length} da ospitare`
                    : "Nessun suggerimento disponibile"
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

              {/* Sosta embedding suggestions */}
              {sostaEmbeddingSuggestions.length > 0 && (
                <>
                  <div className="px-4 py-2 border-t border-border bg-muted/30">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <LogIn className="w-3 h-3" />
                      Inserimento in sosta
                    </p>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-border">
                    {sostaEmbeddingSuggestions.map((sug) => (
                      <div
                        key={`${sug.hostNastroId}-${sug.sostaId}`}
                        className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold">{sug.hostNastroId}</span>
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: stringToColor(sug.sostaLocation) }}
                            />
                            <span className="text-xs text-muted-foreground truncate">{sug.sostaLocation}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              sosta {formatMinutes(sug.sostaDurationMins)}
                            </span>
                            {sug.fitMarginMins >= 0 ? (
                              <span className="text-green-600 dark:text-green-400">
                                +{Math.round(sug.fitMarginMins)}m margine
                              </span>
                            ) : (
                              <span className="text-orange-500">
                                {Math.round(Math.abs(sug.fitMarginMins))}m sovrapposizione
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 h-7 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950"
                          disabled={isInserting}
                          onClick={() => handleInsertInSosta(sug)}
                          data-testid={`button-insert-sosta-${nastroId}-${sug.hostNastroId}`}
                        >
                          <LogIn className="w-3 h-3 mr-1" />
                          Inserisci
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Sosta host suggestions: nastri da ospitare in una sosta di questo nastro */}
              {sostaHostSuggestions.length > 0 && (
                <>
                  <div className="px-4 py-2 border-t border-border bg-muted/30">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <LogIn className="w-3 h-3 rotate-180" />
                      Nastri da ospitare in sosta
                    </p>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-border">
                    {sostaHostSuggestions.map((sug) => (
                      <div
                        key={`${sug.guestNastroId}-${sug.sostaId}`}
                        className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold">{sug.guestNastroId}</span>
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: stringToColor(sug.sostaLocation) }}
                            />
                            <span className="text-xs text-muted-foreground truncate">{sug.sostaLocation}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              sosta {formatMinutes(sug.sostaDurationMins)} · ospite {formatMinutes(sug.guestEffectiveDurationMins)}
                            </span>
                            {sug.fitMarginMins >= 0 ? (
                              <span className="text-green-600 dark:text-green-400">
                                +{Math.round(sug.fitMarginMins)}m margine
                              </span>
                            ) : (
                              <span className="text-orange-500">
                                {Math.round(Math.abs(sug.fitMarginMins))}m sovrapposizione
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 h-7 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950"
                          disabled={isInserting}
                          onClick={() => handleInsertGuestInSosta(sug)}
                          data-testid={`button-host-sosta-${nastroId}-${sug.guestNastroId}`}
                        >
                          <LogIn className="w-3 h-3 mr-1" />
                          Ospita
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
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
