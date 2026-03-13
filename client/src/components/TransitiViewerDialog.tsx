import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Train } from "lucide-react";
import { type Transito } from "@shared/schema";
import { getPercentageOfDay, getDurationPercentage, formatTime } from "./GanttChart/TimeUtils";
import { TimelineHeader } from "./GanttChart/TimelineHeader";
import { stringToColor } from "@/lib/color-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CorsaInfo {
  idCorsa: string;
  idOrigine: string;
  idDestinazione: string;
  orarioInizio: string;
  orarioFine: string;
}

interface Tratta {
  key: string;
  idOrigine: string;
  idDestinazione: string;
  corse: CorsaInfo[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  transitiList: Transito[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function estraiCorse(transiti: Transito[]): CorsaInfo[] {
  const map = new Map<string, Transito[]>();
  for (const t of transiti) {
    if (!map.has(t.idCorsa)) map.set(t.idCorsa, []);
    map.get(t.idCorsa)!.push(t);
  }
  const corse: CorsaInfo[] = [];
  map.forEach((stops, idCorsa) => {
    const sorted = [...stops].sort((a, b) => a.sequenza - b.sequenza);
    const primo = sorted[0];
    const ultimo = sorted[sorted.length - 1];
    const orarioInizio = primo.orarioPartenza ?? primo.orarioArrivo;
    const orarioFine = ultimo.orarioArrivo ?? ultimo.orarioPartenza;
    if (!orarioInizio || !orarioFine || !primo.idPunto || !ultimo.idPunto) return;
    corse.push({ idCorsa, idOrigine: primo.idPunto, idDestinazione: ultimo.idPunto, orarioInizio, orarioFine });
  });
  return corse;
}

// ---------------------------------------------------------------------------
// Corsa block
// ---------------------------------------------------------------------------

function CorsaBlock({ corsa }: { corsa: CorsaInfo }) {
  const left = getPercentageOfDay(corsa.orarioInizio);
  const width = getDurationPercentage(corsa.orarioInizio, corsa.orarioFine);
  const colorOrig = stringToColor(corsa.idOrigine);
  const colorDest = stringToColor(corsa.idDestinazione);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute top-1 bottom-1 rounded shadow-sm cursor-default overflow-hidden flex flex-col justify-center"
            style={{
              left: `${left}%`,
              width: `${width}%`,
              background: `linear-gradient(to right, ${colorOrig} 0%, ${colorOrig} 50%, ${colorDest} 50%, ${colorDest} 100%)`,
              minWidth: "4px",
            }}
            data-testid={`transit-corsa-${corsa.idCorsa}`}
          >
            <div className="px-1 text-[9px] font-bold text-white drop-shadow truncate leading-tight">
              {corsa.idCorsa}
            </div>
            <div className="px-1 text-[8px] text-white/80 drop-shadow truncate leading-tight font-mono">
              {formatTime(corsa.orarioInizio)}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-foreground text-background text-xs">
          <div className="font-semibold">Corsa {corsa.idCorsa}</div>
          <div>{corsa.idOrigine} → {corsa.idDestinazione}</div>
          <div className="font-mono mt-0.5">{formatTime(corsa.orarioInizio)} → {formatTime(corsa.orarioFine)}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Tratta row
// ---------------------------------------------------------------------------

const LABEL_WIDTH = 192; // px — must stay in sync with the CSS below

function TrattaRow({ tratta }: { tratta: Tratta }) {
  return (
    <div className="flex items-stretch border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
      {/* Label */}
      <div
        className="shrink-0 flex flex-col justify-center px-3 py-1 gap-0.5 border-r border-border bg-card"
        style={{ width: LABEL_WIDTH }}
      >
        <div className="text-xs font-semibold text-foreground truncate leading-tight">
          {tratta.idOrigine}
        </div>
        <div className="flex items-center gap-1">
          <div className="h-px flex-1 bg-muted-foreground/40" />
          <span className="text-[9px] text-muted-foreground">→</span>
          <div className="h-px flex-1 bg-muted-foreground/40" />
        </div>
        <div className="text-xs font-semibold text-foreground truncate leading-tight">
          {tratta.idDestinazione}
        </div>
        <Badge variant="secondary" className="self-start text-[9px] px-1 py-0 h-4 mt-0.5">
          {tratta.corse.length} cors{tratta.corse.length === 1 ? "a" : "e"}
        </Badge>
      </div>

      {/* Timeline */}
      <div className="relative flex-1 h-14">
        {tratta.corse.map(corsa => (
          <CorsaBlock key={corsa.idCorsa} corsa={corsa} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------

export function TransitiViewerDialog({ open, onOpenChange, transitiList }: Props) {
  const tratte = useMemo<Tratta[]>(() => {
    const corse = estraiCorse(transitiList);
    const map = new Map<string, Tratta>();

    for (const c of corse) {
      const key = `${c.idOrigine}|||${c.idDestinazione}`;
      if (!map.has(key)) {
        map.set(key, { key, idOrigine: c.idOrigine, idDestinazione: c.idDestinazione, corse: [] });
      }
      map.get(key)!.corse.push(c);
    }

    // Sort corse within each tratta by departure time
    map.forEach(tratta => {
      tratta.corse.sort((a, b) => new Date(a.orarioInizio).getTime() - new Date(b.orarioInizio).getTime());
    });

    // Sort tratte: by idOrigine then idDestinazione
    return Array.from(map.values()).sort((a, b) => {
      const orig = a.idOrigine.localeCompare(b.idOrigine);
      if (orig !== 0) return orig;
      return a.idDestinazione.localeCompare(b.idDestinazione);
    });
  }, [transitiList]);

  const totalCorse = useMemo(() => tratte.reduce((sum, t) => sum + t.corse.length, 0), [tratte]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 shrink-0 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Train className="w-4 h-4 text-violet-500" />
            Transiti importati
          </DialogTitle>
          <DialogDescription>
            {tratte.length > 0
              ? `${tratte.length} tratte · ${totalCorse} corse totali`
              : "Nessun transito caricato."}
          </DialogDescription>
        </DialogHeader>

        {tratte.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12 text-muted-foreground text-sm">
            Importa i transiti per visualizzare le corse per tratta.
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 flex bg-card border-b border-border shadow-sm">
              <div className="shrink-0 border-r border-border bg-card" style={{ width: LABEL_WIDTH }} />
              <div className="flex-1">
                <TimelineHeader />
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {tratte.map(tratta => (
                <TrattaRow key={tratta.key} tratta={tratta} />
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
