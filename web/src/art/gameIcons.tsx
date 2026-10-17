import type { ReactNode } from "react";
import { COSMIC_ART } from "./cosmic";
import { ABYSS_ART } from "./abyss";
import { FORGE_ART } from "./forge";
import { SLOT_THEMES } from "./themes";
import { GAMES2, GAME_ICONS2 } from "./gameIcons2";

const card = (x: number, y: number, r: number, label: string, red = false) => (
  <g transform={`rotate(${r} ${x + 16} ${y + 22})`}>
    <rect x={x} y={y} width="32" height="44" rx="5" fill="#fff" stroke="#1e1b4b" strokeWidth="1.5" />
    <text x={x + 16} y={y + 30} textAnchor="middle" fontSize="18" fontWeight="900" fill={red ? "#e11d48" : "#16132b"} fontFamily="Manrope">{label}</text>
  </g>
);

/** Ícones dos jogos no lobby (viewBox 0 0 100 100). */
export const GAME_ICONS: Record<string, ReactNode> = {
  ...GAME_ICONS2,
  ...Object.fromEntries(Object.values(SLOT_THEMES).map((t) => [t.id, t.art[t.icon]])),
  cosmic: COSMIC_ART[11],
  "slots-fruit": ABYSS_ART[2],
  "slots-classic": FORGE_ART[1],
  dice: (
    <g filter="url(#a-soft)">
      <rect x="14" y="26" width="44" height="44" rx="10" fill="#fff" transform="rotate(-14 36 48)" />
      {[[28, 38], [44, 56], [36, 47]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="4.5" fill="#7c3aed" transform="rotate(-14 36 48)" />)}
      <rect x="46" y="34" width="40" height="40" rx="9" fill="#f5c451" transform="rotate(12 66 54)" />
      {[[56, 44], [76, 44], [56, 64], [76, 64]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="4" fill="#3b2300" transform="rotate(12 66 54)" />)}
    </g>
  ),
  coinflip: (
    <g filter="url(#a-soft)">
      <ellipse cx="50" cy="52" rx="34" ry="34" fill="url(#a-gold-d)" />
      <ellipse cx="50" cy="48" rx="34" ry="34" fill="url(#a-gold)" />
      <circle cx="50" cy="48" r="25" fill="none" stroke="#a16207" strokeWidth="2.5" strokeDasharray="3 3" />
      <path d="M50 30 L55 43 L69 43 L58 51 L62 65 L50 57 L38 65 L42 51 L31 43 L45 43 Z" fill="#a16207" />
    </g>
  ),
  "roulette-eu": <Roulette />,
  "roulette-us": <Roulette double />,
  keno: (
    <g filter="url(#a-soft)">
      {[0, 1, 2, 3].map((i) => [0, 1, 2].map((j) => {
        const on = (i + j * 2) % 3 === 0;
        return <circle key={`${i}${j}`} cx={22 + i * 19} cy={30 + j * 20} r="8" fill={on ? "#f5c451" : "#312e81"} stroke={on ? "#fff7d6" : "#6366f1"} strokeWidth="1.5" />;
      }))}
    </g>
  ),
  scratch: (
    <g filter="url(#a-soft)">
      <rect x="12" y="20" width="76" height="60" rx="8" fill="#7c3aed" stroke="#c4b5fd" strokeWidth="2" />
      <rect x="20" y="30" width="60" height="40" rx="5" fill="#cbd5e1" />
      <path d="M20 54 C 34 40, 46 66, 62 46 L 80 46 L80 70 L20 70 Z" fill="#fde047" />
      <text x="52" y="64" textAnchor="middle" fontWeight="900" fontSize="14" fill="#7c2d12" fontFamily="Unbounded">x100</text>
      <path d="M70 26 L86 10" stroke="#f5c451" strokeWidth="6" strokeLinecap="round" />
    </g>
  ),
  bingo: (
    <g filter="url(#a-soft)">
      <circle cx="50" cy="50" r="34" fill="#ec4899" />
      <circle cx="50" cy="50" r="20" fill="#fff" />
      <text x="50" y="58" textAnchor="middle" fontWeight="900" fontSize="22" fill="#831843" fontFamily="Unbounded">75</text>
      <ellipse cx="38" cy="30" rx="10" ry="5" fill="#fff" opacity=".5" transform="rotate(-30 38 30)" />
    </g>
  ),
  blackjack: <g filter="url(#a-soft)">{card(20, 22, -12, "A")}{card(46, 24, 10, "K", true)}</g>,
  baccarat: <g filter="url(#a-soft)">{card(16, 26, -16, "9", true)}{card(34, 20, 0, "B")}{card(52, 26, 16, "P", true)}</g>,
  videopoker: <g filter="url(#a-soft)">{[0, 1, 2, 3, 4].map((i) => card(6 + i * 14, 26 + Math.abs(i - 2) * 3, (i - 2) * 8, ["10", "J", "Q", "K", "A"][i], i % 2 === 1))}</g>,
  threecard: <g filter="url(#a-soft)">{card(18, 26, -14, "Q", true)}{card(34, 22, 0, "Q")}{card(50, 26, 14, "Q", true)}</g>,
  caribbean: (
    <g filter="url(#a-soft)">
      {card(26, 22, -8, "A", true)}
      <path d="M60 70 C 60 40, 90 40, 90 70" stroke="#16a34a" strokeWidth="5" fill="none" />
      <path d="M75 72 L75 30 M75 30 C 64 26, 60 36, 54 34 M75 30 C 86 26, 90 36, 96 34 M75 30 C 70 18, 62 16, 58 20 M75 30 C 80 18, 88 16, 92 20" stroke="#22c55e" strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  ),
  crash: (
    <g filter="url(#a-soft)">
      <path d="M10 86 C 40 84, 62 66, 82 22" stroke="#4ade80" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M10 86 C 40 84, 62 66, 82 22 L82 86 Z" fill="#4ade80" opacity=".15" />
      <g transform="translate(78 22) rotate(40)">
        <path d="M0 -14 C 7 -6, 7 6, 4 12 L-4 12 C -7 6, -7 -6, 0 -14 Z" fill="#f5f3ff" />
        <circle cx="0" cy="-2" r="3" fill="#22d3ee" />
        <path d="M-4 12 L0 22 L4 12 Z" fill="#fb923c" />
      </g>
    </g>
  ),
  plinko: (
    <g filter="url(#a-soft)">
      {[0, 1, 2, 3, 4].map((r) => Array.from({ length: r + 2 }).map((_, i) => <circle key={`${r}${i}`} cx={50 - (r + 1) * 8 + i * 16} cy={18 + r * 14} r="3" fill="#e9d5ff" />))}
      <circle cx="54" cy="40" r="6" fill="#f472b6" />
      {[["#ef4444", 12], ["#f97316", 28], ["#eab308", 44], ["#f97316", 60], ["#ef4444", 76]].map(([c, x]) => <rect key={x as number} x={x as number} y="86" width="13" height="9" rx="2" fill={c as string} />)}
    </g>
  ),
  mines: (
    <g filter="url(#a-soft)">
      {[0, 1].map((i) => [0, 1].map((j) => <rect key={`${i}${j}`} x={12 + i * 40} y={12 + j * 40} width="36" height="36" rx="7" fill="#312e81" />))}
      <path d="M30 18 L40 30 L30 44 L20 30 Z" fill="#4ade80" stroke="#dcfce7" strokeWidth="1.5" />
      <circle cx="70" cy="70" r="11" fill="#1f2937" />
      <path d="M70 59 L74 52" stroke="#f97316" strokeWidth="3" />
      <circle cx="74" cy="51" r="3" fill="#fde047" />
      <path d="M70 58 L74 72 L70 82 L66 72 Z M22 70 L38 70" stroke="#4ade80" strokeWidth="0" />
      <path d="M70 18 L80 30 L70 44 L60 30 Z" fill="#4ade80" stroke="#dcfce7" strokeWidth="1.5" />
    </g>
  ),
  tower: (
    <g filter="url(#a-soft)">
      {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={18 + c * 22} y={74 - r * 18} width="19" height="14" rx="3" fill={r === 3 && c === 1 ? "#f5c451" : r < 3 && c === (r % 3) ? "#4ade80" : "#312e81"} />))}
      <path d="M50 4 L58 14 L42 14 Z" fill="#f5c451" />
    </g>
  ),
  limbo: (
    <g filter="url(#a-soft)">
      <circle cx="50" cy="50" r="36" fill="none" stroke="#7c3aed" strokeWidth="6" />
      <circle cx="50" cy="50" r="24" fill="none" stroke="#a78bfa" strokeWidth="5" />
      <circle cx="50" cy="50" r="12" fill="#f5c451" />
      <path d="M50 50 L86 14" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M78 10 L90 10 L90 22" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  ),
};

