/**
 * Motor genérico de video slots 5x3 com 20 linhas, usado pelos 10 slots temáticos.
 *
 * Cada tema escolhe uma mecânica de giros grátis:
 *  - expanding_symbol  "estilo livro": um símbolo especial sorteado expande e paga em todas as linhas
 *  - sticky_wilds      wilds ficam presos até o fim do bônus
 *  - mult_wilds        wilds com multiplicador (somam na linha)
 *  - progressive_mult  multiplicador global sobe +1 a cada giro vencedor
 *  - random_wilds      de 1 a 4 wilds caem aleatoriamente em cada giro
 *  - mult_orbs         orbes com 2x a 100x somam e multiplicam o ganho do giro
 *  - expanding_wilds   wild que aparece ocupa o rolo inteiro
 *
 * Tudo é resolvido no servidor numa única chamada (base + giros grátis), com RNG provably fair.
 * A escala de pagamento e o preço da compra de bônus vêm da calibração (npm run calibrate).
 */
import type { Rng } from "../fair.js";
import { assert, floorPay, type InstantGame } from "./types.js";
import calib from "./videoslots.calib.json" with { type: "json" };

export type Feature =
  | "expanding_symbol"
  | "sticky_wilds"
  | "mult_wilds"
  | "progressive_mult"
  | "random_wilds"
  | "mult_orbs"
  | "expanding_wilds"
  // ---- Onda 2
  | "walking_wilds" // wilds andam um rolo para a esquerda a cada giro grátis
  | "neighbor_wilds" // wild "morde": vizinhos viram wild nos giros grátis
  | "split_symbols" // cortes: até 3 símbolos valem 2x ou 3x nas linhas
  | "money_collect" // símbolos com valor em dinheiro; o wild coleta todos
  | "dual_mode" // jogador escolhe o modo dos giros grátis (fogo = wilds multiplicadores, gelo = wilds presos)
  | "chosen_symbol" // símbolo expansivo escolhido pelo jogador
  | "trail" // a cada giro grátis o herói avança numa trilha com prêmios
  | "duel" // no fim dos giros grátis, duelo que multiplica o prêmio
  | "growing_wilds" // wilds presos que crescem uma casa por giro
  | "giant_reels"; // rolo gigante 3x3 no meio (às vezes no jogo base, sempre nos giros grátis)

export type VideoSlotTheme = {
  id: string;
  name: string;
  feature: Feature;
  /** nomes dos símbolos: 0 wild, 1 scatter, 2..5 altos, 6..9 baixos (10 = orbe/valor, quando houver) */
  symbols: string[];
  /** quantos símbolos especiais no "livro" (padrão 1) */
  specials?: number;
  /** valores de wild multiplicador (padrão 2/3/5/10) */
  wildMults?: number[];
  wildMultW?: number[];
  /** escolhas do jogador antes do giro (cada uma tem calibração própria) */
  variants?: string[];
};

export const MAX_WIN = 50_000;
const W = 0;
const SC = 1;
const ORB = 10;

/** Pagamento por linha (x aposta por linha) para 3, 4 e 5 iguais, antes da escala. */
const BASE_PAYS: Record<number, [number, number, number]> = {
  2: [25, 100, 500],
  3: [15, 60, 250],
  4: [12, 40, 150],
  5: [10, 30, 120],
  6: [5, 15, 60],
  7: [4, 12, 50],
  8: [3, 10, 40],
  9: [3, 8, 30],
};
const SCATTER_PAYS = [0, 0, 0, 2, 10, 50];
const FREE_SPINS = [0, 0, 0, 10, 12, 15];
const RETRIGGER = 5;
const MAX_FS = 100;

export const LINES = [
  [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2], [1, 0, 1, 2, 1], [1, 2, 1, 0, 1], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 0, 2, 0, 0], [2, 2, 0, 2, 2], [0, 2, 0, 2, 0],
];

