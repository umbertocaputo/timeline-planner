/**
 * Motore di ottimizzazione nastri lavorativi
 *
 * Algoritmo: Vehicle Scheduling Problem (VSP) ottimale
 * Fase 1 – Bipartite matching massimale via Hopcroft-Karp
 *           → Minimum Path Cover nel DAG di compatibilità
 *           → Considera sia connessioni dirette sia Vettura (passeggero)
 * Fase 2 – Split iterativo delle catene che superano la durata massima
 * Fase 3 – Costruzione nastri con Vettura, soste, tempi accessori
 *           → TA iniziale nella località di partenza consentita
 *           → Vettura (passeggero) dove il driver deve cambiare posizione
 *           → TA finale nella località di arrivo consentita
 *
 * Regole chiave:
 * - Ogni corsa può essere usata UNA SOLA VOLTA come "corsa in linea"
 * - Ogni corsa può essere usata INFINITE VOLTE come "vettura" (passeggero)
 * - Se localitaTermine è non-vuoto, tutti i nastri devono partire E terminare
 *   in una delle località consentite (raggiungibili via Vettura se necessario)
 * - corseIdsScope: se impostato, solo queste corse sono candidati "in linea";
 *   tutte le corse rimangono disponibili come Vettura
 */

export interface CorsaInput {
  idCorsa: string;
  idOrigine: string;
  idDestinazione: string;
  orarioInizio: string; // ISO string
  orarioFine: string;   // ISO string
}

export interface OttimizzazioneParams {
  durataMassimaNastroMinuti: number;          // es. 495 (8h15m)
  durataMinimaNoastroMinuti: number;          // es. 315 (5h15m)
  durataTempoAccessorioInizioMinuti: number;  // es. 30
  durataTempoAccessorioFineMinuti: number;    // es. 20
  durataMinimaSostaMinuti: number;            // es. 5 — gap minimo tra due corse
  data: string;                               // "YYYY-MM-DD" per i timestamp ISO
  deposito: string;                           // località base (es. "Napoli")
  localitaTermine: string[];                  // località in cui un nastro può partire/terminare
  corseIdsScope: string[] | null;             // null = tutte; array = solo queste come "in linea"
}

export interface AttivitaGenerata {
  nastroId: string;
  idOrigine: string;
  idDestinazione: string;
  orarioInizio: string; // ISO string
  orarioFine: string;   // ISO string
  tipoAttivita: string;
  idCorsa: string | null;
  isBridgeCorsa: boolean;
}

export interface NastroGenerato {
  nastroId: string;
  attivita: AttivitaGenerata[];
  corse: string[];        // idCorsa list (solo corse in linea)
  durataMinuti: number;   // durata totale (dalla prima attività all'ultima)
}

export interface OttimizzazioneResult {
  nastri: NastroGenerato[];
  corseAssegnate: number;
  corseNonAssegnate: string[];
  nastriGenerati: number;
  durataMediaMinuti: number;
  durataMinimaMinuti: number;
  durataMassimaMinuti: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDate(iso: string): Date {
  return new Date(iso);
}

function diffMinutes(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 60000;
}

function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60000);
}

function toISO(d: Date): string {
  return d.toISOString();
}

/** Padding nastroId: N + 2-digit index + G0 */
function makeNastroId(index: number): string {
  const padded = String(index).padStart(2, "0");
  return `N${padded}G0`;
}

/**
 * Cerca una Vettura INTERMEDIA (tra due corse consecutive nello stesso nastro).
 * La Vettura deve partire da fromLoc non prima di afterTime+minGap
 * e deve arrivare a toLoc non oltre beforeTime-minGap.
 * Sceglie la PIÙ TARDIVA (minimizza attesa prima della corsa successiva).
 */
