/**
 * Onda 3 · slots com mecânicas avançadas.
 *  - Motor de cascata (grade que desaba e reabastece): ways, paga-em-qualquer-lugar e clusters,
 *    com altura fixa ou variável (megaways) e vários tipos de multiplicador.
 *  - Hold & Win (moedas travam e dão re-spins).
 *  - Duplo Slot (duas grades ligadas, wilds copiados).
 *  - Jackpot em Pirâmide (medidor persistente por jogador e por aposta).
 *  - Slot de Rodas (três rodas da sorte).
 * Tudo provably fair, resolvido no servidor; escalas vêm de advslots.calib.json (npm run calibrate:adv).
 */
import type { Rng } from "../fair.js";
import { floorPay, type InstantGame } from "./types.js";
import calib from "./advslots.calib.json" with { type: "json" };

export const MAX_WIN = 50_000;
const W = 0;
const SC = 1;
const BOMB = 10;
type Cell = [number, number]; // [coluna, linha] (linha 0 = topo)
const C = (calib as Record<string, { scale: number; buyPrice?: number }>);
export const advScale = (id: string) => C[id]?.scale ?? 1;
export const advBuy = (id: string) => C[id]?.buyPrice ?? 100;

/* ====================================================================== cascata */
export type CascadeSpec = {
  id: string;
  name: string;
  cols: number;
  rows: number; // altura fixa (ignorada no megaways)
  mega?: boolean; // altura 2..7 por coluna a cada giro
  mode: "ways" | "anywhere" | "cluster";
  min: number;
  weights: Record<number, number>; // símbolo -> peso (inclui W e SC quando houver)
  freeWeights?: Record<number, number>;
  pays: Record<number, number[]>;
  /** multiplicador: gonzo (1,2,3,5 / FS 3,6,9,15), double (dobra a cada queda), plus1 (FS +1 por queda), bombs (FS), spots (casas multiplicadoras) */
  mult: "none" | "gonzo" | "double" | "plus1" | "bombs" | "spots";
  freeSpins: Record<number, number>; // nº de scatters -> giros
  symbols: string[];
};

