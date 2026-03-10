import { useDraggable } from "@dnd-kit/core";
import { type Attivita } from "@shared/schema";
import { getPercentageOfDay, getDurationPercentage, formatTime } from "./TimeUtils";
import { stringToColor } from "@/lib/color-utils";
import { X } from "lucide-react";
import { useDeleteAttivita } from "@/hooks/use-attivita";

interface AttivitaItemProps {
  attivita: Attivita;
}

export function AttivitaItem({ attivita }: AttivitaItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `attivita-${attivita.id}`,
    data: {
      type: "attivita",
      attivita,
    },
  });
  
  const { mutate: deleteAttivita } = useDeleteAttivita();

  const left = getPercentageOfDay(attivita.orarioInizio);
  const width = getDurationPercentage(attivita.orarioInizio, attivita.orarioFine);
  
  const colorOrig = stringToColor(attivita.idOrigine);
  const colorDest = stringToColor(attivita.idDestinazione);

  const style = {
    left: `${left}%`,
    width: `${width}%`,
    // Gradient between origin and destination color
    background: `linear-gradient(to right, ${colorOrig}, ${colorDest})`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        absolute top-1 bottom-1 rounded-md shadow-sm group
        flex flex-col justify-center overflow-hidden
        transition-shadow duration-200 cursor-grab active:cursor-grabbing
        ${isDragging ? 'shadow-xl ring-2 ring-primary/50 opacity-90' : 'hover:shadow-md hover:ring-1 hover:ring-border'}
      `}
      {...attributes}
      {...listeners}
    >
      <div className="px-2 py-0.5 w-full truncate text-[10px] font-medium text-white drop-shadow-md">
        {attivita.tipoAttivita}
        {attivita.idCorsa && ` (${attivita.idCorsa})`}
      </div>
      <div className="px-2 pb-0.5 w-full truncate text-[9px] text-white/90 drop-shadow-md font-mono flex justify-between">
        <span>{formatTime(attivita.orarioInizio)}</span>
        <span>{formatTime(attivita.orarioFine)}</span>
      </div>

      {/* Delete button appears on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteAttivita(attivita.id);
        }}
        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-20 cursor-pointer"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
