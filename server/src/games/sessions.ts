import { crashPoint } from "../fair.js";
import { decks, eval3, eval5, Hand3, Hand5, rank } from "./cards.js";
import { assert, floorPay, GameError, type SessionGame, type SessionStep } from "./types.js";

/* ====================================================================== Blackjack
 * 6 baralhos, dealer para em 17 soft (S17), blackjack paga 3:2, dobrar com 2 cartas,
 * uma divisão por rodada (ases divididos recebem uma carta).
 */
const bjVal = (c: number) => {
  const r = rank(c);
  return r <= 8 ? r + 2 : r === 12 ? 11 : 10;
};

export function bjTotal(cards: number[]) {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    total += bjVal(c);
    if (rank(c) === 12) aces++;
  }
  while (total > 21 && aces) {
    total -= 10;
    aces--;
  }
  return { total, soft: aces > 0 };
}

type BjHand = { cards: number[]; bet: number; done: boolean; doubled?: boolean; splitAces?: boolean; result?: string; payout?: number };
type BjState = { deck: number[]; pos: number; dealer: number[]; hands: BjHand[]; active: number; split: boolean };

const isBJ = (cards: number[]) => cards.length === 2 && bjTotal(cards).total === 21;

function bjView(s: BjState, done: boolean) {
  const hands = s.hands.map((h) => ({ ...h, total: bjTotal(h.cards).total, soft: bjTotal(h.cards).soft }));
  const h = s.hands[s.active];
  const actions: string[] = [];
  if (!done && h && !h.done) {
    actions.push("hit", "stand");
    if (h.cards.length === 2) actions.push("double");
    if (!s.split && h.cards.length === 2 && bjVal(h.cards[0]) === bjVal(h.cards[1])) actions.push("split");
  }
  return {
    dealer: done ? s.dealer : [s.dealer[0], -1],
    dealerTotal: done ? bjTotal(s.dealer).total : bjVal(s.dealer[0]),
    hands,
    active: s.active,
    actions,
  };
}

function bjDraw(s: BjState) {
  return s.deck[s.pos++];
}

function bjFinish(s: BjState): SessionStep {
  const live = s.hands.some((h) => bjTotal(h.cards).total <= 21);
  if (live) while (bjTotal(s.dealer).total < 17) s.dealer.push(bjDraw(s));
  const d = bjTotal(s.dealer).total;
  let payout = 0;
  for (const h of s.hands) {
    const p = bjTotal(h.cards).total;
    let mult: number;
    if (p > 21) { mult = 0; h.result = "bust"; }
    else if (d > 21 || p > d) { mult = 2; h.result = "win"; }
    else if (p === d) { mult = 1; h.result = "push"; }
    else { mult = 0; h.result = "lose"; }
    h.payout = h.bet * mult;
    payout += h.payout;
  }
  return { state: s, view: bjView(s, true), done: true, payout };
}

function bjAdvance(s: BjState): SessionStep {
  while (s.active < s.hands.length && s.hands[s.active].done) s.active++;
  if (s.active >= s.hands.length) return bjFinish(s);
  const h = s.hands[s.active];
  if (h.cards.length === 1) {
    h.cards.push(bjDraw(s));
    if (h.splitAces || bjTotal(h.cards).total === 21) {
      h.done = true;
      return bjAdvance(s);
    }
  }
  return { state: s, view: bjView(s, false), done: false };
}