export const CASCADES: CascadeSpec[] = [
  {
    id: "as-avalanche",
    name: "Avalanche de Gemas",
    cols: 6,
    rows: 5,
    mode: "ways",
    min: 3,
    weights: { 0: 0.55, 1: 0.85, 2: 3, 3: 4, 4: 5, 5: 6, 6: 8, 7: 9, 8: 10, 9: 11 },
    pays: { 2: [0.5, 1, 2.5, 5], 3: [0.4, 0.8, 2, 4], 4: [0.3, 0.6, 1.5, 3], 5: [0.25, 0.5, 1.2, 2.5], 6: [0.1, 0.25, 0.5, 1], 7: [0.1, 0.2, 0.4, 0.8], 8: [0.05, 0.15, 0.3, 0.6], 9: [0.05, 0.1, 0.25, 0.5] },
    mult: "gonzo",
    freeSpins: { 4: 10, 5: 12, 6: 15 },
    symbols: ["Diamante (Wild)", "Cofre (Scatter)", "Rubi", "Safira", "Esmeralda", "Ametista", "Topázio", "Quartzo", "Opala", "Jade"],
  },
  {
    id: "as-doceria",
    name: "Doceria Explosiva",
    cols: 6,
    rows: 5,
    mode: "anywhere",
    min: 8,
    weights: { 1: 1.15, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9, 8: 10, 9: 11 },
    freeWeights: { 1: 1.15, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9, 8: 10, 9: 11, 10: 1.2 },
    pays: { 2: [10, 25, 50], 3: [2.5, 10, 25], 4: [2, 5, 15], 5: [1.5, 2, 12], 6: [1, 1.5, 10], 7: [0.8, 1.2, 8], 8: [0.5, 1, 5], 9: [0.25, 0.75, 2] },
    mult: "bombs",
    freeSpins: { 4: 10, 5: 10, 6: 10 },
    symbols: ["—", "Pirulito (Scatter)", "Coração", "Estrela", "Lua", "Gota", "Donut", "Bala", "Jujuba", "Biscoito", "Bomba"],
  },
  {
    id: "as-mega",
    name: "Megafortuna 117.649",
    cols: 6,
    rows: 7,
    mega: true,
    mode: "ways",
    min: 3,
    weights: { 0: 1, 1: 1, 2: 3, 3: 4, 4: 5, 5: 6, 6: 8, 7: 9, 8: 10, 9: 11 },
    pays: { 2: [0.5, 1, 2.5, 5], 3: [0.4, 0.8, 2, 4], 4: [0.3, 0.6, 1.5, 3], 5: [0.25, 0.5, 1.2, 2.5], 6: [0.1, 0.25, 0.5, 1], 7: [0.1, 0.2, 0.4, 0.8], 8: [0.05, 0.15, 0.3, 0.6], 9: [0.05, 0.1, 0.25, 0.5] },
    mult: "plus1",
    freeSpins: { 4: 12, 5: 15, 6: 20 },
    symbols: ["Coroa (Wild)", "Baú (Scatter)", "Rei", "Rainha", "Cálice", "Cetro", "Anel", "Moeda", "Pergaminho", "Chave"],
  },
  {
    id: "as-colmeia",
    name: "Colmeia Dourada",
    cols: 7,
    rows: 7,
    mode: "cluster",
    min: 5,
    weights: { 1: 0.55, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9 },
    pays: { 2: [1, 1.5, 2.5, 5, 7.5, 12, 20, 40, 100], 3: [0.8, 1.2, 2, 4, 6, 10, 16, 32, 80], 4: [0.6, 0.9, 1.5, 3, 4.5, 7, 12, 24, 60], 5: [0.5, 0.75, 1.2, 2.5, 3.5, 6, 10, 20, 50], 6: [0.35, 0.5, 0.9, 1.8, 2.6, 4, 7, 14, 35], 7: [0.3, 0.45, 0.75, 1.5, 2.2, 3.5, 6, 12, 30], 8: [0.25, 0.35, 0.6, 1.2, 1.8, 3, 5, 10, 25] },
    mult: "spots",
    freeSpins: { 4: 10, 5: 12, 6: 15, 7: 20 },
    symbols: ["—", "Rainha (Scatter)", "Abelha rainha", "Pote de mel", "Flor", "Favo", "Gota de mel", "Pólen", "Folha"],
  },
  {
    id: "as-cristal",
    name: "Minas de Cristal",
    cols: 6,
    rows: 6,
    mode: "cluster",
    min: 5,
    weights: { 1: 0.75, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9 },
    pays: { 2: [1, 1.5, 2.5, 5, 7.5, 12, 20, 40, 100], 3: [0.8, 1.2, 2, 4, 6, 10, 16, 32, 80], 4: [0.6, 0.9, 1.5, 3, 4.5, 7, 12, 24, 60], 5: [0.5, 0.75, 1.2, 2.5, 3.5, 6, 10, 20, 50], 6: [0.35, 0.5, 0.9, 1.8, 2.6, 4, 7, 14, 35], 7: [0.3, 0.45, 0.75, 1.5, 2.2, 3.5, 6, 12, 30], 8: [0.25, 0.35, 0.6, 1.2, 1.8, 3, 5, 10, 25] },
    mult: "double",
    freeSpins: { 4: 8, 5: 10, 6: 12 },
    symbols: ["—", "Lanterna (Scatter)", "Diamante bruto", "Rubi", "Esmeralda", "Ametista", "Ouro", "Prata", "Carvão"],
  },
];

const clusterBucket = (n: number) => (n >= 15 ? 8 : n >= 13 ? 7 : n >= 11 ? 6 : Math.min(5, n - 5));
const anyBucket = (n: number) => (n >= 12 ? 2 : n >= 10 ? 1 : 0);
const BOMB_VALUES = [2, 3, 4, 5, 8, 10, 15, 20, 25, 50, 100];
const BOMB_W = [30, 22, 16, 12, 8, 5, 3, 2, 1.2, 0.5, 0.2];
const GONZO = [1, 2, 3, 5];
const GONZO_FS = [3, 6, 9, 15];

type Win = { symbol: number; cells: Cell[]; pay: number; ways?: number };
export type CascadeStep = { grid: number[][]; wins: Win[]; mult: number; win: number; bombs?: { cell: Cell; value: number }[]; spots?: number[][] };
export type CascadeSpin = { heights: number[]; steps: CascadeStep[]; win: number; scatters: number; freeSpinsWon: number; bombMult: number };

