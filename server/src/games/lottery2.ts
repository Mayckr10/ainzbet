/**
 * Onda 1 · sorteios, loterias e raspadinhas.
 */
import type { Rng } from "../fair.js";
import { assert, floorPay, type InstantGame } from "./types.js";

/* ------------------------------------------------------------------ 71 · Raspadinha do Faraó (3 iguais) */
// 7 símbolos do Faraó; índice = símbolo da arte (0 = maior prêmio)
export const PHARAOH_TIERS = [
  { mult: 5000, p: 0.000002 },
  { mult: 500, p: 0.00008 },
  { mult: 50, p: 0.002 },
  { mult: 10, p: 0.015 },
  { mult: 5, p: 0.04 },
  { mult: 2, p: 0.11 },
  { mult: 1, p: 0.24 },
];

function threeOfKindTicket(rng: Rng, tiers: { mult: number; p: number }[]) {
  const loseP = 1 - tiers.reduce((s, t) => s + t.p, 0);
  const t = rng.weighted([...tiers.map((x) => x.p), loseP]);
  const win = t < tiers.length ? t : -1;
  const grid: number[] = new Array(9).fill(-1);
  const counts = new Array(tiers.length).fill(0);
  const pos = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  let k = 0;
  if (win >= 0) {
    for (let i = 0; i < 3; i++) grid[pos[k++]] = win;
    counts[win] = 3;
  }
  while (k < 9) {
    const opts = tiers.map((_, i) => i).filter((i) => i !== win && counts[i] < 2);
    const s = opts[rng.weighted(opts.map((i) => (i <= 1 ? 1 : i <= 3 ? 2 : 4)))];
    grid[pos[k++]] = s;
    counts[s]++;
  }
  return { grid, win, mult: win >= 0 ? tiers[win].mult : 0 };
}

export const scratchPharaoh: InstantGame = {
  kind: "instant",
  totalBet: (_p, bet) => bet,
  play(rng, _p, bet) {
    const t = threeOfKindTicket(rng, PHARAOH_TIERS);
    const winCells = t.win >= 0 ? t.grid.map((s, i) => (s === t.win ? i : -1)).filter((i) => i >= 0) : [];
    return { payout: floorPay(bet * t.mult), result: { grid: t.grid, win: t.win, winCells, multiplier: t.mult } };
  },
};

/* ------------------------------------------------------------------ 73 · Raspadinha Multiplicadora */
export const SM_VALUES = [
  { m: 0, p: 0.5607 }, { m: 0.5, p: 0.2 }, { m: 1, p: 0.13 }, { m: 2, p: 0.07 }, { m: 5, p: 0.035 }, { m: 20, p: 0.004 }, { m: 100, p: 0.0003 },
];
export const SM_MULTS = [
  { m: 1, p: 0.7 }, { m: 2, p: 0.2 }, { m: 3, p: 0.07 }, { m: 5, p: 0.025 }, { m: 10, p: 0.005 },
];
export const scratchMult: InstantGame = {
  kind: "instant",
  totalBet: (_p, bet) => bet,
  play(rng, _p, bet) {
    const value = SM_VALUES[rng.weighted(SM_VALUES.map((v) => v.p))].m;
    const mult = SM_MULTS[rng.weighted(SM_MULTS.map((v) => v.p))].m;
    // "iscas" visuais nas outras casas da área de valor (sempre diferentes do valor sorteado)
    const decoys = Array.from({ length: 5 }, () => SM_VALUES[1 + rng.int(SM_VALUES.length - 1)].m);
    const total = value * mult;
    return { payout: floorPay(bet * total), result: { value, mult, decoys, multiplier: total } };
  },
};