export const THEMES: VideoSlotTheme[] = [
  { id: "vs-savana", name: "Rei da Savana", feature: "expanding_wilds", symbols: ["Leão (Wild)", "Pôr do sol", "Elefante", "Rinoceronte", "Girafa", "Zebra", "Garra", "Pegada", "Folha", "Tambor"] },
  { id: "vs-gemas", name: "Cofre de Gemas", feature: "mult_wilds", symbols: ["Diamante (Wild)", "Cofre", "Rubi", "Safira", "Esmeralda", "Ametista", "Topázio", "Quartzo", "Opala", "Jade"] },
  { id: "vs-farao", name: "Livro do Faraó", feature: "expanding_symbol", symbols: ["Livro (Wild)", "Livro (Scatter)", "Faraó", "Escaravelho", "Anubis", "Olho de Hórus", "Ankh", "Pirâmide", "Lótus", "Papiro"] },
  { id: "vs-piratas", name: "Ouro dos Piratas", feature: "sticky_wilds", symbols: ["Caveira (Wild)", "Mapa", "Capitão", "Navio", "Papagaio", "Baú", "Âncora", "Leme", "Garrafa", "Moeda"] },
  { id: "vs-dragao", name: "Dragão Imperial", feature: "progressive_mult", symbols: ["Dragão (Wild)", "Pérola", "Imperador", "Carpa", "Leque", "Lanterna", "Bonsai", "Sino", "Moeda", "Nó"] },
  { id: "vs-floresta", name: "Floresta Encantada", feature: "random_wilds", symbols: ["Fada (Wild)", "Portal", "Coruja", "Raposa", "Cogumelo", "Poção", "Bolota", "Trevo", "Vagalume", "Pena"] },
  { id: "vs-olimpo", name: "Trono do Olimpo", feature: "mult_orbs", symbols: ["Raio (Wild)", "Templo", "Zeus", "Elmo", "Lira", "Coroa de louros", "Ânfora", "Escudo", "Coluna", "Moeda", "Orbe"] },
  { id: "vs-cyber", name: "Neon Cyber", feature: "sticky_wilds", symbols: ["Androide (Wild)", "Núcleo", "Robô", "Drone", "Visor", "Chip", "Bateria", "Antena", "Engrenagem", "Bit"] },
  { id: "vs-asteca", name: "Templo Asteca", feature: "expanding_wilds", symbols: ["Máscara (Wild)", "Calendário", "Jaguar", "Serpente", "Ídolo", "Cocar", "Lança", "Pena", "Totem", "Pedra"] },
  { id: "vs-artico", name: "Lobo Ártico", feature: "mult_wilds", symbols: ["Lobo (Wild)", "Aurora", "Urso polar", "Coruja-das-neves", "Raposa-do-ártico", "Foca", "Floco", "Iglu", "Pinheiro", "Cristal"] },
  // ---- Onda 2
  { id: "vs-nilo", name: "Rainha do Nilo", feature: "expanding_symbol", specials: 2, symbols: ["Pergaminho (Wild)", "Pergaminho (Scatter)", "Rainha", "Gato sagrado", "Falcão", "Cobra real", "Colar", "Vaso", "Lótus azul", "Lua"] },
  { id: "vs-tigre", name: "Tigre Dourado", feature: "mult_wilds", wildMults: [2, 3, 5, 10, 25], wildMultW: [46, 28, 16, 8, 2], symbols: ["Tigre (Wild)", "Pagode", "Monge", "Lótus", "Bambu", "Jade", "Leque", "Moeda", "Nuvem", "Sino"] },
  { id: "vs-vikings", name: "Vikings do Norte", feature: "walking_wilds", symbols: ["Berserker (Wild)", "Drakkar", "Jarl", "Valquíria", "Lobo", "Corvo", "Machado", "Escudo", "Elmo", "Runa"] },
  { id: "vs-vampiro", name: "Cassino Vampiro", feature: "neighbor_wilds", symbols: ["Vampiro (Wild)", "Lua de sangue", "Condessa", "Morcego", "Castelo", "Cálice", "Vela", "Rosa", "Anel", "Cruz"] },
  { id: "vs-samurai", name: "Samurai Sombrio", feature: "split_symbols", symbols: ["Katana (Wild)", "Torii", "Samurai", "Ninja", "Gueixa", "Dragão-serpente", "Kabuto", "Leque", "Sakura", "Shuriken"] },
  { id: "vs-oeste", name: "Ouro do Velho Oeste", feature: "money_collect", symbols: ["Xerife (Wild)", "Cartaz de procurado", "Pistoleiro", "Cavalo", "Diligência", "Cacto", "Chapéu", "Ferradura", "Revólver", "Garrafa", "Saco de ouro"] },
  { id: "vs-coruja", name: "Coruja da Meia-Noite", feature: "progressive_mult", symbols: ["Coruja (Wild)", "Lua cheia", "Raposa", "Cervo", "Ouriço", "Cogumelo", "Lanterna", "Pena", "Bolota", "Estrela"] },
  { id: "vs-recife", name: "Recife de Coral", feature: "money_collect", symbols: ["Pescador (Wild)", "Concha", "Tartaruga", "Peixe-palhaço", "Polvo", "Cavalo-marinho", "Coral", "Estrela-do-mar", "Bolha", "Alga", "Peixe dourado"] },
  { id: "vs-lua", name: "Deusa da Lua", feature: "mult_orbs", symbols: ["Deusa (Wild)", "Templo lunar", "Coelho da lua", "Cervo de prata", "Coruja branca", "Harpa", "Espelho", "Pérola", "Flor noturna", "Estrela", "Orbe lunar"] },
  { id: "vs-celta", name: "Fortuna Celta", feature: "expanding_wilds", symbols: ["Duende (Wild)", "Arco-íris", "Pote de ouro", "Harpa", "Cavalo branco", "Cálice", "Trevo", "Ferradura", "Cogumelo", "Moeda"] },
  { id: "vs-gelo", name: "Ninho do Dragão de Gelo", feature: "dual_mode", variants: ["fogo", "gelo"], symbols: ["Dragão (Wild)", "Ovo de dragão", "Dragão de fogo", "Dragão de gelo", "Cavaleiro", "Castelo", "Espada", "Escudo", "Tocha", "Cristal"] },
  { id: "vs-inca", name: "Templo Inca", feature: "chosen_symbol", variants: ["2", "3", "4", "5", "6", "7", "8", "9"], symbols: ["Disco solar (Wild)", "Disco solar (Scatter)", "Imperador", "Condor", "Lhama", "Puma", "Máscara", "Quipu", "Milho", "Pedra"] },
  { id: "vs-safari", name: "Safari Noturno", feature: "random_wilds", symbols: ["Olhos (Wild)", "Lua", "Leopardo", "Hipopótamo", "Hiena", "Coruja", "Pegada", "Jipe", "Lanterna", "Folha"] },
  { id: "vs-doces", name: "Doces Cósmicos", feature: "mult_orbs", symbols: ["Astronauta (Wild)", "Planeta-bolo", "Pirulito", "Donut", "Cupcake", "Sorvete", "Bala", "Jujuba", "Chiclete", "Biscoito", "Bomba doce"] },
  { id: "vs-minotauro", name: "Lendário Minotauro", feature: "trail", symbols: ["Minotauro (Wild)", "Labirinto", "Teseu", "Ariadne", "Machado duplo", "Elmo grego", "Novelo", "Tocha", "Coluna", "Moeda"] },
  { id: "vs-romano", name: "Império Romano", feature: "duel", symbols: ["Gladiador (Wild)", "Coliseu", "César", "Leão", "Biga", "Águia", "Elmo", "Escudo", "Gládio", "Moeda"] },
  { id: "vs-fazenda", name: "Fazenda Feliz", feature: "sticky_wilds", symbols: ["Espantalho (Wild)", "Celeiro", "Vaca", "Porco", "Galinha", "Ovelha", "Milho", "Cenoura", "Abóbora", "Ovo"] },
  { id: "vs-robos", name: "Robôs Gigantes", feature: "growing_wilds", symbols: ["Mecha (Wild)", "Reator", "Robô alfa", "Robô ômega", "Nave", "Canhão", "Bateria", "Parafuso", "Chip", "Antena"] },
  { id: "vs-kraken", name: "Lenda do Kraken", feature: "expanding_wilds", symbols: ["Kraken (Wild)", "Navio fantasma", "Sereia", "Tritão", "Tubarão", "Âncora", "Tridente", "Concha", "Pérola", "Bússola"] },
  { id: "vs-gigantes", name: "Rolos Gigantes", feature: "giant_reels", symbols: ["Titã (Wild)", "Vulcão", "Ciclope", "Golem", "Martelo", "Montanha", "Rocha", "Cristal", "Tocha", "Runa"] },
  { id: "vs-carnaval", name: "Carnaval do Rio", feature: "progressive_mult", symbols: ["Passista (Wild)", "Carro alegórico", "Rainha da bateria", "Mestre-sala", "Tamborim", "Máscara", "Pandeiro", "Confete", "Pluma", "Serpentina"] },
];

