/**
 * Cartas como inteiros 0..51: rank = c % 13 (0 = 2 ... 8 = 10, 9 = J, 10 = Q, 11 = K, 12 = A),
 * naipe = floor(c / 13) (0 ♠, 1 ♥, 2 ♦, 3 ♣).
 */
export const rank = (c: number) => c % 13;
export const suit = (c: number) => Math.floor(c / 13);

export function decks(n: number): number[] {
  const out: number[] = [];
  for (let d = 0; d < n; d++) for (let c = 0; c < 52; c++) out.push(c);
  return out;
}

/** Categorias de mão de 5 cartas (maior = melhor). */
export enum Hand5 {
  HighCard = 0,
  Pair,
  TwoPair,
  Trips,
  Straight,
  Flush,
  FullHouse,
  Quads,
  StraightFlush,
  RoyalFlush,
}

export const HAND5_NAMES: Record<Hand5, string> = {
  [Hand5.HighCard]: "Carta alta",
  [Hand5.Pair]: "Par",
  [Hand5.TwoPair]: "Dois pares",
  [Hand5.Trips]: "Trinca",
  [Hand5.Straight]: "Sequência",
  [Hand5.Flush]: "Flush",
  [Hand5.FullHouse]: "Full house",
  [Hand5.Quads]: "Quadra",
  [Hand5.StraightFlush]: "Straight flush",
  [Hand5.RoyalFlush]: "Royal flush",
};

/** Avalia 5 cartas. score permite comparar mãos (maior vence). */
export function eval5(cards: number[]) {
  const ranks = cards.map(rank).sort((a, b) => b - a);
  const flush = cards.every((c) => suit(c) === suit(cards[0]));
  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  // agrupa por (quantidade desc, rank desc)
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const uniq = [...new Set(ranks)];
  let straightHigh = -1;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) straightHigh = uniq[0];
    else if (uniq[0] === 12 && uniq[1] === 3) straightHigh = 3; // A-2-3-4-5
  }
  let cat: Hand5;
  let kick: number[];
  if (straightHigh >= 0 && flush) {
    cat = straightHigh === 12 ? Hand5.RoyalFlush : Hand5.StraightFlush;
    kick = [straightHigh];
  } else if (groups[0][1] === 4) {
    cat = Hand5.Quads;
    kick = groups.map((g) => g[0]);
  } else if (groups[0][1] === 3 && groups[1][1] === 2) {
    cat = Hand5.FullHouse;
    kick = groups.map((g) => g[0]);
  } else if (flush) {
    cat = Hand5.Flush;
    kick = ranks;
  } else if (straightHigh >= 0) {
    cat = Hand5.Straight;
    kick = [straightHigh];
  } else if (groups[0][1] === 3) {
    cat = Hand5.Trips;
    kick = groups.map((g) => g[0]);
  } else if (groups[0][1] === 2 && groups[1][1] === 2) {
    cat = Hand5.TwoPair;
    kick = groups.map((g) => g[0]);
  } else if (groups[0][1] === 2) {
    cat = Hand5.Pair;
    kick = groups.map((g) => g[0]);
  } else {
    cat = Hand5.HighCard;
    kick = ranks;
  }
  let score = cat;
  for (let i = 0; i < 5; i++) score = score * 16 + (kick[i] ?? 0);
  return { cat, score, pairRank: cat === Hand5.Pair ? groups[0][0] : -1, ranks };
}

/** Mão de 3 cartas (Three Card Poker): sequência vale mais que flush. */
export enum Hand3 {
  HighCard = 0,
  Pair,
  Flush,
  Straight,
  Trips,
  StraightFlush,
}

export const HAND3_NAMES: Record<Hand3, string> = {
  [Hand3.HighCard]: "Carta alta",
  [Hand3.Pair]: "Par",
  [Hand3.Flush]: "Flush",
  [Hand3.Straight]: "Sequência",
  [Hand3.Trips]: "Trinca",
  [Hand3.StraightFlush]: "Straight flush",
};

export function eval3(cards: number[]) {
  const r = cards.map(rank).sort((a, b) => b - a);
  const flush = suit(cards[0]) === suit(cards[1]) && suit(cards[1]) === suit(cards[2]);
  let straightHigh = -1;
  if (r[0] !== r[1] && r[1] !== r[2]) {
    if (r[0] - r[2] === 2) straightHigh = r[0];
    else if (r[0] === 12 && r[1] === 1 && r[2] === 0) straightHigh = 1; // A-2-3
  }
  let cat: Hand3;
  let kick = r;
  if (straightHigh >= 0 && flush) {
    cat = Hand3.StraightFlush;
    kick = [straightHigh];
  } else if (r[0] === r[2]) cat = Hand3.Trips;
  else if (straightHigh >= 0) {
    cat = Hand3.Straight;
    kick = [straightHigh];
  } else if (flush) cat = Hand3.Flush;
  else if (r[0] === r[1] || r[1] === r[2]) {
    cat = Hand3.Pair;
    const p = r[1];
    kick = [p, r[0] === p ? r[2] : r[0]];
  } else cat = Hand3.HighCard;
  let score = cat;
  for (let i = 0; i < 3; i++) score = score * 16 + (kick[i] ?? 0);
  return { cat, score, high: r[0], ranks: r };
}
