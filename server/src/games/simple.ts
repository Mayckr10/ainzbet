import { crashPoint, type Rng } from "../fair.js";
import { assert, floorPay, type InstantGame } from "./types.js";

const int = (v: unknown) => Number.isInteger(v) && (v as number) > 0;

/* ------------------------------------------------------------------ Dados */
export const DICE_MULT = { number: 5.82, even: 1.94, odd: 1.94, low: 1.94, high: 1.94 } as const;

export const dice: InstantGame = {
  kind: "instant",
  totalBet(p, bet) {
    assert(p && p.type in DICE_MULT);
    if (p.type === "number") assert(Number.isInteger(p.value) && p.value >= 1 && p.value <= 6);
    return bet;
  },
  play(rng, p, bet) {
    const roll = rng.int(6) + 1;
    const win =
      p.type === "number" ? roll === p.value
      : p.type === "even" ? roll % 2 === 0
      : p.type === "odd" ? roll % 2 === 1
      : p.type === "low" ? roll <= 3
      : roll >= 4;
    const mult = win ? DICE_MULT[p.type as keyof typeof DICE_MULT] : 0;
    return { payout: floorPay(bet * mult), result: { roll, win, multiplier: mult } };
  },
};

/* ------------------------------------------------------------------ Moeda */
export const coinflip: InstantGame = {
  kind: "instant",
  totalBet(p, bet) {
    assert(p && (p.side === "heads" || p.side === "tails"));
    return bet;
  },
  play(rng, p, bet) {
    const side = rng.int(2) === 0 ? "heads" : "tails";
    const win = side === p.side;
    return { payout: win ? floorPay(bet * 1.96) : 0, result: { side, win, multiplier: win ? 1.96 : 0 } };
  },
};

/* ------------------------------------------------------------------ Limbo */
export const limbo: InstantGame = {
  kind: "instant",
  totalBet(p, bet) {
    assert(p && typeof p.target === "number" && p.target >= 1.01 && p.target <= 50_000);
    return bet;
  },
  play(rng, p, bet) {
    const target = Math.floor(p.target * 100) / 100;
    const result = crashPoint(rng.float());
    const win = result >= target;
    return { payout: win ? floorPay(bet * target) : 0, result: { result, target, win, multiplier: win ? target : 0 } };
  },
};

/* ------------------------------------------------------------------ Roleta */
export const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

type RouletteBet = { type: string; value?: number; amount: number };

function rouletteWins(b: RouletteBet, n: number): number {
  // n: 0..36, 37 = "00"
  const isZero = n === 0 || n === 37;
  switch (b.type) {
    case "straight": return b.value === n ? 36 : 0;
    case "red": return !isZero && RED.has(n) ? 2 : 0;
    case "black": return !isZero && !RED.has(n) ? 2 : 0;
    case "even": return !isZero && n % 2 === 0 ? 2 : 0;
    case "odd": return !isZero && n % 2 === 1 ? 2 : 0;
    case "low": return !isZero && n <= 18 ? 2 : 0;
    case "high": return !isZero && n >= 19 ? 2 : 0;
    case "dozen": return !isZero && Math.ceil(n / 12) === b.value ? 3 : 0;
    case "column": return !isZero && ((n - 1) % 3) + 1 === b.value ? 3 : 0;
  }
  return 0;
}

function roulette(american: boolean): InstantGame {
  const maxNumber = american ? 37 : 36;
  return {
    kind: "instant",
    totalBet(p) {
      assert(p && Array.isArray(p.bets) && p.bets.length > 0 && p.bets.length <= 60);
      let total = 0;
      for (const b of p.bets as RouletteBet[]) {
        assert(int(b.amount));
        assert(["straight", "red", "black", "even", "odd", "low", "high", "dozen", "column"].includes(b.type));
        if (b.type === "straight") assert(Number.isInteger(b.value) && b.value! >= 0 && b.value! <= maxNumber);
        if (b.type === "dozen" || b.type === "column") assert([1, 2, 3].includes(b.value!));
        total += b.amount;
      }
      return total;
    },
    play(rng, p) {
      const number = rng.int(maxNumber + 1);
      let payout = 0;
      const wins: number[] = [];
      (p.bets as RouletteBet[]).forEach((b, i) => {
        const m = rouletteWins(b, number);
        if (m) {
          payout += b.amount * m;
          wins.push(i);
        }
      });
      return { payout, result: { number, wins } };
    },
  };
}
export const rouletteEu = roulette(false);
export const rouletteUs = roulette(true);

