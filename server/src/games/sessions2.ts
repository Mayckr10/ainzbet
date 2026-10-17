/**
 * Onda 1 · jogos com etapas (o jogador decide quando parar).
 * Motores genéricos: escada (torre), grade (mines), escolha de prêmios, Hi-Lo, Monty Hall e crash duplo.
 */
import { crashPoint } from "../fair.js";
import { assert, floorPay, GameError, type SessionGame } from "./types.js";

export const EDGE = 0.98;
const r2 = (x: number) => Math.floor(x * 100 + 1e-9) / 100;
export const MAX_MULT = 50_000;

/* ====================================================================== Escada genérica
 * Cada andar tem `cols` posições e `bad` armadilhas. Multiplicador do andar L: 0,98·(cols/(cols−bad))^L.
 */
export type LadderSpec = { levels: number; modes: Record<string, { cols: number; bad: number }> };
export const ladderMult = (cols: number, bad: number, L: number) => (L <= 0 ? 1 : Math.min(MAX_MULT, r2(EDGE * (cols / (cols - bad)) ** L)));

export function makeLadder(spec: LadderSpec): SessionGame {
  return {
    kind: "session",
    totalBet(p, bet) {
      assert(p?.mode in spec.modes);
      return bet;
    },
    start(rng, p) {
      const { cols, bad } = spec.modes[p.mode];
      const rows = Array.from({ length: spec.levels }, () => rng.pickUnique(cols, bad));
      const state = { mode: p.mode, rows, picks: [] as number[] };
      return { state, view: { mode: p.mode, picks: [], level: 0, multiplier: 1, next: ladderMult(cols, bad, 1) }, done: false };
    },
    action(s, action, payload, ctx) {
      const { cols, bad } = spec.modes[s.mode];
      const level = s.picks.length;
      const view = (extra: object, done: boolean) => ({
        mode: s.mode,
        picks: s.picks,
        level: s.picks.length,
        multiplier: ladderMult(cols, bad, s.picks.length),
        next: ladderMult(cols, bad, Math.min(spec.levels, s.picks.length + 1)),
        ...(done ? { rows: s.rows } : {}),
        ...extra,
      });
      if (action === "cashout") {
        assert(level > 0, "invalid_action");
        return { state: s, view: view({ outcome: "cashout" }, true), done: true, payout: floorPay(ctx.bet * ladderMult(cols, bad, level)) };
      }
      assert(action === "pick", "invalid_action");
      const col = payload?.col;
      assert(Number.isInteger(col) && col >= 0 && col < cols, "invalid_action");
      if (s.rows[level].includes(col)) return { state: s, view: view({ outcome: "bust", hit: { level, col } }, true), done: true, payout: 0 };
      s.picks.push(col);
      if (s.picks.length === spec.levels) {
        return { state: s, view: view({ outcome: "top" }, true), done: true, payout: floorPay(ctx.bet * ladderMult(cols, bad, spec.levels)) };
      }
      return { state: s, view: view({}, false), done: false };
    },
  };
}

export const LADDERS: Record<string, LadderSpec> = {
  // 37 · Escada: 4 degraus por andar, 1 a 3 armadilhas
  escada: { levels: 8, modes: { easy: { cols: 4, bad: 1 }, medium: { cols: 4, bad: 2 }, hard: { cols: 4, bad: 3 } } },
  // 38 · Galinha Atravessa: cada faixa tem chance de carro (1/25, 3/25, 5/25, 10/25)
  galinha: { levels: 20, modes: { easy: { cols: 25, bad: 1 }, medium: { cols: 25, bad: 3 }, hard: { cols: 25, bad: 5 }, insane: { cols: 25, bad: 10 } } },
  // 93 · Torre de Blocos: cada bloco pode cair
  blocos: { levels: 15, modes: { easy: { cols: 20, bad: 2 }, medium: { cols: 20, bad: 4 }, hard: { cols: 20, bad: 7 } } },
  // 98 · Maçã Dourada: galhos com maçãs boas e podres
  maca: { levels: 9, modes: { easy: { cols: 5, bad: 1 }, medium: { cols: 4, bad: 1 }, hard: { cols: 3, bad: 1 }, expert: { cols: 3, bad: 2 } } },
  // 45 · Gol de Pênalti: 5 cantos, o goleiro cobre 1, 2 ou 3; série de 5 cobranças
  penalti: { levels: 5, modes: { easy: { cols: 5, bad: 1 }, medium: { cols: 5, bad: 2 }, hard: { cols: 5, bad: 3 } } },
  // 41 · Cara ou Coroa em Série: cada acerto dobra (até 20 seguidos)
  moedas: { levels: 20, modes: { normal: { cols: 2, bad: 1 } } },
};

