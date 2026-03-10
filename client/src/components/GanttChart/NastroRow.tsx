import { useDroppable, useDraggable } from "@dnd-kit/core";
import { type Attivita } from "@shared/schema";
import { AttivitaItem } from "./AttivitaItem";
import { stringToColor } from "@/lib/color-utils";
import { GripVertical } from "lucide-react";

interface NastroRowProps {
  nastroId: string;
  attivitaList: Attivita[];
}

export function NastroRow({ nastroId, attivitaList }: NastroRowProps) {
  // Sort activities chronologically to find true origin and destination
  const sorted = [...attivitaList].sort((a, b) => 
    new Date(a.orarioInizio).getTime() - new Date(b.orarioInizio).getTime()
  );
  
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  // Calculate total duration: difference between end of last activity and start of first
  const calculateDuration = () => {
    if (!first || !last) return "0m";
    const startTime = new Date(first.orarioInizio).getTime();
    const endTime = new Date(last.orarioFine).getTime();
    const diffMs = endTime - startTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const duration = calculateDuration();

  // Droppable area for activities and other nastri
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `nastro-${nastroId}`,
    data: {
      type: "nastro",
      nastroId,
    },
  });

  // Draggable area for merging nastri
  const { 
    attributes, 
    listeners, 
    setNodeRef: setDraggableRef,
    isDragging 
  } = useDraggable({
    id: `drag-nastro-${nastroId}`,
    data: {
      type: "nastro-handle",
      nastroId,
    },
  });

  return (
    <div 
      ref={setDroppableRef}
      className={`
        flex h-16 border-b border-border/50 bg-card transition-colors duration-200
        ${isOver ? 'bg-primary/5 ring-inset ring-2 ring-primary/20' : 'hover:bg-muted/10'}
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      {/* Row Label / Metadata */}
      <div className="w-48 shrink-0 border-r border-border flex items-center px-2 gap-2 relative bg-card z-10 group">
        
        {/* Drag handle for row */}
        <div 
          ref={setDraggableRef} 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-foreground transition-colors p-1 -ml-1 rounded"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm truncate text-foreground" title={nastroId}>
              {nastroId}
            </span>
            <span className="text-xs text-muted-foreground font-mono shrink-0" title="Durata totale nastro">
              {duration}
            </span>
          </div>
          <div className="flex items-center text-[10px] text-muted-foreground gap-1.5 mt-0.5">
            {first && (
              <div className="flex items-center gap-1 shrink-0">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: stringToColor(first.idOrigine) }} 
                />
                <span className="truncate max-w-[50px]">{first.idOrigine}</span>
              </div>
            )}
            <span className="text-border">→</span>
            {last && (
              <div className="flex items-center gap-1 shrink-0">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: stringToColor(last.idDestinazione) }} 
                />
                <span className="truncate max-w-[50px]">{last.idDestinazione}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 relative gantt-pattern">
        {attivitaList.map((att) => (
          <AttivitaItem key={att.id} attivita={att} />
        ))}
      </div>
    </div>
  );
}
