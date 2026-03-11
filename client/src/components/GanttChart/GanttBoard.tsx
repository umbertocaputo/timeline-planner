import { useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { type Attivita, type Transito } from "@shared/schema";
import { TimelineHeader } from "./TimelineHeader";
import { NastroRow } from "./NastroRow";
import { useMoveAttivita, useMergeNastro } from "@/hooks/use-attivita";

interface GanttBoardProps {
  attivitaList: Attivita[];
  transitiList?: Transito[];
  sortBy?: "name" | "start-time";
  hideSosta?: boolean;
  hideTempoAccessorio?: boolean;
  durataMassima?: string;
  pausaCorse?: string;
  pausaSpostamenti?: string;
}

export function GanttBoard({
  attivitaList,
  transitiList = [],
  sortBy = "name",
  hideSosta = false,
  hideTempoAccessorio = false,
  durataMassima = "",
  pausaCorse = "",
  pausaSpostamenti = "",
}: GanttBoardProps) {
  const { mutate: moveAttivita } = useMoveAttivita();
  const { mutate: mergeNastro } = useMergeNastro();

  // Full unfiltered map for the merge suggester
  const allNastriMap = useMemo(() => {
    const map = new Map<string, Attivita[]>();
    attivitaList.forEach((att) => {
      const existing = map.get(att.nastroId) || [];
      existing.push(att);
      map.set(att.nastroId, existing);
    });
    return map;
  }, [attivitaList]);

  // Group transiti by IDCorsa for bridge-corsa lookup
  const transitiByCorsa = useMemo(() => {
    const map = new Map<string, Transito[]>();
    transitiList.forEach((t) => {
      const existing = map.get(t.idCorsa) || [];
      existing.push(t);
      map.set(t.idCorsa, existing);
    });
    return map;
  }, [transitiList]);

  // Filtered + sorted display groups
  const nastri = useMemo(() => {
    const groups = new Map<string, Attivita[]>();
    attivitaList.forEach((att) => {
      if (hideSosta && att.tipoAttivita.toLowerCase() === "sosta") return;
      if (hideTempoAccessorio && att.tipoAttivita.toLowerCase() === "tempo accessorio") return;
      const existing = groups.get(att.nastroId) || [];
      existing.push(att);
      groups.set(att.nastroId, existing);
    });

    const entries = Array.from(groups.entries());

    if (sortBy === "start-time") {
      entries.sort((a, b) => {
        const aMin = Math.min(...a[1].map((att) => new Date(att.orarioInizio).getTime()));
        const bMin = Math.min(...b[1].map((att) => new Date(att.orarioInizio).getTime()));
        return aMin - bMin;
      });
    } else {
      entries.sort((a, b) => a[0].localeCompare(b[0]));
    }

    return entries.filter(([_, items]) => items.length > 0);
  }, [attivitaList, sortBy, hideSosta, hideTempoAccessorio]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current;
    const overData = over.data.current;
    if (!activeData || !overData) return;

    if (activeData.type === "attivita" && overData.type === "nastro") {
      const att = activeData.attivita as Attivita;
      const targetNastroId = overData.nastroId as string;
      if (att.nastroId !== targetNastroId) {
        moveAttivita({ attivitaId: att.id, fromNastroId: att.nastroId, toNastroId: targetNastroId });
      }
    }

    if (activeData.type === "nastro-handle" && overData.type === "nastro") {
      const nastroA = activeData.nastroId as string;
      const nastroB = overData.nastroId as string;
      if (nastroA === nastroB) return;

      if (confirm(`Merge "${nastroA}" con "${nastroB}"?`)) {
        // Determine temporal order: the nastro whose activities start earlier is the "target" (first)
        const activitiesA = allNastriMap.get(nastroA) || [];
        const activitiesB = allNastriMap.get(nastroB) || [];
        const minStartA = activitiesA.length
          ? Math.min(...activitiesA.map((a) => new Date(a.orarioInizio).getTime()))
          : Infinity;
        const minStartB = activitiesB.length
          ? Math.min(...activitiesB.map((a) => new Date(a.orarioInizio).getTime()))
          : Infinity;
        // Earlier nastro = target (keeps its ID), later nastro = source (merged in, TA stripped from head)
        const [targetId, sourceId] =
          minStartA <= minStartB ? [nastroA, nastroB] : [nastroB, nastroA];
        mergeNastro({ targetNastroId: targetId, sourceNastroId: sourceId });
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border shadow-md shadow-black/5 overflow-hidden">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]}>
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
                  <h3 className="text-lg font-medium text-foreground mb-1">Nessun dato</h3>
                  <p className="text-sm max-w-sm text-center">Importa un file Excel per visualizzare e gestire i Nastri Lavorativi.</p>
                </div>
              ) : (
                nastri.map(([nastroId, attivita]) => (
                  <NastroRow
                    key={nastroId}
                    nastroId={nastroId}
                    attivitaList={attivita}
                    allNastriMap={allNastriMap}
                    transitiByCorsa={transitiByCorsa}
                    durataMassima={durataMassima}
                    pausaCorse={pausaCorse}
                    pausaSpostamenti={pausaSpostamenti}
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