function findVettura(
  fromLoc: string,
  toLoc: string,
  afterTime: Date,
  beforeTime: Date,
  allCorse: CorsaInput[],
  minGap: number
): CorsaInput | undefined {
  const candidates = allCorse.filter(c =>
    c.idOrigine === fromLoc &&
    c.idDestinazione === toLoc &&
    toDate(c.orarioInizio) >= addMinutes(afterTime, minGap) &&
    toDate(c.orarioFine) <= addMinutes(beforeTime, -minGap)
  );
  // Prende la più tardiva (arriva più vicino alla corsa successiva)
  return candidates.reduce<CorsaInput | undefined>((best, c) =>
    !best || toDate(c.orarioFine) > toDate(best.orarioFine) ? c : best, undefined
  );
}

/**
 * Cerca la Vettura di INIZIO nastro: da una località consentita all'origine della prima corsa.
 * Sceglie la più TARDIVA (arriva il più vicino possibile alla prima corsa, minimizzando l'overhead).
 * Verifica che il tempo extra non faccia sforare la durata massima.
 */
function findStartVettura(
  localitaOk: Set<string>,
  firstC: CorsaInput,
  chainBaseDuration: number,
  maxDurata: number,
  allCorse: CorsaInput[],
  minGap: number
): CorsaInput | undefined {
  if (localitaOk.size === 0 || localitaOk.has(firstC.idOrigine)) return undefined;

  let best: CorsaInput | undefined;
  for (const loc of localitaOk) {
    if (loc === firstC.idOrigine) continue;
    const candidates = allCorse.filter(c =>
      c.idOrigine === loc &&
      c.idDestinazione === firstC.idOrigine &&
      toDate(c.orarioFine) <= addMinutes(toDate(firstC.orarioInizio), -minGap)
    );
    for (const c of candidates) {
      if (!best || toDate(c.orarioFine) > toDate(best.orarioFine)) {
        best = c;
      }
    }
  }
  if (!best) return undefined;

  // Verifica che l'overhead (dalla partenza della Vettura all'inizio della prima corsa) non sfori la durata max
  const overhead = diffMinutes(toDate(best.orarioInizio), toDate(firstC.orarioInizio));
  return (overhead + chainBaseDuration <= maxDurata) ? best : undefined;
}

/**
 * Cerca la Vettura di FINE nastro: dall'ultima corsa a una località consentita.
 * Sceglie la più PRECOCE (parte il prima possibile dopo l'ultima corsa, minimizzando l'overhead).
 * Verifica che il tempo extra non faccia sforare la durata massima.
 */
function findEndVettura(
  localitaOk: Set<string>,
  lastC: CorsaInput,
  chainBaseDuration: number,
  startOverhead: number,
  maxDurata: number,
  allCorse: CorsaInput[],
  minGap: number
): CorsaInput | undefined {
  if (localitaOk.size === 0 || localitaOk.has(lastC.idDestinazione)) return undefined;

  let best: CorsaInput | undefined;
  for (const loc of localitaOk) {
    if (loc === lastC.idDestinazione) continue;
    const candidates = allCorse.filter(c =>
      c.idOrigine === lastC.idDestinazione &&
      c.idDestinazione === loc &&
      toDate(c.orarioInizio) >= addMinutes(toDate(lastC.orarioFine), minGap)
    );
    for (const c of candidates) {
      if (!best || toDate(c.orarioInizio) < toDate(best.orarioInizio)) {
        best = c;
      }
    }
  }
  if (!best) return undefined;

  // Verifica che l'overhead totale (start + end) non sfori la durata max
  const endOverhead = diffMinutes(toDate(lastC.orarioFine), toDate(best.orarioFine));
  return (startOverhead + endOverhead + chainBaseDuration <= maxDurata) ? best : undefined;
}

// ---------------------------------------------------------------------------
// Fase 1 – Hopcroft-Karp maximum bipartite matching
// ---------------------------------------------------------------------------

