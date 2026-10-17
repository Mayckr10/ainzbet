/**
 * Onda 1 · jogos de cartas: Dragon Tiger, Andar Bahar, Red Dog, Guerra, Bacará Relâmpago,
 * Blackjack (Europeu, Multimão, Switch, 21+3), Video Pôquer (Deuces Wild, Double Bonus, Joker) e Let It Ride.
 */
import { decks, eval3, eval5, Hand3, Hand5, rank, suit } from "./cards.js";
import { playBaccarat } from "./simple.js";
import { assert, floorPay, GameError, type InstantGame, type SessionGame, type SessionStep } from "./types.js";

const posInt = (v: unknown) => Number.isInteger(v) && (v as number) > 0;

function sumBets(bets: unknown, keys: string[]) {
  assert(bets && typeof bets === "object");
  let total = 0;
  for (const [k, v] of Object.entries(bets as Record<string, unknown>)) {
    assert(keys.includes(k));
    if (v === 0) continue;
    assert(posInt(v));
    total += v as number;
  }
  assert(total > 0);
  return total;
}

/* ====================================================================== 53 · Dragon Tiger */
/** Valor no Dragon Tiger: Ás = 1 (menor) ... Rei = 13 (maior). */
export const dtValue = (c: number) => (rank(c) === 12 ? 1 : rank(c) + 2);
export const DT_PAYS = { side: 2, tie: 13 };
export const dragonTiger: InstantGame = {
  kind: "instant",
  totalBet: (p) => sumBets(p?.bets, ["dragon", "tiger", "tie"]),
  play(rng, p) {
    const [d, t] = rng.pickUnique(416, 2).map((i) => i % 52);
    const dv = dtValue(d);
    const tv = dtValue(t);
    const winner = dv > tv ? "dragon" : tv > dv ? "tiger" : "tie";
    const b = p.bets as Record<string, number>;
    let payout = 0;
    if (winner === "tie") {
      payout += (b.tie ?? 0) * DT_PAYS.tie + (b.dragon ?? 0) / 2 + (b.tiger ?? 0) / 2;
    } else payout += (b[winner] ?? 0) * DT_PAYS.side;
    return { payout: floorPay(payout), result: { dragon: d, tiger: t, winner } };
  },
};

/* ====================================================================== 54 · Andar Bahar */
export const AB_PAYS = { andar: 1.9, bahar: 2 };
export const andarBahar: InstantGame = {
  kind: "instant",
  totalBet: (p) => sumBets(p?.bets, ["andar", "bahar"]),
  play(rng, p) {
    const deck = rng.shuffle(decks(1));
    const joker = deck[0];
    const andar: number[] = [];
    const bahar: number[] = [];
    let winner: "andar" | "bahar" = "andar";
    for (let i = 1; i < deck.length; i++) {
      const side = i % 2 === 1 ? andar : bahar; // começa pelo Andar
      side.push(deck[i]);
      if (rank(deck[i]) === rank(joker)) {
        winner = side === andar ? "andar" : "bahar";
        break;
      }
    }
    const b = p.bets as Record<string, number>;
    const payout = (b[winner] ?? 0) * AB_PAYS[winner];
    return { payout: floorPay(payout), result: { joker, andar, bahar, winner } };
  },
};