function Roulette({ double }: { double?: boolean }) {
  const n = 18;
  return (
    <g filter="url(#a-soft)">
      <circle cx="50" cy="50" r="40" fill="url(#a-gold-d)" />
      {Array.from({ length: n }).map((_, i) => {
        const a0 = (i / n) * Math.PI * 2;
        const a1 = ((i + 1) / n) * Math.PI * 2;
        const p = (a: number, r: number) => `${50 + Math.cos(a) * r} ${50 + Math.sin(a) * r}`;
        const fill = i === 0 || (double && i === n / 2) ? "#16a34a" : i % 2 ? "#dc2626" : "#111827";
        return <path key={i} d={`M ${p(a0, 35)} A 35 35 0 0 1 ${p(a1, 35)} L ${p(a1, 20)} A 20 20 0 0 0 ${p(a0, 20)} Z`} fill={fill} />;
      })}
      <circle cx="50" cy="50" r="19" fill="url(#a-gold)" />
      <circle cx="50" cy="50" r="5" fill="#78350f" />
      <circle cx="74" cy="30" r="4" fill="#fff" />
    </g>
  );
}

export type GameMeta = { id: string; name: string; tag?: string; cat: "slots" | "originals" | "table" | "cards" | "lottery" | "arcade"; colors: [string, string]; max?: string };

