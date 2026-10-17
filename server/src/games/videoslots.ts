/**
 * Motor genérico de video slots 5x3 com 20 linhas, usado pelos 10 slots temáticos.
 *
 * Cada tema escolhe uma mecânica de giros grátis:
 *  - expanding_symbol  "estilo livro": um símbolo especial sorteado expande e paga em todas as linhas
 *  - sticky_wilds      wilds ficam presos até o fim do bônus
 *  - mult_wilds        wilds com multiplicador (somam na linha)
 *  - progressive_mult  multiplicador global sobe +1 a cada giro vencedor
 *  - random_wilds      de 1 a 4 wilds caem aleatoriamente em cada giro
 *  - mult_orbs         orbes com 2x a 100x somam e multiplicam o ganho do giro
 *  - expanding_wilds   wild que aparece ocupa o rolo inteiro
 *
 * Tudo é resolvido no servidor numa única chamada (base + giros grátis), com RNG provably fair.
 * A escala de pagamento e o preço da compra de bônus vêm da calibração (npm run calibrate).
 */
import type { Rng } from "../fair.js";
import { floorPay, type InstantGame } from "./types.js";
import calib from "./videoslots.calib.json" with { type: "json" };

export type Feature = "expanding_symbol" | "sticky_wilds" | "mult_wilds" | "progressive_mult" | "random_wilds" | "mult_orbs" | "expanding_wilds";

export type VideoSlotTheme = {
  id: string;
  name: string;
  feature: Feature;
  /** nomes dos símbolos: 0 wild, 1 scatter, 2..5 altos, 6..9 baixos (10 = orbe, só em mult_orbs) */
  symbols: string[];
};

export const MAX_WIN = 50_000;
const W = 0;
const SC = 1;
const ORB = 10;

/** Pagamento por linha (x aposta por linha) para 3, 4 e 5 iguais, antes da escala. */
const BASE_PAYS: Record<number, [number, number, number]> = {
  2: [25, 100, 500],
  3: [15, 60, 250],
  4: [12, 40, 150],
  5: [10, 30, 120],
  6: [5, 15, 60],
  7: [4, 12, 50],
  8: [3, 10, 40],
  9: [3, 8, 30],
};
const SCATTER_PAYS = [0, 0, 0, 2, 10, 50];
const FREE_SPINS = [0, 0, 0, 10, 12, 15];
const RETRIGGER = 5;
const MAX_FS = 100;

export const LINES = [
  [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2], [1, 0, 1, 2, 1], [1, 2, 1, 0, 1], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 0, 2, 0, 0], [2, 2, 0, 2, 2], [0, 2, 0, 2, 0],
];

export const THEMES: VideoSlotTheme[] = [
  { id: "vs-savana", name: "Rei da Savana", feature: "expanding_wilds", symbols: ["Leão (Wild)", "Pôr do sol", "Elefante", "Rinoceronte", "Girafa", "Zebra", "Garra", "Pegada", "Folha", "Tambor"] },
  { id: "vs-gemas", name: "Cofre de Gemas", feature: "mult_wilds", symbols: ["Diamante (Wild)", "Cofre", "Rubi", "Safira", "Esmeralda", "Ametista", "Topázio", "Quartzo", "Opala", "Jade"] },
  { id: "vs-farao", name: "Livro do Faraó", feature: "expanding_symbol", symbols: ["Livro (Wild)", "Livro (Scatter)", "Faraó", "Escaravelho", "Anubis", "Olho de Hórus", "Ankh", "Pirâmide", "Lótus", "Papiro"] },
  { id: "vs-piratas", name: "Ouro dos Piratas", feature: "sticky_wilds", symbols: ["Caveira (Wild)", "Mapa", "Capitão", "Navio", "Papagaio", "Baú", "Âncora", "Leme", "Garrafa", "Moeda"] },
  { id: "vs-dragao", name: "Dragão Imperial", feature: "progressive_mult", symbols: ["Dragão (Wild)", "Pérola", "Imperador", "Carpa", "Leque", "Lanterna", "Bonsai", "Sino", "Moeda", "Nó"] },
  { id: "vs-floresta", name: "Floresta Encantada", feature: "random_wilds", symbols: ["Fada (Wild)", "Portal", "Coruja", "Raposa", "Cogumelo", "Poção", "Bolota", "Trevo", "Vagalume", "Pena"] },
  { id: "vs-olimpo", name: "Trono do Olimpo", feature: "mult_orbs", symbols: ["Raio (Wild)", "Templo", "Zeus", "Elmo", "Lira", "Coroa de louros", "Ânfora", "Escudo", "Coluna", "Moeda", "Orbe"] },
  { id: "vs-cyber", name: "Neon Cyber", feature: "sticky_wilds", symbols: ["Androide (Wild)", "Núcleo", "Robô", "Drone", "Visor", "Chip", "Bateria", "Antena", "Engrenagem", "Bit"] },
  { id: "vs-asteca", name: "Templo Asteca", feature: "expanding_wilds", symbols: ["Máscara (Wild)", "Calendário", "Jaguar", "Serpente", "Ídolo", "Cocar", "Lança", "Pena", "Totem", "Pedra"] },
  { id: "vs-artico", name: "Lobo Ártico", feature: "mult_wilds", symbols: ["Lobo (Wild)", "Aurora", "Urso polar", "Coruja-das-neves", "Raposa-do-ártico", "Foca", "Floco", "Iglu", "Pinheiro", "Cristal"] },
];