/* ====================================================================== 68 · Red Dog */
export const RD_PAYS: Record<number, number> = { 1: 5, 2: 4, 3: 2 }; // 4+ paga 1:1
export const rdPay = (spread: number) => RD_PAYS[spread] ?? 1;
export const redDog: SessionGame = {
  kind: "session",
  totalBet: (_p, bet) => bet,
  start(rng, _p, bet) {
    const cards = rng.pickUnique(416, 3).map((i) => i % 52);
    const [a, b] = cards;
    const ra = rank(a);
    const rb = rank(b);
    const state = { cards, raised: false };
    if (ra === rb) {
      const trips = rank(cards[2]) === ra;
      return { state, view: { cards, outcome: trips ? "trips" : "pair", spread: -1 }, done: true, payout: trips ? bet * 12 : bet };
    }
    if (Math.abs(ra - rb) === 1) return { state, view: { cards: [a, b], outcome: "consecutive", spread: 0 }, done: true, payout: bet };
    const spread = Math.abs(ra - rb) - 1;
    return { state, view: { cards: [a, b], spread, pay: rdPay(spread) }, done: false };
  },
  action(s, action, _payload, ctx) {
    assert(action === "raise" || action === "call", "invalid_action");
    const raise = action === "raise";
    if (raise && ctx.balance < ctx.bet) throw new GameError("insufficient_balance");
    const [a, b, c] = s.cards;
    const lo = Math.min(rank(a), rank(b));
    const hi = Math.max(rank(a), rank(b));
    const spread = hi - lo - 1;
    const win = rank(c) > lo && rank(c) < hi;
    const stake = raise ? ctx.bet * 2 : ctx.bet;
    return {
      state: { ...s, raised: raise },
      view: { cards: s.cards, spread, pay: rdPay(spread), raised: raise, outcome: win ? "win" : "lose" },
      done: true,
      payout: win ? stake * (1 + rdPay(spread)) : 0,
      extraBet: raise ? ctx.bet : 0,
    };
  },
};

/* ====================================================================== 69 · Guerra de Cartas */
export const war: SessionGame = {
  kind: "session",
  totalBet: (_p, bet) => bet,
  start(rng, _p, bet) {
    const shoe = rng.pickUnique(312, 8).map((i) => i % 52);
    const [pc, dc] = shoe;
    const state = { shoe };
    if (rank(pc) !== rank(dc)) {
      const win = rank(pc) > rank(dc);
      return { state, view: { player: pc, dealer: dc, outcome: win ? "win" : "lose" }, done: true, payout: win ? bet * 2 : 0 };
    }
    return { state, view: { player: pc, dealer: dc, outcome: "tie" }, done: false };
  },
  action(s, action, _payload, ctx) {
    assert(action === "war" || action === "surrender", "invalid_action");
    const [pc, dc, b1, b2, b3, p2, d2] = s.shoe;
    if (action === "surrender") {
      return { state: s, view: { player: pc, dealer: dc, outcome: "surrender" }, done: true, payout: Math.floor(ctx.bet / 2) };
    }
    if (ctx.balance < ctx.bet) throw new GameError("insufficient_balance");
    const win = rank(p2) >= rank(d2);
    return {
      state: s,
      view: { player: pc, dealer: dc, burn: [b1, b2, b3], player2: p2, dealer2: d2, outcome: win ? (rank(p2) === rank(d2) ? "warTie" : "warWin") : "warLose" },
      done: true,
      // na guerra: a aposta original empata e o aumento paga 1:1 (empate na guerra conta como vitória)
      payout: win ? ctx.bet * 3 : 0,
      extraBet: ctx.bet,
    };
  },
};

/* ====================================================================== 67 · Bacará Relâmpago
 * Taxa de 20% sobre as apostas. A cada rodada 1 a 5 cartas-relâmpago recebem 2x a 8x; se a mão
 * vencedora contém cartas-relâmpago, o prêmio é multiplicado (os multiplicadores se multiplicam).
 */