function pick(rng: Rng, weights: Record<number, number>) {
  const keys = Object.keys(weights).map(Number);
  return keys[rng.weighted(keys.map((k) => weights[k]))];
}

function evalGrid(spec: CascadeSpec, grid: number[][], scale: number): Win[] {
  const wins: Win[] = [];
  if (spec.mode === "ways") {
    for (let s = 2; s <= 9; s++) {
      let ways = 1;
      let reels = 0;
      const cells: Cell[] = [];
      for (let c = 0; c < grid.length; c++) {
        const hits = grid[c].map((x, r) => (x === s || x === W ? r : -1)).filter((r) => r >= 0);
        if (!hits.length) break;
        ways *= hits.length;
        reels++;
        hits.forEach((r) => cells.push([c, r]));
      }
      if (reels >= spec.min && spec.pays[s]?.[reels - 3]) wins.push({ symbol: s, cells, pay: spec.pays[s][reels - 3] * ways * scale, ways });
    }
  } else if (spec.mode === "anywhere") {
    const cnt = new Map<number, Cell[]>();
    grid.forEach((col, c) => col.forEach((x, r) => x >= 2 && x <= 9 && cnt.set(x, [...(cnt.get(x) ?? []), [c, r]])));
    for (const [s, cells] of cnt) if (cells.length >= spec.min) wins.push({ symbol: s, cells, pay: spec.pays[s][anyBucket(cells.length)] * scale });
  } else {
    const seen = new Set<string>();
    for (let c = 0; c < grid.length; c++)
      for (let r = 0; r < grid[c].length; r++) {
        const s = grid[c][r];
        if (s < 2 || s > 9 || seen.has(`${c}:${r}`)) continue;
        const group: Cell[] = [];
        const stack: Cell[] = [[c, r]];
        seen.add(`${c}:${r}`);
        while (stack.length) {
          const [a, b] = stack.pop()!;
          group.push([a, b]);
          for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const x = a + da;
            const y = b + db;
            if (x < 0 || x >= grid.length || y < 0 || y >= grid[x].length || seen.has(`${x}:${y}`) || grid[x][y] !== s) continue;
            seen.add(`${x}:${y}`);
            stack.push([x, y]);
          }
        }
        if (group.length >= spec.min) wins.push({ symbol: s, cells: group, pay: spec.pays[s][clusterBucket(group.length)] * scale });
      }
  }
  return wins;
}