/* ------------------------------------------------------------------ Keno (40 números, 10 sorteados) */
const KENO_SHAPES: number[][] = [
  [],
  [0, 1],
  [0, 0.2, 1],
  [0, 0, 0.06, 1],
  [0, 0, 0.022, 0.15, 1],
  [0, 0, 0.006, 0.03, 0.18, 1],
  [0, 0, 0, 0.007, 0.04, 0.25, 1],
  [0, 0, 0, 0.0035, 0.012, 0.06, 0.3, 1],
  [0, 0, 0, 0.0015, 0.005, 0.02, 0.08, 0.3, 1],
  [0, 0, 0, 0.001, 0.0025, 0.008, 0.03, 0.1, 0.35, 1],
  [0, 0, 0, 0.0005, 0.0015, 0.004, 0.012, 0.04, 0.12, 0.4, 1],
];
const KENO_RTP = 0.97;

function comb(n: number, k: number) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return r;
}
export const kenoHitProb = (picks: number, hits: number) =>
  (comb(10, hits) * comb(30, picks - hits)) / comb(40, picks);

const niceRound = (x: number) => (x >= 100 ? Math.floor(x) : x >= 10 ? Math.floor(x * 10) / 10 : Math.floor(x * 100) / 100);

/** Tabelas calibradas para 97% de RTP (calculadas de forma exata pela hipergeométrica). */
export const KENO_TABLE: number[][] = KENO_SHAPES.map((shape, picks) => {
  if (!picks) return [];
  const ev = shape.reduce((s, w, h) => s + w * kenoHitProb(picks, h), 0);
  const k = KENO_RTP / ev;
  return shape.map((w) => (w ? niceRound(w * k) : 0));
});