export const LB_FEE = 0.12;
export const LB_MULTS = [
  { m: 2, p: 0.45 },
  { m: 3, p: 0.3 },
  { m: 4, p: 0.13 },
  { m: 5, p: 0.08 },
  { m: 8, p: 0.04 },
];
export const LB_PAYS = { player: 1, banker: 0.95, tie: 6.5 };
export const LB_MAX = 512;
export const baccaratLightning: InstantGame = {
  kind: "instant",
  totalBet: (p) => {
    const t = sumBets(p?.bets, ["player", "banker", "tie"]);
    return t + Math.ceil(t * LB_FEE);
  },
  play(rng, p) {
    const count = rng.weighted([0.3, 0.3, 0.2, 0.12, 0.08]) + 1;
    const lightning = rng.pickUnique(52, count).map((card) => ({ card, mult: LB_MULTS[rng.weighted(LB_MULTS.map((x) => x.p))].m }));
    const r = playBaccarat(rng);
    const b = p.bets as Record<string, number>;
    const lmap = new Map(lightning.map((l) => [l.card, l.mult]));
    const multOf = (hand: number[]) => Math.min(LB_MAX, hand.reduce((m, c) => m * (lmap.get(c % 52) ?? 1), 1));
    let payout = 0;
    let applied = 1;
    if (r.winner === "player" && b.player) {
      applied = multOf(r.player);
      payout += b.player * (1 + LB_PAYS.player * applied);
    }
    if (r.winner === "banker" && b.banker) {
      applied = multOf(r.banker);
      payout += b.banker * (1 + LB_PAYS.banker * applied);
    }
    if (r.winner === "tie") {
      applied = Math.min(LB_MAX, multOf(r.player) * multOf(r.banker));
      if (b.tie) payout += b.tie * (1 + LB_PAYS.tie * applied);
      payout += (b.player ?? 0) + (b.banker ?? 0);
    }
    return { payout: floorPay(payout), result: { ...r, lightning, applied } };
  },
};

/* ====================================================================== Blackjack (variantes) */
export type BjVariant = { enhc?: boolean; double911?: boolean; maxHands: number; minHands?: number; switch?: boolean; side?: boolean };
export const BJ_VARIANTS: Record<string, BjVariant> = {
  "bj-eu": { enhc: true, double911: true, maxHands: 1 },
  "bj-multi": { maxHands: 3 },
  "bj-switch": { switch: true, maxHands: 2, minHands: 2 },
  "bj-213": { side: true, maxHands: 1 },
};
export const SIDE_213: Record<string, number> = { suitedTrips: 100, straightFlush: 40, trips: 30, straight: 10, flush: 5 };

const bjv = (c: number) => {
  const r = rank(c);
  return r <= 8 ? r + 2 : r === 12 ? 11 : 10;
};
export function bjTotal(cards: number[]) {
  let t = 0;
  let a = 0;
  for (const c of cards) {
    t += bjv(c);
    if (rank(c) === 12) a++;
  }
  while (t > 21 && a) {
    t -= 10;
    a--;
  }
  return { total: t, soft: a > 0 };
}
type PH = { cards: number[]; bet: number; seat: number; done: boolean; split?: boolean; splitAces?: boolean; doubled?: boolean; result?: string; payout?: number };
type PS = { v: string; deck: number[]; pos: number; dealer: number[]; hands: PH[]; active: number; splitSeats: number[]; phase: "switch" | "play" | "done"; switched: boolean; side: number; sidePay: number; sideCat: string | null };

const two21 = (cards: number[]) => cards.length === 2 && bjTotal(cards).total === 21;

function side213(cards: number[]) {
  const e = eval3(cards);
  if (e.cat === Hand3.Trips) return suit(cards[0]) === suit(cards[1]) && suit(cards[1]) === suit(cards[2]) ? "suitedTrips" : "trips";
  if (e.cat === Hand3.StraightFlush) return "straightFlush";
  if (e.cat === Hand3.Straight) return "straight";
  if (e.cat === Hand3.Flush) return "flush";
  return null;
}

function pView(s: PS) {
  const V = BJ_VARIANTS[s.v];
  const done = s.phase === "done";
  const hands = s.hands.map((h) => ({ ...h, total: bjTotal(h.cards).total, soft: bjTotal(h.cards).soft }));
  const h = s.hands[s.active];
  const actions: string[] = [];
  if (s.phase === "switch") actions.push("switch", "noswitch");
  else if (!done && h && !h.done) {
    actions.push("hit", "stand");
    const t = bjTotal(h.cards);
    if (h.cards.length === 2 && !h.splitAces && (!V.double911 || (t.total >= 9 && t.total <= 11))) actions.push("double");
    if (!h.split && !s.splitSeats.includes(h.seat) && h.cards.length === 2 && bjv(h.cards[0]) === bjv(h.cards[1])) actions.push("split");
  }
  const dealer = done ? s.dealer : V.enhc ? [s.dealer[0]] : [s.dealer[0], -1];
  return {
    variant: s.v,
    dealer,
    dealerTotal: done ? bjTotal(s.dealer).total : bjv(s.dealer[0]),
    hands,
    active: s.active,
    actions,
    phase: s.phase,
    switched: s.switched,
    side: s.side,
    sideCat: s.sideCat,
    sidePay: s.sidePay,
  };
}