/** Um giro completo com quedas. `st` guarda o estado entre giros grátis (multiplicador, casas). */
function cascadeSpin(spec: CascadeSpec, rng: Rng, inFree: boolean, scale: number, st: { mult: number; spots: number[][] | null }): CascadeSpin {
  const weights = inFree && spec.freeWeights ? spec.freeWeights : spec.weights;
  const heights = Array.from({ length: spec.cols }, () => (spec.mega ? 2 + rng.int(6) : spec.rows));
  let grid = heights.map((h) => Array.from({ length: h }, () => pick(rng, weights)));
  const steps: CascadeStep[] = [];
  let total = 0;
  let cascadeIdx = 0;
  const bombs: { cell: Cell; value: number }[] = [];
  const bombVal = new Map<string, number>();
  const assignBombs = () =>
    grid.forEach((col, c) =>
      col.forEach((x, r) => {
        if (x === BOMB && !bombVal.has(`${c}:${r}`)) bombVal.set(`${c}:${r}`, BOMB_VALUES[rng.weighted(BOMB_W)]);
      }),
    );
  if (spec.mult === "bombs") assignBombs();
  // casas multiplicadoras (colmeia): no jogo base começam zeradas a cada giro
  let spots = st.spots ?? grid.map((col) => col.map(() => 0));
  for (let guard = 0; guard < 60; guard++) {
    const wins = evalGrid(spec, grid, scale);
    let mult = 1;
    if (spec.mult === "gonzo") mult = (inFree ? GONZO_FS : GONZO)[Math.min(3, cascadeIdx)];
    else if (spec.mult === "double") mult = st.mult;
    else if (spec.mult === "plus1") mult = inFree ? st.mult : 1;
    let stepWin = 0;
    for (const w of wins) {
      let m = mult;
      if (spec.mult === "spots") {
        const sum = w.cells.reduce((a, [c, r]) => a + (spots[c][r] >= 2 ? spots[c][r] : 0), 0);
        m = sum > 0 ? sum : 1;
      }
      stepWin += w.pay * m;
    }
    const step: CascadeStep = { grid: grid.map((c) => c.slice()), wins, mult, win: stepWin };
    if (spec.mult === "spots") step.spots = spots.map((c) => c.slice());
    if (spec.mult === "bombs") step.bombs = [...bombVal.entries()].map(([k, value]) => ({ cell: k.split(":").map(Number) as Cell, value }));
    steps.push(step);
    if (!wins.length) break;
    total += stepWin;
    // atualiza multiplicadores para a próxima queda
    if (spec.mult === "double") st.mult = Math.min(1024, st.mult * 2);
    if (spec.mult === "plus1" && inFree) st.mult += 1;
    if (spec.mult === "spots") {
      for (const w of wins) for (const [c, r] of w.cells) spots[c][r] = spots[c][r] === 0 ? 1 : Math.min(128, spots[c][r] === 1 ? 2 : spots[c][r] * 2);
    }
    cascadeIdx++;
    // remove as casas vencedoras e deixa cair
    const dead = new Set<string>();
    wins.forEach((w) => w.cells.forEach(([c, r]) => dead.add(`${c}:${r}`)));
    grid = grid.map((col, c) => {
      const keep = col.filter((_, r) => !dead.has(`${c}:${r}`));
      const keptBombs: [number, number][] = [];
      if (spec.mult === "bombs") {
        // as bombas acompanham a queda
        let ri = 0;
        col.forEach((x, r) => {
          if (dead.has(`${c}:${r}`)) return;
          if (x === BOMB) keptBombs.push([r, ri]);
          ri++;
        });
      }
      const add = col.length - keep.length;
      const fresh = Array.from({ length: add }, () => pick(rng, weights));
      if (spec.mult === "bombs") {
        const moved = new Map<string, number>();
        for (const [oldR, idx] of keptBombs) {
          const v = bombVal.get(`${c}:${oldR}`);
          if (v != null) moved.set(`${c}:${idx + add}`, v);
        }
        for (const k of [...bombVal.keys()]) if (k.startsWith(`${c}:`)) bombVal.delete(k);
        for (const [k, v] of moved) bombVal.set(k, v);
      }
      return [...fresh, ...keep];
    });
    if (spec.mult === "bombs") assignBombs();
  }
  // bombas: se a sequência pagou, a soma das bombas na tela multiplica o total
  let bombMult = 1;
  if (spec.mult === "bombs" && total > 0 && bombVal.size) {
    bombMult = [...bombVal.values()].reduce((a, b) => a + b, 0);
    total *= bombMult;
  }
  if (spec.mult === "spots" && inFree) st.spots = spots;
  const last = steps[steps.length - 1].grid;
  const scatters = last.reduce((a, col) => a + col.filter((x) => x === SC).length, 0);
  const minSc = Math.min(...Object.keys(spec.freeSpins).map(Number));
  let freeSpinsWon = 0;
  if (scatters >= minSc) freeSpinsWon = inFree ? 5 : spec.freeSpins[Math.min(Math.max(...Object.keys(spec.freeSpins).map(Number)), scatters)] ?? 0;
  return { heights, steps, win: total, scatters, freeSpinsWon, bombMult };
}

export function playCascade(spec: CascadeSpec, rng: Rng, buy: boolean, scaleOverride?: number) {
  const scale = scaleOverride ?? advScale(spec.id);
  const st = { mult: 1, spots: null as number[][] | null };
  const base = buy ? null : cascadeSpin(spec, rng, false, scale, st);
  // no jogo base o multiplicador "double" volta para 1 a cada giro
  st.mult = 1;
  const minSc = Math.min(...Object.keys(spec.freeSpins).map(Number));
  let remaining = buy ? spec.freeSpins[minSc] : base!.freeSpinsWon;
  let granted = remaining;
  const free: CascadeSpin[] = [];
  let total = base?.win ?? 0;
  if (remaining > 0 && spec.mult === "spots") st.spots = Array.from({ length: spec.cols }, () => Array(spec.rows).fill(0));
  while (remaining > 0 && total < MAX_WIN) {
    remaining--;
    const s = cascadeSpin(spec, rng, true, scale, st);
    free.push(s);
    total += s.win;
    if (s.freeSpinsWon && granted < 60) {
      granted += s.freeSpinsWon;
      remaining += s.freeSpinsWon;
    }
  }
  return { base, free, multiplier: Math.min(MAX_WIN, total), bought: buy, freeSpinsTotal: granted };
}