export const keno: InstantGame = {
  kind: "instant",
  totalBet(p, bet) {
    assert(p && Array.isArray(p.picks) && p.picks.length >= 1 && p.picks.length <= 10);
    const set = new Set(p.picks);
    assert(set.size === p.picks.length && p.picks.every((n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 40));
    return bet;
  },
  play(rng, p, bet) {
    const drawn = rng.pickUnique(40, 10).map((n) => n + 1);
    const picks: number[] = p.picks;
    const hits = picks.filter((n) => drawn.includes(n)).length;
    const mult = KENO_TABLE[picks.length][hits];
    return { payout: floorPay(bet * mult), result: { drawn, hits, multiplier: mult } };
  },
};

/* ------------------------------------------------------------------ Raspadinha */
export const SCRATCH_TIERS = [
  { mult: 1000, p: 0.00003 },
  { mult: 100, p: 0.0008 },
  { mult: 25, p: 0.004 },
  { mult: 10, p: 0.015 },
  { mult: 5, p: 0.034 },
  { mult: 2, p: 0.11 },
  { mult: 1, p: 0.2 },
];

export const scratch: InstantGame = {
  kind: "instant",
  totalBet: (_p, bet) => bet,
  play(rng, _p, bet) {
    const symbols = SCRATCH_TIERS.map((t) => t.mult); // 7 símbolos de prêmio
    const loseP = 1 - SCRATCH_TIERS.reduce((s, t) => s + t.p, 0);
    const tierIdx = rng.weighted([...SCRATCH_TIERS.map((t) => t.p), loseP]);
    const winMult = tierIdx < SCRATCH_TIERS.length ? SCRATCH_TIERS[tierIdx].mult : 0;
    const grid: number[] = new Array(9).fill(-1);
    const counts = new Map<number, number>();
    const positions = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    let pos = 0;
    if (winMult) {
      for (let i = 0; i < 3; i++) grid[positions[pos++]] = winMult;
      counts.set(winMult, 3);
    }
    while (pos < 9) {
      const options = symbols.filter((s) => s !== winMult && (counts.get(s) ?? 0) < 2);
      // prêmios grandes aparecem menos como "isca"
      const weights = options.map((s) => (s >= 100 ? 1 : s >= 10 ? 2 : 4));
      const s = options[rng.weighted(weights)];
      grid[positions[pos++]] = s;
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    const winCells = winMult ? grid.map((s, i) => (s === winMult ? i : -1)).filter((i) => i >= 0) : [];
    return {
      payout: floorPay(bet * winMult),
      result: { grid, winMult, winCells, multiplier: winMult },
    };
  },
};

/* ------------------------------------------------------------------ Plinko */
const KNOWN_PLINKO: Record<string, number[]> = {
  "8-low": [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
  "8-medium": [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
  "8-high": [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  "9-low": [5.6, 2, 1.6, 1, 0.7, 0.7, 1, 1.6, 2, 5.6],
  "9-medium": [18, 4, 1.7, 0.9, 0.5, 0.5, 0.9, 1.7, 4, 18],
  "9-high": [43, 7, 2, 0.6, 0.2, 0.2, 0.6, 2, 7, 43],
  "10-low": [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
  "10-medium": [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
  "10-high": [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76],
  "11-low": [8.4, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 8.4],
  "11-medium": [24, 6, 3, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 3, 6, 24],
  "11-high": [120, 14, 5.2, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 5.2, 14, 120],
  "12-low": [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
  "12-medium": [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
  "12-high": [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
  "13-low": [8.1, 4, 3, 1.9, 1.2, 0.9, 0.7, 0.7, 0.9, 1.2, 1.9, 3, 4, 8.1],
  "13-medium": [43, 13, 6, 3, 1.3, 0.7, 0.4, 0.4, 0.7, 1.3, 3, 6, 13, 43],
  "13-high": [260, 37, 11, 4, 1, 0.2, 0.2, 0.2, 0.2, 1, 4, 11, 37, 260],
  "14-low": [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1],
  "14-medium": [58, 15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 58],
  "14-high": [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420],
  "15-low": [15, 8, 3, 2, 1.5, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.5, 2, 3, 8, 15],
  "15-medium": [88, 18, 11, 5, 3, 1.3, 0.5, 0.3, 0.3, 0.5, 1.3, 3, 5, 11, 18, 88],
  "15-high": [620, 83, 27, 8, 3, 0.5, 0.2, 0.2, 0.2, 0.2, 0.5, 3, 8, 27, 83, 620],
  "16-low": [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
  "16-medium": [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
  "16-high": [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
};
export const PLINKO_TABLES = KNOWN_PLINKO;

export const plinko: InstantGame = {
  kind: "instant",
  totalBet(p, bet) {
    assert(p && Number.isInteger(p.rows) && p.rows >= 8 && p.rows <= 16);
    assert(["low", "medium", "high"].includes(p.risk));
    return bet;
  },
  play(rng, p, bet) {
    const path: number[] = [];
    for (let i = 0; i < p.rows; i++) path.push(rng.int(2));
    const bucket = path.reduce((s, x) => s + x, 0);
    const mult = PLINKO_TABLES[`${p.rows}-${p.risk}`][bucket];
    return { payout: floorPay(bet * mult), result: { path, bucket, multiplier: mult } };
  },
};

/* ------------------------------------------------------------------ Bingo (75 bolas, 35 sorteadas) */
export const BINGO_DRAWS = 35;
/** Pagamento por quantidade de linhas completas (linhas, colunas e diagonais). Calibrado por simulação. */
export const BINGO_PAYS: Record<number, number> = { 1: 2.5, 2: 6, 3: 20, 4: 60, 5: 150, 6: 400 };
export const BINGO_BLACKOUT = 10_000;

export function bingoLines(card: number[], drawn: Set<number>) {
  const marked = (i: number) => i === 12 || drawn.has(card[i]);
  const lines: number[][] = [];
  for (let r = 0; r < 5; r++) lines.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
  for (let c = 0; c < 5; c++) lines.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
  lines.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]);
  const done = lines.filter((l) => l.every(marked));
  const blackout = card.every((_, i) => marked(i));
  return { done, blackout };
}

export function validBingoCard(card: unknown): card is number[] {
  if (!Array.isArray(card) || card.length !== 25) return false;
  const seen = new Set<number>();
  for (let i = 0; i < 25; i++) {
    const v = card[i];
    if (i === 12) {
      if (v !== 0) return false;
      continue;
    }
    const col = i % 5;
    if (!Number.isInteger(v) || v < col * 15 + 1 || v > col * 15 + 15 || seen.has(v)) return false;
    seen.add(v);
  }
  return true;
}

export function bingoPayFor(lines: number, blackout: boolean) {
  if (blackout) return BINGO_BLACKOUT;
  return BINGO_PAYS[Math.min(lines, 6)] ?? 0;
}

export const bingo: InstantGame = {
  kind: "instant",
  totalBet(p, bet) {
    assert(p && validBingoCard(p.card), "invalid_params", "Cartela inválida");
    return bet;
  },
  play(rng, p, bet) {
    const draws = rng.pickUnique(75, BINGO_DRAWS).map((n) => n + 1);
    const { done, blackout } = bingoLines(p.card, new Set(draws));
    const mult = bingoPayFor(done.length, blackout);
    return { payout: floorPay(bet * mult), result: { draws, lines: done, blackout, multiplier: mult } };
  },
};

/* ------------------------------------------------------------------ Bacará */
export const bacValue = (c: number) => {
  const r = c % 13;
  return r <= 7 ? r + 2 : r === 12 ? 1 : 0;
};

export function playBaccarat(rng: Rng) {
  const shoe = rng.pickUnique(416, 6).map((i) => i % 52);
  let k = 0;
  const player = [shoe[k++], shoe[k++]];
  const banker = [shoe[k++], shoe[k++]];
  const total = (h: number[]) => h.reduce((s, c) => s + bacValue(c), 0) % 10;
  const order: ("P" | "B")[] = ["P", "B", "P", "B"];
  let pt = total(player);
  let bt = total(banker);
  if (pt < 8 && bt < 8) {
    let p3: number | null = null;
    if (pt <= 5) {
      p3 = shoe[k++];
      player.push(p3);
      order.push("P");
      pt = total(player);
    }
    let bankerDraws: boolean;
    if (p3 === null) bankerDraws = bt <= 5;
    else {
      const v = bacValue(p3);
      bankerDraws =
        bt <= 2 ||
        (bt === 3 && v !== 8) ||
        (bt === 4 && v >= 2 && v <= 7) ||
        (bt === 5 && v >= 4 && v <= 7) ||
        (bt === 6 && (v === 6 || v === 7));
    }
    if (bankerDraws) {
      banker.push(shoe[k++]);
      order.push("B");
      bt = total(banker);
    }
  }
  const winner = pt > bt ? "player" : bt > pt ? "banker" : "tie";
  return { player, banker, order, playerTotal: pt, bankerTotal: bt, winner };
}

export const baccarat: InstantGame = {
  kind: "instant",
  totalBet(p) {
    assert(p && typeof p.bets === "object");
    const keys = ["player", "banker", "tie", "playerPair", "bankerPair"];
    let total = 0;
    for (const [k, v] of Object.entries(p.bets)) {
      assert(keys.includes(k));
      if (v === 0) continue;
      assert(int(v));
      total += v as number;
    }
    assert(total > 0);
    return total;
  },
  play(rng, p) {
    const r = playBaccarat(rng);
    const b = p.bets as Record<string, number>;
    const pair = (h: number[]) => h[0] % 13 === h[1] % 13;
    let payout = 0;
    const wins: string[] = [];
    const add = (key: string, mult: number) => {
      if (b[key]) {
        payout += b[key] * mult;
        if (mult > 1) wins.push(key);
      }
    };
    if (r.winner === "player") add("player", 2);
    if (r.winner === "banker") add("banker", 1.95);
    if (r.winner === "tie") {
      add("tie", 9);
      add("player", 1); // empate devolve apostas em jogador e banca
      add("banker", 1);
    }
    if (pair(r.player)) add("playerPair", 12);
    if (pair(r.banker)) add("bankerPair", 12);
    return { payout: floorPay(payout), result: { ...r, wins } };
  },
};