function pDraw(s: PS) {
  return s.deck[s.pos++];
}

function pFinish(s: PS): SessionStep {
  const V = BJ_VARIANTS[s.v];
  s.phase = "done";
  if (V.enhc && s.dealer.length === 1) s.dealer.push(pDraw(s));
  const dBJ = two21(s.dealer);
  const live = s.hands.some((h) => bjTotal(h.cards).total <= 21 && !(two21(h.cards) && !h.split && !s.switched));
  if (live && !dBJ) while (bjTotal(s.dealer).total < 17) s.dealer.push(pDraw(s));
  const d = bjTotal(s.dealer).total;
  let payout = s.sidePay;
  for (const h of s.hands) {
    const p = bjTotal(h.cards).total;
    const pBJ = two21(h.cards) && !h.split && !s.switched;
    let mult: number;
    if (p > 21) [mult, h.result] = [0, "bust"];
    else if (pBJ && !dBJ) [mult, h.result] = [V.switch ? 2 : 2.5, "blackjack"];
    else if (pBJ && dBJ) [mult, h.result] = [1, "push"];
    else if (dBJ) [mult, h.result] = [0, "lose"];
    else if (V.switch && d === 22) [mult, h.result] = [1, "push"];
    else if (d > 21 || p > d) [mult, h.result] = [2, "win"];
    else if (p === d) [mult, h.result] = [1, "push"];
    else [mult, h.result] = [0, "lose"];
    h.payout = floorPay(h.bet * mult);
    payout += h.payout;
  }
  return { state: s, view: pView(s), done: true, payout };
}

function pAdvance(s: PS): SessionStep {
  while (s.active < s.hands.length && s.hands[s.active].done) s.active++;
  if (s.active >= s.hands.length) return pFinish(s);
  const h = s.hands[s.active];
  if (h.cards.length === 1) {
    h.cards.push(pDraw(s));
    if (h.splitAces || bjTotal(h.cards).total === 21) {
      h.done = true;
      return pAdvance(s);
    }
  }
  if (bjTotal(h.cards).total === 21) {
    h.done = true;
    return pAdvance(s);
  }
  return { state: s, view: pView(s), done: false };
}