export const blackjack: SessionGame = {
  kind: "session",
  totalBet: (_p, bet) => bet,
  start(rng, _p, bet) {
    const deck = rng.shuffle(decks(6));
    const s: BjState = { deck, pos: 0, dealer: [], hands: [{ cards: [], bet, done: false }], active: 0, split: false };
    s.hands[0].cards.push(bjDraw(s));
    s.dealer.push(bjDraw(s));
    s.hands[0].cards.push(bjDraw(s));
    s.dealer.push(bjDraw(s));
    const pBJ = isBJ(s.hands[0].cards);
    const dBJ = isBJ(s.dealer);
    if (pBJ || dBJ) {
      const h = s.hands[0];
      h.done = true;
      const mult = pBJ && dBJ ? 1 : pBJ ? 2.5 : 0;
      h.result = pBJ && dBJ ? "push" : pBJ ? "blackjack" : "lose";
      h.payout = floorPay(bet * mult);
      return { state: s, view: bjView(s, true), done: true, payout: h.payout };
    }
    return { state: s, view: bjView(s, false), done: false };
  },
  action(s: BjState, action, _payload, ctx) {
    const h = s.hands[s.active];
    assert(h && !h.done, "invalid_action");
    if (action === "hit") {
      h.cards.push(bjDraw(s));
      if (bjTotal(h.cards).total >= 21) h.done = true;
      return bjAdvance(s);
    }
    if (action === "stand") {
      h.done = true;
      return bjAdvance(s);
    }
    if (action === "double") {
      assert(h.cards.length === 2, "invalid_action");
      if (ctx.balance < h.bet) throw new GameError("insufficient_balance");
      const extra = h.bet;
      h.bet *= 2;
      h.doubled = true;
      h.cards.push(bjDraw(s));
      h.done = true;
      return { ...bjAdvance(s), extraBet: extra };
    }
    if (action === "split") {
      assert(!s.split && h.cards.length === 2 && bjVal(h.cards[0]) === bjVal(h.cards[1]), "invalid_action");
      if (ctx.balance < h.bet) throw new GameError("insufficient_balance");
      s.split = true;
      const aces = rank(h.cards[0]) === 12;
      const second: BjHand = { cards: [h.cards[1]], bet: h.bet, done: false, splitAces: aces };
      h.cards = [h.cards[0]];
      h.splitAces = aces;
      s.hands.splice(s.active + 1, 0, second);
      return { ...bjAdvance(s), extraBet: h.bet };
    }
    throw new GameError("invalid_action");
  },
};

/* ====================================================================== Video pôquer (Jacks or Better 9/6) */
export const VP_PAYS: Record<number, number> = {
  [Hand5.RoyalFlush]: 800,
  [Hand5.StraightFlush]: 50,
  [Hand5.Quads]: 25,
  [Hand5.FullHouse]: 9,
  [Hand5.Flush]: 6,
  [Hand5.Straight]: 4,
  [Hand5.Trips]: 3,
  [Hand5.TwoPair]: 2,
  [Hand5.Pair]: 1, // só valetes ou maior
};

export function vpPay(cards: number[]) {
  const e = eval5(cards);
  if (e.cat === Hand5.Pair && e.pairRank < 9) return { cat: Hand5.HighCard, mult: 0 };
  return { cat: e.cat, mult: VP_PAYS[e.cat] ?? 0 };
}

export const videopoker: SessionGame = {
  kind: "session",
  totalBet: (_p, bet) => bet,
  start(rng) {
    const deck = rng.shuffle(decks(1));
    const hand = deck.slice(0, 5);
    const state = { deck, hand };
    return { state, view: { hand, phase: "hold", current: vpPay(hand) }, done: false };
  },
  action(s, action, payload, ctx) {
    assert(action === "draw", "invalid_action");
    const hold: boolean[] = Array.isArray(payload?.hold) ? payload.hold : [];
    let pos = 5;
    const hand = s.hand.map((c: number, i: number) => (hold[i] ? c : s.deck[pos++]));
    const { cat, mult } = vpPay(hand);
    return {
      state: { ...s, hand },
      view: { hand, held: [0, 1, 2, 3, 4].map((i) => !!hold[i]), phase: "done", hand_rank: cat, multiplier: mult },
      done: true,
      payout: floorPay(ctx.bet * mult),
    };
  },
};

