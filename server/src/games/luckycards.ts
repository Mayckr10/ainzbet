/**
 * Oráculo Cósmico — motor do slot principal (roda no servidor, com RNG provably fair).
 *
 * Grade 5x3, 20 linhas fixas. Arcanos celestes dourados ativam poderes:
 *   Sol     → a coluna inteira vira Portal (Wild) neste giro
 *   Lua     → multiplicador x2–x5 na próxima vitória
 *   Cometa  → 2 a 4 símbolos viram Portal (Wild)
 *   Eclipse → Re-Spin dos rolos que não formaram vitória
 *   Olho do Oráculo → símbolo de maior pagamento
 * 3/4/5 Nebulosas (Scatter) → 8/12/20 giros grátis (ganhos x2, arcanos dourados mais frequentes, +5 com 3 Nebulosas).
 * 3 Orbes do Destino (rolos 1, 3 e 5) → minigame "Escolha a Estrela" (9 estrelas, escolha 3).
 * Orbes multiplicadores (x2, x3, x5, x10) somam e multiplicam o ganho do giro.
 * Prêmio máximo: 50.000x a aposta.
 */
import type { Rng } from "../fair.js";
import { GameError } from "./types.js";

export const S = {
  WILD: 0, SCATTER: 1, BONUS: 2, MULT: 3,
  HOURGLASS: 4, ASTROLABE: 5, PRISM: 6, PLANET: 7, RUNE_FIRE: 8, RUNE_WATER: 9, RUNE_EARTH: 10,
  EYE: 11, SUN: 12, MOON: 13, COMET: 14, ECLIPSE: 15,
} as const;

export const LC_SYMBOLS = [
  "portal", "nebula", "orb", "multorb", "hourglass", "astrolabe", "prism", "planet", "runeFire", "runeWater", "runeEarth",
  "eye", "sun", "moon", "comet", "eclipse",
];

/** Pagamento por linha (x aposta por linha) para 3, 4 e 5 símbolos. */
export const LC_PAYS: Record<number, [number, number, number]> = {
  [S.EYE]: [25, 100, 600],
  [S.HOURGLASS]: [20, 80, 400],
  [S.ASTROLABE]: [15, 50, 250],
  [S.PRISM]: [12, 40, 200],
  [S.SUN]: [10, 30, 150],
  [S.MOON]: [8, 25, 120],
  [S.PLANET]: [6, 20, 100],
  [S.RUNE_FIRE]: [5, 15, 80],
  [S.COMET]: [5, 15, 70],
  [S.ECLIPSE]: [4, 12, 60],
  [S.RUNE_WATER]: [3, 10, 50],
  [S.RUNE_EARTH]: [3, 10, 50],
};
/** Escala dos pagamentos, calibrada por simulação para ~96% de RTP (npm run rtp cosmic). */
export const LC_PAY_SCALE = { value: 1.06 };

export const LC_LINES = [
  [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2], [1, 0, 1, 2, 1], [1, 2, 1, 0, 1], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 0, 2, 0, 0], [2, 2, 0, 2, 2], [0, 2, 0, 2, 0],
];

export const LC = {
  freeSpinsFor: [0, 0, 0, 8, 12, 20],
  retrigger: 5,
  maxFreeSpins: 100,
  freeMult: 2,
  goldChance: 0.05,
  goldChanceFree: 0.1,
  multValues: [2, 3, 5, 10],
  multWeights: [50, 30, 15, 5],
  maxWin: 50_000,
  bigWin: 15,
  megaWin: 40,
  epicWin: 100,
};

/* -------------------------------------------------------------- Rolos */
type Counts = Partial<Record<number, number>>;
const BASE_COUNTS: Counts = {
  [S.HOURGLASS]: 2, [S.ASTROLABE]: 2, [S.PRISM]: 3, [S.PLANET]: 3, [S.RUNE_FIRE]: 4, [S.RUNE_WATER]: 5, [S.RUNE_EARTH]: 5,
  [S.EYE]: 2, [S.SUN]: 3, [S.MOON]: 3, [S.COMET]: 4, [S.ECLIPSE]: 4, [S.SCATTER]: 1, [S.MULT]: 1,
};