/* ====================================================================== Grade genérica (Mines)
 * Multiplicador após k acertos com b armadilhas em n casas: 0,98·C(n,k)/C(n−b,k).
 */
export function gridMult(n: number, bombs: number, safe: number) {
  let m = EDGE;
  for (let i = 0; i < safe; i++) m *= (n - i) / (n - bombs - i);
  return Math.min(MAX_MULT, r2(m));
}

export type GridSpec = { size: number; minBombs: number; maxBombs: number };
export function makeGrid(spec: GridSpec): SessionGame {
  const n = spec.size * spec.size;
  return {
    kind: "session",
    totalBet(p, bet) {
      assert(Number.isInteger(p?.bombs) && p.bombs >= spec.minBombs && p.bombs <= spec.maxBombs);
      return bet;
    },
    start(rng, p) {
      const bombPos = rng.pickUnique(n, p.bombs);
      const state = { bombs: p.bombs, bombPos, revealed: [] as number[] };
      return { state, view: { bombs: p.bombs, revealed: [], multiplier: 1, next: gridMult(n, p.bombs, 1) }, done: false };
    },
    action(s, action, payload, ctx) {
      const out = (extra: object, payout: number, done: boolean) => ({
        state: s,
        view: {
          bombs: s.bombs,
          revealed: s.revealed,
          multiplier: s.revealed.length ? gridMult(n, s.bombs, s.revealed.length) : 1,
          next: gridMult(n, s.bombs, s.revealed.length + 1),
          ...(done ? { bombPos: s.bombPos } : {}),
          ...extra,
        },
        done,
        payout,
      });
      if (action === "cashout") {
        assert(s.revealed.length > 0, "invalid_action");
        return out({ outcome: "cashout" }, floorPay(ctx.bet * gridMult(n, s.bombs, s.revealed.length)), true);
      }
      assert(action === "reveal", "invalid_action");
      const cell = payload?.cell;
      assert(Number.isInteger(cell) && cell >= 0 && cell < n && !s.revealed.includes(cell), "invalid_action");
      if (s.bombPos.includes(cell)) return out({ outcome: "bust", hit: cell }, 0, true);
      s.revealed.push(cell);
      const m = gridMult(n, s.bombs, s.revealed.length);
      if (s.revealed.length === n - s.bombs || m >= MAX_MULT) return out({ outcome: "cleared" }, floorPay(ctx.bet * m), true);
      return out({}, 0, false);
    },
  };
}

export const GRIDS: Record<string, GridSpec> = {
  bolhas: { size: 4, minBombs: 1, maxBombs: 12 }, // 36 · Bolhas
  mines7: { size: 7, minBombs: 1, maxBombs: 48 }, // 44 · Mines 7x7
  tesouro: { size: 6, minBombs: 1, maxBombs: 30 }, // 94 · Caça-Tesouro
};

/* ====================================================================== Escolha de prêmios ocultos
 * n posições com valores sorteados de forma independente; o jogador abre k. RTP = k·E[valor].
 */
export type PickSpec = { n: number; picks: number; values: { m: number; p: number }[] };
export function makePick(spec: PickSpec): SessionGame {
  return {
    kind: "session",
    totalBet: (_p, bet) => bet,
    start(rng) {
      const vals = Array.from({ length: spec.n }, () => spec.values[rng.weighted(spec.values.map((v) => v.p))].m);
      const state = { vals, opened: [] as number[] };
      return { state, view: { opened: [], found: [], total: 0, left: spec.picks }, done: false };
    },
    action(s, action, payload, ctx) {
      assert(action === "pick", "invalid_action");
      const i = payload?.index;
      assert(Number.isInteger(i) && i >= 0 && i < spec.n && !s.opened.includes(i), "invalid_action");
      s.opened.push(i);
      const found = s.opened.map((j: number) => s.vals[j]);
      const total = found.reduce((a: number, b: number) => a + b, 0);
      const done = s.opened.length >= spec.picks;
      return {
        state: s,
        view: { opened: s.opened, found, total: Math.round(total * 100) / 100, left: spec.picks - s.opened.length, ...(done ? { all: s.vals } : {}) },
        done,
        payout: done ? floorPay(ctx.bet * total) : 0,
      };
    },
  };
}

