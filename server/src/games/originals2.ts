/**
 * Onda 1 · originais rápidos de rodada única (instantâneos).
 * Todos com RTP entre 96% e 99%, conferidos por cálculo exato ou simulação (scripts/rtp-wave1.ts).
 */
import { crashPoint } from "../fair.js";
import { PLINKO_TABLES } from "./simple.js";
import { assert, floorPay, type InstantGame } from "./types.js";

const r2 = (x: number) => Math.floor(x * 100 + 1e-9) / 100;
const r4 = (x: number) => Math.floor(x * 10000 + 1e-9) / 10000;

/* ------------------------------------------------------------------ 34 · Dados Over/Under */
export const OU_EDGE = 0.98;
export function ouChance(target: number, dir: "over" | "under") {
  return dir === "under" ? target : 100 - target;
}
export const ouMult = (chance: number) => r4((OU_EDGE * 100) / chance);

export const overunder: InstantGame = {
  kind: "instant",
  totalBet(p, bet) {
    assert(p && (p.dir === "over" || p.dir === "under"));
    assert(typeof p.target === "number" && p.target >= 2 && p.target <= 98 && Math.abs(p.target * 100 - Math.round(p.target * 100)) < 1e-6);
    return bet;
  },
  play(rng, p, bet) {
    const target = Math.round(p.target * 100) / 100;
    const roll = rng.int(10000) / 100; // 0,00 .. 99,99
    const win = p.dir === "under" ? roll < target : roll >= target;
    const mult = win ? ouMult(ouChance(target, p.dir)) : 0;
    return { payout: floorPay(bet * mult), result: { roll, target, dir: p.dir, win, multiplier: mult } };
  },
};

/* ------------------------------------------------------------------ 35 · Roda Wheel */
export const WHEEL_SEGMENTS = [10, 20, 30, 40, 50] as const;
export function wheelTable(n: number, risk: string): number[] {
  const out: number[] = [];
  if (risk === "low") {
    // a cada 10: 1× 1,5x · 7× 1,2x · 2× 0x  → 99%
    const base = [1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0];
    for (let i = 0; i < n; i++) out.push(base[i % 10]);
  } else if (risk === "medium") {
    // a cada 10: 0 · 1,9 · 0 · 1,5 · 0 · 2 · 0 · 1,5 · 0 · 3  → 99%
    const base = [0, 1.9, 0, 1.5, 0, 2, 0, 1.5, 0, 3];
    for (let i = 0; i < n; i++) out.push(base[i % 10]);
    if (n >= 30) {
      // um segmento de destaque troca 3x por 3x + (n/10-1)·... mantendo a média
      const k = out.lastIndexOf(3);
      const extra = n / 10 - 1; // pega o valor de (n/10 - 1) segmentos 3x e concentra em um só
      let removed = 0;
      for (let i = 0; i < out.length && removed < extra; i++) if (out[i] === 3 && i !== k) {
        out[i] = 0;
        removed++;
      }
      out[k] = 3 * (extra + 1);
    }
  } else {
    // alto: um único segmento paga 0,99·n
    for (let i = 0; i < n; i++) out.push(0);
    out[0] = r2(0.99 * n);
  }
  return out;
}

export const wheel: InstantGame = {
  kind: "instant",
  totalBet(p, bet) {
    assert(p && (WHEEL_SEGMENTS as readonly number[]).includes(p.segments) && ["low", "medium", "high"].includes(p.risk));
    return bet;
  },
  play(rng, p, bet) {
    const table = wheelTable(p.segments, p.risk);
    const index = rng.int(table.length);
    const mult = table[index];
    return { payout: floorPay(bet * mult), result: { index, multiplier: mult, segments: p.segments, risk: p.risk } };
  },
};