/* ====================================================================== Three Card Poker */
const PAIR_PLUS: Record<number, number> = { [Hand3.StraightFlush]: 40, [Hand3.Trips]: 30, [Hand3.Straight]: 6, [Hand3.Flush]: 3, [Hand3.Pair]: 1 };
const ANTE_BONUS: Record<number, number> = { [Hand3.StraightFlush]: 5, [Hand3.Trips]: 4, [Hand3.Straight]: 1 };

export const threecard: SessionGame = {
  kind: "session",
  totalBet(p, bet) {
    const pp = p?.pairPlus ?? 0;
    assert(Number.isInteger(pp) && pp >= 0);
    return bet + pp;
  },
  start(rng, p, bet) {
    const deck = rng.pickUnique(52, 6);
    const state = { ante: bet, pairPlus: p?.pairPlus ?? 0, player: deck.slice(0, 3), dealer: deck.slice(3, 6) };
    const pe = eval3(state.player);
    return { state, view: { player: state.player, dealer: [-1, -1, -1], playerHand: pe.cat, ante: bet, pairPlus: state.pairPlus }, done: false };
  },
  action(s, action, _payload, ctx) {
    assert(action === "play" || action === "fold", "invalid_action");
    const pe = eval3(s.player);
    const de = eval3(s.dealer);
    const ppPay = s.pairPlus && PAIR_PLUS[pe.cat] ? s.pairPlus * (PAIR_PLUS[pe.cat] + 1) : 0;
    const base = { player: s.player, dealer: s.dealer, playerHand: pe.cat, dealerHand: de.cat, ante: s.ante, pairPlus: s.pairPlus, pairPlusPay: ppPay };
    if (action === "fold") {
      return { state: s, view: { ...base, outcome: "fold", qualifies: null }, done: true, payout: ppPay };
    }
    if (ctx.balance < s.ante) throw new GameError("insufficient_balance");
    const qualifies = de.cat > Hand3.HighCard || de.high >= 10; // dama ou maior
    const bonus = ANTE_BONUS[pe.cat] ? s.ante * ANTE_BONUS[pe.cat] : 0;
    let payout = ppPay + bonus;
    let outcome: string;
    if (!qualifies) {
      outcome = "noqualify";
      payout += s.ante * 2 + s.ante; // ante paga 1:1, play devolvido
    } else if (pe.score > de.score) {
      outcome = "win";
      payout += s.ante * 2 + s.ante * 2;
    } else if (pe.score === de.score) {
      outcome = "push";
      payout += s.ante * 2;
    } else outcome = "lose";
    return { state: s, view: { ...base, outcome, qualifies, anteBonus: bonus }, done: true, payout, extraBet: s.ante };
  },
};

/* ====================================================================== Caribbean Stud */
const CS_PAYS: Record<number, number> = {
  [Hand5.RoyalFlush]: 100, [Hand5.StraightFlush]: 50, [Hand5.Quads]: 20, [Hand5.FullHouse]: 7,
  [Hand5.Flush]: 5, [Hand5.Straight]: 4, [Hand5.Trips]: 3, [Hand5.TwoPair]: 2, [Hand5.Pair]: 1, [Hand5.HighCard]: 1,
};

