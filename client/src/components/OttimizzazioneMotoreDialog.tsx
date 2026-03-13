import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Clock, Layers, TrendingUp, MapPin } from "lucide-react";
import type { Transito } from "@shared/schema";

// ---------------------------------------------------------------------------
// Tipi
// ---------------------------------------------------------------------------

interface CorsaInput {
  idCorsa: string;
  idOrigine: string;
  idDestinazione: string;
  orarioInizio: string;
  orarioFine: string;
}

interface AttivitaGenerata {
  nastroId: string;
  idOrigine: string;
  idDestinazione: string;
  orarioInizio: string;
  orarioFine: string;
  tipoAttivita: string;
  idCorsa: string | null;
  isBridgeCorsa: boolean;
}

interface NastroGenerato {
  nastroId: string;
  attivita: AttivitaGenerata[];
  corse: string[];
  durataMinuti: number;
}

interface OttimizzazioneResult {
  nastri: NastroGenerato[];
  corseAssegnate: number;
  corseNonAssegnate: string[];
  nastriGenerati: number;
  durataMediaMinuti: number;
  durataMinimaMinuti: number;
  durataMassimaMinuti: number;
}

interface Params {
  durataMassimaNastroMinuti: number;
  durataMinimaNoastroMinuti: number;
  durataTempoAccessorioInizioMinuti: number;
  durataTempoAccessorioFineMinuti: number;
  durataMinimaSostaMinuti: number;
  data: string;
  deposito: string;
  localitaTermine: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedDate: string; // "YYYY-MM-DD"
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return iso;
  }
}

/**
 * Estrae le corse dalla tabella transiti.
 * Per ogni idCorsa unico, prende il primo e l'ultimo punto per ricavare
 * origine, destinazione, orario inizio e fine.
 */
function estraiCorseDaTransiti(transiti: Transito[]): CorsaInput[] {
  const map = new Map<string, Transito[]>();
  for (const t of transiti) {
    if (!map.has(t.idCorsa)) map.set(t.idCorsa, []);
    map.get(t.idCorsa)!.push(t);
  }

  const corse: CorsaInput[] = [];
  Array.from(map.entries()).forEach(([idCorsa, stops]) => {
    const sorted = [...stops].sort((a, b) => a.sequenza - b.sequenza);
    const primo = sorted[0];
    const ultimo = sorted[sorted.length - 1];

    const orarioInizio = primo.orarioPartenza ?? primo.orarioArrivo;
    const orarioFine = ultimo.orarioArrivo ?? ultimo.orarioPartenza;

    if (!orarioInizio || !orarioFine || !primo.idPunto || !ultimo.idPunto) return;

    corse.push({
      idCorsa,
      idOrigine: primo.idPunto,
      idDestinazione: ultimo.idPunto,
      orarioInizio,
      orarioFine,
    });
  });

  return corse;
}

// ---------------------------------------------------------------------------
// Componente principale
// ---------------------------------------------------------------------------