export function makeCascade(spec: CascadeSpec): InstantGame {
  return {
    kind: "instant",
    totalBet: (p, bet) => (p?.buy === true ? bet * advBuy(spec.id) : bet),
    play(rng, p, bet) {
      const r = playCascade(spec, rng, p?.buy === true);
      return { payout: floorPay(bet * r.multiplier), result: r };
    },
  };
}

/* ====================================================================== linhas 5x3 (base dos três slots a seguir) */
export const LINES = [
  [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2], [1, 0, 1, 2, 1], [1, 2, 1, 0, 1], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 0, 2, 0, 0], [2, 2, 0, 2, 2], [0, 2, 0, 2, 0],
];
const LINE_PAYS: Record<number, [number, number, number]> = {
  2: [25, 100, 500], 3: [15, 60, 250], 4: [12, 40, 150], 5: [10, 30, 120], 6: [5, 15, 60], 7: [4, 12, 50], 8: [3, 10, 40], 9: [3, 8, 30],
};
export type LineWin = { line: number; symbol: number; count: number; mult: number; cells: Cell[] };
function evalLines(grid: number[][], scale: number, lineBet = 1 / 20): { wins: LineWin[]; sum: number } {
  const wins: LineWin[] = [];
  let sum = 0;
  LINES.forEach((rows, li) => {
    let sym = -1;
    let count = 0;
    for (let reel = 0; reel < 5; reel++) {
      const c = grid[reel][rows[reel]];
      if (c === W) {
        count++;
        continue;
      }
      if (c < 2 || c > 9) break;
      if (sym === -1) sym = c;
      if (c === sym) count++;
      else break;
    }
    if (sym === -1 && count >= 3) sym = 2;
    if (sym === -1 || count < 3) return;
    const m = LINE_PAYS[sym][count - 3] * scale * lineBet;
    sum += m;
    wins.push({ line: li, symbol: sym, count, mult: m, cells: rows.slice(0, count).map((r, reel) => [reel, r] as Cell) });
  });
  return { wins, sum };
}
function spinStrips(rng: Rng, weights: Record<number, number>[], rows = 3) {
  return weights.map((w) => Array.from({ length: rows }, () => pick(rng, w)));
}
const reelW = (extra: Record<number, number> = {}, wild = true): Record<number, number>[] =>
  [0, 1, 2, 3, 4].map((r) => {
    const w: Record<number, number> = { 2: 2, 3: 3, 4: 3, 5: 4, 6: 5, 7: 5, 8: 6, 9: 6, ...extra };
    if (wild && r >= 1 && r <= 3) w[W] = 1;
    return w;
  });