/* ------------------------------------------------------------------ 43 · Limbo Turbo */
export const LIMBO_TURBO_COUNTS = [5, 10, 20];
export const limboTurbo: InstantGame = {
  kind: "instant",
  totalBet(p, bet) {
    assert(p && typeof p.target === "number" && p.target >= 1.01 && p.target <= 50_000 && LIMBO_TURBO_COUNTS.includes(p.count));
    return bet * p.count;
  },
  play(rng, p, bet) {
    const target = Math.floor(p.target * 100) / 100;
    const results: number[] = [];
    let wins = 0;
    for (let i = 0; i < p.count; i++) {
      const x = crashPoint(rng.float());
      results.push(x);
      if (x >= target) wins++;
    }
    const payout = floorPay(bet * target * wins);
    return { payout, result: { results, target, wins, count: p.count, multiplier: payout / (bet * p.count) } };
  },
};

/* ------------------------------------------------------------------ 40 · Cofre Secreto */
export const SAFE_MULT = [0, 9.7, 97, 970, 9700];
export const safeCode: InstantGame = {
  kind: "instant",
  totalBet(p, bet) {
    assert(p && Number.isInteger(p.digits) && p.digits >= 1 && p.digits <= 4);
    assert(typeof p.code === "string" && new RegExp(`^[0-9]{${p.digits}}$`).test(p.code));
    return bet;
  },
  play(rng, p, bet) {
    const code = Array.from({ length: p.digits }, () => rng.int(10)).join("");
    const match = [...code].map((d, i) => d === p.code[i]);
    const win = code === p.code;
    const mult = win ? SAFE_MULT[p.digits] : 0;
    return { payout: floorPay(bet * mult), result: { code, guess: p.code, match, win, multiplier: mult } };
  },
};

/* ------------------------------------------------------------------ 39 · Diamantes 5 */
export const DIAMOND_COLORS = 7;
export const DIAMOND_PAYS: Record<string, number> = { five: 50, four: 5, full: 4, three: 3, twopair: 2, pair: 0.1, none: 0 };
export function diamondsHand(gems: number[]) {
  const counts = new Map<number, number>();
  for (const g of gems) counts.set(g, (counts.get(g) ?? 0) + 1);
  const c = [...counts.values()].sort((a, b) => b - a);
  const kind = c[0] === 5 ? "five" : c[0] === 4 ? "four" : c[0] === 3 && c[1] === 2 ? "full" : c[0] === 3 ? "three" : c[0] === 2 && c[1] === 2 ? "twopair" : c[0] === 2 ? "pair" : "none";
  // gemas que fazem parte da combinação
  const winGems = new Set([...counts.entries()].filter(([, n]) => n >= 2).map(([g]) => g));
  return { kind, win: gems.map((g) => winGems.has(g)) };
}
export const diamonds: InstantGame = {
  kind: "instant",
  totalBet: (_p, bet) => bet,
  play(rng, _p, bet) {
    const gems = Array.from({ length: 5 }, () => rng.int(DIAMOND_COLORS));
    const h = diamondsHand(gems);
    const mult = DIAMOND_PAYS[h.kind];
    return { payout: floorPay(bet * mult), result: { gems, kind: h.kind, win: h.win, multiplier: mult } };
  },
};

/* ------------------------------------------------------------------ 79 · Loto Dados (soma de 5 dados) */
export const LOTO_EDGE = 0.97;
export const LOTO_DIST: number[] = (() => {
  let d = [1];
  for (let k = 0; k < 5; k++) {
    const n = new Array(d.length + 6).fill(0);
    d.forEach((v, s) => {
      for (let f = 1; f <= 6; f++) n[s + f] += v;
    });
    d = n;
  }
  const total = 6 ** 5;
  return d.map((v) => v / total); // índice = soma (0..30)
})();
export function lotoProb(type: string, value: number) {
  let p = 0;
  for (let s = 5; s <= 30; s++) {
    const hit = type === "exact" ? s === value : type === "under" ? s < value : s > value;
    if (hit) p += LOTO_DIST[s];
  }
  return p;
}
export const lotoMult = (type: string, value: number) => {
  const p = lotoProb(type, value);
  return p > 0 ? r2(LOTO_EDGE / p) : 0;
};
export const lotoDice: InstantGame = {
  kind: "instant",
  totalBet(p, bet) {
    assert(p && ["exact", "under", "over"].includes(p.type) && Number.isInteger(p.value));
    if (p.type === "exact") assert(p.value >= 5 && p.value <= 30);
    else if (p.type === "under") assert(p.value >= 8 && p.value <= 28);
    else assert(p.value >= 7 && p.value <= 27);
    assert(lotoMult(p.type, p.value) >= 1.01);
    return bet;
  },
  play(rng, p, bet) {
    const dice = Array.from({ length: 5 }, () => rng.int(6) + 1);
    const sum = dice.reduce((a, b) => a + b, 0);
    const win = p.type === "exact" ? sum === p.value : p.type === "under" ? sum < p.value : sum > p.value;
    const mult = win ? lotoMult(p.type, p.value) : 0;
    return { payout: floorPay(bet * mult), result: { dice, sum, win, multiplier: mult } };
  },
};

