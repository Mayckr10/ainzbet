import type { Game } from "./types.js";
import { baccarat, bingo, coinflip, dice, keno, limbo, plinko, rouletteEu, rouletteUs, scratch } from "./simple.js";
import { slotsClassic, slotsFruit } from "./slots.js";
import { blackjack, caribbean, crash, mines, threecard, tower, videopoker } from "./sessions.js";

/** Todos os jogos de rodada única ou com etapas. O Oráculo Cósmico tem rota própria (estado persistente). */
export const GAMES: Record<string, Game> = {
  dice,
  coinflip,
  "roulette-eu": rouletteEu,
  "roulette-us": rouletteUs,
  "slots-classic": slotsClassic,
  "slots-fruit": slotsFruit,
  keno,
  scratch,
  bingo,
  blackjack,
  baccarat,
  videopoker,
  threecard,
  caribbean,
  crash,
  plinko,
  mines,
  tower,
  limbo,
};

export const GAME_NAMES: Record<string, string> = {
  cosmic: "Oráculo Cósmico",
  dice: "Dados",
  coinflip: "Cara ou Coroa",
  "roulette-eu": "Roleta Europeia",
  "roulette-us": "Roleta Americana",
  "slots-classic": "Forja do Dragão",
  "slots-fruit": "Jardim Abissal",
  keno: "Keno",
  scratch: "Raspadinha",
  bingo: "Bingo",
  blackjack: "Blackjack",
  baccarat: "Bacará",
  videopoker: "Video Pôquer",
  threecard: "Pôquer 3 Cartas",
  caribbean: "Caribbean Stud",
  crash: "Crash",
  plinko: "Plinko",
  mines: "Mines",
  tower: "Torre",
  limbo: "Limbo",
};
