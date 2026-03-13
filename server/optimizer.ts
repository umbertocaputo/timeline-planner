/**
 * Motore di ottimizzazione nastri lavorativi
 *
 * Algoritmo: Vehicle Scheduling Problem (VSP) ottimale
 * Fase 1 – Bipartite matching massimale via Hopcroft-Karp
 *           → Minimum Path Cover nel DAG di compatibilità
 *           → Numero minimo di nastri senza vincolo di durata
 * Fase 2 – Split iterativo delle catene che superano la durata massima
 * Fase 3 – Aggiunta tempi accessori in testa e coda
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
  localitaTermine: string[];                  // località in cui un nastro può iniziare/terminare
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
  corse: string[];        // idCorsa list
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

// ---------------------------------------------------------------------------
// Fase 1 – Hopcroft-Karp maximum bipartite matching
// ---------------------------------------------------------------------------

/**
 * Restituisce il matching massimale su un grafo bipartito.
 * left[i] = nodo sorgente (corsa come "fine"), right[j] = nodo dest (corsa come "inizio")
 * adj[i] = lista di j raggiungibili da left[i]
 * Ritorna: matchL[i] = j se left[i] è abbinato a right[j], -1 altrimenti
 *          matchR[j] = i se right[j] è abbinato a left[i], -1 altrimenti
 */
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

/**
 * Ricostruisce le catene (nastri) dal matching bipartito.
 * matchL[i] = j significa che la corsa i precede la corsa j
 */
