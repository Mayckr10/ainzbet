import type { Rng } from "../fair.js";
import { floorPay, type InstantGame } from "./types.js";

/** Monta uma fita de rolo espalhando os símbolos de forma uniforme (determinística). */
function buildStrip(counts: Record<number, number>, spreadSymbols: number[] = []): number[] {
  const entries = Object.entries(counts).map(([s, n]) => ({ s: Number(s), n }));
  const total = entries.reduce((a, e) => a + e.n, 0);
  // coloca cada símbolo em posições i*total/n + deslocamento, resolvendo colisões
  const strip: number[] = new Array(total).fill(-1);
  entries.sort((a, b) => a.n - b.n);
  entries.forEach((e, idx) => {
    for (let i = 0; i < e.n; i++) {
      let pos = Math.floor((i * total) / e.n + idx * 3) % total;
      while (strip[pos] !== -1) pos = (pos + 1) % total;
      strip[pos] = e.s;
    }
  });
  // garante que símbolos "espalhados" (scatter) não fiquem a menos de 3 posições um do outro
  for (const sym of spreadSymbols) {
    for (let i = 0; i < total; i++) {
      if (strip[i] !== sym) continue;
      for (const d of [1, 2]) {
        const j = (i + d) % total;
        if (strip[j] === sym) {
          // troca com o primeiro símbolo comum distante
          for (let k = (j + 3) % total; k !== i; k = (k + 1) % total) {
            if (strip[k] !== sym && strip[(k + 1) % total] !== sym && strip[(k - 1 + total) % total] !== sym && strip[(k + 2) % total] !== sym && strip[(k - 2 + total) % total] !== sym) {
              [strip[j], strip[k]] = [strip[k], strip[j]];
              break;
            }
          }
        }
      }
    }
  }
  return strip;
}

function spinWindow(rng: Rng, strip: number[], rows: number): { stop: number; cells: number[] } {
  const stop = rng.int(strip.length);
  const cells: number[] = [];
  for (let r = 0; r < rows; r++) cells.push(strip[(stop + r) % strip.length]);
  return { stop, cells };
}

/* ============================================================ Caça-níqueis clássico (3x3, 5 linhas) */
export const CLASSIC = {
  symbols: ["diamond", "seven", "bar3", "bar2", "bar1", "bell", "cherry", "blank"] as const,
  // índice: 0 diamante (curinga, dobra o prêmio), 1 sete, 2 3xBAR, 3 2xBAR, 4 BAR, 5 sino, 6 cereja, 7 vazio
  lines: [
    [1, 1, 1],
    [0, 0, 0],
    [2, 2, 2],
    [0, 1, 2],
    [2, 1, 0],
  ],
  pays: { 0: 800, 1: 100, 2: 40, 3: 25, 4: 12, 5: 10, 6: 8 } as Record<number, number>,
  anyBar: 3,
  cherry2: 2,
  cherry1: 0.5,
  reels: [
    { 0: 1, 1: 2, 2: 3, 3: 3, 4: 4, 5: 4, 6: 3, 7: 10 },
    { 0: 1, 1: 2, 2: 3, 3: 3, 4: 4, 5: 4, 6: 3, 7: 10 },
    { 0: 1, 1: 2, 2: 3, 3: 3, 4: 4, 5: 4, 6: 3, 7: 10 },
  ] as Record<number, number>[],
};
export const CLASSIC_STRIPS = CLASSIC.reels.map((c) => buildStrip(c));

const isBar = (s: number) => s >= 2 && s <= 4;

/** Avalia uma linha do clássico; retorna multiplicador da aposta por linha. */
export function classicLine(cells: number[]): number {
  const [a, b, c] = cells;
  const W = 0;
  // três iguais (com curinga substituindo)
  const nonWild = cells.filter((s) => s !== W);
  if (nonWild.length === 0) return CLASSIC.pays[0];
  const base = nonWild[0];
  if (base !== 7 && nonWild.every((s) => s === base)) {
    const wilds = 3 - nonWild.length;
    // cada curinga na linha dobra o prêmio
    return CLASSIC.pays[base] * (wilds ? 2 ** wilds : 1);
  }
  if (cells.every((s) => isBar(s) || s === W)) return CLASSIC.anyBar;
  if ((a === 6 || a === W) && (b === 6 || b === W) && a + b !== 0) return CLASSIC.cherry2;
  if (a === 6) return CLASSIC.cherry1;
  void c;
  return 0;
}