export function makeBlackjack(v: string): SessionGame {
  const V = BJ_VARIANTS[v];
  const handsOf = (p: any) => (V.minHands ? V.minHands : V.maxHands > 1 ? p?.hands ?? 1 : 1);
  return {
    kind: "session",
    totalBet(p, bet) {
      const n = handsOf(p);
      assert(Number.isInteger(n) && n >= 1 && n <= V.maxHands);
      const side = V.side ? p?.side ?? 0 : 0;
      assert(Number.isInteger(side) && side >= 0);
      return bet * n + side;
    },
    start(rng, p, bet) {
      const n = handsOf(p);
      const deck = rng.shuffle(decks(6));
      const s: PS = { v, deck, pos: 0, dealer: [], hands: [], active: 0, splitSeats: [], phase: "play", switched: false, side: V.side ? p?.side ?? 0 : 0, sidePay: 0, sideCat: null };
      for (let i = 0; i < n; i++) s.hands.push({ cards: [pDraw(s)], bet, seat: i, done: false });
      s.dealer.push(pDraw(s));
      for (const h of s.hands) h.cards.push(pDraw(s));
      if (!V.enhc) s.dealer.push(pDraw(s));
      if (s.side) {
        s.sideCat = side213([s.hands[0].cards[0], s.hands[0].cards[1], s.dealer[0]]);
        s.sidePay = s.sideCat ? s.side * (SIDE_213[s.sideCat] + 1) : 0;
      }
      // banca com blackjack (espia a carta escondida, exceto no europeu)
      if (!V.enhc && two21(s.dealer)) {
        for (const h of s.hands) h.done = true;
        return pFinish(s);
      }
      if (V.switch) {
        s.phase = "switch";
        return { state: s, view: pView(s), done: false };
      }
      for (const h of s.hands) if (two21(h.cards)) h.done = true;
      return pAdvance(s);
    },
    action(s: PS, action, _payload, ctx) {
      if (s.phase === "switch") {
        assert(action === "switch" || action === "noswitch", "invalid_action");
        if (action === "switch") {
          const [a, b] = s.hands;
          [a.cards[1], b.cards[1]] = [b.cards[1], a.cards[1]];
          s.switched = true;
        }
        s.phase = "play";
        for (const h of s.hands) if (bjTotal(h.cards).total === 21) h.done = true;
        return pAdvance(s);
      }
      const h = s.hands[s.active];
      assert(h && !h.done && s.phase === "play", "invalid_action");
      const allowed = pView(s).actions;
      assert(allowed.includes(action), "invalid_action");
      if (action === "hit") {
        h.cards.push(pDraw(s));
        if (bjTotal(h.cards).total >= 21) h.done = true;
        return pAdvance(s);
      }
      if (action === "stand") {
        h.done = true;
        return pAdvance(s);
      }
      if (action === "double") {
        if (ctx.balance < h.bet) throw new GameError("insufficient_balance");
        const extra = h.bet;
        h.bet *= 2;
        h.doubled = true;
        h.cards.push(pDraw(s));
        h.done = true;
        return { ...pAdvance(s), extraBet: extra };
      }
      // split
      if (ctx.balance < h.bet) throw new GameError("insufficient_balance");
      s.splitSeats.push(h.seat);
      const aces = rank(h.cards[0]) === 12;
      const second: PH = { cards: [h.cards[1]], bet: h.bet, seat: h.seat, done: false, split: true, splitAces: aces };
      h.cards = [h.cards[0]];
      h.split = true;
      h.splitAces = aces;
      s.hands.splice(s.active + 1, 0, second);
      return { ...pAdvance(s), extraBet: h.bet };
    },
  };
}

/* ====================================================================== Video pôquer (variantes) */
type VpKind = "deuces" | "double" | "joker";
export const VP_TABLES: Record<string, { kind: VpKind; deck: number; pays: Record<string, number>; order: string[]; names: Record<string, string> }> = {
  "vp-deuces": {
    kind: "deuces",
    deck: 52,
    pays: { natural_royal: 800, four_deuces: 200, wild_royal: 25, five_kind: 16, straight_flush: 10, four_kind: 4, full_house: 4, flush: 3, straight: 2, three_kind: 1 },
    order: ["natural_royal", "four_deuces", "wild_royal", "five_kind", "straight_flush", "four_kind", "full_house", "flush", "straight", "three_kind"],
    names: { natural_royal: "Royal Natural", four_deuces: "Quatro 2", wild_royal: "Royal c/ Coringa", five_kind: "Quina", straight_flush: "Straight Flush", four_kind: "Quadra", full_house: "Full House", flush: "Flush", straight: "Sequência", three_kind: "Trinca" },
  },
  "vp-double": {
    kind: "double",
    deck: 52,
    pays: { royal: 800, straight_flush: 50, four_aces: 160, four_2_4: 80, four_5_k: 50, full_house: 9, flush: 7, straight: 5, three_kind: 3, two_pair: 1, jacks_better: 1 },
    order: ["royal", "straight_flush", "four_aces", "four_2_4", "four_5_k", "full_house", "flush", "straight", "three_kind", "two_pair", "jacks_better"],
    names: { royal: "Royal Flush", straight_flush: "Straight Flush", four_aces: "Quadra de Ases", four_2_4: "Quadra de 2 a 4", four_5_k: "Quadra de 5 a K", full_house: "Full House", flush: "Flush", straight: "Sequência", three_kind: "Trinca", two_pair: "Dois Pares", jacks_better: "Valetes ou +" },
  },
  "vp-joker": {
    kind: "joker",
    deck: 53,
    pays: { natural_royal: 800, five_kind: 200, wild_royal: 100, straight_flush: 50, four_kind: 17, full_house: 7, flush: 5, straight: 3, three_kind: 2, two_pair: 1, kings_better: 1 },
    order: ["natural_royal", "five_kind", "wild_royal", "straight_flush", "four_kind", "full_house", "flush", "straight", "three_kind", "two_pair", "kings_better"],
    names: { natural_royal: "Royal Natural", five_kind: "Quina", wild_royal: "Royal c/ Coringa", straight_flush: "Straight Flush", four_kind: "Quadra", full_house: "Full House", flush: "Flush", straight: "Sequência", three_kind: "Trinca", two_pair: "Dois Pares", kings_better: "Reis ou +" },
  },
};

