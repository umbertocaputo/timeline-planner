import { useState, useMemo } from "react";
import { 
  DndContext, 
  DragEndEvent, 
  MouseSensor, 
  TouchSensor, 
  useSensor, 
  useSensors 
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { type Attivita } from "@shared/schema";
import { TimelineHeader } from "./TimelineHeader";
import { NastroRow } from "./NastroRow";
import { useUpdateAttivita, useMoveNastro } from "@/hooks/use-attivita";

interface GanttBoardProps {
  attivitaList: Attivita[];
}

export function GanttBoard({ attivitaList }: GanttBoardProps) {
  const { mutate: updateAttivita } = useUpdateAttivita();
  const { mutate: moveNastro } = useMoveNastro();

  // Group activities by Nastro
  const nastri = useMemo(() => {
    const groups = new Map<string, Attivita[]>();
    attivitaList.forEach(att => {
      const existing = groups.get(att.nastroId) || [];
      existing.push(att);
      groups.set(att.nastroId, existing);
    });
    
    // Sort rows alphabetically by Nastro ID
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [attivitaList]);

  // Configure sensors to only drag after moving a bit (prevents firing drag on clicks)
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, 
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    // Case 1: Dragging an Activity onto a Nastro Row
    if (activeData.type === "attivita" && overData.type === "nastro") {
      const attivita = activeData.attivita as Attivita;
      const targetNastroId = overData.nastroId as string;

      if (attivita.nastroId !== targetNastroId) {
        updateAttivita({ 
          id: attivita.id, 
          nastroId: targetNastroId 
        });
      }
    }

    // Case 2: Dragging a Nastro onto another Nastro (Merge)
    if (activeData.type === "nastro-handle" && overData.type === "nastro") {
      const sourceNastroId = activeData.nastroId as string;
      const targetNastroId = overData.nastroId as string;

      if (sourceNastroId !== targetNastroId) {
        if (confirm(`Merge Nastro "${sourceNastroId}" into "${targetNastroId}"?`)) {
          moveNastro({ oldNastroId: sourceNastroId, newNastroId: targetNastroId });
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border shadow-md shadow-black/5 overflow-hidden">
      <DndContext 
        sensors={sensors} 
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="flex-1 overflow-auto custom-scrollbar">
          <div className="min-w-[1000px] h-full flex flex-col">
            <TimelineHeader />
            
            <div className="flex-1 flex flex-col relative">
              {nastri.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">No schedule data</h3>
                  <p className="text-sm max-w-sm text-center">Import an Excel file to visualize and organize your Nastri Lavorativi.</p>
                </div>
              ) : (
                nastri.map(([nastroId, attivita]) => (
                  <NastroRow 
                    key={nastroId} 
                    nastroId={nastroId} 
                    attivitaList={attivita} 
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  );
}