export function OttimizzazioneMotoreDialog({ open, onOpenChange, selectedDate }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Parametri configurabili
  const [params, setParams] = useState<Params>({
    durataMassimaNastroMinuti: 495,     // 8h15m
    durataMinimaNoastroMinuti: 315,     // 5h15m
    durataTempoAccessorioInizioMinuti: 30,
    durataTempoAccessorioFineMinuti: 20,
    durataMinimaSostaMinuti: 5,
    data: selectedDate,
    deposito: "",
    localitaTermine: [],
  });

  const [result, setResult] = useState<OttimizzazioneResult | null>(null);
  const [corse, setCorse] = useState<CorsaInput[]>([]);

  // Carica transiti — sempre attivo (non solo quando il dialog è aperto)
  const transitiQuery = useQuery<Transito[]>({
    queryKey: ["/api/transiti"],
  });

  const corseDisponibili = useMemo(() => {
    if (!transitiQuery.data) return [];
    return estraiCorseDaTransiti(transitiQuery.data);
  }, [transitiQuery.data]);

  // Tutte le località uniche presenti nei transiti (origini + destinazioni)
  const localitaUniche = useMemo(() => {
    const set = new Set<string>();
    for (const c of corseDisponibili) {
      if (c.idOrigine) set.add(c.idOrigine);
      if (c.idDestinazione) set.add(c.idDestinazione);
    }
    return Array.from(set).sort();
  }, [corseDisponibili]);

  // Helper per chiamate API con gestione robusta della risposta
  async function postJson<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error(`[ottimizzazione] Risposta non-JSON da ${url}:`, text.substring(0, 300));
      throw new Error(
        `Il server ha restituito una risposta non valida (HTTP ${response.status}). ` +
        `Ricarica la pagina con F5 e riprova.`
      );
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message ?? `Errore ${response.status}`);
    }
    return data as T;
  }

  // Anteprima
  const anteprimaMutation = useMutation({
    mutationFn: async () => {
      const corseToUse = corseDisponibili;
      if (corseToUse.length === 0) {
        throw new Error("Nessuna corsa disponibile. Assicurati di aver caricato i transiti.");
      }
      setCorse(corseToUse);
      return postJson<OttimizzazioneResult>("/api/ottimizzazione/anteprima", {
        corse: corseToUse,
        params,
      });
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (err: Error) => {
      toast({
        title: "Errore ottimizzazione",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Applica
  const applicaMutation = useMutation({
    mutationFn: async () => postJson("/api/ottimizzazione/applica", {
      corse,
      params,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attivita"] });
      toast({
        title: "Ottimizzazione applicata",
        description: `${result?.nastriGenerati} nastri generati e salvati con successo.`,
      });
      onOpenChange(false);
      setResult(null);
    },
    onError: (err: Error) => {
      toast({
        title: "Errore applicazione",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleParamChange = (key: keyof Params, value: string) => {
    if (key === "deposito") {
      setParams(prev => ({ ...prev, deposito: value }));
      return;
    }
    const numValue = parseFloat(value);
    setParams(prev => ({
      ...prev,
      [key]: isNaN(numValue) ? prev[key] : numValue,
    }));
  };

  const corseCount = corseDisponibili.length;
  const hasTransiti = corseCount > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setResult(null); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-violet-500" />
            Motore di Ottimizzazione Nastri
          </DialogTitle>
          <DialogDescription>
            Genera il numero minimo di nastri per coprire tutte le corse caricate,
            rispettando i parametri contrattuali.
          </DialogDescription>
        </DialogHeader>

        <Separator className="shrink-0" />

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          <div className="space-y-6">

            {/* Stato corse disponibili */}
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/40">
              {transitiQuery.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : hasTransiti ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-sm">
                {transitiQuery.isLoading
                  ? "Caricamento transiti..."
                  : hasTransiti
                  ? `${corseCount} corse disponibili per l'ottimizzazione`
                  : "Nessun transito caricato. Importa prima i transiti dalla dashboard."}
              </span>
            </div>

            {/* Parametri */}
            <div>
              <h3 className="font-medium text-sm mb-3">Parametri contrattuali</h3>
              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-1.5">
                  <Label htmlFor="durataMax" className="text-xs text-muted-foreground">
                    Durata massima nastro (minuti)
                  </Label>
                  <Input
                    id="durataMax"
                    data-testid="input-durata-max-nastro"
                    type="number"
                    min={60}
                    max={960}
                    value={params.durataMassimaNastroMinuti}
                    onChange={e => handleParamChange("durataMassimaNastroMinuti", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    = {fmtMinutes(params.durataMassimaNastroMinuti)} (attuale)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="durataMin" className="text-xs text-muted-foreground">
                    Durata minima nastro (minuti)
                  </Label>
                  <Input
                    id="durataMin"
                    data-testid="input-durata-min-nastro"
                    type="number"
                    min={0}
                    max={960}
                    value={params.durataMinimaNoastroMinuti}
                    onChange={e => handleParamChange("durataMinimaNoastroMinuti", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    = {fmtMinutes(params.durataMinimaNoastroMinuti)} (attuale)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sostaMin" className="text-xs text-muted-foreground">
                    Gap minimo tra corse (minuti)
                  </Label>
                  <Input
                    id="sostaMin"
                    data-testid="input-sosta-minima"
                    type="number"
                    min={0}
                    max={60}
                    value={params.durataMinimaSostaMinuti}
                    onChange={e => handleParamChange("durataMinimaSostaMinuti", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="taInizio" className="text-xs text-muted-foreground">
                    Tempo accessorio iniziale (minuti)
                  </Label>
                  <Input
                    id="taInizio"
                    data-testid="input-ta-inizio"
                    type="number"
                    min={0}
                    max={120}
                    value={params.durataTempoAccessorioInizioMinuti}
                    onChange={e => handleParamChange("durataTempoAccessorioInizioMinuti", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="taFine" className="text-xs text-muted-foreground">
                    Tempo accessorio finale (minuti)
                  </Label>
                  <Input
                    id="taFine"
                    data-testid="input-ta-fine"
                    type="number"
                    min={0}
                    max={120}
                    value={params.durataTempoAccessorioFineMinuti}
                    onChange={e => handleParamChange("durataTempoAccessorioFineMinuti", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Sezione deposito */}
            <div>
              <h3 className="font-medium text-sm mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                Deposito di appartenenza
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Il deposito è la sede base degli autisti. I nastri che terminano fuori deposito
                vengono ordinati a fine giornata.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="deposito" className="text-xs text-muted-foreground">
                  Deposito (località base)
                </Label>
                <Select
                  value={params.deposito}
                  onValueChange={v => setParams(prev => ({ ...prev, deposito: v === "__nessuno__" ? "" : v }))}
                >
                  <SelectTrigger id="deposito" data-testid="select-deposito">
                    <SelectValue placeholder="Nessun deposito selezionato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__nessuno__">Nessun deposito</SelectItem>
                    {localitaUniche.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selezione località di termine */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Località in cui un nastro può terminare (e iniziare)
                  </Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs text-violet-600 hover:underline"
                      onClick={() => setParams(prev => ({ ...prev, localitaTermine: [...localitaUniche] }))}
                    >
                      Tutte
                    </button>
                    <span className="text-xs text-muted-foreground">·</span>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:underline"
                      onClick={() => setParams(prev => ({ ...prev, localitaTermine: [] }))}
                    >
                      Nessuna
                    </button>
                  </div>
                </div>

                {localitaUniche.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Carica i transiti per vedere le località disponibili.
                  </p>
                ) : (
                  <div className="border rounded-md p-3 max-h-36 overflow-y-auto">
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {localitaUniche.map(loc => {
                        const isDeposito = loc === params.deposito;
                        const checked = isDeposito || params.localitaTermine.includes(loc);
                        return (
                          <label
                            key={loc}
                            className="flex items-center gap-1.5 cursor-pointer select-none"
                            data-testid={`checkbox-localita-${loc}`}
                          >
                            <Checkbox
                              checked={checked}
                              disabled={isDeposito}
                              onCheckedChange={(v) => {
                                setParams(prev => ({
                                  ...prev,
                                  localitaTermine: v
                                    ? [...prev.localitaTermine.filter(x => x !== loc), loc]
                                    : prev.localitaTermine.filter(x => x !== loc),
                                }));
                              }}
                            />
                            <span className={`text-xs ${isDeposito ? "font-medium text-violet-700 dark:text-violet-400" : ""}`}>
                              {loc}
                              {isDeposito && " ★"}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {params.localitaTermine.length === 0 && !params.deposito
                    ? "Nessun vincolo di termine attivo."
                    : `${params.localitaTermine.length + (params.deposito ? 1 : 0)} ${params.deposito ? `(deposito ${params.deposito} incluso)` : ""} — le corse di spostamento vengono aggiunte automaticamente dove necessario.`}
                </p>
              </div>
            </div>

            {/* Pulsante genera anteprima */}
            <Button
              data-testid="button-genera-anteprima"
              className="w-full"
              disabled={!hasTransiti || anteprimaMutation.isPending}
              onClick={() => anteprimaMutation.mutate()}
            >
              {anteprimaMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calcolo in corso...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Genera anteprima ottimizzazione
                </>
              )}
            </Button>

            {/* Risultati */}
            {result && (
              <>
                <Separator />

                <div>
                  <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-500" />
                    Resoconto ottimizzazione
                  </h3>

                  {/* KPI cards */}
                  <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-4">
                    <div className="rounded-lg border p-3 text-center space-y-0.5" data-testid="stat-nastri-generati">
                      <p className="text-2xl font-bold text-violet-600">{result.nastriGenerati}</p>
                      <p className="text-xs text-muted-foreground">Nastri generati</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center space-y-0.5" data-testid="stat-corse-assegnate">
                      <p className="text-2xl font-bold text-green-600">{result.corseAssegnate}</p>
                      <p className="text-xs text-muted-foreground">Corse assegnate</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center space-y-0.5" data-testid="stat-corse-non-assegnate">
                      <p className={`text-2xl font-bold ${result.corseNonAssegnate.length > 0 ? "text-amber-500" : "text-green-600"}`}>
                        {result.corseNonAssegnate.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Non assegnate</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center space-y-0.5" data-testid="stat-durata-media">
                      <p className="text-2xl font-bold text-blue-600">{fmtMinutes(result.durataMediaMinuti)}</p>
                      <p className="text-xs text-muted-foreground">Durata media</p>
                    </div>
                  </div>

                  {/* Range durate */}
                  <div className="flex gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Min: {fmtMinutes(result.durataMinimaMinuti)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Max: {fmtMinutes(result.durataMassimaMinuti)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      Copertura: {Math.round((result.corseAssegnate / corseCount) * 100)}%
                    </span>
                  </div>

                  {/* Corse non assegnate */}
                  {result.corseNonAssegnate.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 mb-4">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">
                        Corse non assegnate ({result.corseNonAssegnate.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {result.corseNonAssegnate.map(id => (
                          <Badge key={id} variant="outline" className="text-xs border-amber-300 text-amber-700">
                            {id}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lista nastri */}
                  <Accordion type="multiple" className="space-y-1">
                    {result.nastri.map((nastro) => {
                      // Individua nastri di ritorno (tutte le corse sono isBridgeCorsa o spostamento)
                      const corse = nastro.attivita.filter(a => a.tipoAttivita === "corsa in linea" || a.tipoAttivita === "spostamento");
                      const isRitorno = corse.length > 0 && corse.every(a => a.isBridgeCorsa);
                      const lastCorsa = [...nastro.attivita].reverse().find(a =>
                        a.tipoAttivita === "corsa in linea" || a.tipoAttivita === "spostamento"
                      );
                      const isFuoriDeposito = params.deposito && lastCorsa && lastCorsa.idDestinazione !== params.deposito && !isRitorno;
                      const firstCorsa = nastro.attivita.find(a => a.tipoAttivita === "corsa in linea");
                      const timeRange = nastro.attivita.length > 0
                        ? `${fmtTime(nastro.attivita[0].orarioInizio)} – ${fmtTime(nastro.attivita[nastro.attivita.length - 1].orarioFine)}`
                        : "";

                      return (
                        <AccordionItem
                          key={nastro.nastroId}
                          value={nastro.nastroId}
                          className={`border rounded-lg px-3 ${
                            isRitorno ? "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20" :
                            isFuoriDeposito ? "border-orange-200 bg-orange-50/50 dark:bg-orange-950/20" : ""
                          }`}
                          data-testid={`nastro-ottimizzato-${nastro.nastroId}`}
                        >
                          <AccordionTrigger className="hover:no-underline py-2">
                            <div className="flex items-center gap-2 w-full flex-wrap">
                              <span className="font-mono text-sm font-semibold text-violet-700 dark:text-violet-400 min-w-[64px]">
                                {nastro.nastroId}
                              </span>
                              {isRitorno && (
                                <Badge variant="outline" className="text-xs border-blue-400 text-blue-700 dark:text-blue-300">
                                  ↩ ritorno
                                </Badge>
                              )}
                              {isFuoriDeposito && (
                                <Badge variant="outline" className="text-xs border-orange-400 text-orange-700 dark:text-orange-300">
                                  fuori deposito
                                </Badge>
                              )}
                              {firstCorsa && (
                                <span className="text-xs text-muted-foreground">
                                  {firstCorsa.idOrigine}
                                  {lastCorsa && lastCorsa.idDestinazione !== firstCorsa.idOrigine
                                    ? ` → ${lastCorsa.idDestinazione}` : ""}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground ml-auto mr-2 tabular-nums">
                                {timeRange} · {fmtMinutes(nastro.durataMinuti)}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-2">
                            <div className="space-y-0.5 text-xs">
                              {nastro.attivita.map((att, i) => (
                                <div
                                  key={i}
                                  className={`flex items-center gap-2 py-0.5 ${
                                    att.tipoAttivita === "tempo accessorio"
                                      ? "text-muted-foreground"
                                      : att.tipoAttivita === "sosta"
                                      ? "text-muted-foreground italic"
                                      : att.tipoAttivita === "spostamento"
                                      ? "text-blue-600 dark:text-blue-400 italic"
                                      : att.isBridgeCorsa
                                      ? "text-blue-600 dark:text-blue-400"
                                      : "font-medium"
                                  }`}
                                >
                                  <span className="font-mono text-[11px] tabular-nums w-[88px]">
                                    {fmtTime(att.orarioInizio)} – {fmtTime(att.orarioFine)}
                                  </span>
                                  <span className="flex-1">
                                    {att.tipoAttivita === "corsa in linea"
                                      ? `Corsa ${att.idCorsa}${att.isBridgeCorsa ? " (spostamento)" : ""} · ${att.idOrigine} → ${att.idDestinazione}`
                                      : att.tipoAttivita === "sosta"
                                      ? `Sosta @ ${att.idOrigine}`
                                      : att.tipoAttivita === "spostamento"
                                      ? `Spostamento ${att.idOrigine} → ${att.idDestinazione}`
                                      : `T.A. @ ${att.idOrigine}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        {result && (
          <>
            <Separator className="shrink-0" />
            <div className="px-6 py-4 flex items-center justify-between gap-3 shrink-0">
              <p className="text-xs text-muted-foreground">
                L'applicazione sostituirà tutti i nastri esistenti con quelli ottimizzati.
              </p>
              <Button
                data-testid="button-applica-ottimizzazione"
                onClick={() => applicaMutation.mutate()}
                disabled={applicaMutation.isPending}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {applicaMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Applica ottimizzazione
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