/** Analisa 5 cartas com coringas (cartas para as quais isWild é verdadeiro). */
export function vpAnalyze(cards: number[], isWild: (c: number) => boolean) {
  const nat = cards.filter((c) => !isWild(c));
  const w = 5 - nat.length;
  const ranks = nat.map(rank);
  const suits = nat.map(suit);
  const cm = new Map<number, number>();
  for (const r of ranks) cm.set(r, (cm.get(r) ?? 0) + 1);
  const counts = [...cm.values()].sort((a, b) => b - a);
  const c0 = counts[0] ?? 0;
  const c1 = counts[1] ?? 0;
  const flush = suits.every((s) => s === suits[0]);
  const distinct = cm.size === ranks.length;
  let straight = false;
  if (distinct) {
    const windows: number[][] = [[12, 0, 1, 2, 3]];
    for (let lo = 0; lo <= 8; lo++) windows.push([lo, lo + 1, lo + 2, lo + 3, lo + 4]);
    straight = windows.some((win) => ranks.every((r) => win.includes(r)));
  }
  const royalFit = distinct && ranks.every((r) => r >= 8);
  const quadRank = [...cm.entries()].find(([, n]) => n === 4)?.[0] ?? -1;
  const pairRank = [...cm.entries()].filter(([, n]) => n === 2).map(([r]) => r).sort((a, b) => b - a)[0] ?? -1;
  return { w, c0, c1, flush, straight, royalFit, quadRank, pairRank, highNat: ranks.length ? Math.max(...ranks) : -1 };
}

export function vpEval(table: string, cards: number[]): { key: string | null; mult: number } {
  const T = VP_TABLES[table];
  let key: string | null = null;
  if (T.kind === "double") {
    const a = vpAnalyze(cards, () => false);
    if (a.flush && a.straight && a.royalFit) key = "royal";
    else if (a.flush && a.straight) key = "straight_flush";
    else if (a.c0 === 4) key = a.quadRank === 12 ? "four_aces" : a.quadRank <= 2 ? "four_2_4" : "four_5_k";
    else if (a.c0 === 3 && a.c1 === 2) key = "full_house";
    else if (a.flush) key = "flush";
    else if (a.straight) key = "straight";
    else if (a.c0 === 3) key = "three_kind";
    else if (a.c0 === 2 && a.c1 === 2) key = "two_pair";
    else if (a.c0 === 2 && a.pairRank >= 9) key = "jacks_better";
  } else {
    const deuces = T.kind === "deuces";
    const a = vpAnalyze(cards, deuces ? (c) => c < 52 && rank(c) === 0 : (c) => c === 52);
    const { w } = a;
    if (w === 0 && a.flush && a.straight && a.royalFit) key = "natural_royal";
    else if (deuces && w === 4) key = "four_deuces";
    else if (w > 0 && a.flush && a.royalFit) key = "wild_royal";
    else if (w > 0 && a.c0 + w >= 5) key = "five_kind";
    else if (a.flush && a.straight) key = "straight_flush";
    else if (a.c0 + w >= 4) key = "four_kind";
    else if ((w === 0 && a.c0 === 3 && a.c1 === 2) || (w === 1 && a.c0 === 2 && a.c1 === 2)) key = "full_house";
    else if (a.flush) key = "flush";
    else if (a.straight) key = "straight";
    else if (a.c0 + w >= 3) key = "three_kind";
    else if (!deuces && w === 0 && a.c0 === 2 && a.c1 === 2) key = "two_pair";
    else if (!deuces && ((w === 0 && a.c0 === 2 && a.pairRank >= 11) || (w === 1 && a.highNat >= 11))) key = "kings_better";
  }
  return { key, mult: key ? T.pays[key] ?? 0 : 0 };
}