/* ------------------------------------------------------------------ 96 · Corrida de Foguetes */
export const ROCKET_PROBS = [0.4, 0.3, 0.2, 0.1];
export const ROCKET_MULTS = ROCKET_PROBS.map((p) => r2(0.97 / p));
export const rocketRace: InstantGame = {
  kind: "instant",
  totalBet(p, bet) {
    assert(p && Number.isInteger(p.rocket) && p.rocket >= 0 && p.rocket < 4);
    return bet;
  },
  play(rng, p, bet) {
    const winner = rng.weighted(ROCKET_PROBS);
    const rest = rng.shuffle([0, 1, 2, 3].filter((i) => i !== winner));
    const order = [winner, ...rest];
    // ritmo de cada foguete (5 trechos), só para a animação: o vencedor sempre cruza primeiro
    const pace = [0, 1, 2, 3].map(() => Array.from({ length: 5 }, () => 0.6 + rng.float() * 0.8));
    const win = winner === p.rocket;
    const mult = win ? ROCKET_MULTS[winner] : 0;
    return { payout: floorPay(bet * mult), result: { order, winner, pace, win, multiplier: mult } };
  },
};

/* ------------------------------------------------------------------ 95 · Tiro ao Alvo */
// anéis: 0 = mosca, 1, 2, 3, 4 = fora
export const TARGET_TABLES: Record<string, { p: number[]; m: number[] }> = {
  low: { p: [0.02, 0.13, 0.35, 0.3, 0.2], m: [6, 2, 1.1, 0.68, 0] },
  medium: { p: [0.01, 0.06, 0.2, 0.33, 0.4], m: [20, 5, 1.5, 0.5, 0] },
  high: { p: [0.002, 0.02, 0.1, 0.25, 0.628], m: [200, 15, 2.7, 0, 0] },
};
export const targetShoot: InstantGame = {
  kind: "instant",
  totalBet(p, bet) {
    assert(p && p.risk in TARGET_TABLES);
    return bet;
  },
  play(rng, p, bet) {
    const t = TARGET_TABLES[p.risk];
    const ring = rng.weighted(t.p);
    const angle = rng.float() * Math.PI * 2;
    const depth = rng.float(); // posição dentro do anel (0..1)
    const mult = t.m[ring];
    return { payout: floorPay(bet * mult), result: { ring, angle, depth, multiplier: mult } };
  },
};

/* ------------------------------------------------------------------ 99 · Dardos (3 dardos, aposta dividida) */
// áreas: 0 fora · 1 simples · 2 duplo · 3 triplo · 4 bull externo · 5 mosca
export const DART_P = [0.12, 0.62, 0.14, 0.09, 0.02, 0.01];
export const DART_M = [0, 0.5, 1.5, 2.5, 5, 12];
export const darts: InstantGame = {
  kind: "instant",
  totalBet: (_p, bet) => {
    assert(bet >= 3, "invalid_params", "Aposta mínima de 3 fichas");
    return bet;
  },
  play(rng, _p, bet) {
    const throws = [0, 1, 2].map(() => {
      const area = rng.weighted(DART_P);
      return { area, sector: rng.int(20), jitter: rng.float(), mult: DART_M[area] };
    });
    const sum = throws.reduce((s, t) => s + t.mult, 0);
    const triple = throws.every((t) => t.area === 5); // três moscas: bônus 1.000x
    const mult = triple ? 1000 : sum / 3;
    return { payout: floorPay(bet * mult), result: { throws, triple, multiplier: r4(mult) } };
  },
};