function reelCounts(reel: number, free: boolean): Counts {
  const c: Counts = { ...BASE_COUNTS };
  if (reel > 0) c[S.WILD] = free ? 2 : 1;
  if (reel % 2 === 0) c[S.BONUS] = 2;
  if (free) for (const s of [S.EYE, S.SUN, S.MOON, S.COMET, S.ECLIPSE]) c[s] = (c[s] ?? 0) + 1;
  return c;
}

/** Fita determinística: distribui símbolos e separa os especiais para no máximo 1 visível por rolo. */
function buildStrip(counts: Counts, seed: number): number[] {
  const specials = [S.SCATTER, S.BONUS];
  const normal: number[] = [];
  for (const [s, n] of Object.entries(counts)) if (!specials.includes(Number(s) as 1 | 2)) for (let i = 0; i < n!; i++) normal.push(Number(s));
  // embaralhamento determinístico (LCG) só para dar aparência natural à fita
  let x = seed * 9301 + 49297;
  for (let i = normal.length - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280;
    const j = Math.floor((x / 233280) * (i + 1));
    [normal[i], normal[j]] = [normal[j], normal[i]];
  }
  const sp: number[] = [];
  for (const s of specials) for (let i = 0; i < (counts[s] ?? 0); i++) sp.push(s);
  // insere especiais com espaçamento >= 4
  const strip = normal.slice();
  sp.forEach((s, k) => {
    const pos = Math.floor(((k + 0.5) * strip.length) / sp.length);
    strip.splice(pos, 0, s);
  });
  return strip;
}

export const LC_STRIPS = [0, 1, 2, 3, 4].map((r) => buildStrip(reelCounts(r, false), r + 1));
export const LC_FREE_STRIPS = [0, 1, 2, 3, 4].map((r) => buildStrip(reelCounts(r, true), r + 11));

/** Arcanos celestes (podem ficar dourados e ativar poderes). */
const isCard = (s: number) => s >= S.EYE && s <= S.ECLIPSE;
const isPaying = (s: number) => s >= S.HOURGLASS;

/* -------------------------------------------------------------- Estado persistente por jogador */
export type LcPrize =
  | { kind: "credits"; value: number }
  | { kind: "mult"; value: number }
  | { kind: "spins"; value: number }
  | { kind: "wilds"; value: number }
  | { kind: "joker" };

export type LcState = {
  queenMult: number; // multiplicador guardado para a próxima vitória (0 = nenhum)
  nextWilds: number; // wilds a colocar no próximo giro
  free: null | { left: number; total: number; played: number; win: number; best: number; bet: number };
  bonus: null | { cards: LcPrize[]; picks: number[]; bet: number };
};

export const emptyLcState = (): LcState => ({ queenMult: 0, nextWilds: 0, free: null, bonus: null });

/* -------------------------------------------------------------- Avaliação */
export type LcLineWin = { line: number; symbol: number; count: number; win: number; cells: [number, number][] };

export function evalLines(grid: number[][]) {
  const wins: LcLineWin[] = [];
  let sum = 0;
  LC_LINES.forEach((rows, li) => {
    const cells = rows.map((r, reel) => grid[reel][r]);
    let sym = -1;
    let count = 0;
    for (let reel = 0; reel < 5; reel++) {
      const c = cells[reel];
      if (c === S.WILD) { count++; continue; }
      if (!isPaying(c)) break;
      if (sym === -1) sym = c;
      if (c === sym) count++;
      else break;
    }
    if (sym === -1 && count === 5) sym = S.EYE; // 5 portais pagam como 5 Olhos
    if (sym === -1 || count < 3) return;
    const pay = LC_PAYS[sym][count - 3] * LC_PAY_SCALE.value;
    const win = pay / LC_LINES.length; // em x aposta total
    sum += win;
    wins.push({ line: li, symbol: sym, count, win, cells: rows.slice(0, count).map((r, reel) => [reel, r] as [number, number]) });
  });
  return { wins, sum };
}

