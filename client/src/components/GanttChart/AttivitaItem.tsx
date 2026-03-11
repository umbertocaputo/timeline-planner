import { useDraggable } from "@dnd-kit/core";
import { type Attivita } from "@shared/schema";
import { getPercentageOfDay, getDurationPercentage, formatTime } from "./TimeUtils";
import { stringToColor } from "@/lib/color-utils";
import { X } from "lucide-react";
import { useDeleteAttivita } from "@/hooks/use-attivita";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AttivitaItemProps {
  attivita: Attivita;
}

export function AttivitaItem({ attivita }: AttivitaItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `attivita-${attivita.id}`,
    data: { type: "attivita", attivita },
  });

  const { mutate: deleteAttivita } = useDeleteAttivita();

  const left = getPercentageOfDay(attivita.orarioInizio);
  const width = getDurationPercentage(attivita.orarioInizio, attivita.orarioFine);

  const colorOrig = stringToColor(attivita.idOrigine);
  const colorDest = stringToColor(attivita.idDestinazione);

  const isTempoAccessorio = attivita.tipoAttivita.toLowerCase() === "tempo accessorio";
  const isBridgeCorsa = attivita.isBridgeCorsa === true || attivita.tipoAttivita.toLowerCase() === "corsa ponte";
  const isSpostamento = attivita.tipoAttivita.toLowerCase() === "corsa di spostamento";

  const style: React.CSSProperties = {
    left: `${left}%`,
    width: `${width}%`,
    background: isBridgeCorsa
      ? "#fef08a"  // yellow-200 solid for bridge corsa
      : isSpostamento
        ? "repeating-linear-gradient(45deg, #7c3aed 0px, #7c3aed 6px, #a78bfa 6px, #a78bfa 12px)"  // purple diagonal stripes
        : `linear-gradient(to right, ${colorOrig} 0%, ${colorOrig} 50%, ${colorDest} 50%, ${colorDest} 100%)`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            style={style}
            className={`
              absolute top-1 bottom-1 rounded-md shadow-sm group
              flex flex-col justify-center overflow-hidden
              transition-shadow duration-200 cursor-grab active:cursor-grabbing
              ${isTempoAccessorio ? "border-2 border-black dark:border-white" : ""}
              ${isBridgeCorsa ? "border-2 border-red-600 shadow-md" : ""}
              ${isSpostamento ? "border-2 border-violet-700 shadow-md" : ""}
              ${isDragging ? "shadow-xl ring-2 ring-primary/50 opacity-90" : "hover:shadow-md hover:ring-1 hover:ring-border"}
            `}
            {...attributes}
            {...listeners}
            data-testid={`activity-item-${attivita.id}`}
          >
            <div className={`px-2 py-0.5 w-full truncate text-[10px] font-medium flex items-center justify-between gap-1
              ${isBridgeCorsa ? "text-red-700" : isSpostamento ? "text-white drop-shadow-lg" : "text-white drop-shadow-md"}
            `}>
              <span className="truncate">{isBridgeCorsa ? "corsa ponte" : isSpostamento ? "spostamento" : attivita.tipoAttivita}</span>
              {attivita.idCorsa && (
                <span className="truncate font-bold shrink-0">{attivita.idCorsa}</span>
              )}
            </div>
            <div className={`px-2 pb-0.5 w-full truncate text-[9px] font-mono flex justify-between
              ${isBridgeCorsa ? "text-red-600" : "text-white/90 drop-shadow-md"}
            `}>
              <span>{formatTime(attivita.orarioInizio)}</span>
              <span>{formatTime(attivita.orarioFine)}</span>
            </div>

            {/* Delete button on hover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteAttivita(attivita.id);
              }}
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-20 cursor-pointer"
              data-testid={`button-delete-activity-${attivita.id}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-foreground text-background">
          <div className="text-sm font-medium">
            {isBridgeCorsa ? "Corsa Ponte" : isSpostamento ? "Corsa di Spostamento" : attivita.tipoAttivita}
            {attivita.idCorsa && (
              <div className="text-xs mt-1">
                Corsa: <span className="font-semibold">{attivita.idCorsa}</span>
              </div>
            )}
            {isBridgeCorsa && (
              <div className="text-xs mt-1 text-yellow-300">Corsa di raccordo tra nastri</div>
            )}
            {isSpostamento && (
              <div className="text-xs mt-1 text-violet-300">Corsa di spostamento inserita</div>
            )}
          </div>
          <div className="text-xs mt-1">
            {formatTime(attivita.orarioInizio)} → {formatTime(attivita.orarioFine)}
            {" "}
            <span className="opacity-70">
              ({(() => {
                const diffMins = Math.round(
                  (new Date(attivita.orarioFine).getTime() - new Date(attivita.orarioInizio).getTime()) / 60000
                );
                const h = Math.floor(diffMins / 60);
                const m = diffMins % 60;
                return h > 0 ? `${h}h ${m}m` : `${m}m`;
              })()})
            </span>
          </div>
          <div className="text-xs mt-1">
            {attivita.idOrigine} → {attivita.idDestinazione}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