/* ====================================================================== 25 · Hold & Win das Moedas */
export const HW = {
  id: "as-holdwin",
  name: "Hold & Win das Moedas",
  trigger: 6,
  respins: 3,
  coinValues: [1, 2, 3, 5, 10, 15, 25],
  coinW: [30, 25, 18, 12, 8, 4, 3],
  jackpots: { mini: 20, minor: 50, major: 200, grand: 1000 } as Record<string, number>,
  jackW: { mini: 1.5, minor: 0.5, major: 0.12 } as Record<string, number>,
  respinCoinP: 0.075,
  symbols: ["Cofre (Wild)", "—", "Barra de ouro", "Saco de moedas", "Cédula", "Porquinho", "Cifrão", "Chave", "Lingote", "Moedinha", "Moeda"],
};
type Coin = { cell: Cell; value: number; jackpot?: string };
function drawCoin(rng: Rng, cell: Cell): Coin {
  const all = [...HW.coinW, HW.jackW.mini, HW.jackW.minor, HW.jackW.major];
  const i = rng.weighted(all);
  if (i < HW.coinValues.length) return { cell, value: HW.coinValues[i] };
  const j = ["mini", "minor", "major"][i - HW.coinValues.length];
  return { cell, value: HW.jackpots[j], jackpot: j };
}
export function playHoldWin(rng: Rng, buy: boolean, scaleOverride?: number) {
  const scale = scaleOverride ?? advScale(HW.id);
  const grid = spinStrips(rng, reelW({ 10: 4.6 }));
  let base: { grid: number[][]; wins: LineWin[]; lineWin: number; coins: Coin[] } | null = null;
  let coins: Coin[] = [];
  if (!buy) {
    const { wins, sum } = evalLines(grid, scale);
    grid.forEach((col, c) => col.forEach((x, r) => x === 10 && coins.push(drawCoin(rng, [c, r]))));
    base = { grid, wins, lineWin: sum, coins };
  } else {
    // compra: começa com 6 moedas em posições sorteadas
    const pos = rng.pickUnique(15, HW.trigger);
    coins = pos.map((p) => drawCoin(rng, [Math.floor(p / 3), p % 3]));
  }
  let total = base?.lineWin ?? 0;
  let feature: { start: Coin[]; rounds: Coin[][]; final: Coin[]; grand: boolean; win: number } | null = null;
  if (coins.length >= HW.trigger) {
    const locked = new Map(coins.map((c) => [`${c.cell[0]}:${c.cell[1]}`, c]));
    const rounds: Coin[][] = [];
    let left = HW.respins;
    while (left > 0 && locked.size < 15) {
      const fresh: Coin[] = [];
      for (let c = 0; c < 5; c++)
        for (let r = 0; r < 3; r++) {
          if (locked.has(`${c}:${r}`)) continue;
          if (rng.float() < HW.respinCoinP) {
            const coin = drawCoin(rng, [c, r]);
            locked.set(`${c}:${r}`, coin);
            fresh.push(coin);
          }
        }
      rounds.push(fresh);
      left = fresh.length ? HW.respins : left - 1;
    }
    const final = [...locked.values()];
    const grand = final.length === 15;
    const win = final.reduce((a, c) => a + c.value, 0) + (grand ? HW.jackpots.grand : 0);
    feature = { start: coins, rounds, final, grand, win };
    total += win;
  }
  return { base, feature, multiplier: Math.min(MAX_WIN, total), bought: buy };
}
export const holdWin: InstantGame = {
  kind: "instant",
  totalBet: (p, bet) => (p?.buy === true ? bet * advBuy(HW.id) : bet),
  play(rng, p, bet) {
    const r = playHoldWin(rng, p?.buy === true);
    return { payout: floorPay(bet * r.multiplier), result: r };
  },
};

/* ====================================================================== 28 · Duplo Slot */
export const TWIN = { id: "as-duplo", name: "Duplo Slot", freeSpins: 10, symbols: ["Espelho (Wild)", "Portal (Scatter)", "Gêmeos", "Lua dupla", "Sol duplo", "Cometa", "Planeta", "Estrela", "Nebulosa", "Asteroide"] };
export function playTwin(rng: Rng, buy: boolean, scaleOverride?: number) {
  const scale = scaleOverride ?? advScale(TWIN.id);
  const one = (inFree: boolean) => {
    const w = reelW({ [SC]: 0.36 });
    const top = spinStrips(rng, w);
    const bottom = spinStrips(rng, w);
    const copied: Cell[] = [];
    // wilds de cima são copiados para baixo (nos giros grátis, nos dois sentidos)
    top.forEach((col, c) => col.forEach((x, r) => x === W && bottom[c][r] !== W && bottom[c][r] !== SC && (bottom[c][r] = W, copied.push([c, r]))));
    if (inFree) bottom.forEach((col, c) => col.forEach((x, r) => x === W && top[c][r] !== W && top[c][r] !== SC && (top[c][r] = W, copied.push([c, r]))));
    const a = evalLines(top, scale, 1 / 40);
    const b = evalLines(bottom, scale, 1 / 40);
    const sc = [...top, ...bottom].reduce((n, col) => n + col.filter((x) => x === SC).length, 0);
    const mult = inFree ? 2 : 1;
    return { top, bottom, copied, winsTop: a.wins, winsBottom: b.wins, win: (a.sum + b.sum) * mult, mult, scatters: sc, freeSpinsWon: sc >= 3 ? (inFree ? 5 : TWIN.freeSpins) : 0 };
  };
  const base = buy ? null : one(false);
  let remaining = buy ? TWIN.freeSpins : base!.freeSpinsWon;
  let total = base?.win ?? 0;
  const free: ReturnType<typeof one>[] = [];
  let granted = remaining;
  while (remaining > 0 && total < MAX_WIN) {
    remaining--;
    const s = one(true);
    free.push(s);
    total += s.win;
    if (s.freeSpinsWon && granted < 60) {
      granted += 5;
      remaining += 5;
    }
  }
  return { base, free, multiplier: Math.min(MAX_WIN, total), bought: buy, freeSpinsTotal: granted };
}
export const twinSlot: InstantGame = {
  kind: "instant",
  totalBet: (p, bet) => (p?.buy === true ? bet * advBuy(TWIN.id) : bet),
  play(rng, p, bet) {
    const r = playTwin(rng, p?.buy === true);
    return { payout: floorPay(bet * r.multiplier), result: r };
  },
};