export function evalClassic(grid: number[][]) {
  // grid[reel][row]
  const wins: { line: number; mult: number }[] = [];
  let total = 0;
  CLASSIC.lines.forEach((rows, li) => {
    const cells = rows.map((r, reel) => grid[reel][r]);
    const m = classicLine(cells);
    if (m > 0) {
      wins.push({ line: li, mult: m });
      total += m;
    }
  });
  return { wins, lineMultSum: total };
}

/** Roda da Sorte (3 níveis). Valores em x aposta total; -1 = sobe para a próxima roda. */
export const WHEELS: number[][] = [
  [5, 10, 15, 20, 5, 10, 25, 15, 5, -1, 10, 20, 5, 15, 30, 10, 5, 50, 15, 10],
  [50, 100, 75, 150, 50, 200, 100, 75, -1, 250, 50, 100, 500, 75, 150, 50, 300, 100, 1000, 75],
  [1000, 2000, 1000, 5000, 1000, 2000, 10000, 1000, 2000, 5000, 1000, 25000, 2000, 1000, 5000, 2000, 1000, 10000, 2000, 50000],
];
export const MAX_WIN = 50_000;

export function spinWheels(rng: Rng) {
  const stops: number[] = [];
  for (let level = 0; level < WHEELS.length; level++) {
    const seg = rng.int(WHEELS[level].length);
    stops.push(seg);
    if (WHEELS[level][seg] !== -1) return { stops, multiplier: WHEELS[level][seg] };
  }
  return { stops, multiplier: 0 };
}

export const slotsClassic: InstantGame = {
  kind: "instant",
  totalBet: (_p, bet) => bet,
  play(rng, _p, bet) {
    const spins = CLASSIC_STRIPS.map((strip) => spinWindow(rng, strip, 3));
    const grid = spins.map((s) => s.cells);
    const { wins, lineMultSum } = evalClassic(grid);
    let multiplier = lineMultSum / CLASSIC.lines.length;
    // diamante visível nos 3 rolos aciona a Roda da Sorte
    const wheel = grid.every((col) => col.includes(0)) ? spinWheels(rng) : null;
    if (wheel) multiplier += wheel.multiplier;
    multiplier = Math.min(multiplier, MAX_WIN);
    return { payout: floorPay(bet * multiplier), result: { grid, wins, wheel, multiplier } };
  },
};

/* ============================================================ Frutas (5x3, 20 linhas, giros grátis) */
export const FRUIT = {
  // 0 curinga, 1 scatter (estrela), 2 sete, 3 melancia, 4 uva, 5 ameixa, 6 laranja, 7 limão, 8 cereja
  symbols: ["wild", "scatter", "seven", "melon", "grape", "plum", "orange", "lemon", "cherry"] as const,
  pays: {
    2: [0, 0, 0, 37, 180, 750],
    3: [0, 0, 0, 18, 75, 370],
    4: [0, 0, 0, 15, 54, 230],
    5: [0, 0, 0, 9, 33, 150],
    6: [0, 0, 0, 8, 25, 95],
    7: [0, 0, 0, 7, 20, 80],
    8: [0, 0, 2, 5, 16, 62],
  } as Record<number, number[]>,
  scatterPays: [0, 0, 0, 2, 10, 50], // x aposta total
  /** giros grátis por quantidade de scatters (3, 4, 5) */
  freeSpinsFor: [0, 0, 0, 12, 15, 20],
  retrigger: 5,
  maxFreeSpins: 100,
  /** curingas multiplicadores dos giros grátis (somam na linha) */
  wildMults: [2, 3, 5, 10, 25, 50, 100, 250, 500],
  wildMultWeights: [400, 250, 150, 90, 50, 25, 10, 4, 1],
  /** preço da compra de bônus, em x aposta */
  buyPrice: 52,
  lines: [
    [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
    [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 1, 1, 1, 0],
    [2, 1, 1, 1, 2], [1, 0, 1, 2, 1], [1, 2, 1, 0, 1], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2],
    [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 0, 2, 0, 0], [2, 2, 0, 2, 2], [0, 2, 0, 2, 0],
  ],
  reels: [
    { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 },
    { 0: 2, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 },
    { 0: 2, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 },
    { 0: 2, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 },
    { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 },
  ] as Record<number, number>[],
  freeReels: [
    { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 },
    { 0: 2, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 },
    { 0: 2, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 },
    { 0: 2, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 },
    { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 },
  ] as Record<number, number>[],
};
export const FRUIT_STRIPS = FRUIT.reels.map((c) => buildStrip(c, [1]));
export const FRUIT_FREE_STRIPS = FRUIT.freeReels.map((c) => buildStrip(c, [1]));