export function makeVideoPoker(table: string): SessionGame {
  const T = VP_TABLES[table];
  return {
    kind: "session",
    totalBet: (_p, bet) => bet,
    start(rng) {
      const deck = rng.shuffle(Array.from({ length: T.deck }, (_, i) => i));
      const hand = deck.slice(0, 5);
      return { state: { deck, hand }, view: { hand, phase: "hold", current: vpEval(table, hand) }, done: false };
    },
    action(s, action, payload, ctx) {
      assert(action === "draw", "invalid_action");
      const hold: boolean[] = Array.isArray(payload?.hold) ? payload.hold : [];
      let pos = 5;
      const hand = s.hand.map((c: number, i: number) => (hold[i] ? c : s.deck[pos++]));
      const r = vpEval(table, hand);
      return {
        state: { ...s, hand },
        view: { hand, held: [0, 1, 2, 3, 4].map((i) => !!hold[i]), phase: "done", key: r.key, multiplier: r.mult },
        done: true,
        payout: floorPay(ctx.bet * r.mult),
      };
    },
  };
}

/* ====================================================================== 65 · Let It Ride */
export const LIR_PAYS: Record<number, number> = {
  [Hand5.RoyalFlush]: 1000, [Hand5.StraightFlush]: 200, [Hand5.Quads]: 50, [Hand5.FullHouse]: 11,
  [Hand5.Flush]: 8, [Hand5.Straight]: 5, [Hand5.Trips]: 3, [Hand5.TwoPair]: 2, [Hand5.Pair]: 1,
};
export function lirPay(cards: number[]) {
  const e = eval5(cards);
  if (e.cat === Hand5.Pair && e.pairRank < 8) return { cat: Hand5.HighCard, mult: 0 };
  return { cat: e.cat, mult: LIR_PAYS[e.cat] ?? 0 };
}
export const letItRide: SessionGame = {
  kind: "session",
  totalBet: (_p, bet) => bet * 3,
  start(rng) {
    const cards = rng.pickUnique(52, 5);
    const state = { cards, ride: [] as boolean[] };
    return { state, view: { player: cards.slice(0, 3), community: [-1, -1], stage: 1, ride: [] }, done: false };
  },
  action(s, action, _payload, ctx) {
    assert(action === "ride" || action === "pull", "invalid_action");
    s.ride.push(action === "ride");
    if (s.ride.length === 1) {
      return { state: s, view: { player: s.cards.slice(0, 3), community: [s.cards[3], -1], stage: 2, ride: s.ride }, done: false };
    }
    const r = lirPay(s.cards);
    const live = (s.ride[0] ? 1 : 0) + (s.ride[1] ? 1 : 0) + 1;
    const pulled = 3 - live;
    const payout = ctx.bet * pulled + (r.mult ? ctx.bet * live * (1 + r.mult) : 0);
    return {
      state: s,
      view: { player: s.cards.slice(0, 3), community: s.cards.slice(3), stage: 3, ride: s.ride, cat: r.cat, multiplier: r.mult, live },
      done: true,
      payout,
    };
  },
};