/* ====================================================================== 29 · Jackpot em Pirâmide (estado por jogador) */
export const PYR = {
  id: "as-piramide",
  name: "Jackpot em Pirâmide",
  perLevel: 10,
  prizes: [3, 6, 12, 25, 100],
  ankhWeight: 0.15,
  symbols: ["Esfinge (Wild)", "—", "Faraó", "Escaravelho", "Anubis", "Olho de Hórus", "Ankh", "Pirâmide", "Lótus", "Papiro", "Ankh dourado"],
};
export type PyrState = Record<string, { level: number; count: number }>;
export function playPyramid(rng: Rng, bet: number, state: PyrState | null, scaleOverride?: number) {
  const scale = scaleOverride ?? advScale(PYR.id);
  const grid = spinStrips(rng, reelW({ 10: PYR.ankhWeight }));
  const { wins, sum } = evalLines(grid, scale);
  const key = String(bet);
  const prev = { ...(state?.[key] ?? { level: 0, count: 0 }) };
  const cur = { ...prev };
  const ankhs: Cell[] = [];
  grid.forEach((col, c) => col.forEach((x, r) => x === 10 && ankhs.push([c, r])));
  const levelUps: { level: number; prize: number }[] = [];
  for (let i = 0; i < ankhs.length; i++) {
    cur.count++;
    if (cur.count >= PYR.perLevel) {
      levelUps.push({ level: cur.level, prize: PYR.prizes[cur.level] });
      cur.count = 0;
      cur.level = (cur.level + 1) % PYR.prizes.length;
    }
  }
  const prize = levelUps.reduce((a, l) => a + l.prize, 0);
  const next: PyrState = { ...(state ?? {}), [key]: cur };
  return { result: { grid, wins, lineWin: sum, ankhs, prev, cur, levelUps, multiplier: Math.min(MAX_WIN, sum + prize) }, state: next };
}