function window(rng: Rng, strip: number[]) {
  const stop = rng.int(strip.length);
  return [0, 1, 2].map((r) => strip[(stop + r) % strip.length]);
}

export type LcSpinResult = {
  /** grade inicial (antes dos poderes) */
  initial: number[][];
  /** grade final após poderes e re-spin */
  grid: number[][];
  golden: [number, number][];
  effects: {
    royal: number[]; // colunas que viraram Wild
    jackWilds: [number, number][];
    bonusWilds: [number, number][];
    queen: number | null; // multiplicador ganho para a próxima vitória
    respin: { held: number[]; grid: number[][] } | null;
  };
  multChips: { cell: [number, number]; value: number }[];
  wins: LcLineWin[];
  lineWin: number; // x aposta, antes dos multiplicadores
  multipliers: { free: number; chips: number; queen: number };
  multiplier: number; // x aposta total final
  scatters: [number, number][];
  bonusSymbols: [number, number][];
  freeSpinsWon: number;
  bonusTriggered: boolean;
  isFree: boolean;
  free: LcState["free"];
  tier: "none" | "big" | "mega" | "epic";
};

function tierOf(m: number): LcSpinResult["tier"] {
  return m >= LC.epicWin ? "epic" : m >= LC.megaWin ? "mega" : m >= LC.bigWin ? "big" : "none";
}