export const PICKS: Record<string, PickSpec> = {
  // 91 · Cofre do Banco: 3 de 12 cofres
  cofre: {
    n: 12,
    picks: 3,
    values: [
      { m: 0, p: 0.502 }, { m: 0.1, p: 0.2 }, { m: 0.3, p: 0.15 }, { m: 0.6, p: 0.08 },
      { m: 1, p: 0.04 }, { m: 2.5, p: 0.02 }, { m: 10, p: 0.007 }, { m: 50, p: 0.001 },
    ],
  },
  // 80 · Pescaria: 3 lançamentos entre 16 peixes
  pescaria: {
    n: 16,
    picks: 3,
    values: [
      { m: 0, p: 0.4608 }, { m: 0.15, p: 0.22 }, { m: 0.3, p: 0.16 }, { m: 0.6, p: 0.09 },
      { m: 1.2, p: 0.05 }, { m: 3, p: 0.015 }, { m: 15, p: 0.004 }, { m: 100, p: 0.0002 },
    ],
  },
};

/* ====================================================================== 72 · Raspadinha Baú Pirata
 * 9 casas, um baú escondido; até 3 tentativas. O baú guarda um prêmio sorteado (E ≈ 2,93x, achar = 1/3).
 */
export const CHEST_VALUES = [
  { m: 2, p: 0.6088 }, { m: 3, p: 0.25 }, { m: 5, p: 0.1 }, { m: 10, p: 0.04 }, { m: 50, p: 0.0012 },
];
export const chest: SessionGame = {
  kind: "session",
  totalBet: (_p, bet) => bet,
  start(rng) {
    const pos = rng.int(9);
    const prize = CHEST_VALUES[rng.weighted(CHEST_VALUES.map((v) => v.p))].m;
    const state = { pos, prize, opened: [] as number[] };
    return { state, view: { opened: [], left: 3 }, done: false };
  },
  action(s, action, payload, ctx) {
    assert(action === "pick", "invalid_action");
    const i = payload?.index;
    assert(Number.isInteger(i) && i >= 0 && i < 9 && !s.opened.includes(i), "invalid_action");
    s.opened.push(i);
    const found = i === s.pos;
    const done = found || s.opened.length >= 3;
    const view = { opened: s.opened, left: 3 - s.opened.length, ...(done ? { pos: s.pos, prize: s.prize, found } : {}) };
    return { state: s, view, done, payout: found ? floorPay(ctx.bet * s.prize) : 0 };
  },
};

/* ====================================================================== 33 · Hi-Lo de Cartas
 * Baralho infinito (cada carta é sorteada de 52). "Maior ou igual" / "menor ou igual".
 * Multiplicador acumulado = 0,98 · Π(1/p). Pode pular a carta (até 52 cartas por rodada).
 */