/* ------------------------------------------------------------------ 74 · Mega Sena Virtual (6 de 60) */
export const MEGA_PAYS: Record<number, number> = { 2: 3, 3: 50, 4: 300, 5: 10000, 6: 50000 };
export const megaSena: InstantGame = {
  kind: "instant",
  totalBet(p, bet) {
    assert(Array.isArray(p?.picks) && p.picks.length === 6);
    const s = new Set(p.picks);
    assert(s.size === 6 && p.picks.every((n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 60));
    return bet;
  },
  play(rng, p, bet) {
    const drawn = rng.pickUnique(60, 6).map((n) => n + 1);
    const hits = p.picks.filter((n: number) => drawn.includes(n)).length;
    const mult = MEGA_PAYS[hits] ?? 0;
    return { payout: floorPay(bet * mult), result: { drawn, hits, multiplier: mult } };
  },
};

/* ------------------------------------------------------------------ 75 · Bingo 90 bolas (cartela 3x9) */
export const B90_DRAWS = 50;
export const B90_PAYS = { line1: 4.8, line2: 40, full: 2000 } as const;
/** Gera uma cartela britânica: 3 linhas × 9 colunas, 5 números por linha, coluna c tem números de c·10 (+1) a c·10+9 (90 na última). */
export function b90Ticket(rng: Rng): number[][] {
  // escolhe as colunas de cada linha garantindo que toda coluna tenha ao menos um número
  for (;;) {
    const rows = [0, 1, 2].map(() => rng.pickUnique(9, 5).sort((a, b) => a - b));
    const used = new Set(rows.flat());
    if (used.size < 9) continue;
    const grid: number[][] = [0, 1, 2].map(() => new Array(9).fill(0));
    for (let c = 0; c < 9; c++) {
      const lo = c === 0 ? 1 : c * 10;
      const hi = c === 8 ? 90 : c * 10 + 9;
      const rs = [0, 1, 2].filter((r) => rows[r].includes(c));
      const nums = rng.pickUnique(hi - lo + 1, rs.length).map((x) => x + lo).sort((a, b) => a - b);
      rs.forEach((r, i) => (grid[r][c] = nums[i]));
    }
    return grid;
  }
}
export const bingo90: InstantGame = {
  kind: "instant",
  totalBet: (_p, bet) => bet,
  play(rng, _p, bet) {
    const ticket = b90Ticket(rng);
    const draws = rng.pickUnique(90, B90_DRAWS).map((n) => n + 1);
    // momento (índice do sorteio) em que cada linha se completou
    const at = new Map(draws.map((n, i) => [n, i]));
    const rowDone = ticket.map((row) => {
      const nums = row.filter((n) => n > 0);
      return nums.every((n) => at.has(n)) ? Math.max(...nums.map((n) => at.get(n)!)) : -1;
    });
    const lines = rowDone.filter((x) => x >= 0).length;
    const mult = lines === 3 ? B90_PAYS.full : lines === 2 ? B90_PAYS.line2 : lines === 1 ? B90_PAYS.line1 : 0;
    return { payout: floorPay(bet * mult), result: { ticket, draws, rowDone, lines, multiplier: mult } };
  },
};

/* ------------------------------------------------------------------ 76 · Bingo Relâmpago (75 bolas, 20 sorteadas, padrões) */
export const BF_DRAWS = 30;
// padrões na cartela 5x5 (centro livre)
export const BF_PATTERNS: { key: string; name: string; cells: number[][]; pay: number }[] = [
  { key: "frame", name: "Moldura", pay: 50000, cells: [[0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24]] },
  { key: "x", name: "X", pay: 300, cells: [[0, 6, 12, 18, 24, 4, 8, 16, 20]] },
  { key: "line", name: "Linha", pay: 4.5, cells: [] }, // preenchido abaixo
  { key: "corners", name: "4 Cantos", pay: 10, cells: [[0, 4, 20, 24]] },
];
(() => {
  const L: number[][] = [];
  for (let r = 0; r < 5; r++) L.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
  for (let c = 0; c < 5; c++) L.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
  L.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]);
  BF_PATTERNS[2].cells = L;
})();
export function bfCard(rng: Rng) {
  const card: number[] = [];
  const cols = [0, 1, 2, 3, 4].map((c) => rng.pickUnique(15, 5).map((x) => x + 1 + c * 15));
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) card.push(r === 2 && c === 2 ? 0 : cols[c][r]);
  return card;
}
export const bingoFlash: InstantGame = {
  kind: "instant",
  totalBet: (_p, bet) => bet,
  play(rng, _p, bet) {
    const card = bfCard(rng);
    const draws = rng.pickUnique(75, BF_DRAWS).map((n) => n + 1);
    const set = new Set(draws);
    const marked = (i: number) => i === 12 || set.has(card[i]);
    // paga só o melhor padrão
    let best: { key: string; cells: number[]; pay: number } | null = null;
    for (const p of BF_PATTERNS) {
      const hit = p.cells.find((cs) => cs.every(marked));
      if (hit && (!best || p.pay > best.pay)) best = { key: p.key, cells: hit, pay: p.pay };
    }
    const mult = best?.pay ?? 0;
    return { payout: floorPay(bet * mult), result: { card, draws, pattern: best?.key ?? null, cells: best?.cells ?? [], multiplier: mult } };
  },
};

/* ------------------------------------------------------------------ 78 · Jogo do Bicho (fichas virtuais) */
export const BICHOS = [
  "Avestruz", "Águia", "Burro", "Borboleta", "Cachorro", "Cabra", "Carneiro", "Camelo", "Cobra", "Coelho",
  "Cavalo", "Elefante", "Galo", "Gato", "Jacaré", "Leão", "Macaco", "Porco", "Pavão", "Peru",
  "Touro", "Tigre", "Urso", "Veado", "Vaca",
];
/** grupo (1..25) da dezena 00..99: 01-04 → 1 ... 97-00 → 25 */
export const bichoGroup = (dezena: number) => (dezena === 0 ? 25 : Math.ceil(dezena / 4));
export const BICHO_MODES: Record<string, { pay: number; label: string }> = {
  grupo: { pay: 24, label: "Grupo (cabeça)" },
  grupo15: { pay: 5.2, label: "Grupo do 1º ao 5º" },
  dezena: { pay: 96, label: "Dezena (cabeça)" },
  centena: { pay: 960, label: "Centena (cabeça)" },
  milhar: { pay: 9600, label: "Milhar (cabeça)" },
};
export const bicho: InstantGame = {
  kind: "instant",
  totalBet(p, bet) {
    assert(p && p.mode in BICHO_MODES && Number.isInteger(p.value));
    const v = p.value;
    if (p.mode === "grupo" || p.mode === "grupo15") assert(v >= 1 && v <= 25);
    else if (p.mode === "dezena") assert(v >= 0 && v <= 99);
    else if (p.mode === "centena") assert(v >= 0 && v <= 999);
    else assert(v >= 0 && v <= 9999);
    return bet;
  },
  play(rng, p, bet) {
    const prizes = Array.from({ length: 5 }, () => rng.int(10000)); // milhares do 1º ao 5º prêmio
    const head = prizes[0];
    let win = false;
    if (p.mode === "grupo") win = bichoGroup(head % 100) === p.value;
    else if (p.mode === "grupo15") win = prizes.some((m) => bichoGroup(m % 100) === p.value);
    else if (p.mode === "dezena") win = head % 100 === p.value;
    else if (p.mode === "centena") win = head % 1000 === p.value;
    else win = head === p.value;
    const mult = win ? BICHO_MODES[p.mode].pay : 0;
    return { payout: floorPay(bet * mult), result: { prizes, groups: prizes.map((m) => bichoGroup(m % 100)), win, multiplier: mult } };
  },
};