export type FruitSpin = {
  grid: number[][]; // [reel][row]
  /** multiplicadores dos curingas (só nos giros grátis): [reel][row] = valor ou 0 */
  wildMults: number[][] | null;
  wins: { line: number; symbol: number; count: number; mult: number }[];
  scatter: { count: number; cells: [number, number][]; mult: number };
  /** multiplicador total deste giro (x aposta total) */
  multiplier: number;
  freeSpinsWon: number;
};

export function evalFruit(grid: number[][], wildMults: number[][] | null, inFree: boolean): FruitSpin {
  const wins: FruitSpin["wins"] = [];
  let lineSum = 0;
  FRUIT.lines.forEach((rows, li) => {
    const cells = rows.map((r, reel) => grid[reel][r]);
    if (cells[0] === 1) return;
    let sym = cells[0];
    let count = 0;
    let wm = 0;
    for (let reel = 0; reel < 5; reel++) {
      const c = cells[reel];
      if (c === 1) break;
      if (sym === 0 && c !== 0) sym = c;
      if (c === sym || c === 0) {
        count++;
        if (c === 0 && wildMults) wm += wildMults[reel][rows[reel]];
      } else break;
    }
    if (sym === 0) return;
    const base = FRUIT.pays[sym]?.[count] ?? 0;
    if (base > 0) {
      const m = base * (wm > 0 ? wm : 1);
      wins.push({ line: li, symbol: sym, count, mult: m / FRUIT.lines.length });
      lineSum += m;
    }
  });
  const cells: [number, number][] = [];
  grid.forEach((col, reel) => col.forEach((s, row) => s === 1 && cells.push([reel, row])));
  const n = Math.min(cells.length, 5);
  const scMult = FRUIT.scatterPays[n];
  const multiplier = lineSum / FRUIT.lines.length + scMult;
  const freeSpinsWon = n >= 3 ? (inFree ? FRUIT.retrigger : FRUIT.freeSpinsFor[n]) : 0;
  return { grid, wildMults, wins, scatter: { count: cells.length, cells, mult: scMult }, multiplier, freeSpinsWon };
}

export function playFruit(rng: Rng, buy = false) {
  const spin = (strips: number[][]) => strips.map((s) => spinWindow(rng, s, 3).cells);
  const base = buy ? null : evalFruit(spin(FRUIT_STRIPS), null, false);
  const free: FruitSpin[] = [];
  let remaining = buy ? FRUIT.freeSpinsFor[3] : base!.freeSpinsWon;
  let granted = remaining;
  let total = base?.multiplier ?? 0;
  let maxWin = false;
  while (remaining > 0 && !maxWin) {
    remaining--;
    const grid = spin(FRUIT_FREE_STRIPS);
    const wm = grid.map((col) =>
      col.map((s) => (s === 0 ? FRUIT.wildMults[rng.weighted(FRUIT.wildMultWeights)] : 0)),
    );
    const s = evalFruit(grid, wm, true);
    free.push(s);
    total += s.multiplier;
    if (total >= MAX_WIN) maxWin = true;
    if (s.freeSpinsWon && granted < FRUIT.maxFreeSpins) {
      const add = Math.min(s.freeSpinsWon, FRUIT.maxFreeSpins - granted);
      granted += add;
      remaining += add;
    }
  }
  const multiplier = Math.min(total, MAX_WIN);
  return { base, free, multiplier, bought: buy, maxWin };
}

export const slotsFruit: InstantGame = {
  kind: "instant",
  totalBet: (p, bet) => (p?.buy === true ? bet * FRUIT.buyPrice : bet),
  play(rng, p, bet) {
    const r = playFruit(rng, p?.buy === true);
    // multiplicador relativo à aposta-base (a compra custa buyPrice x aposta)
    return { payout: floorPay(bet * r.multiplier), result: r };
  },
};