function hopcroftKarp(n: number, adj: number[][]): { matchL: number[]; matchR: number[] } {
  const INF = Infinity;
  const matchL = new Array<number>(n).fill(-1);
  const matchR = new Array<number>(n).fill(-1);
  const dist = new Array<number>(n);

  function bfs(): boolean {
    const queue: number[] = [];
    for (let u = 0; u < n; u++) {
      if (matchL[u] === -1) {
        dist[u] = 0;
        queue.push(u);
      } else {
        dist[u] = INF;
      }
    }
    let found = false;
    let qi = 0;
    while (qi < queue.length) {
      const u = queue[qi++];
      for (const v of adj[u]) {
        const w = matchR[v];
        if (w === -1) {
          found = true;
        } else if (dist[w] === INF) {
          dist[w] = dist[u] + 1;
          queue.push(w);
        }
      }
    }
    return found;
  }

  function dfs(u: number): boolean {
    for (const v of adj[u]) {
      const w = matchR[v];
      if (w === -1 || (dist[w] === dist[u] + 1 && dfs(w))) {
        matchL[u] = v;
        matchR[v] = u;
        return true;
      }
    }
    dist[u] = INF;
    return false;
  }

  while (bfs()) {
    for (let u = 0; u < n; u++) {
      if (matchL[u] === -1) dfs(u);
    }
  }

  return { matchL, matchR };
}

function reconstructChains(n: number, matchL: number[]): number[][] {
  const pointed = new Set<number>(matchL.filter(v => v !== -1));
  const chains: number[][] = [];
  const visited = new Set<number>();

  for (let i = 0; i < n; i++) {
    if (!pointed.has(i) && !visited.has(i)) {
      const chain: number[] = [];
      let cur: number = i;
      while (cur !== -1 && !visited.has(cur)) {
        visited.add(cur);
        chain.push(cur);
        cur = matchL[cur];
      }
      chains.push(chain);
    }
  }

  return chains;
}

// ---------------------------------------------------------------------------
// Fase 2 – Split iterativo per vincolo durata massima
// ---------------------------------------------------------------------------

/**
 * Calcola la durata di una catena (in minuti), inclusi tempi accessori.
 * Nota: questa stima non include l'eventuale Vettura di inizio/fine,
 * ma è sufficiente per il controllo del vincolo di durata massima.
 */
function calcolaDurataChain(
  chain: number[],
  corse: CorsaInput[],
  params: OttimizzazioneParams
): number {
  if (chain.length === 0) return 0;
  const prima = corse[chain[0]];
  const ultima = corse[chain[chain.length - 1]];
  const inizioTa = toDate(prima.orarioInizio);
  const fineTa = toDate(ultima.orarioFine);
  return (
    params.durataTempoAccessorioInizioMinuti +
    diffMinutes(inizioTa, fineTa) +
    params.durataTempoAccessorioFineMinuti
  );
}

function splitChain(
  chain: number[],
  corse: CorsaInput[],
  params: OttimizzazioneParams
): number[][] {
  const maxMinuti = params.durataMassimaNastroMinuti;
  const taInizio = params.durataTempoAccessorioInizioMinuti;
  const taFine = params.durataTempoAccessorioFineMinuti;

  const primaCorsa = corse[chain[0]];
  const inizio = toDate(primaCorsa.orarioInizio);

  const minMinuti = params.durataMinimaNoastroMinuti ?? 0;

  let bestSplit = 1;
  let idealSplit = -1;

  for (let k = 1; k < chain.length; k++) {
    const ultimaFirst = corse[chain[k - 1]];
    const durataFirst =
      taInizio +
      diffMinutes(inizio, toDate(ultimaFirst.orarioFine)) +
      taFine;
    if (durataFirst > maxMinuti) break;

    bestSplit = k;

    if (minMinuti > 0 && durataFirst >= minMinuti) {
      const secondPart = chain.slice(k);
      const durataSecond = calcolaDurataChain(secondPart, corse, params);
      if (durataSecond >= minMinuti) {
        idealSplit = k;
      }
    }
  }

  const splitAt = idealSplit !== -1 ? idealSplit : bestSplit;
  return [chain.slice(0, splitAt), chain.slice(splitAt)];
}