/* ------------------------------------------------------------------ 92 · Garra de Pelúcia */
export const CLAW_PRIZES = [
  { m: 0, p: 0.5268 },
  { m: 0.5, p: 0.18 },
  { m: 1, p: 0.12 },
  { m: 2, p: 0.1 },
  { m: 3, p: 0.05 },
  { m: 10, p: 0.02 },
  { m: 50, p: 0.003 },
  { m: 250, p: 0.0002 },
];
export const claw: InstantGame = {
  kind: "instant",
  totalBet(p, bet) {
    assert(p == null || p.lane == null || (Number.isInteger(p.lane) && p.lane >= 0 && p.lane < 5));
    return bet;
  },
  play(rng, p, bet) {
    const i = rng.weighted(CLAW_PRIZES.map((x) => x.p));
    const prize = CLAW_PRIZES[i];
    // se não pegar nada: escorrega (0) ou a garra volta vazia (1), só visual
    const slip = prize.m === 0 ? rng.int(2) : -1;
    return { payout: floorPay(bet * prize.m), result: { tier: i, slip, lane: p?.lane ?? 2, multiplier: prize.m } };
  },
};

/* ------------------------------------------------------------------ 100 · Corte da Fruta Neon */
export const FRUIT_OBJECTS = 10;
export const FRUIT_BOMB_P = 0.15;
export const FRUIT_VALUES = [
  { m: 0.1, p: 0.6198 },
  { m: 0.2, p: 0.28 },
  { m: 0.4, p: 0.07 },
  { m: 1, p: 0.022 },
  { m: 3, p: 0.0065 },
  { m: 15, p: 0.0017 },
];
export const fruitCut: InstantGame = {
  kind: "instant",
  totalBet: (_p, bet) => bet,
  play(rng, _p, bet) {
    const objects: { kind: "fruit" | "bomb"; m: number; type: number; x: number }[] = [];
    let total = 0;
    let alive = true;
    for (let i = 0; i < FRUIT_OBJECTS; i++) {
      const bomb = rng.float() < FRUIT_BOMB_P;
      const vi = rng.weighted(FRUIT_VALUES.map((v) => v.p));
      const x = rng.float();
      if (bomb) {
        objects.push({ kind: "bomb", m: 0, type: 0, x });
        alive = false;
        break;
      }
      objects.push({ kind: "fruit", m: FRUIT_VALUES[vi].m, type: vi, x });
      total += FRUIT_VALUES[vi].m;
    }
    const mult = r4(total);
    return { payout: floorPay(bet * mult), result: { objects, exploded: !alive, multiplier: mult } };
  },
};

/* ------------------------------------------------------------------ 42 · Plinko Pirâmide (bola que se divide) */
export const plinkoDuo: InstantGame = {
  kind: "instant",
  totalBet(p, bet) {
    assert(p && Number.isInteger(p.rows) && p.rows >= 8 && p.rows <= 16 && ["low", "medium", "high"].includes(p.risk));
    assert(bet >= 2, "invalid_params", "Aposta mínima de 2 fichas");
    return bet;
  },
  play(rng, p, bet) {
    // a bola cai 2 linhas juntas e se divide: cada metade segue o próprio caminho (as 2 primeiras linhas são compartilhadas)
    const shared = [rng.int(2), rng.int(2)];
    const balls = [0, 1].map(() => {
      const path = [...shared];
      for (let i = 2; i < p.rows; i++) path.push(rng.int(2));
      const bucket = path.reduce((s, x) => s + x, 0);
      return { path, bucket, multiplier: PLINKO_TABLES[`${p.rows}-${p.risk}`][bucket] };
    });
    const mult = (balls[0].multiplier + balls[1].multiplier) / 2;
    return { payout: floorPay(bet * mult), result: { balls, multiplier: r4(mult) } };
  },
};