/* ------------------------------------------------------------------ rolos */
type Counts = Partial<Record<number, number>>;

function reelCounts(reel: number, free: boolean, feature: Feature): Counts {
  const c: Counts = { 2: 2, 3: 3, 4: 3, 5: 4, 6: 5, 7: 5, 8: 6, 9: 6, [SC]: 1 };
  if (reel >= 1 && reel <= 3) c[W] = free ? 2 : 1;
  if (feature === "expanding_symbol") {
    // no "livro" o scatter também é wild e aparece em todos os rolos
    delete c[W];
    c[SC] = free ? 2 : 1;
  }
  if (feature === "mult_orbs" || feature === "money_collect") c[ORB] = free ? 3 : 2;
  if (feature === "mult_orbs") c[ORB] = free ? 2 : 1;
  if (feature === "chosen_symbol") {
    delete c[W];
    c[SC] = free ? 2 : 1;
  }
  return c;
}

function buildStrip(counts: Counts, seed: number) {
  const out: number[] = [];
  for (const [s, n] of Object.entries(counts)) for (let i = 0; i < n!; i++) out.push(Number(s));
  let x = seed * 7919 + 13;
  for (let i = out.length - 1; i > 0; i--) {
    x = (x * 48271) % 2147483647;
    const j = x % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  // separa scatters (no máximo um visível por rolo)
  for (let i = 0; i < out.length; i++) {
    if (out[i] !== SC) continue;
    for (const d of [1, 2]) {
      const j = (i + d) % out.length;
      if (out[j] === SC) {
        const k = (j + Math.floor(out.length / 2)) % out.length;
        [out[j], out[k]] = [out[k], out[j]];
      }
    }
  }
  return out;
}

const stripsCache = new Map<string, { base: number[][]; free: number[][] }>();
function strips(t: VideoSlotTheme) {
  let s = stripsCache.get(t.id);
  if (!s) {
    const seed = [...t.id].reduce((a, c) => a + c.charCodeAt(0), 0);
    s = {
      base: [0, 1, 2, 3, 4].map((r) => buildStrip(reelCounts(r, false, t.feature), seed + r)),
      free: [0, 1, 2, 3, 4].map((r) => buildStrip(reelCounts(r, true, t.feature), seed + 50 + r)),
    };
    stripsCache.set(t.id, s);
  }
  return s;
}

function spinGrid(rng: Rng, st: number[][]) {
  return st.map((strip) => {
    const stop = rng.int(strip.length);
    return [0, 1, 2].map((r) => strip[(stop + r) % strip.length]);
  });
}

/* ------------------------------------------------------------------ avaliação */
export type LineWin = { line: number; symbol: number; count: number; mult: number; cells: [number, number][] };

function evalLines(grid: number[][], scale: number, opts: { wildIsScatter?: boolean; wildMults?: number[][] | null; cellMults?: number[][] | null }) {
  const isWild = (s: number) => s === W || (opts.wildIsScatter && s === SC);
  const wins: LineWin[] = [];
  let sum = 0;
  LINES.forEach((rows, li) => {
    let sym = -1;
    let count = 0;
    let wm = 0;
    for (let reel = 0; reel < 5; reel++) {
      const c = grid[reel][rows[reel]];
      if (isWild(c)) {
        count++;
        if (opts.wildMults) wm += opts.wildMults[reel][rows[reel]];
        continue;
      }
      if (c === SC || c === ORB) break;
      if (sym === -1) sym = c;
      if (c === sym) count++;
      else break;
    }
    if (sym === -1 && count >= 3) sym = 2; // linha só de wilds paga como o símbolo mais alto
    if (sym === -1 || count < 3) return;
    let cm = 1;
    if (opts.cellMults) for (let reel = 0; reel < count; reel++) cm *= opts.cellMults[reel][rows[reel]] || 1;
    const pay = BASE_PAYS[sym][count - 3] * scale * (wm > 0 ? wm : 1) * cm;
    const mult = pay / LINES.length;
    sum += mult;
    wins.push({ line: li, symbol: sym, count, mult, cells: rows.slice(0, count).map((r, reel) => [reel, r] as [number, number]) });
  });
  return { wins, sum };
}

/** Pagamento do símbolo expandido (estilo livro): paga em todas as linhas se cobrir rolos suficientes. */
function evalExpanding(grid: number[][], special: number, scale: number) {
  const reels = grid.map((col, i) => (col.includes(special) ? i : -1)).filter((i) => i >= 0);
  const need = special <= 5 ? 2 : 3;
  if (reels.length < need) return { reels: [] as number[], mult: 0 };
  // paga como se houvesse N símbolos em cada uma das 20 linhas (posições não precisam ser adjacentes)
  const n = Math.min(5, reels.length);
  const pay = n >= 3 ? BASE_PAYS[special][n - 3] : BASE_PAYS[special][0] * 0.5;
  return { reels, mult: (pay * scale * LINES.length) / LINES.length };
}

function scatterInfo(grid: number[][]) {
  const cells: [number, number][] = [];
  grid.forEach((col, r) => col.forEach((s, w) => s === SC && cells.push([r, w])));
  return cells;
}

export type VSpin = {
  grid: number[][];
  /** grade depois de efeitos (wilds expandidos, presos, aleatórios) */
  final: number[][];
  wins: LineWin[];
  scatter: { count: number; cells: [number, number][]; mult: number };
  wildMults: number[][] | null;
  orbs: { cell: [number, number]; value: number }[];
  expanded: { symbol: number; reels: number[]; mult: number } | null;
  effects: { expandedWildReels: number[]; sticky: [number, number][]; randomWilds: [number, number][]; walking?: [number, number][]; bitten?: [number, number][]; grown?: [number, number][]; giant?: number };
  /** símbolos cortados (samurai): multiplicador por casa */
  cellMults?: number[][] | null;
  /** valor coletado pelos wilds (dinheiro) — já incluído em multiplier */
  collected?: number;
  /** trilha (minotauro) */
  trail?: { from: number; to: number; prize: number };
  spinMult: number; // multiplicador global do giro (progressivo / orbes)
  multiplier: number; // x aposta total
  freeSpinsWon: number;
};

const WILD_MULTS = [2, 3, 5, 10];
const WILD_MULT_W = [50, 30, 15, 5];
const ORB_VALUES = [2, 3, 5, 10, 25, 50, 100];
const ORB_W = [40, 25, 15, 10, 6, 3, 1];
/** valores de dinheiro (x aposta total, antes da escala) */
const MONEY_VALUES = [0.2, 0.5, 1, 2, 5, 10, 25];
const MONEY_W = [34, 28, 18, 10, 6, 3, 1];
/** trilha do labirinto: prêmio de cada casa (x aposta, antes da escala) */
export const TRAIL = [0, 0.2, 0.3, 0.2, 0.5, 0.3, 1, 0.4, 0.5, 2, 0.5, 0.8, 1, 3, 1, 1, 1.5, 5, 2, 2, 3, 10, 3, 4, 5, 20, 5, 8, 10, 50];
export const DUEL_ROUNDS = 4;

const calOf = (id: string) => (calib as Record<string, { scale: number; buyPrice: number }>)[id];
export const calibKey = (t: VideoSlotTheme, variant?: string) => (t.variants && variant ? `${t.id}:${variant}` : t.id);

function playTheme(t: VideoSlotTheme, rng: Rng, buy: boolean, scaleOverride?: number, variant?: string) {
  const cal = calOf(calibKey(t, variant)) ?? calOf(t.id) ?? { scale: 1, buyPrice: 100 };
  const scale = scaleOverride ?? cal.scale;
  const st = strips(t);
  const book = t.feature === "expanding_symbol" || t.feature === "chosen_symbol";
  // modo escolhido nos giros grátis (dragão de gelo)
  const fsFeature: Feature = t.feature === "dual_mode" ? (variant === "gelo" ? "sticky_wilds" : "mult_wilds") : t.feature;
  const moneyVal = (v: number) => Math.max(0.1, Math.round(v * scale * 10) / 10);

  type St = { sticky: Set<string>; prog: number; special: number; specials: number[]; walkers: [number, number][]; trail: number };
  const oneSpin = (inFree: boolean, state: St): VSpin => {
    const grid = spinGrid(rng, inFree ? st.free : st.base);
    const final = grid.map((c) => c.slice());
    const effects: VSpin["effects"] = { expandedWildReels: [], sticky: [], randomWilds: [] };
    let wildMults: number[][] | null = null;
    const orbs: VSpin["orbs"] = [];

    const feat = inFree ? fsFeature : t.feature;
    if (inFree && feat === "walking_wilds") {
      // os wilds andam um rolo para a esquerda; os que saem da grade somem
      state.walkers = state.walkers.map(([r, w]) => [r - 1, w] as [number, number]).filter(([r]) => r >= 0);
      for (const [r, w] of state.walkers) if (final[r][w] !== SC) final[r][w] = W;
      final.forEach((col, r) => col.forEach((s, w) => s === W && !state.walkers.some(([a, b]) => a === r && b === w) && state.walkers.push([r, w])));
      effects.walking = state.walkers.map((x) => [...x] as [number, number]);
    }
    if (inFree && feat === "growing_wilds") {
      // cada wild preso cresce uma casa no próprio rolo (para cima, senão para baixo)
      const grown: [number, number][] = [];
      for (const k of [...state.sticky]) {
        const [r, w] = k.split(":").map(Number);
        for (const nw of [w - 1, w + 1]) {
          if (nw < 0 || nw > 2 || state.sticky.has(`${r}:${nw}`)) continue;
          state.sticky.add(`${r}:${nw}`);
          grown.push([r, nw]);
          break;
        }
      }
      for (const k of state.sticky) {
        const [r, w] = k.split(":").map(Number);
        if (final[r][w] !== SC) final[r][w] = W;
      }
      final.forEach((col, r) => col.forEach((s, w) => s === W && state.sticky.add(`${r}:${w}`)));
      effects.sticky = [...state.sticky].map((k) => k.split(":").map(Number) as [number, number]);
      effects.grown = grown;
    }
    if (inFree && feat === "neighbor_wilds") {
      const bitten: [number, number][] = [];
      const src: [number, number][] = [];
      final.forEach((col, r) => col.forEach((s, w) => s === W && src.push([r, w])));
      for (const [r, w] of src)
        for (const [dr, dw] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const a = r + dr;
          const b = w + dw;
          if (a < 0 || a > 4 || b < 0 || b > 2 || final[a][b] === W || final[a][b] === SC) continue;
          final[a][b] = W;
          bitten.push([a, b]);
        }
      effects.bitten = bitten;
    }
    if (feat === "giant_reels" && (inFree || rng.float() < 0.18)) {
      // um símbolo gigante ocupa os rolos 2, 3 e 4 inteiros
      const opts = [0, 2, 3, 4, 5, 6, 7, 8, 9];
      const g = opts[rng.weighted([1, 1, 1.2, 1.4, 1.6, 2.5, 2.5, 3, 3])];
      for (let r = 1; r <= 3; r++) for (let w = 0; w < 3; w++) final[r][w] = g;
      effects.giant = g;
    }
    let cellMults: number[][] | null = null;
    if (inFree && feat === "split_symbols") {
      const cand: [number, number][] = [];
      for (let r = 0; r < 5; r++) for (let w = 0; w < 3; w++) if (final[r][w] >= 2 && final[r][w] <= 9) cand.push([r, w]);
      const n = Math.min(cand.length, 1 + rng.int(3));
      cellMults = final.map((c) => c.map(() => 0));
      for (const i of rng.pickUnique(cand.length, n)) {
        const [r, w] = cand[i];
        cellMults[r][w] = rng.float() < 0.8 ? 2 : 3;
      }
    }

    if (feat === "expanding_wilds") {
      for (let r = 0; r < 5; r++) if (final[r].includes(W)) {
        effects.expandedWildReels.push(r);
        for (let w = 0; w < 3; w++) if (final[r][w] !== SC) final[r][w] = W;
      }
    }
    if (inFree && feat === "sticky_wilds") {
      for (const k of state.sticky) {
        const [r, w] = k.split(":").map(Number);
        if (final[r][w] !== SC) final[r][w] = W;
      }
      final.forEach((col, r) => col.forEach((s, w) => s === W && state.sticky.add(`${r}:${w}`)));
      effects.sticky = [...state.sticky].map((k) => k.split(":").map(Number) as [number, number]);
    }
    if (inFree && feat === "random_wilds") {
      const n = 1 + rng.int(4);
      const cand: [number, number][] = [];
      for (let r = 0; r < 5; r++) for (let w = 0; w < 3; w++) if (final[r][w] !== SC && final[r][w] !== W) cand.push([r, w]);
      for (const i of rng.pickUnique(cand.length, Math.min(n, cand.length))) {
        const [r, w] = cand[i];
        final[r][w] = W;
        effects.randomWilds.push([r, w]);
      }
    }
    if (inFree && feat === "mult_wilds") {
      const vals = t.wildMults ?? WILD_MULTS;
      const wts = t.wildMultW ?? WILD_MULT_W;
      wildMults = final.map((col) => col.map((s) => (s === W ? vals[rng.weighted(wts)] : 0)));
    }
    if (t.feature === "mult_orbs") {
      final.forEach((col, r) => col.forEach((s, w) => s === ORB && orbs.push({ cell: [r, w], value: ORB_VALUES[rng.weighted(ORB_W)] })));
    }
    let collected = 0;
    if (t.feature === "money_collect") {
      final.forEach((col, r) => col.forEach((s, w) => s === ORB && orbs.push({ cell: [r, w], value: moneyVal(MONEY_VALUES[rng.weighted(MONEY_W)]) })));
      const collectors = final.reduce((a, col) => a + col.filter((s) => s === W).length, 0);
      // cada wild coleta todos os valores (nos giros grátis, cada wild coleta de novo)
      if (collectors && orbs.length) collected = orbs.reduce((a, o) => a + o.value, 0) * (inFree ? collectors : 1);
    }

    const { wins, sum } = evalLines(final, scale, { wildIsScatter: book, wildMults, cellMults });
    let lineSum = sum;
    let expanded: VSpin["expanded"] = null;
    if (inFree && book && state.specials.length) {
      let tot = 0;
      let reelsUnion: number[] = [];
      let first = -1;
      for (const sp of state.specials) {
        const e = evalExpanding(final, sp, scale);
        if (e.mult > 0) {
          tot += e.mult;
          reelsUnion = [...new Set([...reelsUnion, ...e.reels])];
          if (first < 0) first = sp;
          if (!expanded) expanded = { symbol: sp, reels: e.reels, mult: e.mult };
          else (expanded as any).second = { symbol: sp, reels: e.reels, mult: e.mult };
        }
      }
      if (expanded) {
        expanded.mult = tot;
        lineSum += tot;
      }
    }
    const sc = scatterInfo(final);
    const n = Math.min(5, sc.length);
    const scMult = SCATTER_PAYS[n];
    let spinMult = 1;
    if (t.feature === "progressive_mult" && inFree) spinMult = state.prog;
    // wilds expansivos: nos giros grátis todos os ganhos valem x3
    if (t.feature === "expanding_wilds" && inFree) spinMult = 3;
    if (t.feature === "mult_orbs" && orbs.length && lineSum > 0) spinMult = orbs.reduce((a, o) => a + o.value, 0);
    let trail: VSpin["trail"];
    let trailPrize = 0;
    if (t.feature === "trail" && inFree && state.trail < TRAIL.length - 1) {
      const from = state.trail;
      state.trail = Math.min(TRAIL.length - 1, from + 1 + rng.int(3));
      trailPrize = moneyVal(TRAIL[state.trail]);
      trail = { from, to: state.trail, prize: trailPrize };
    }
    const multiplier = lineSum * spinMult + scMult + collected + trailPrize;
    if (t.feature === "progressive_mult" && inFree && lineSum > 0) state.prog += 1;
    const freeSpinsWon = n >= 3 ? (inFree ? RETRIGGER : FREE_SPINS[n]) : 0;
    return { grid, final, wins, scatter: { count: sc.length, cells: sc, mult: scMult }, wildMults, orbs, expanded, effects, spinMult, multiplier, freeSpinsWon, cellMults, collected, trail };
  };

  const state: St = { sticky: new Set<string>(), prog: 1, special: -1, specials: [], walkers: [], trail: 0 };
  const base = buy ? null : oneSpin(false, state);
  const free: VSpin[] = [];
  let remaining = buy ? FREE_SPINS[3] : base!.freeSpinsWon;
  let granted = remaining;
  let total = base?.multiplier ?? 0;
  let special = -1;
  let specials: number[] = [];
  if (remaining > 0 && book) {
    if (t.feature === "chosen_symbol") specials = [Math.max(2, Math.min(9, Number(variant) || 2))];
    else if ((t.specials ?? 1) === 1) specials = [2 + rng.int(8)];
    else specials = rng.pickUnique(8, t.specials!).map((x) => x + 2);
    special = specials[0];
    state.special = special;
    state.specials = specials;
  }
  let fsTotal = 0;
  while (remaining > 0 && total + fsTotal < MAX_WIN) {
    remaining--;
    const s = oneSpin(true, state);
    free.push(s);
    fsTotal += s.multiplier;
    if (s.freeSpinsWon && granted < MAX_FS) {
      const add = Math.min(s.freeSpinsWon, MAX_FS - granted);
      granted += add;
      remaining += add;
    }
  }
  // duelo da arena: cada vitória soma +1 ao multiplicador do bônus (até 4 rodadas, para na primeira derrota)
  let duel: { rounds: boolean[]; mult: number } | undefined;
  if (t.feature === "duel" && free.length) {
    const rounds: boolean[] = [];
    let mult = 1;
    for (let i = 0; i < DUEL_ROUNDS; i++) {
      const win = rng.float() < 0.5;
      rounds.push(win);
      if (!win) break;
      mult++;
    }
    duel = { rounds, mult };
    fsTotal *= mult;
  }
  total += fsTotal;
  return { base, free, special, specials, duel, variant: variant ?? null, multiplier: Math.min(total, MAX_WIN), bought: buy, freeSpinsTotal: granted };
}

export function makeVideoSlot(t: VideoSlotTheme): InstantGame {
  const variantOf = (p: any) => (t.variants ? (t.variants.includes(String(p?.variant)) ? String(p.variant) : t.variants[0]) : undefined);
  return {
    kind: "instant",
    totalBet: (p, bet) => {
      if (t.variants && p?.variant != null) assert(t.variants.includes(String(p.variant)));
      return p?.buy === true ? bet * buyPriceOf(calibKey(t, variantOf(p))) : bet;
    },
    play(rng, p, bet) {
      const r = playTheme(t, rng, p?.buy === true, undefined, variantOf(p));
      return { payout: floorPay(bet * r.multiplier), result: r };
    },
  };
}

export function buyPriceOf(id: string) {
  return (calib as Record<string, { scale: number; buyPrice: number }>)[id]?.buyPrice ?? 100;
}

/** Exposto para o script de calibração. */
export const __internals = { playTheme, BASE_PAYS, calibKey };

export const VIDEO_SLOTS: Record<string, InstantGame> = Object.fromEntries(THEMES.map((t) => [t.id, makeVideoSlot(t)]));

export function videoSlotsPublicConfig() {
  return THEMES.map((t) => ({
    id: t.id,
    name: t.name,
    feature: t.feature,
    symbols: t.symbols,
    pays: Object.fromEntries(Object.entries(BASE_PAYS).map(([s, p]) => [s, p.map((v) => +(v * ((calib as any)[calibKey(t, t.variants?.[0])]?.scale ?? 1)).toFixed(2))])),
    scatterPays: SCATTER_PAYS,
    freeSpins: FREE_SPINS,
    buyPrice: buyPriceOf(calibKey(t, t.variants?.[0])),
    lines: LINES,
    specials: t.specials ?? 1,
    wildMults: t.wildMults ?? WILD_MULTS,
    variants: t.variants
      ? Object.fromEntries(t.variants.map((v) => [v, { buyPrice: buyPriceOf(calibKey(t, v)), pays: Object.fromEntries(Object.entries(BASE_PAYS).map(([s, p]) => [s, p.map((x) => +(x * ((calib as any)[calibKey(t, v)]?.scale ?? 1)).toFixed(2))])) }]))
      : null,
    trail: t.feature === "trail" ? TRAIL.map((x) => Math.max(0.1, Math.round(x * ((calib as any)[t.id]?.scale ?? 1) * 10) / 10)) : null,
  }));
}