/* ------------------------------------------------------------------ rolos */
type Counts = Partial<Record<number, number>>;

function reelCounts(reel: number, free: boolean, feature: Feature): Counts {
  const c: Counts = { 2: 2, 3: 3, 4: 3, 5: 4, 6: 5, 7: 5, 8: 6, 9: 6, [SC]: 1 };
  if (reel >= 1 && reel <= 3) c[W] = free ? 2 : 1;
  if (feature === "expanding_symbol") {
    // no "livro" o scatter também é wild e aparece em todos os rolos
    delete c[W];
    c[SC] = free ? 2 : 1;
  }
  if (feature === "mult_orbs") c[ORB] = free ? 2 : 1;
  return c;
}

function buildStrip(counts: Counts, seed: number) {
  const out: number[] = [];
  for (const [s, n] of Object.entries(counts)) for (let i = 0; i < n!; i++) out.push(Number(s));
  let x = seed * 7919 + 13;
  for (let i = out.length - 1; i > 0; i--) {
    x = (x * 48271) % 2147483647;
    const j = x % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  // separa scatters (no máximo um visível por rolo)
  for (let i = 0; i < out.length; i++) {
    if (out[i] !== SC) continue;
    for (const d of [1, 2]) {
      const j = (i + d) % out.length;
      if (out[j] === SC) {
        const k = (j + Math.floor(out.length / 2)) % out.length;
        [out[j], out[k]] = [out[k], out[j]];
      }
    }
  }
  return out;
}

const stripsCache = new Map<string, { base: number[][]; free: number[][] }>();
function strips(t: VideoSlotTheme) {
  let s = stripsCache.get(t.id);
  if (!s) {
    const seed = [...t.id].reduce((a, c) => a + c.charCodeAt(0), 0);
    s = {
      base: [0, 1, 2, 3, 4].map((r) => buildStrip(reelCounts(r, false, t.feature), seed + r)),
      free: [0, 1, 2, 3, 4].map((r) => buildStrip(reelCounts(r, true, t.feature), seed + 50 + r)),
    };
    stripsCache.set(t.id, s);
  }
  return s;
}

function spinGrid(rng: Rng, st: number[][]) {
  return st.map((strip) => {
    const stop = rng.int(strip.length);
    return [0, 1, 2].map((r) => strip[(stop + r) % strip.length]);
  });
}

/* ------------------------------------------------------------------ avaliação */
export type LineWin = { line: number; symbol: number; count: number; mult: number; cells: [number, number][] };

function evalLines(grid: number[][], scale: number, opts: { wildIsScatter?: boolean; wildMults?: number[][] | null }) {
  const isWild = (s: number) => s === W || (opts.wildIsScatter && s === SC);
  const wins: LineWin[] = [];
  let sum = 0;
  LINES.forEach((rows, li) => {
    let sym = -1;
    let count = 0;
    let wm = 0;
    for (let reel = 0; reel < 5; reel++) {
      const c = grid[reel][rows[reel]];
      if (isWild(c)) {
        count++;
        if (opts.wildMults) wm += opts.wildMults[reel][rows[reel]];
        continue;
      }
      if (c === SC || c === ORB) break;
      if (sym === -1) sym = c;
      if (c === sym) count++;
      else break;
    }
    if (sym === -1 && count >= 3) sym = 2; // linha só de wilds paga como o símbolo mais alto
    if (sym === -1 || count < 3) return;
    const pay = BASE_PAYS[sym][count - 3] * scale * (wm > 0 ? wm : 1);
    const mult = pay / LINES.length;
    sum += mult;
    wins.push({ line: li, symbol: sym, count, mult, cells: rows.slice(0, count).map((r, reel) => [reel, r] as [number, number]) });
  });
  return { wins, sum };
}

/** Pagamento do símbolo expandido (estilo livro): paga em todas as linhas se cobrir rolos suficientes. */
function evalExpanding(grid: number[][], special: number, scale: number) {
  const reels = grid.map((col, i) => (col.includes(special) ? i : -1)).filter((i) => i >= 0);
  const need = special <= 5 ? 2 : 3;
  if (reels.length < need) return { reels: [] as number[], mult: 0 };
  // paga como se houvesse N símbolos em cada uma das 20 linhas (posições não precisam ser adjacentes)
  const n = Math.min(5, reels.length);
  const pay = n >= 3 ? BASE_PAYS[special][n - 3] : BASE_PAYS[special][0] * 0.5;
  return { reels, mult: (pay * scale * LINES.length) / LINES.length };
}

function scatterInfo(grid: number[][]) {
  const cells: [number, number][] = [];
  grid.forEach((col, r) => col.forEach((s, w) => s === SC && cells.push([r, w])));
  return cells;
}

export type VSpin = {
  grid: number[][];
  /** grade depois de efeitos (wilds expandidos, presos, aleatórios) */
  final: number[][];
  wins: LineWin[];
  scatter: { count: number; cells: [number, number][]; mult: number };
  wildMults: number[][] | null;
  orbs: { cell: [number, number]; value: number }[];
  expanded: { symbol: number; reels: number[]; mult: number } | null;
  effects: { expandedWildReels: number[]; sticky: [number, number][]; randomWilds: [number, number][] };
  spinMult: number; // multiplicador global do giro (progressivo / orbes)
  multiplier: number; // x aposta total
  freeSpinsWon: number;
};

const WILD_MULTS = [2, 3, 5, 10];
const WILD_MULT_W = [50, 30, 15, 5];
const ORB_VALUES = [2, 3, 5, 10, 25, 50, 100];
const ORB_W = [40, 25, 15, 10, 6, 3, 1];

function playTheme(t: VideoSlotTheme, rng: Rng, buy: boolean, scaleOverride?: number) {
  const cal = (calib as Record<string, { scale: number; buyPrice: number }>)[t.id] ?? { scale: 1, buyPrice: 100 };
  const scale = scaleOverride ?? cal.scale;
  const st = strips(t);
  const book = t.feature === "expanding_symbol";

  const oneSpin = (inFree: boolean, state: { sticky: Set<string>; prog: number; special: number }): VSpin => {
    const grid = spinGrid(rng, inFree ? st.free : st.base);
    const final = grid.map((c) => c.slice());
    const effects: VSpin["effects"] = { expandedWildReels: [], sticky: [], randomWilds: [] };
    let wildMults: number[][] | null = null;
    const orbs: VSpin["orbs"] = [];

    if (t.feature === "expanding_wilds") {
      for (let r = 0; r < 5; r++) if (final[r].includes(W)) {
        effects.expandedWildReels.push(r);
        for (let w = 0; w < 3; w++) if (final[r][w] !== SC) final[r][w] = W;
      }
    }
    if (inFree && t.feature === "sticky_wilds") {
      for (const k of state.sticky) {
        const [r, w] = k.split(":").map(Number);
        if (final[r][w] !== SC) final[r][w] = W;
      }
      final.forEach((col, r) => col.forEach((s, w) => s === W && state.sticky.add(`${r}:${w}`)));
      effects.sticky = [...state.sticky].map((k) => k.split(":").map(Number) as [number, number]);
    }
    if (inFree && t.feature === "random_wilds") {
      const n = 1 + rng.int(4);
      const cand: [number, number][] = [];
      for (let r = 0; r < 5; r++) for (let w = 0; w < 3; w++) if (final[r][w] !== SC && final[r][w] !== W) cand.push([r, w]);
      for (const i of rng.pickUnique(cand.length, Math.min(n, cand.length))) {
        const [r, w] = cand[i];
        final[r][w] = W;
        effects.randomWilds.push([r, w]);
      }
    }
    if (inFree && t.feature === "mult_wilds") {
      wildMults = final.map((col) => col.map((s) => (s === W ? WILD_MULTS[rng.weighted(WILD_MULT_W)] : 0)));
    }
    if (t.feature === "mult_orbs") {
      final.forEach((col, r) => col.forEach((s, w) => s === ORB && orbs.push({ cell: [r, w], value: ORB_VALUES[rng.weighted(ORB_W)] })));
    }

    const { wins, sum } = evalLines(final, scale, { wildIsScatter: book, wildMults });
    let lineSum = sum;
    let expanded: VSpin["expanded"] = null;
    if (inFree && book && state.special >= 0) {
      const e = evalExpanding(final, state.special, scale);
      if (e.mult > 0) {
        expanded = { symbol: state.special, reels: e.reels, mult: e.mult };
        lineSum += e.mult;
      }
    }
    const sc = scatterInfo(final);
    const n = Math.min(5, sc.length);
    const scMult = SCATTER_PAYS[n];
    let spinMult = 1;
    if (t.feature === "progressive_mult" && inFree) spinMult = state.prog;
    // wilds expansivos: nos giros grátis todos os ganhos valem x3
    if (t.feature === "expanding_wilds" && inFree) spinMult = 3;
    if (t.feature === "mult_orbs" && orbs.length && lineSum > 0) spinMult = orbs.reduce((a, o) => a + o.value, 0);
    const multiplier = lineSum * spinMult + scMult;
    if (t.feature === "progressive_mult" && inFree && lineSum > 0) state.prog += 1;
    const freeSpinsWon = n >= 3 ? (inFree ? RETRIGGER : FREE_SPINS[n]) : 0;
    return { grid, final, wins, scatter: { count: sc.length, cells: sc, mult: scMult }, wildMults, orbs, expanded, effects, spinMult, multiplier, freeSpinsWon };
  };

  const state = { sticky: new Set<string>(), prog: 1, special: -1 };
  const base = buy ? null : oneSpin(false, state);
  const free: VSpin[] = [];
  let remaining = buy ? FREE_SPINS[3] : base!.freeSpinsWon;
  let granted = remaining;
  let total = base?.multiplier ?? 0;
  let special = -1;
  if (remaining > 0 && book) {
    special = 2 + rng.int(8);
    state.special = special;
  }
  while (remaining > 0 && total < MAX_WIN) {
    remaining--;
    const s = oneSpin(true, state);
    free.push(s);
    total += s.multiplier;
    if (s.freeSpinsWon && granted < MAX_FS) {
      const add = Math.min(s.freeSpinsWon, MAX_FS - granted);
      granted += add;
      remaining += add;
    }
  }
  return { base, free, special, multiplier: Math.min(total, MAX_WIN), bought: buy, freeSpinsTotal: granted };
}

export function makeVideoSlot(t: VideoSlotTheme): InstantGame {
  return {
    kind: "instant",
    totalBet: (p, bet) => (p?.buy === true ? bet * buyPriceOf(t.id) : bet),
    play(rng, p, bet) {
      const r = playTheme(t, rng, p?.buy === true);
      return { payout: floorPay(bet * r.multiplier), result: r };
    },
  };
}

export function buyPriceOf(id: string) {
  return (calib as Record<string, { scale: number; buyPrice: number }>)[id]?.buyPrice ?? 100;
}

/** Exposto para o script de calibração. */
export const __internals = { playTheme, BASE_PAYS };

export const VIDEO_SLOTS: Record<string, InstantGame> = Object.fromEntries(THEMES.map((t) => [t.id, makeVideoSlot(t)]));

export function videoSlotsPublicConfig() {
  return THEMES.map((t) => ({
    id: t.id,
    name: t.name,
    feature: t.feature,
    symbols: t.symbols,
    pays: Object.fromEntries(Object.entries(BASE_PAYS).map(([s, p]) => [s, p.map((v) => +(v * ((calib as any)[t.id]?.scale ?? 1)).toFixed(2))])),
    scatterPays: SCATTER_PAYS,
    freeSpins: FREE_SPINS,
    buyPrice: buyPriceOf(t.id),
    lines: LINES,
  }));
}
