import type { Attivita, Transito } from "@shared/schema";

export interface CorsaInfo {
  idCorsa: string;
  idOrigine: string;
  idDestinazione: string;
  orarioPartenza: string;
  orarioArrivo: string;
}

export interface NastroSuggestionBridge {
  idCorsa: string;
  idOrigine: string;
  idDestinazione: string;
  orarioInizio: string;
  orarioFine: string;
}

export interface NastroSuggestionTA {
  idOrigine: string;
  idDestinazione: string;
  orarioInizio: string;
  orarioFine: string;
}

export interface NastroSuggestion {
  nastroId: string;
  spostamentoPre?: NastroSuggestionBridge;
  spostamentoPost?: NastroSuggestionBridge;
  newDurationMins: number;
  deleteIds: number[];
  newLeadingTA?: NastroSuggestionTA;
  newTrailingTA?: NastroSuggestionTA;
}

function isoToMinutes(iso: string): number {
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
}

function normalizeToDate(transitoIso: string, referenceIso: string): string {
  if (!transitoIso || transitoIso.length < 11) return transitoIso;
  const refDate = new Date(referenceIso);
  const yyyy = refDate.getUTCFullYear();
  const mm = String(refDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(refDate.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${transitoIso.slice(11)}`;
}

function findBridge(
  transitiByCorsa: Map<string, Transito[]>,
  fromLoc: string,
  toLoc: string,
  minDepMins: number,
  maxArrMins: number,
  refIso: string,
): NastroSuggestionBridge | null {
  for (const [idCorsa, stops] of Array.from(transitiByCorsa.entries())) {
    const sorted = [...stops].sort((a, b) => a.sequenza - b.sequenza);

    const fromIdx = sorted.findIndex(s => s.idPunto === fromLoc && s.orarioPartenza);
    if (fromIdx === -1) continue;

    const fromStop = sorted[fromIdx];
    const depMins = isoToMinutes(fromStop.orarioPartenza!);
    if (depMins < minDepMins) continue;

    const toStop = sorted.slice(fromIdx + 1).find(s => s.idPunto === toLoc && s.orarioArrivo);
    if (!toStop) continue;

    const arrMins = isoToMinutes(toStop.orarioArrivo!);
    if (arrMins > maxArrMins) continue;

    return {
      idCorsa,
      idOrigine: fromLoc,
      idDestinazione: toLoc,
      orarioInizio: normalizeToDate(fromStop.orarioPartenza!, refIso),
      orarioFine: normalizeToDate(toStop.orarioArrivo!, refIso),
    };
  }
  return null;
}

export function computeNastroSuggestions(
  corsa: CorsaInfo,
  allNastriMap: Map<string, Attivita[]>,
  transitiByCorsa: Map<string, Transito[]>,
  pausaCorseMins: number,
  pausaSpostamentiMins: number,
  durataMassimaMinutes: number | null,
): NastroSuggestion[] {
  const results: NastroSuggestion[] = [];

  const cStartMins = isoToMinutes(corsa.orarioPartenza);
  const cEndMins = isoToMinutes(corsa.orarioArrivo);
  if (isNaN(cStartMins) || isNaN(cEndMins)) return results;

  for (const [nastroId, activities] of Array.from(allNastriMap.entries())) {
    if (activities.length === 0) continue;

    const sorted = [...activities].sort(
      (a, b) => isoToMinutes(a.orarioInizio) - isoToMinutes(b.orarioInizio),
    );

    const refIso = sorted[0].orarioInizio;

    const normCStart = normalizeToDate(corsa.orarioPartenza, refIso);
    const normCEnd = normalizeToDate(corsa.orarioArrivo, refIso);

    // Identify leading/trailing TAs at boundaries only
    const firstAct = sorted[0];
    const lastAct = sorted[sorted.length - 1];

    const leadingTA =
      firstAct.tipoAttivita.toLowerCase() === "tempo accessorio" ? firstAct : null;
    const trailingTA =
      sorted.length > 1 && lastAct.tipoAttivita.toLowerCase() === "tempo accessorio"
        ? lastAct
        : null;

    // Core activities: everything except leading/trailing TAs
    const coreStart = leadingTA ? 1 : 0;
    const coreEnd = trailingTA ? sorted.length - 1 : sorted.length;
    const coreActs = sorted.slice(coreStart, coreEnd);

    if (coreActs.length === 0) continue;

    // Check time overlap with any core activity
    const hasOverlap = coreActs.some(a => {
      const aStart = isoToMinutes(a.orarioInizio);
      const aEnd = isoToMinutes(a.orarioFine);
      return aStart < cEndMins && aEnd > cStartMins;
    });
    if (hasOverlap) continue;

    // Find prevAct: last core activity ending <= cStartMins
    const prevAct =
      [...coreActs].reverse().find(a => isoToMinutes(a.orarioFine) <= cStartMins) ?? null;

    // Find nextAct: first core activity starting >= cEndMins
    const nextAct = coreActs.find(a => isoToMinutes(a.orarioInizio) >= cEndMins) ?? null;

    // --- Bridge before C ---
    let spostamentoPre: NastroSuggestionBridge | undefined;
    if (prevAct) {
      const prevEndMins = isoToMinutes(prevAct.orarioFine);
      if (prevAct.idDestinazione === corsa.idOrigine) {
        if (cStartMins - prevEndMins < pausaCorseMins) continue;
      } else {
        const minDep = prevEndMins + pausaSpostamentiMins;
        const maxArr = cStartMins - pausaCorseMins;
        if (minDep >= maxArr) continue;
        const bridge = findBridge(
          transitiByCorsa,
          prevAct.idDestinazione,
          corsa.idOrigine,
          minDep,
          maxArr,
          refIso,
        );
        if (!bridge) continue;
        spostamentoPre = bridge;
      }
    }

    // --- Bridge after C ---
    let spostamentoPost: NastroSuggestionBridge | undefined;
    if (nextAct) {
      const nextStartMins = isoToMinutes(nextAct.orarioInizio);
      if (corsa.idDestinazione === nextAct.idOrigine) {
        if (nextStartMins - cEndMins < pausaCorseMins) continue;
      } else {
        const minDep = cEndMins + pausaCorseMins;
        const maxArr = nextStartMins - pausaSpostamentiMins;
        if (minDep >= maxArr) continue;
        const bridge = findBridge(
          transitiByCorsa,
          corsa.idDestinazione,
          nextAct.idOrigine,
          minDep,
          maxArr,
          refIso,
        );
        if (!bridge) continue;
        spostamentoPost = bridge;
      }
    }

    // Effective start/end of the block we're inserting (in minutes for TA check, ISO for TA rebuild)
    const normActStart = spostamentoPre ? spostamentoPre.orarioInizio : normCStart;
    const normActEnd = spostamentoPost ? spostamentoPost.orarioFine : normCEnd;
    const newActStartMins = spostamentoPre
      ? isoToMinutes(spostamentoPre.orarioInizio)
      : cStartMins;
    const newActEndMins = spostamentoPost
      ? isoToMinutes(spostamentoPost.orarioFine)
      : cEndMins;

    // --- Leading TA handling ---
    const deleteIds: number[] = [];
    let newLeadingTA: NastroSuggestionTA | undefined;
    let newTrailingTA: NastroSuggestionTA | undefined;

    if (leadingTA) {
      const ltaEndMins = isoToMinutes(leadingTA.orarioFine);
      if (newActStartMins < ltaEndMins) {
        deleteIds.push(leadingTA.id);
        const ltaDurMs =
          new Date(leadingTA.orarioFine).getTime() - new Date(leadingTA.orarioInizio).getTime();
        const taLoc = spostamentoPre ? spostamentoPre.idOrigine : corsa.idOrigine;
        const normActStartMs = new Date(normActStart).getTime();
        newLeadingTA = {
          idOrigine: taLoc,
          idDestinazione: taLoc,
          orarioInizio: new Date(normActStartMs - ltaDurMs).toISOString(),
          orarioFine: normActStart,
        };
      }
    }

    // --- Trailing TA handling ---
    if (trailingTA) {
      const ttaStartMins = isoToMinutes(trailingTA.orarioInizio);
      if (newActEndMins >= ttaStartMins) {
        deleteIds.push(trailingTA.id);
        const ttaDurMs =
          new Date(trailingTA.orarioFine).getTime() - new Date(trailingTA.orarioInizio).getTime();
        const taLoc = spostamentoPost ? spostamentoPost.idDestinazione : corsa.idDestinazione;
        const normActEndMs = new Date(normActEnd).getTime();
        newTrailingTA = {
          idOrigine: taLoc,
          idDestinazione: taLoc,
          orarioInizio: normActEnd,
          orarioFine: new Date(normActEndMs + ttaDurMs).toISOString(),
        };
      }
    }

    // --- Compute new nastro duration ---
    const remainingActs = sorted.filter(a => !deleteIds.includes(a.id));
    let nastroStartMs =
      remainingActs.length > 0
        ? Math.min(...remainingActs.map(a => new Date(a.orarioInizio).getTime()))
        : Infinity;
    let nastroEndMs =
      remainingActs.length > 0
        ? Math.max(...remainingActs.map(a => new Date(a.orarioFine).getTime()))
        : -Infinity;

    const normPreStart = spostamentoPre
      ? new Date(spostamentoPre.orarioInizio).getTime()
      : new Date(normCStart).getTime();
    const normPostEnd = spostamentoPost
      ? new Date(spostamentoPost.orarioFine).getTime()
      : new Date(normCEnd).getTime();

    nastroStartMs = Math.min(nastroStartMs, normPreStart);
    nastroEndMs = Math.max(nastroEndMs, normPostEnd);

    if (newLeadingTA)
      nastroStartMs = Math.min(nastroStartMs, new Date(newLeadingTA.orarioInizio).getTime());
    if (newTrailingTA)
      nastroEndMs = Math.max(nastroEndMs, new Date(newTrailingTA.orarioFine).getTime());

    const newDurationMins = (nastroEndMs - nastroStartMs) / 60000;

    if (durataMassimaMinutes !== null && newDurationMins > durataMassimaMinutes) continue;

    results.push({
      nastroId,
      spostamentoPre,
      spostamentoPost,
      newDurationMins,
      deleteIds,
      newLeadingTA,
      newTrailingTA,
    });
  }

  return results.sort((a, b) => a.newDurationMins - b.newDurationMins);
}