const hlRank = (c: number) => c % 13; // 0 = 2 ... 12 = A
/** "Maior ou igual" / "menor ou igual"; no 2 o "maior" é estrito e no Ás o "menor" é estrito. */
export function hiloProb(r: number, dir: "hi" | "lo") {
  if (dir === "hi") return r === 0 ? 12 / 13 : (13 - r) / 13;
  return r === 12 ? 12 / 13 : (r + 1) / 13;
}
export function hiloHit(r: number, next: number, dir: "hi" | "lo") {
  if (dir === "hi") return r === 0 ? next > r : next >= r;
  return r === 12 ? next < r : next <= r;
}
export const hilo: SessionGame = {
  kind: "session",
  totalBet: (_p, bet) => bet,
  start(rng) {
    const cards = Array.from({ length: 60 }, () => rng.int(52));
    const state = { cards, pos: 0, product: 1, steps: [] as { card: number; dir: string; ok: boolean }[], skips: 0 };
    return { state, view: hiloView(state, false), done: false };
  },
  action(s, action, payload, ctx) {
    const cur = s.cards[s.pos];
    const m = () => Math.min(MAX_MULT, r2(EDGE * s.product));
    if (action === "cashout") {
      assert(s.steps.some((x: any) => x.ok), "invalid_action");
      return { state: s, view: { ...hiloView(s, true), outcome: "cashout" }, done: true, payout: floorPay(ctx.bet * m()) };
    }
    if (s.pos >= s.cards.length - 2) throw new GameError("invalid_action");
    if (action === "skip") {
      assert(s.skips < 30, "invalid_action");
      s.skips++;
      s.pos++;
      s.steps.push({ card: s.cards[s.pos], dir: "skip", ok: true });
      return { state: s, view: hiloView(s, false), done: false };
    }
    assert(action === "hi" || action === "lo", "invalid_action");
    const p = hiloProb(hlRank(cur), action);
    s.pos++;
    const next = s.cards[s.pos];
    const ok = hiloHit(hlRank(cur), hlRank(next), action);
    s.steps.push({ card: next, dir: action, ok });
    if (!ok) return { state: s, view: { ...hiloView(s, true), outcome: "bust" }, done: true, payout: 0 };
    s.product *= 1 / p;
    if (m() >= MAX_MULT) return { state: s, view: { ...hiloView(s, true), outcome: "max" }, done: true, payout: floorPay(ctx.bet * m()) };
    return { state: s, view: hiloView(s, false), done: false };
  },
};
function hiloView(s: any, done: boolean) {
  const cur = s.cards[s.pos];
  const r = hlRank(cur);
  const m = Math.min(MAX_MULT, r2(EDGE * s.product));
  const pHi = hiloProb(r, "hi");
  const pLo = hiloProb(r, "lo");
  return {
    first: s.cards[0],
    card: cur,
    steps: s.steps,
    multiplier: s.steps.some((x: any) => x.ok && x.dir !== "skip") ? m : 1,
    hi: { p: pHi, mult: Math.min(MAX_MULT, r2((EDGE * s.product) / pHi)) },
    lo: { p: pLo, mult: Math.min(MAX_MULT, r2((EDGE * s.product) / pLo)) },
    done,
  };
}

/* ====================================================================== 97 · Escolha a Caixa (Monty Hall)
 * 3 caixas, uma com prêmio. Você escolhe, o apresentador abre uma vazia; você troca ou mantém.
 * Prêmio 1,47x. Trocar ganha 2/3 das vezes (RTP 98%); manter ganha 1/3.
 */
export const MONTY_MULT = 1.47;
export const monty: SessionGame = {
  kind: "session",
  totalBet: (_p, bet) => bet,
  start(rng) {
    const state = { prize: rng.int(3), coin: rng.int(2), pick: -1, opened: -1 };
    return { state, view: { phase: "pick" }, done: false };
  },
  action(s, action, payload, ctx) {
    if (action === "pick") {
      assert(s.pick < 0, "invalid_action");
      const b = payload?.box;
      assert(Number.isInteger(b) && b >= 0 && b < 3, "invalid_action");
      s.pick = b;
      const empties = [0, 1, 2].filter((i) => i !== b && i !== s.prize);
      s.opened = empties.length === 2 ? empties[s.coin] : empties[0];
      return { state: s, view: { phase: "decide", pick: s.pick, opened: s.opened }, done: false };
    }
    assert(action === "final" && s.pick >= 0, "invalid_action");
    const sw = !!payload?.switch;
    const final = sw ? [0, 1, 2].find((i) => i !== s.pick && i !== s.opened)! : s.pick;
    const win = final === s.prize;
    return {
      state: s,
      view: { phase: "done", pick: s.pick, opened: s.opened, final, switched: sw, prize: s.prize, win, multiplier: win ? MONTY_MULT : 0 },
      done: true,
      payout: win ? floorPay(ctx.bet * MONTY_MULT) : 0,
    };
  },
};

/* ====================================================================== Crash de dois foguetes / avião com saque parcial */
import { CRASH_GROWTH, crashMultAt, crashTimeFor } from "./sessions.js";
const CRASH_DELAY = 1500;