export const caribbean: SessionGame = {
  kind: "session",
  totalBet: (_p, bet) => bet,
  start(rng, _p, bet) {
    const deck = rng.pickUnique(52, 10);
    const state = { ante: bet, player: deck.slice(0, 5), dealer: deck.slice(5, 10) };
    return { state, view: { player: state.player, dealer: [state.dealer[0], -1, -1, -1, -1], playerHand: eval5(state.player).cat, ante: bet }, done: false };
  },
  action(s, action) {
    assert(action === "call" || action === "fold", "invalid_action");
    const pe = eval5(s.player);
    const de = eval5(s.dealer);
    const base = { player: s.player, dealer: s.dealer, playerHand: pe.cat, dealerHand: de.cat, ante: s.ante };
    if (action === "fold") return { state: s, view: { ...base, outcome: "fold" }, done: true, payout: 0 };
    const call = s.ante * 2;
    const qualifies = de.cat > Hand5.HighCard || (de.ranks.includes(12) && de.ranks.includes(11));
    let payout = 0;
    let outcome: string;
    if (!qualifies) {
      outcome = "noqualify";
      payout = s.ante * 2 + call;
    } else if (pe.score > de.score) {
      outcome = "win";
      payout = s.ante * 2 + call + call * CS_PAYS[pe.cat];
    } else if (pe.score === de.score) {
      outcome = "push";
      payout = s.ante + call;
    } else outcome = "lose";
    return { state: s, view: { ...base, outcome, qualifies, callPay: CS_PAYS[pe.cat] }, done: true, payout, extraBet: call };
  },
};

/* ====================================================================== Mines (5x5) */
export function minesMult(mines: number, safe: number) {
  let m = 0.99;
  for (let i = 0; i < safe; i++) m *= (25 - i) / (25 - mines - i);
  return Math.floor(m * 100) / 100;
}

export const mines: SessionGame = {
  kind: "session",
  totalBet(p, bet) {
    assert(Number.isInteger(p?.mines) && p.mines >= 1 && p.mines <= 24);
    return bet;
  },
  start(rng, p) {
    const minePos = rng.pickUnique(25, p.mines);
    const state = { mines: p.mines, minePos, revealed: [] as number[] };
    return { state, view: { mines: p.mines, revealed: [], multiplier: 1, next: minesMult(p.mines, 1) }, done: false };
  },
  action(s, action, payload, ctx) {
    const reveal = (extra: object, payout: number, done: boolean) => ({
      state: s,
      view: {
        mines: s.mines,
        revealed: s.revealed,
        multiplier: minesMult(s.mines, s.revealed.length),
        next: minesMult(s.mines, s.revealed.length + 1),
        ...(done ? { minePos: s.minePos } : {}),
        ...extra,
      },
      done,
      payout,
    });
    if (action === "cashout") {
      assert(s.revealed.length > 0, "invalid_action");
      const m = minesMult(s.mines, s.revealed.length);
      return reveal({ outcome: "cashout" }, floorPay(ctx.bet * m), true);
    }
    assert(action === "reveal", "invalid_action");
    const cell = payload?.cell;
    assert(Number.isInteger(cell) && cell >= 0 && cell < 25 && !s.revealed.includes(cell), "invalid_action");
    if (s.minePos.includes(cell)) return reveal({ outcome: "bust", hit: cell }, 0, true);
    s.revealed.push(cell);
    if (s.revealed.length === 25 - s.mines) {
      return reveal({ outcome: "cleared" }, floorPay(ctx.bet * minesMult(s.mines, s.revealed.length)), true);
    }
    return reveal({}, 0, false);
  },
};

/* ====================================================================== Torre */
export const TOWER_LEVELS = 9;
export const TOWER_MODES: Record<string, { cols: number; bad: number }> = {
  easy: { cols: 4, bad: 1 },
  medium: { cols: 3, bad: 1 },
  hard: { cols: 2, bad: 1 },
  expert: { cols: 3, bad: 2 },
  master: { cols: 4, bad: 3 },
};
export function towerMult(mode: string, level: number) {
  const { cols, bad } = TOWER_MODES[mode];
  return Math.floor((0.99 / ((cols - bad) / cols) ** level) * 100) / 100;
}