/** Executa um giro. Altera `state` (cópia) e devolve o resultado e o multiplicador final. */
export function lcSpin(rng: Rng, prev: LcState): { state: LcState; result: LcSpinResult } {
  const state: LcState = structuredClone(prev);
  if (state.bonus) throw new GameError("bonus_pending", "Escolha as estrelas do bônus primeiro");
  const isFree = !!state.free && state.free.left > 0;
  const strips = isFree ? LC_FREE_STRIPS : LC_STRIPS;
  const initial = strips.map((s) => window(rng, s));
  const grid = initial.map((c) => c.slice());

  // arcanos dourados
  const goldP = isFree ? LC.goldChanceFree : LC.goldChance;
  const golden: [number, number][] = [];
  for (let reel = 0; reel < 5; reel++) for (let row = 0; row < 3; row++) {
    if (isCard(grid[reel][row]) && rng.float() < goldP) golden.push([reel, row]);
  }
  const goldOf = (sym: number) => golden.filter(([r, w]) => initial[r][w] === sym);

  const replaceable = (reel: number, row: number) => grid[reel][row] !== S.SCATTER && grid[reel][row] !== S.BONUS && grid[reel][row] !== S.WILD;
  const randomCells = (n: number) => {
    const cand: [number, number][] = [];
    for (let reel = 0; reel < 5; reel++) for (let row = 0; row < 3; row++) if (replaceable(reel, row)) cand.push([reel, row]);
    return rng.pickUnique(cand.length, Math.min(n, cand.length)).map((i) => cand[i]);
  };

  // wilds ganhos no minigame
  const bonusWilds = state.nextWilds ? randomCells(state.nextWilds) : [];
  for (const [r, w] of bonusWilds) grid[r][w] = S.WILD;
  state.nextWilds = 0;

  // Sol: coluna inteira Wild (exceto Scatter/Bônus)
  const royal = [...new Set(goldOf(S.SUN).map(([r]) => r))];
  for (const r of royal) for (let w = 0; w < 3; w++) if (grid[r][w] !== S.SCATTER && grid[r][w] !== S.BONUS) grid[r][w] = S.WILD;

  // Cometa: 2 a 4 símbolos viram Wild
  const jackWilds: [number, number][] = [];
  for (const _ of goldOf(S.COMET)) {
    const cells = randomCells(2 + rng.int(3));
    for (const [r, w] of cells) grid[r][w] = S.WILD;
    jackWilds.push(...cells);
  }

  let { wins, sum } = evalLines(grid);

  // Eclipse: Re-Spin dos rolos que não participaram de vitórias
  let respin: LcSpinResult["effects"]["respin"] = null;
  const tens = goldOf(S.ECLIPSE);
  if (tens.length) {
    const held = new Set<number>(tens.map(([r]) => r));
    for (const w of wins) for (const [r] of w.cells) held.add(r);
    for (const r of royal) held.add(r);
    for (let reel = 0; reel < 5; reel++) {
      if (held.has(reel)) continue;
      grid[reel] = window(rng, strips[reel]);
    }
    ({ wins, sum } = evalLines(grid));
    respin = { held: [...held].sort(), grid: grid.map((c) => c.slice()) };
  }

  // orbes multiplicadores visíveis
  const multChips: LcSpinResult["multChips"] = [];
  for (let reel = 0; reel < 5; reel++) for (let row = 0; row < 3; row++) {
    if (grid[reel][row] === S.MULT) multChips.push({ cell: [reel, row], value: LC.multValues[rng.weighted(LC.multWeights)] });
  }

  const chipMult = multChips.length && sum > 0 ? multChips.reduce((a, c) => a + c.value, 0) : 1;
  const freeMult = isFree ? LC.freeMult : 1;
  let queenMult = 1;
  if (sum > 0 && state.queenMult) {
    queenMult = state.queenMult;
    state.queenMult = 0;
  }
  // Lua dourada guarda multiplicador para a próxima vitória
  let queen: number | null = null;
  if (goldOf(S.MOON).length) {
    queen = 2 + rng.int(4);
    state.queenMult = Math.max(state.queenMult, queen);
  }

  let multiplier = sum * chipMult * freeMult * queenMult;

  const scatters: [number, number][] = [];
  const bonusSymbols: [number, number][] = [];
  for (let reel = 0; reel < 5; reel++) for (let row = 0; row < 3; row++) {
    if (grid[reel][row] === S.SCATTER) scatters.push([reel, row]);
    if (grid[reel][row] === S.BONUS) bonusSymbols.push([reel, row]);
  }

  // giros grátis
  let freeSpinsWon = 0;
  const nSc = Math.min(scatters.length, 5);
  if (nSc >= 3) freeSpinsWon = isFree ? LC.retrigger : LC.freeSpinsFor[nSc];

  if (isFree) {
    const f = state.free!;
    f.left--;
    f.played++;
    const room = LC.maxWin - f.win;
    multiplier = Math.min(multiplier, Math.max(0, room));
    f.win += multiplier;
    f.best = Math.max(f.best, multiplier);
    if (freeSpinsWon && f.total < LC.maxFreeSpins) {
      const add = Math.min(freeSpinsWon, LC.maxFreeSpins - f.total);
      f.left += add;
      f.total += add;
    }
    if (f.win >= LC.maxWin) f.left = 0;
  } else {
    multiplier = Math.min(multiplier, LC.maxWin);
  }

  // minigame de bônus
  const bonusTriggered = bonusSymbols.length >= 3;
  if (bonusTriggered) state.bonus = { cards: makeBonusCards(rng), picks: [], bet: 0 };

  const freeSnapshot = state.free ? { ...state.free } : null;
  if (!isFree && freeSpinsWon) {
    state.free = { left: freeSpinsWon, total: freeSpinsWon, played: 0, win: 0, best: 0, bet: 0 };
  }
  if (state.free && state.free.left <= 0 && isFree) {
    // terminou: o resumo vai no resultado; estado limpo
    state.free = null;
  }

  return {
    state,
    result: {
      initial,
      grid,
      golden,
      effects: { royal, jackWilds, bonusWilds, queen, respin },
      multChips,
      wins,
      lineWin: sum,
      multipliers: { free: freeMult, chips: chipMult, queen: queenMult },
      multiplier,
      scatters,
      bonusSymbols,
      freeSpinsWon,
      bonusTriggered,
      isFree,
      free: isFree ? freeSnapshot : state.free ? { ...state.free } : null,
      tier: tierOf(isFree && freeSnapshot && freeSnapshot.left === 0 ? freeSnapshot.win : multiplier),
    },
  };
}