/** 31 · Foguete Duplo: dois foguetes independentes; metade da aposta em cada um. */
export const crashDuo: SessionGame = {
  kind: "session",
  totalBet(p, bet) {
    assert(bet >= 2, "invalid_params", "Aposta mínima de 2 fichas");
    for (const a of [p?.auto0, p?.auto1]) assert(a == null || (typeof a === "number" && a >= 1.01 && a <= 50_000));
    return bet;
  },
  start(rng, p) {
    const points = [crashPoint(rng.float()), crashPoint(rng.float())];
    const startAt = Date.now() + CRASH_DELAY;
    const auto = [p?.auto0 ? r2(p.auto0) : null, p?.auto1 ? r2(p.auto1) : null];
    const state = { points, startAt, auto, cashed: [null, null] as (number | null)[] };
    return { state, view: { startAt, serverNow: Date.now(), auto, growth: CRASH_GROWTH, cashed: state.cashed }, done: false };
  },
  action(s, action, payload, ctx) {
    assert(action === "poll" || action === "cashout", "invalid_action");
    const now = Date.now();
    const el = now - s.startAt;
    const half = [Math.floor(ctx.bet / 2), ctx.bet - Math.floor(ctx.bet / 2)];
    // resolve automáticos e crashes
    for (const i of [0, 1]) {
      if (s.cashed[i] != null) continue;
      if (s.auto[i] && s.auto[i] < s.points[i] && el >= crashTimeFor(s.auto[i])) s.cashed[i] = s.auto[i];
      else if (el >= crashTimeFor(s.points[i]) || s.points[i] <= 1) s.cashed[i] = 0;
    }
    if (action === "cashout") {
      const i = payload?.which;
      assert(i === 0 || i === 1, "invalid_action");
      if (el < 0) throw new GameError("not_started");
      if (s.cashed[i] == null) {
        const m = crashMultAt(el);
        s.cashed[i] = m >= s.points[i] ? 0 : m;
      }
    }
    const crashed = [0, 1].map((i) => el >= crashTimeFor(s.points[i]) || s.points[i] <= 1);
    const done = s.cashed[0] != null && s.cashed[1] != null;
    const payout = done ? floorPay(half[0] * (s.cashed[0] ?? 0)) + floorPay(half[1] * (s.cashed[1] ?? 0)) : 0;
    const view = {
      startAt: s.startAt,
      serverNow: now,
      auto: s.auto,
      growth: CRASH_GROWTH,
      cashed: s.cashed,
      multiplier: crashMultAt(el),
      // o ponto de cada foguete só é revelado quando ele explode (ou no fim da rodada)
      points: [0, 1].map((i) => (crashed[i] || done ? s.points[i] : null)),
      ...(done ? { outcome: "done" } : {}),
    };
    return { state: s, view, done, payout };
  },
};

/** 32 · Aviãozinho: um avião; pode sacar metade uma vez e deixar o resto voando. */
export const crashPlane: SessionGame = {
  kind: "session",
  totalBet(p, bet) {
    assert(bet >= 2, "invalid_params", "Aposta mínima de 2 fichas");
    const a = p?.autoCashout;
    assert(a == null || (typeof a === "number" && a >= 1.01 && a <= 50_000));
    return bet;
  },
  start(rng, p) {
    const point = crashPoint(rng.float());
    const startAt = Date.now() + CRASH_DELAY;
    const state = { point, startAt, auto: p?.autoCashout ? r2(p.autoCashout) : null, half: null as number | null };
    return { state, view: { startAt, serverNow: Date.now(), auto: state.auto, growth: CRASH_GROWTH, half: null }, done: false };
  },
  action(s, action, _payload, ctx) {
    assert(action === "poll" || action === "cashout" || action === "half", "invalid_action");
    const now = Date.now();
    const el = now - s.startAt;
    const h1 = Math.floor(ctx.bet / 2);
    const rest = s.half != null ? ctx.bet - h1 : ctx.bet;
    const halfPay = s.half != null ? floorPay(h1 * s.half) : 0;
    const finished = (outcome: string, mult: number) => ({
      state: s,
      view: { outcome, point: s.point, cashedAt: mult || null, half: s.half, startAt: s.startAt, serverNow: now },
      done: true,
      payout: halfPay + floorPay(rest * mult),
    });
    if (s.auto && s.auto < s.point && el >= crashTimeFor(s.auto)) return finished("cashout", s.auto);
    if (el >= crashTimeFor(s.point) || s.point <= 1) return finished("crash", 0);
    if (action === "cashout" || action === "half") {
      if (el < 0) throw new GameError("not_started");
      const m = crashMultAt(el);
      if (m >= s.point) return finished("crash", 0);
      if (action === "cashout") return finished("cashout", m);
      assert(s.half == null, "invalid_action");
      s.half = m;
    }
    return {
      state: s,
      view: { startAt: s.startAt, serverNow: now, auto: s.auto, growth: CRASH_GROWTH, multiplier: crashMultAt(el), half: s.half },
      done: false,
    };
  },
};