export const tower: SessionGame = {
  kind: "session",
  totalBet(p, bet) {
    assert(p?.mode in TOWER_MODES);
    return bet;
  },
  start(rng, p) {
    const { cols, bad } = TOWER_MODES[p.mode];
    const rows = Array.from({ length: TOWER_LEVELS }, () => rng.pickUnique(cols, bad));
    const state = { mode: p.mode, rows, picks: [] as number[] };
    return { state, view: { mode: p.mode, picks: [], level: 0, multiplier: 1, next: towerMult(p.mode, 1) }, done: false };
  },
  action(s, action, payload, ctx) {
    const level = s.picks.length;
    const view = (extra: object, done: boolean) => ({
      mode: s.mode,
      picks: s.picks,
      level: s.picks.length,
      multiplier: s.picks.length ? towerMult(s.mode, s.picks.length) : 1,
      next: towerMult(s.mode, Math.min(TOWER_LEVELS, s.picks.length + 1)),
      ...(done ? { rows: s.rows } : {}),
      ...extra,
    });
    if (action === "cashout") {
      assert(level > 0, "invalid_action");
      return { state: s, view: view({ outcome: "cashout" }, true), done: true, payout: floorPay(ctx.bet * towerMult(s.mode, level)) };
    }
    assert(action === "pick", "invalid_action");
    const col = payload?.col;
    assert(Number.isInteger(col) && col >= 0 && col < TOWER_MODES[s.mode].cols, "invalid_action");
    if (s.rows[level].includes(col)) {
      return { state: s, view: view({ outcome: "bust", hit: { level, col } }, true), done: true, payout: 0 };
    }
    s.picks.push(col);
    if (s.picks.length === TOWER_LEVELS) {
      return { state: s, view: view({ outcome: "top" }, true), done: true, payout: floorPay(ctx.bet * towerMult(s.mode, TOWER_LEVELS)) };
    }
    return { state: s, view: view({}, false), done: false };
  },
};

/* ====================================================================== Crash
 * Curva: m(t) = e^(0.00006·t), t em ms (2x ≈ 11,6 s; 10x ≈ 38 s).
 * O ponto de crash é sorteado no início e fica em segredo no servidor; o saque usa o relógio do servidor.
 */
export const CRASH_GROWTH = 0.00006;
export const CRASH_DELAY_MS = 1500;
export const crashMultAt = (ms: number) => (ms <= 0 ? 1 : Math.floor(100 * Math.exp(CRASH_GROWTH * ms)) / 100);
export const crashTimeFor = (m: number) => Math.log(m) / CRASH_GROWTH;

export const crash: SessionGame = {
  kind: "session",
  totalBet(p, bet) {
    const a = p?.autoCashout;
    assert(a == null || (typeof a === "number" && a >= 1.01 && a <= 50_000));
    return bet;
  },
  start(rng, p) {
    const point = crashPoint(rng.float());
    const startAt = Date.now() + CRASH_DELAY_MS;
    const state = { point, startAt, auto: p?.autoCashout ? Math.floor(p.autoCashout * 100) / 100 : null };
    return { state, view: { startAt, serverNow: Date.now(), auto: state.auto, growth: CRASH_GROWTH }, done: false };
  },
  action(s, action, _payload, ctx) {
    assert(action === "poll" || action === "cashout", "invalid_action");
    const now = Date.now();
    const elapsed = now - s.startAt;
    const crashAt = crashTimeFor(s.point);
    const finished = (outcome: string, mult: number) => ({
      state: s,
      view: { outcome, point: s.point, cashedAt: mult || null, startAt: s.startAt, serverNow: now },
      done: true,
      payout: floorPay(ctx.bet * mult),
    });
    // saque automático acontece antes do crash
    if (s.auto && s.auto < s.point && elapsed >= crashTimeFor(s.auto)) return finished("cashout", s.auto);
    if (elapsed >= crashAt || s.point <= 1) return finished("crash", 0);
    if (action === "cashout") {
      if (elapsed < 0) throw new GameError("not_started");
      const m = crashMultAt(elapsed);
      if (m >= s.point) return finished("crash", 0);
      return finished("cashout", m);
    }
    return { state: s, view: { startAt: s.startAt, serverNow: now, auto: s.auto, growth: CRASH_GROWTH, multiplier: crashMultAt(elapsed) }, done: false };
  },
};