/* -------------------------------------------------------------- Minigame "Escolha a Estrela" */
const PRIZE_POOL: { prize: LcPrize; w: number }[] = [
  { prize: { kind: "credits", value: 2 }, w: 30 },
  { prize: { kind: "credits", value: 3 }, w: 26 },
  { prize: { kind: "credits", value: 5 }, w: 22 },
  { prize: { kind: "credits", value: 10 }, w: 14 },
  { prize: { kind: "credits", value: 20 }, w: 7 },
  { prize: { kind: "credits", value: 50 }, w: 2.5 },
  { prize: { kind: "credits", value: 250 }, w: 0.4 },
  { prize: { kind: "mult", value: 2 }, w: 9 },
  { prize: { kind: "mult", value: 3 }, w: 4 },
  { prize: { kind: "spins", value: 3 }, w: 8 },
  { prize: { kind: "spins", value: 5 }, w: 4 },
  { prize: { kind: "wilds", value: 2 }, w: 7 },
  { prize: { kind: "wilds", value: 3 }, w: 4 },
];

function makeBonusCards(rng: Rng): LcPrize[] {
  const cards: LcPrize[] = [];
  for (let i = 0; i < 8; i++) cards.push(PRIZE_POOL[rng.weighted(PRIZE_POOL.map((p) => p.w))].prize);
  // a Estrela da Sorte (dobra o prêmio) aparece em ~45% dos bônus
  if (rng.float() < 0.45) cards.push({ kind: "joker" });
  else cards.push(PRIZE_POOL[rng.weighted(PRIZE_POOL.map((p) => p.w))].prize);
  return rng.shuffle(cards);
}

export function bonusTotal(cards: LcPrize[], picks: number[]) {
  let credits = 0;
  let mult = 1;
  let spins = 0;
  let wilds = 0;
  let joker = false;
  for (const i of picks) {
    const p = cards[i];
    if (p.kind === "credits") credits += p.value;
    else if (p.kind === "mult") mult *= p.value;
    else if (p.kind === "spins") spins += p.value;
    else if (p.kind === "wilds") wilds += p.value;
    else joker = true;
  }
  const multiplier = Math.min(LC.maxWin, credits * mult * (joker ? 2 : 1));
  return { credits, mult, spins, wilds, joker, multiplier };
}

/** Escolhe uma carta. Quando 3 foram escolhidas, aplica os prêmios. */
export function lcPick(prev: LcState, index: number) {
  const state: LcState = structuredClone(prev);
  const b = state.bonus;
  if (!b) throw new GameError("no_bonus");
  if (!Number.isInteger(index) || index < 0 || index > 8 || b.picks.includes(index)) throw new GameError("invalid_action");
  b.picks.push(index);
  if (b.picks.length < 3) return { state, done: false as const, picks: b.picks, revealed: b.picks.map((i) => b.cards[i]) };
  const total = bonusTotal(b.cards, b.picks);
  state.bonus = null;
  state.nextWilds += total.wilds;
  if (total.spins) {
    if (state.free && state.free.left > 0) {
      state.free.left += total.spins;
      state.free.total += total.spins;
    } else state.free = { left: total.spins, total: total.spins, played: 0, win: 0, best: 0, bet: 0 };
  }
  return { state, done: true as const, picks: b.picks, cards: b.cards, total };
}