function reconstructChains(n: number, matchL: number[]): number[][] {
  // Trova le corse "testa" di catena (non puntate da nessuno)
  const pointed = new Set<number>(matchL.filter(v => v !== -1));
  const chains: number[][] = [];
  const visited = new Set<number>();

  for (let i = 0; i < n; i++) {
    if (!pointed.has(i) && !visited.has(i)) {
      // i è la testa di una catena
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

/**
 * Divide una catena al punto in cui la durata supera il massimo.
 * Ritorna due sotto-catene.
 */
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

  let bestSplit = 1;    // fallback = original behaviour (last valid k for max constraint)
  let idealSplit = -1;  // k where BOTH parts satisfy minMinuti

  for (let k = 1; k < chain.length; k++) {
    const ultimaFirst = corse[chain[k - 1]];
    const durataFirst =
      taInizio +
      diffMinutes(inizio, toDate(ultimaFirst.orarioFine)) +
      taFine;
    if (durataFirst > maxMinuti) break;

    bestSplit = k; // original behaviour: keep last valid k

    if (minMinuti > 0 && durataFirst >= minMinuti) {
      const secondPart = chain.slice(k);
      const durataSecond = calcolaDurataChain(secondPart, corse, params);
      if (durataSecond >= minMinuti) {
        idealSplit = k; // both parts ≥ minMinuti
      }
    }
  }

  // Prefer a split where both parts meet minimum duration; fall back to original if none found
  const splitAt = idealSplit !== -1 ? idealSplit : bestSplit;
  return [chain.slice(0, splitAt), chain.slice(splitAt)];
}

/**
 * Applica split iterativi finché tutte le catene rispettano la durata massima.
 */
function splitPerDurata(
  chains: number[][],
  corse: CorsaInput[],
  params: OttimizzazioneParams
): { valid: number[][]; singletons: number[][] } {
  const result: number[][] = [];
  const singletons: number[][] = [];
  const queue = [...chains];

  while (queue.length > 0) {
    const chain = queue.shift()!;
    if (chain.length === 0) continue;

    const durata = calcolaDurataChain(chain, corse, params);
    if (durata <= params.durataMassimaNastroMinuti || chain.length === 1) {
      if (chain.length === 1) {
        const d = calcolaDurataChain(chain, corse, params);
        if (d > params.durataMassimaNastroMinuti) {
          singletons.push(chain); // corsa singola che supera la durata (raro)
        } else {
          result.push(chain);
        }
      } else {
        result.push(chain);
      }
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

  return { valid: result, singletons };
}

// ---------------------------------------------------------------------------
// Fase 3 – Generazione attività con tempi accessori e soste
// ---------------------------------------------------------------------------

function generateAttivitaPerChain(
  chain: number[],
  corse: CorsaInput[],
  params: OttimizzazioneParams,
  nastroId: string,
  data: string
): AttivitaGenerata[] {
  const attivita: AttivitaGenerata[] = [];
  const taInizioMin = params.durataTempoAccessorioInizioMinuti;
  const taFineMin = params.durataTempoAccessorioFineMinuti;

  if (chain.length === 0) return [];

  const primaCorsa = corse[chain[0]];
  const ultimaCorsa = corse[chain[chain.length - 1]];

  // Tempo accessorio in testa
  const taInizioFine = toDate(primaCorsa.orarioInizio);
  const taInizioStart = addMinutes(taInizioFine, -taInizioMin);
  attivita.push({
    nastroId,
    idOrigine: primaCorsa.idOrigine,
    idDestinazione: primaCorsa.idOrigine,
    orarioInizio: toISO(taInizioStart),
    orarioFine: toISO(taInizioFine),
    tipoAttivita: "tempo accessorio",
    idCorsa: null,
    isBridgeCorsa: false,
  });

  // Corse e soste
  for (let k = 0; k < chain.length; k++) {
    const corsa = corse[chain[k]];
    attivita.push({
      nastroId,
      idOrigine: corsa.idOrigine,
      idDestinazione: corsa.idDestinazione,
      orarioInizio: corsa.orarioInizio,
      orarioFine: corsa.orarioFine,
      tipoAttivita: "corsa in linea",
      idCorsa: corsa.idCorsa,
      isBridgeCorsa: false,
    });

    // Sosta tra corsa k e k+1 (se c'è gap)
    if (k < chain.length - 1) {
      const prossima = corse[chain[k + 1]];
      const sostaInizio = toDate(corsa.orarioFine);
      const sostaFine = toDate(prossima.orarioInizio);
      const gapMin = diffMinutes(sostaInizio, sostaFine);
      if (gapMin > 0) {
        attivita.push({
          nastroId,
          idOrigine: corsa.idDestinazione,
          idDestinazione: prossima.idOrigine,
          orarioInizio: toISO(sostaInizio),
          orarioFine: toISO(sostaFine),
          tipoAttivita: "sosta",
          idCorsa: null,
          isBridgeCorsa: false,
        });
      }
    }
  }

  // Tempo accessorio in coda
  const taFineInizio = toDate(ultimaCorsa.orarioFine);
  const taFineFine = addMinutes(taFineInizio, taFineMin);
  attivita.push({
    nastroId,
    idOrigine: ultimaCorsa.idDestinazione,
    idDestinazione: ultimaCorsa.idDestinazione,
    orarioInizio: toISO(taFineInizio),
    orarioFine: toISO(taFineFine),
    tipoAttivita: "tempo accessorio",
    idCorsa: null,
    isBridgeCorsa: false,
  });

  return attivita;
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
      nastri: [],
      corseAssegnate: 0,
      corseNonAssegnate: [],
      nastriGenerati: 0,
      durataMediaMinuti: 0,
      durataMinimaMinuti: 0,
      durataMassimaMinuti: 0,
    };
  }

  // Ordina per orario di inizio
  const corse = [...corseInput].sort(
    (a, b) => new Date(a.orarioInizio).getTime() - new Date(b.orarioInizio).getTime()
  );
  const n = corse.length;

  // Costruisce il grafo di compatibilità (senza vincolo durata, gestito in Fase 2)
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    const fine = toDate(corse[i].orarioFine);
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const inizio = toDate(corse[j].orarioInizio);
      const compatibileLocalita = corse[i].idDestinazione === corse[j].idOrigine;
      const compatibileTempo = diffMinutes(fine, inizio) >= params.durataMinimaSostaMinuti;
      if (compatibileLocalita && compatibileTempo) {
        adj[i].push(j);
      }
    }
  }

  // Fase 1: Hopcroft-Karp
  const { matchL } = hopcroftKarp(n, adj);

  // Ricostruisce catene
  const chains = reconstructChains(n, matchL);

  // Fase 2: Split per durata massima
  const { valid: validChains } = splitPerDurata(chains, corse, params);

  // Genera nastri
  const nastri: NastroGenerato[] = [];
  const corseAssegnate = new Set<string>();

  validChains.forEach((chain, idx) => {
    const nastroId = makeNastroId(idx + 1);
    const attivita = generateAttivitaPerChain(chain, corse, params, nastroId, params.data);

    const prima = corse[chain[0]];
    const ultima = corse[chain[chain.length - 1]];
    const durataMinuti = calcolaDurataChain(chain, corse, params);

    const corseDiQuestoNastro = chain.map(i => corse[i].idCorsa);
    corseDiQuestoNastro.forEach(c => corseAssegnate.add(c));

    nastri.push({
      nastroId,
      attivita,
      corse: corseDiQuestoNastro,
      durataMinuti,
    });
  });

  const corseNonAssegnate = corse
    .filter(c => !corseAssegnate.has(c.idCorsa))
    .map(c => c.idCorsa);

  // ---------------------------------------------------------------------------
  // Fase 4 – Deposito, località di termine e nastri di ritorno
  // ---------------------------------------------------------------------------

  // Costruisce l'insieme delle località in cui un nastro può terminare.
  // Il deposito è sempre incluso; se localitaTermine è vuoto, nessun vincolo di fine-nastro.
  const localitaOk = new Set<string>(params.localitaTermine ?? []);
  if (params.deposito) localitaOk.add(params.deposito);

  // Helper: ultima "corsa in linea" di un nastro (esclude TA, soste e spostamenti)
  const ultimaCorsa4 = (n: NastroGenerato): AttivitaGenerata | undefined =>
    [...n.attivita].reverse().find(a => a.tipoAttivita === "corsa in linea");

  // Helper: posizione finale effettiva del nastro
  // = idDestinazione dell'ultimo TA (che ha sempre idOrigine === idDestinazione === posizione corrente)
  const endLocationOf = (n: NastroGenerato): string | undefined =>
    [...n.attivita].reverse()
      .find(a => a.tipoAttivita === "tempo accessorio")
      ?.idDestinazione;

  // Helper: rinumera tutti i nastri in array
  const rinumera = (arr: NastroGenerato[]) => {
    arr.forEach((n, i) => {
      const newId = makeNastroId(i + 1);
      n.attivita.forEach(a => { a.nastroId = newId; });
      n.nastroId = newId;
    });
  };

  // ── Step 1: vincolo località di termine ──────────────────────────────────
  // Se localitaOk ha elementi, ogni nastro deve terminare in una di quelle.
  // Se l'ultima corsa finisce altrove, aggiungiamo una corsa di spostamento.
  // Le corse già usate come spostamento vengono tracciate per evitare duplicati.
  const corseUsateSpostamento = new Set<string>();

  if (localitaOk.size > 0) {
    for (const nastro of nastri) {
      const ultima = ultimaCorsa4(nastro);
      if (!ultima) continue;
      if (localitaOk.has(ultima.idDestinazione)) continue; // OK, già in posto

      const posAttuale = ultima.idDestinazione;

      // L'ultima attività del nastro è il TA finale — lo rimuoviamo temporaneamente
      const taFinale = nastro.attivita.pop()!;
      const taFineTime = toDate(taFinale.orarioInizio); // inizio del TA = fine ultima corsa

      // Cerca una corsa di spostamento: da posAttuale a una localitaOk
      // — preferisce il deposito; fallback: qualsiasi localitaOk
      // — esclude corse già assegnate come spostamento ad altri nastri
      const trovaSpost = (soloDeposito: boolean): CorsaInput | undefined =>
        corse.find(c =>
          c.idOrigine === posAttuale &&
          localitaOk.has(c.idDestinazione) &&
          (!soloDeposito || c.idDestinazione === params.deposito) &&
          toDate(c.orarioInizio) >= taFineTime &&
          !corseUsateSpostamento.has(c.idCorsa)
        );

      const spostCorsa = trovaSpost(true) ?? trovaSpost(false);

      if (spostCorsa) {
        const rcStart = toDate(spostCorsa.orarioInizio);
        const rcEnd   = toDate(spostCorsa.orarioFine);

        // Sosta di attesa (se la corsa parte dopo il TA)
        if (diffMinutes(taFineTime, rcStart) > 0) {
          nastro.attivita.push({
            nastroId: nastro.nastroId,
            idOrigine: posAttuale, idDestinazione: posAttuale,
            orarioInizio: toISO(taFineTime), orarioFine: toISO(rcStart),
            tipoAttivita: "sosta", idCorsa: null, isBridgeCorsa: false,
          });
        }
        // Corsa di spostamento (marcata come usata per evitare duplicati)
        corseUsateSpostamento.add(spostCorsa.idCorsa);
        nastro.attivita.push({
          nastroId: nastro.nastroId,
          idOrigine: spostCorsa.idOrigine, idDestinazione: spostCorsa.idDestinazione,
          orarioInizio: spostCorsa.orarioInizio, orarioFine: spostCorsa.orarioFine,
          tipoAttivita: "corsa in linea", idCorsa: spostCorsa.idCorsa, isBridgeCorsa: true,
        });
        // Nuovo TA finale nella località consentita
        const nuovoTaFine = addMinutes(rcEnd, params.durataTempoAccessorioFineMinuti);
        nastro.attivita.push({
          nastroId: nastro.nastroId,
          idOrigine: spostCorsa.idDestinazione, idDestinazione: spostCorsa.idDestinazione,
          orarioInizio: toISO(rcEnd), orarioFine: toISO(nuovoTaFine),
          tipoAttivita: "tempo accessorio", idCorsa: null, isBridgeCorsa: false,
        });
        nastro.durataMinuti = Math.round(
          diffMinutes(toDate(nastro.attivita[0].orarioInizio), nuovoTaFine)
        );
      } else {
        // Nessuna corsa reale trovata → spostamento generico (placeholder)
        const dest = params.deposito || Array.from(localitaOk)[0] || posAttuale;
        const spostFine = addMinutes(taFineTime, 60);
        nastro.attivita.push({
          nastroId: nastro.nastroId,
          idOrigine: posAttuale, idDestinazione: dest,
          orarioInizio: toISO(taFineTime), orarioFine: toISO(spostFine),
          tipoAttivita: "spostamento", idCorsa: null, isBridgeCorsa: true,
        });
        const nuovoTaFine = addMinutes(spostFine, params.durataTempoAccessorioFineMinuti);
        nastro.attivita.push({
          nastroId: nastro.nastroId,
          idOrigine: dest, idDestinazione: dest,
          orarioInizio: toISO(spostFine), orarioFine: toISO(nuovoTaFine),
          tipoAttivita: "tempo accessorio", idCorsa: null, isBridgeCorsa: false,
        });
        nastro.durataMinuti = Math.round(
          diffMinutes(toDate(nastro.attivita[0].orarioInizio), nuovoTaFine)
        );
      }
    }
  }

  // ── Step 2: ordinamento finale ───────────────────────────────────────────
  // Se è configurato un deposito, i nastri che terminano fuori deposito vengono
  // spostati in fondo (turni serali); gli altri sono ordinati per orario di inizio.
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