/* ====================================================================== 30 · Slot de Rodas */
// 3 rodas iguais de 12 casas: 0 dragão (wild, dobra), 1 bônus, 2 coroa, 3 diamante, 4 sino, 5 estrela, 6 trevo, 7 vazio
export const WHEEL_SEGS = [7, 5, 3, 7, 6, 2, 7, 4, 1, 6, 0, 5, 7, 4, 6, 3];
export const WHEEL_PAYS: Record<number, number> = { 0: 500, 2: 100, 3: 50, 4: 25, 5: 15, 6: 8 };
export const WHEEL_ANY2 = 1; // dois dragões em qualquer lugar
export const BIG_WHEEL = [10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 250, 1000];
export function wheelsEval(s: number[]) {
  const wilds = s.filter((x) => x === 0).length;
  const bonus = s.every((x) => x === 1);
  if (bonus) return { kind: "bonus", mult: 0 };
  if (wilds === 3) return { kind: "three", symbol: 0, mult: WHEEL_PAYS[0] };
  const others = s.filter((x) => x !== 0);
  const same = others.every((x) => x === others[0]);
  if (same && others[0] >= 2 && others[0] <= 6) return { kind: "three", symbol: others[0], mult: WHEEL_PAYS[others[0]] * (wilds ? 2 ** wilds : 1) };
  if (wilds === 2) return { kind: "two", mult: WHEEL_ANY2 * 4 };
  if (wilds === 1) return { kind: "one", mult: 0 };
  return { kind: "none", mult: 0 };
}
export const wheelSlot: InstantGame = {
  kind: "instant",
  totalBet: (_p, bet) => bet,
  play(rng, _p, bet) {
    const stops = [0, 1, 2].map(() => rng.int(WHEEL_SEGS.length));
    const syms = stops.map((i) => WHEEL_SEGS[i]);
    const e = wheelsEval(syms);
    let big: { stop: number; mult: number } | null = null;
    let mult = e.mult * advScale("as-rodas");
    if (e.kind === "bonus") {
      const stop = rng.int(BIG_WHEEL.length);
      big = { stop, mult: BIG_WHEEL[stop] };
      mult = big.mult;
    }
    mult = Math.round(mult * 100) / 100;
    return { payout: floorPay(bet * mult), result: { stops, symbols: syms, kind: e.kind, symbol: (e as any).symbol ?? null, big, multiplier: mult } };
  },
};

export const __adv = { playCascade, playHoldWin, playTwin, playPyramid, evalLines };

/** Jogo com estado persistente: o serviço injeta `__state` (estado anterior) e `bet` nos parâmetros. */
export const pyramidGame: InstantGame & { stateful: true } = {
  kind: "instant",
  stateful: true,
  totalBet: (_p, bet) => bet,
  play(rng, p, bet) {
    const r = playPyramid(rng, bet, (p?.__state as PyrState) ?? null);
    return { payout: floorPay(bet * r.result.multiplier), result: { ...r.result, stateAfter: r.state } };
  },
};

export const ADV_SLOTS: Record<string, InstantGame> = {
  ...Object.fromEntries(CASCADES.map((s) => [s.id, makeCascade(s)])),
  [HW.id]: holdWin,
  [TWIN.id]: twinSlot,
  "as-rodas": wheelSlot,
  [PYR.id]: pyramidGame,
};
export const ADV_NAMES: Record<string, string> = {
  ...Object.fromEntries(CASCADES.map((s) => [s.id, s.name])),
  [HW.id]: HW.name,
  [TWIN.id]: TWIN.name,
  [PYR.id]: PYR.name,
  "as-rodas": "Slot de Rodas",
};

export function advPublicConfig() {
  return {
    cascades: CASCADES.map((s) => ({ id: s.id, name: s.name, cols: s.cols, rows: s.rows, mega: !!s.mega, mode: s.mode, min: s.min, mult: s.mult, freeSpins: s.freeSpins, symbols: s.symbols, buyPrice: advBuy(s.id), pays: Object.fromEntries(Object.entries(s.pays).map(([k, v]) => [k, v.map((x) => +(x * advScale(s.id)).toFixed(2))])) })),
    holdwin: { ...HW, buyPrice: advBuy(HW.id), linePays: Object.fromEntries(Object.entries(LINE_PAYS).map(([k, v]) => [k, v.map((x) => +(x * advScale(HW.id)).toFixed(2))])) },
    twin: { ...TWIN, buyPrice: advBuy(TWIN.id), linePays: Object.fromEntries(Object.entries(LINE_PAYS).map(([k, v]) => [k, v.map((x) => +(x * advScale(TWIN.id)).toFixed(2))])) },
    pyramid: { ...PYR, linePays: Object.fromEntries(Object.entries(LINE_PAYS).map(([k, v]) => [k, v.map((x) => +(x * advScale(PYR.id)).toFixed(2))])) },
    wheels: { segs: WHEEL_SEGS, pays: Object.fromEntries(Object.entries(WHEEL_PAYS).map(([k, v]) => [k, +(v * advScale("as-rodas")).toFixed(2)])), any2: +(WHEEL_ANY2 * 4 * advScale("as-rodas")).toFixed(2), big: BIG_WHEEL },
    lines: LINES,
  };
}