export const GAMES: GameMeta[] = [
  { id: "cosmic", name: "Oráculo Cósmico", tag: "50.000x", cat: "slots", colors: ["#4c1d95", "#0e7490"], max: "50.000x" },
  { id: "slots-fruit", name: "Jardim Abissal", tag: "Giros grátis", cat: "slots", colors: ["#0c4a6e", "#312e81"], max: "50.000x" },
  { id: "slots-classic", name: "Forja do Dragão", tag: "Roda 50.000x", cat: "slots", colors: ["#7f1d1d", "#78350f"], max: "50.000x" },
  { id: "vs-farao", name: "Livro do Faraó", tag: "Símbolo expansivo", cat: "slots", colors: SLOT_THEMES["vs-farao"].tile, max: "50.000x" },
  { id: "vs-savana", name: "Rei da Savana", tag: "Leões expansivos", cat: "slots", colors: SLOT_THEMES["vs-savana"].tile, max: "50.000x" },
  { id: "vs-gemas", name: "Cofre de Gemas", tag: "Wilds multiplicadores", cat: "slots", colors: SLOT_THEMES["vs-gemas"].tile, max: "50.000x" },
  { id: "vs-olimpo", name: "Trono do Olimpo", tag: "Orbes até 100x", cat: "slots", colors: SLOT_THEMES["vs-olimpo"].tile, max: "50.000x" },
  { id: "vs-dragao", name: "Dragão Imperial", tag: "Multiplicador crescente", cat: "slots", colors: SLOT_THEMES["vs-dragao"].tile, max: "50.000x" },
  { id: "vs-piratas", name: "Ouro dos Piratas", tag: "Wilds presos", cat: "slots", colors: SLOT_THEMES["vs-piratas"].tile, max: "50.000x" },
  { id: "vs-floresta", name: "Floresta Encantada", tag: "Wilds aleatórios", cat: "slots", colors: SLOT_THEMES["vs-floresta"].tile, max: "50.000x" },
  { id: "vs-cyber", name: "Neon Cyber", tag: "Wilds travados", cat: "slots", colors: SLOT_THEMES["vs-cyber"].tile, max: "50.000x" },
  { id: "vs-asteca", name: "Templo Asteca", tag: "Máscaras expansivas", cat: "slots", colors: SLOT_THEMES["vs-asteca"].tile, max: "50.000x" },
  { id: "vs-artico", name: "Lobo Ártico", tag: "Lobos multiplicadores", cat: "slots", colors: SLOT_THEMES["vs-artico"].tile, max: "50.000x" },
  ...([
    ["vs-nilo", "Rainha do Nilo", "2 símbolos especiais"],
    ["vs-tigre", "Tigre Dourado", "Wilds até 25x"],
    ["vs-vikings", "Vikings do Norte", "Wilds que andam"],
    ["vs-vampiro", "Cassino Vampiro", "Mordida wild"],
    ["vs-samurai", "Samurai Sombrio", "Cortes 2x e 3x"],
    ["vs-oeste", "Ouro do Velho Oeste", "Xerife coleta"],
    ["vs-coruja", "Coruja da Meia-Noite", "Multiplicador crescente"],
    ["vs-recife", "Recife de Coral", "Pescador coleta"],
    ["vs-lua", "Deusa da Lua", "Orbes até 100x"],
    ["vs-celta", "Fortuna Celta", "Duendes expansivos"],
    ["vs-gelo", "Dragão de Gelo", "Escolha fogo ou gelo"],
    ["vs-inca", "Templo Inca", "Você escolhe o símbolo"],
    ["vs-safari", "Safari Noturno", "Olhos viram wild"],
    ["vs-doces", "Doces Cósmicos", "Bombas até 100x"],
    ["vs-minotauro", "Lendário Minotauro", "Trilha de prêmios"],
    ["vs-romano", "Império Romano", "Duelo multiplicador"],
    ["vs-fazenda", "Fazenda Feliz", "Wilds presos"],
    ["vs-robos", "Robôs Gigantes", "Wilds que crescem"],
    ["vs-kraken", "Lenda do Kraken", "Tentáculos wild"],
    ["vs-carnaval", "Carnaval do Rio", "Desfile multiplicador"],
  ] as const).map(([id, name, tag]) => ({ id, name, tag, cat: "slots" as const, colors: SLOT_THEMES[id].tile, max: "50.000x" })),
  { id: "crash", name: "Crash", tag: "Ao vivo", cat: "originals", colors: ["#14532d", "#1e1b4b"], max: "50.000x" },
  { id: "mines", name: "Mines", cat: "originals", colors: ["#1e3a8a", "#065f46"] },
  { id: "plinko", name: "Plinko", cat: "originals", colors: ["#831843", "#4c1d95"], max: "1.000x" },
  { id: "limbo", name: "Limbo", cat: "originals", colors: ["#3b0764", "#1e1b4b"], max: "50.000x" },
  { id: "tower", name: "Torre", cat: "originals", colors: ["#422006", "#1e1b4b"] },
  { id: "dice", name: "Dados", cat: "originals", colors: ["#4c1d95", "#1e1b4b"] },
  { id: "coinflip", name: "Cara ou Coroa", cat: "originals", colors: ["#713f12", "#1e1b4b"] },
  { id: "roulette-eu", name: "Roleta Europeia", cat: "table", colors: ["#14532d", "#052e16"] },
  { id: "roulette-us", name: "Roleta Americana", cat: "table", colors: ["#7f1d1d", "#052e16"] },
  { id: "blackjack", name: "Blackjack", cat: "cards", colors: ["#064e3b", "#022c22"] },
  { id: "baccarat", name: "Bacará", cat: "cards", colors: ["#7f1d1d", "#2e1065"] },
  { id: "videopoker", name: "Video Pôquer", cat: "cards", colors: ["#1e3a8a", "#172554"] },
  { id: "threecard", name: "Pôquer 3 Cartas", cat: "cards", colors: ["#581c87", "#1e1b4b"] },
  { id: "caribbean", name: "Caribbean Stud", cat: "cards", colors: ["#0f766e", "#042f2e"] },
  { id: "keno", name: "Keno", cat: "lottery", colors: ["#312e81", "#1e1b4b"], max: "1.500x" },
  { id: "scratch", name: "Raspadinha", cat: "lottery", colors: ["#6b21a8", "#831843"], max: "1.000x" },
  { id: "bingo", name: "Bingo", cat: "lottery", colors: ["#9d174d", "#4c1d95"], max: "10.000x" },
  ...GAMES2,
];