function splitPerDurata(
  chains: number[][],
  corse: CorsaInput[],
  params: OttimizzazioneParams
): number[][] {
  const result: number[][] = [];
  const queue = [...chains];

  while (queue.length > 0) {
    const chain = queue.shift()!;
    if (chain.length === 0) continue;

    const durata = calcolaDurataChain(chain, corse, params);
    if (durata <= params.durataMassimaNastroMinuti || chain.length === 1) {
      // I singleton che superano la durata entrano comunque come nastri:
      // la corsa deve essere assegnata anche se troppo lunga da sola.
      result.push(chain);
    } else {
      const [a, b] = splitChain(chain, corse, params);
      if (b.length > 0) {
        queue.push(a);
        queue.push(b);
      } else {
        result.push(a);
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Fase 3 – Costruzione nastri con Vettura e tempi accessori
// ---------------------------------------------------------------------------

/**
 * Costruisce le attività di un nastro a partire da una catena di indici.
 *
 * Gestisce:
 * 1. TA iniziale nella località di partenza consentita (con eventuale Vettura)
 * 2. Corse in linea + soste dirette
 * 3. Vettura intermedia quando due corse consecutive sono in localities diverse
 * 4. Eventuale Vettura finale + TA nella località di fine consentita
 */
function buildNastroFromChain(
  chain: number[],
  corseLinea: CorsaInput[],
  corseAll: CorsaInput[],
  params: OttimizzazioneParams,
  nastroId: string
): { attivita: AttivitaGenerata[]; durataMinuti: number } {
  const localitaOk = new Set<string>(params.localitaTermine ?? []);
  if (params.deposito) localitaOk.add(params.deposito);

  const firstC = corseLinea[chain[0]];
  const lastC = corseLinea[chain[chain.length - 1]];
  const attivita: AttivitaGenerata[] = [];

  // Durata base della catena (senza overhead Vettura inizio/fine): usata per il guard di durata
  const chainBaseDuration =
    params.durataTempoAccessorioInizioMinuti +
    diffMinutes(toDate(firstC.orarioInizio), toDate(lastC.orarioFine)) +
    params.durataTempoAccessorioFineMinuti;

  // ── 1. TA iniziale + eventuale Vettura di posizionamento ─────────────────
  // findStartVettura sceglie la Vettura più tardiva (minimo overhead) e verifica che
  // il nastro risultante non superi la durata massima.
  const startVettura = findStartVettura(
    localitaOk, firstC, chainBaseDuration,
    params.durataMassimaNastroMinuti, corseAll, params.durataMinimaSostaMinuti
  );

  if (startVettura) {
    // TA prima della Vettura iniziale (alla località di partenza)
    const taStart = addMinutes(toDate(startVettura.orarioInizio), -params.durataTempoAccessorioInizioMinuti);
    attivita.push({
      nastroId, idOrigine: startVettura.idOrigine, idDestinazione: startVettura.idOrigine,
      orarioInizio: toISO(taStart), orarioFine: startVettura.orarioInizio,
      tipoAttivita: "tempo accessorio", idCorsa: null, isBridgeCorsa: false,
    });
    // Vettura iniziale (passeggero = spostamento)
    attivita.push({
      nastroId, idOrigine: startVettura.idOrigine, idDestinazione: startVettura.idDestinazione,
      orarioInizio: startVettura.orarioInizio, orarioFine: startVettura.orarioFine,
      tipoAttivita: "corsa di spostamento", idCorsa: startVettura.idCorsa, isBridgeCorsa: false,
    });
    // Sosta tra Vettura e prima corsa (se c'è gap)
    const gap = diffMinutes(toDate(startVettura.orarioFine), toDate(firstC.orarioInizio));
    if (gap > 0) {
      attivita.push({
        nastroId, idOrigine: startVettura.idDestinazione, idDestinazione: startVettura.idDestinazione,
        orarioInizio: startVettura.orarioFine, orarioFine: firstC.orarioInizio,
        tipoAttivita: "sosta", idCorsa: null, isBridgeCorsa: false,
      });
    }
  } else {
    // TA direttamente prima della prima corsa
    const taStart = addMinutes(toDate(firstC.orarioInizio), -params.durataTempoAccessorioInizioMinuti);
    attivita.push({
      nastroId, idOrigine: firstC.idOrigine, idDestinazione: firstC.idOrigine,
      orarioInizio: toISO(taStart), orarioFine: firstC.orarioInizio,
      tipoAttivita: "tempo accessorio", idCorsa: null, isBridgeCorsa: false,
    });
  }

  // ── 2. Corse in linea + soste + vetture intermedie ───────────────────────
  for (let k = 0; k < chain.length; k++) {
    const c = corseLinea[chain[k]];
    attivita.push({
      nastroId, idOrigine: c.idOrigine, idDestinazione: c.idDestinazione,
      orarioInizio: c.orarioInizio, orarioFine: c.orarioFine,
      tipoAttivita: "corsa in linea", idCorsa: c.idCorsa, isBridgeCorsa: false,
    });

    if (k < chain.length - 1) {
      const next = corseLinea[chain[k + 1]];

      if (c.idDestinazione === next.idOrigine) {
        // Connessione diretta: sosta se c'è gap
        const gap = diffMinutes(toDate(c.orarioFine), toDate(next.orarioInizio));
        if (gap > 0) {
          attivita.push({
            nastroId, idOrigine: c.idDestinazione, idDestinazione: next.idOrigine,
            orarioInizio: c.orarioFine, orarioFine: next.orarioInizio,
            tipoAttivita: "sosta", idCorsa: null, isBridgeCorsa: false,
          });
        }
      } else {
        // Serve Vettura intermedia (passeggero da c.dest a next.origin)
        const v = findVettura(
          c.idDestinazione, next.idOrigine,
          toDate(c.orarioFine), toDate(next.orarioInizio),
          corseAll, params.durataMinimaSostaMinuti
        );
        if (v) {
          const gapBefore = diffMinutes(toDate(c.orarioFine), toDate(v.orarioInizio));
          if (gapBefore > 0) {
            attivita.push({
              nastroId, idOrigine: c.idDestinazione, idDestinazione: c.idDestinazione,
              orarioInizio: c.orarioFine, orarioFine: v.orarioInizio,
              tipoAttivita: "sosta", idCorsa: null, isBridgeCorsa: false,
            });
          }
          attivita.push({
            nastroId, idOrigine: v.idOrigine, idDestinazione: v.idDestinazione,
            orarioInizio: v.orarioInizio, orarioFine: v.orarioFine,
            tipoAttivita: "corsa di spostamento", idCorsa: v.idCorsa, isBridgeCorsa: false,
          });
          const gapAfter = diffMinutes(toDate(v.orarioFine), toDate(next.orarioInizio));
          if (gapAfter > 0) {
            attivita.push({
              nastroId, idOrigine: v.idDestinazione, idDestinazione: next.idOrigine,
              orarioInizio: v.orarioFine, orarioFine: next.orarioInizio,
              tipoAttivita: "sosta", idCorsa: null, isBridgeCorsa: false,
            });
          }
        } else {
          // Nessuna Vettura trovata: sosta generica (gap già nel timespan)
          const gap = diffMinutes(toDate(c.orarioFine), toDate(next.orarioInizio));
          if (gap > 0) {
            attivita.push({
              nastroId, idOrigine: c.idDestinazione, idDestinazione: next.idOrigine,
              orarioInizio: c.orarioFine, orarioFine: next.orarioInizio,
              tipoAttivita: "sosta", idCorsa: null, isBridgeCorsa: false,
            });
          }
        }
      }
    }
  }

  // ── 3. Eventuale Vettura finale + TA nella località consentita ───────────
  // findEndVettura sceglie la Vettura più precoce (minimo overhead) e verifica che
  // il nastro risultante non superi la durata massima, considerando anche l'overhead iniziale.
  const startOverhead = startVettura
    ? diffMinutes(toDate(startVettura.orarioInizio), toDate(firstC.orarioInizio))
    : 0;
  const endVettura = findEndVettura(
    localitaOk, lastC, chainBaseDuration, startOverhead,
    params.durataMassimaNastroMinuti, corseAll, params.durataMinimaSostaMinuti
  );

  if (endVettura) {
    const gap = diffMinutes(toDate(lastC.orarioFine), toDate(endVettura.orarioInizio));
    if (gap > 0) {
      attivita.push({
        nastroId, idOrigine: lastC.idDestinazione, idDestinazione: lastC.idDestinazione,
        orarioInizio: lastC.orarioFine, orarioFine: endVettura.orarioInizio,
        tipoAttivita: "sosta", idCorsa: null, isBridgeCorsa: false,
      });
    }
    attivita.push({
      nastroId, idOrigine: endVettura.idOrigine, idDestinazione: endVettura.idDestinazione,
      orarioInizio: endVettura.orarioInizio, orarioFine: endVettura.orarioFine,
      tipoAttivita: "corsa di spostamento", idCorsa: endVettura.idCorsa, isBridgeCorsa: false,
    });
    const taFine = addMinutes(toDate(endVettura.orarioFine), params.durataTempoAccessorioFineMinuti);
    attivita.push({
      nastroId, idOrigine: endVettura.idDestinazione, idDestinazione: endVettura.idDestinazione,
      orarioInizio: endVettura.orarioFine, orarioFine: toISO(taFine),
      tipoAttivita: "tempo accessorio", idCorsa: null, isBridgeCorsa: false,
    });
  } else {
    const taFine = addMinutes(toDate(lastC.orarioFine), params.durataTempoAccessorioFineMinuti);
    attivita.push({
      nastroId, idOrigine: lastC.idDestinazione, idDestinazione: lastC.idDestinazione,
      orarioInizio: lastC.orarioFine, orarioFine: toISO(taFine),
      tipoAttivita: "tempo accessorio", idCorsa: null, isBridgeCorsa: false,
    });
  }

  const durataMinuti = Math.round(
    diffMinutes(toDate(attivita[0].orarioInizio), toDate(attivita[attivita.length - 1].orarioFine))
  );

  return { attivita, durataMinuti };
}

// ---------------------------------------------------------------------------
// Entry point principale
// ---------------------------------------------------------------------------

export function ottimizza(
  corseInput: CorsaInput[],
  params: OttimizzazioneParams
): OttimizzazioneResult {
  if (corseInput.length === 0) {
    return {
      nastri: [], corseAssegnate: 0, corseNonAssegnate: [],
      nastriGenerati: 0, durataMediaMinuti: 0, durataMinimaMinuti: 0, durataMassimaMinuti: 0,
    };
  }

  // corseAll: tutte le corse (disponibili sia come "in linea" sia come Vettura)
  const corseAll = [...corseInput].sort(
    (a, b) => new Date(a.orarioInizio).getTime() - new Date(b.orarioInizio).getTime()
  );

  // corseLinea: le corse candidate a "corsa in linea" (possibilmente filtrate per scope)
  const corseLinea = params.corseIdsScope
    ? corseAll.filter(c => params.corseIdsScope!.includes(c.idCorsa))
    : corseAll;

  const n = corseLinea.length;
  if (n === 0) {
    return {
      nastri: [], corseAssegnate: 0, corseNonAssegnate: corseAll.map(c => c.idCorsa),
      nastriGenerati: 0, durataMediaMinuti: 0, durataMinimaMinuti: 0, durataMassimaMinuti: 0,
    };
  }

  // ── Fase 1: grafo di compatibilità con Vettura ────────────────────────────
  // Un arco i→j esiste se j può seguire i nella stessa catena, direttamente
  // o attraverso uno spostamento (il driver viaggia come passeggero su corseAll).
  //
  // Regole gap:
  //  - Connessione DIRETTA (stessa fermata): gap ≥ 0 (j inizia dopo la fine di i)
  //  - Connessione via SPOSTAMENTO: gap ≥ durataMinimaSostaMinuti su OGNI lato dello spostamento
  //
  // Pruning di durata: se TA_inizio+(j.fine–i.inizio)+TA_fine > maxDurata, i e j
  // non potranno MAI coesistere nello stesso nastro → arco escluso.
  const taTotal = params.durataTempoAccessorioInizioMinuti + params.durataTempoAccessorioFineMinuti;
  const adj: number[][] = Array.from({ length: n }, () => []);

  for (let i = 0; i < n; i++) {
    const ci = corseLinea[i];
    const fineI = toDate(ci.orarioFine);

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const cj = corseLinea[j];
      const inizioJ = toDate(cj.orarioInizio);

      // j deve iniziare alla fine di i o dopo (gap ≥ 0)
      if (inizioJ < fineI) continue;

      // Pruning di durata: se anche solo i e j insieme (senza altri) sforerebbero maxDurata, skip
      const spanIJ = diffMinutes(toDate(ci.orarioInizio), toDate(cj.orarioFine));
      if (spanIJ + taTotal > params.durataMassimaNastroMinuti) continue;

      if (ci.idDestinazione === cj.idOrigine) {
        // Connessione DIRETTA: nessun gap minimo richiesto (driver è già in loco)
        adj[i].push(j);
      } else {
        // Connessione via SPOSTAMENTO: serve gap minimo su entrambi i lati
        if (diffMinutes(fineI, inizioJ) < params.durataMinimaSostaMinuti) continue;
        const v = findVettura(
          ci.idDestinazione,
          cj.idOrigine,
          fineI,
          inizioJ,
          corseAll,
          params.durataMinimaSostaMinuti
        );
        if (v) adj[i].push(j);
      }
    }
  }

  // Hopcroft-Karp → matching massimale → numero minimo di catene
  const { matchL } = hopcroftKarp(n, adj);
  const chains = reconstructChains(n, matchL);

  // ── Fase 2: split per durata massima ─────────────────────────────────────
  const validChains = splitPerDurata(chains, corseLinea, params);

  // ── Fase 3: costruzione nastri ────────────────────────────────────────────
  const nastri: NastroGenerato[] = [];
  const corseAssegnate = new Set<string>();

  validChains.forEach((chain, idx) => {
    const nastroId = makeNastroId(idx + 1);
    const { attivita, durataMinuti } = buildNastroFromChain(chain, corseLinea, corseAll, params, nastroId);
    const corseDiQuestoNastro = chain.map(i => corseLinea[i].idCorsa);
    corseDiQuestoNastro.forEach(c => corseAssegnate.add(c));
    nastri.push({ nastroId, attivita, corse: corseDiQuestoNastro, durataMinuti });
  });

  const corseNonAssegnate = corseLinea
    .filter(c => !corseAssegnate.has(c.idCorsa))
    .map(c => c.idCorsa);

  // ── Fase 4: ordinamento finale ────────────────────────────────────────────
  const localitaOk = new Set<string>(params.localitaTermine ?? []);
  if (params.deposito) localitaOk.add(params.deposito);

  const endLocationOf = (n: NastroGenerato): string | undefined =>
    [...n.attivita].reverse()
      .find(a => a.tipoAttivita === "tempo accessorio")
      ?.idDestinazione;

  const rinumera = (arr: NastroGenerato[]) => {
    arr.forEach((n, i) => {
      const newId = makeNastroId(i + 1);
      n.attivita.forEach(a => { a.nastroId = newId; });
      n.nastroId = newId;
    });
  };

  if (params.deposito) {
    nastri.sort((a, b) => {
      const aFuori = endLocationOf(a) !== params.deposito ? 1 : 0;
      const bFuori = endLocationOf(b) !== params.deposito ? 1 : 0;
      if (aFuori !== bFuori) return aFuori - bFuori;
      return toDate(a.attivita[0]?.orarioInizio ?? "").getTime() -
             toDate(b.attivita[0]?.orarioInizio ?? "").getTime();
    });
    rinumera(nastri);
  }

  const durate = nastri.map(n => n.durataMinuti);
  const durataMedia = durate.length > 0 ? durate.reduce((a, b) => a + b, 0) / durate.length : 0;
  const durataMin = durate.length > 0 ? Math.min(...durate) : 0;
  const durataMax = durate.length > 0 ? Math.max(...durate) : 0;

  return {
    nastri,
    corseAssegnate: corseAssegnate.size,
    corseNonAssegnate,
    nastriGenerati: nastri.length,
    durataMediaMinuti: Math.round(durataMedia),
    durataMinimaMinuti: Math.round(durataMin),
    durataMassimaMinuti: Math.round(durataMax),
  };
}
