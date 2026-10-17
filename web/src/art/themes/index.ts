import type { ReactNode } from "react";
import { FARAO, GEMAS, SAVANA } from "./themesA";
import { DRAGAO, FLORESTA, PIRATAS } from "./themesB";
import { ARTICO, ASTECA, CYBER, OLIMPO } from "./themesC";

export type SlotThemeMeta = {
  id: string;
  art: Record<number, ReactNode>;
  /** fundo da página */
  bg: string;
  /** moldura dos rolos */
  frame: string;
  /** fundo interno dos rolos */
  inner: string;
  accent: string;
  title: string; // gradiente do título
  cell: string; // classe das células
  featureTitle: string;
  featureDesc: string;
  tile: [string, string];
  icon: number; // símbolo usado no ícone do lobby
  lineColors: string[];
};

export const SLOT_THEMES: Record<string, SlotThemeMeta> = {
  "vs-savana": {
    id: "vs-savana", art: SAVANA,
    bg: "radial-gradient(80% 50% at 50% 0%, rgba(251,146,60,0.45), transparent 70%), radial-gradient(70% 40% at 50% 100%, rgba(159,18,57,0.35), transparent 70%), linear-gradient(180deg,#2a0f05,#120603)",
    frame: "linear-gradient(180deg,#fde68a,#ea580c 50%,#7c2d12)", inner: "#1f0c05", accent: "#fbbf24",
    title: "linear-gradient(180deg,#fff7d6,#fbbf24 50%,#c2410c)", cell: "rounded-xl bg-gradient-to-b from-orange-200/[0.08] to-transparent",
    featureTitle: "LEÕES EXPANSIVOS", featureDesc: "O Leão ocupa o rolo inteiro sempre que aparece. Nos giros grátis todos os ganhos valem x3.",
    tile: ["#9a3412", "#431407"], icon: 0, lineColors: ["#fde047", "#fb923c", "#f87171", "#fbbf24", "#fdba74"],
  },
  "vs-gemas": {
    id: "vs-gemas", art: GEMAS,
    bg: "radial-gradient(70% 45% at 50% 0%, rgba(56,189,248,0.35), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(236,72,153,0.3), transparent 70%), linear-gradient(180deg,#0a0b1f,#05040d)",
    frame: "linear-gradient(180deg,#e0f2fe,#7c3aed 50%,#db2777)", inner: "#0b0a1d", accent: "#7dd3fc",
    title: "linear-gradient(180deg,#ffffff,#7dd3fc 45%,#a855f7)", cell: "rounded-xl bg-gradient-to-b from-sky-200/[0.08] to-transparent",
    featureTitle: "DIAMANTES MULTIPLICADORES", featureDesc: "Nos giros grátis cada Diamante (Wild) traz um multiplicador de 2x a 10x. Na mesma linha, eles se somam.",
    tile: ["#1e3a8a", "#4c1d95"], icon: 2, lineColors: ["#7dd3fc", "#f0abfc", "#fde047", "#86efac", "#fda4af"],
  },
  "vs-farao": {
    id: "vs-farao", art: FARAO,
    bg: "radial-gradient(80% 50% at 50% 0%, rgba(250,204,21,0.35), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(30,64,175,0.35), transparent 70%), linear-gradient(180deg,#1c1404,#0b0802)",
    frame: "linear-gradient(180deg,#fde68a,#ca8a04 50%,#1e3a8a)", inner: "#161004", accent: "#facc15",
    title: "linear-gradient(180deg,#fff7d6,#facc15 50%,#a16207)", cell: "rounded-xl bg-gradient-to-b from-yellow-200/[0.08] to-transparent",
    featureTitle: "LIVRO DOS SÍMBOLOS", featureDesc: "O Livro é Wild e Scatter. Nos giros grátis um símbolo especial é sorteado: ele expande e paga em todas as 20 linhas.",
    tile: ["#a16207", "#1e3a8a"], icon: 2, lineColors: ["#facc15", "#60a5fa", "#fb923c", "#fde68a", "#93c5fd"],
  },
  "vs-piratas": {
    id: "vs-piratas", art: PIRATAS,
    bg: "radial-gradient(80% 50% at 50% 0%, rgba(14,165,233,0.35), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(180,83,9,0.35), transparent 70%), linear-gradient(180deg,#04121f,#020a12)",
    frame: "linear-gradient(180deg,#fde68a,#92400e 50%,#0c4a6e)", inner: "#06131f", accent: "#fbbf24",
    title: "linear-gradient(180deg,#fff7d6,#fbbf24 50%,#92400e)", cell: "rounded-xl bg-gradient-to-b from-amber-100/[0.07] to-transparent",
    featureTitle: "CAVEIRAS PRESAS", featureDesc: "Nos giros grátis cada Caveira (Wild) fica presa no lugar até o fim do bônus.",
    tile: ["#0c4a6e", "#422006"], icon: 0, lineColors: ["#fde047", "#38bdf8", "#f87171", "#fbbf24", "#a5f3fc"],
  },
  "vs-dragao": {
    id: "vs-dragao", art: DRAGAO,
    bg: "radial-gradient(80% 50% at 50% 0%, rgba(220,38,38,0.4), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(234,179,8,0.25), transparent 70%), linear-gradient(180deg,#1f0505,#0d0202)",
    frame: "linear-gradient(180deg,#fde68a,#dc2626 50%,#7f1d1d)", inner: "#1a0505", accent: "#fde047",
    title: "linear-gradient(180deg,#fff7d6,#fde047 45%,#dc2626)", cell: "rounded-xl bg-gradient-to-b from-red-200/[0.08] to-transparent",
    featureTitle: "MULTIPLICADOR DO DRAGÃO", featureDesc: "Nos giros grátis o multiplicador começa em x1 e sobe +1 a cada giro com vitória, sem voltar.",
    tile: ["#991b1b", "#3f0d0d"], icon: 0, lineColors: ["#fde047", "#f87171", "#fb923c", "#fef08a", "#fca5a5"],
  },
  "vs-floresta": {
    id: "vs-floresta", art: FLORESTA,
    bg: "radial-gradient(80% 50% at 50% 0%, rgba(34,197,94,0.35), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(168,85,247,0.35), transparent 70%), linear-gradient(180deg,#04140a,#020a05)",
    frame: "linear-gradient(180deg,#bbf7d0,#16a34a 50%,#7e22ce)", inner: "#05140b", accent: "#86efac",
    title: "linear-gradient(180deg,#ffffff,#86efac 45%,#a855f7)", cell: "rounded-xl bg-gradient-to-b from-green-200/[0.08] to-transparent",
    featureTitle: "FADAS ALEATÓRIAS", featureDesc: "Em cada giro grátis, de 1 a 4 Fadas (Wild) pousam em posições aleatórias.",
    tile: ["#14532d", "#3b0764"], icon: 0, lineColors: ["#86efac", "#f0abfc", "#fde047", "#a5f3fc", "#bef264"],
  },
  "vs-olimpo": {
    id: "vs-olimpo", art: OLIMPO,
    bg: "radial-gradient(80% 50% at 50% 0%, rgba(99,102,241,0.45), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(250,204,21,0.25), transparent 70%), linear-gradient(180deg,#090a24,#04050f)",
    frame: "linear-gradient(180deg,#ffffff,#facc15 50%,#4338ca)", inner: "#0b0c26", accent: "#fde047",
    title: "linear-gradient(180deg,#ffffff,#fde047 45%,#a16207)", cell: "rounded-xl bg-gradient-to-b from-indigo-200/[0.08] to-transparent",
    featureTitle: "ORBES DO TROVÃO", featureDesc: "Orbes com 2x a 100x podem cair em qualquer giro. Os valores somam e multiplicam o ganho do giro (mais orbes nos giros grátis).",
    tile: ["#3730a3", "#1e1b4b"], icon: 2, lineColors: ["#fde047", "#a5b4fc", "#f0abfc", "#fef08a", "#c7d2fe"],
  },
  "vs-cyber": {
    id: "vs-cyber", art: CYBER,
    bg: "radial-gradient(80% 50% at 50% 0%, rgba(240,171,252,0.35), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(34,211,238,0.35), transparent 70%), linear-gradient(180deg,#0b0618,#04020a)",
    frame: "linear-gradient(180deg,#f0abfc,#7e22ce 50%,#22d3ee)", inner: "#0a0516", accent: "#22d3ee",
    title: "linear-gradient(180deg,#ffffff,#f0abfc 45%,#22d3ee)", cell: "rounded-xl bg-gradient-to-b from-fuchsia-200/[0.07] to-transparent",
    featureTitle: "ANDROIDES TRAVADOS", featureDesc: "Nos giros grátis cada Androide (Wild) trava a posição até o fim do bônus.",
    tile: ["#581c87", "#083344"], icon: 2, lineColors: ["#22d3ee", "#f0abfc", "#a3e635", "#fbbf24", "#f472b6"],
  },
  "vs-asteca": {
    id: "vs-asteca", art: ASTECA,
    bg: "radial-gradient(80% 50% at 50% 0%, rgba(20,184,166,0.35), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(217,119,6,0.3), transparent 70%), linear-gradient(180deg,#03140f,#020a07)",
    frame: "linear-gradient(180deg,#fde68a,#0d9488 50%,#78350f)", inner: "#04140f", accent: "#5eead4",
    title: "linear-gradient(180deg,#fff7d6,#5eead4 45%,#b45309)", cell: "rounded-xl bg-gradient-to-b from-teal-200/[0.08] to-transparent",
    featureTitle: "MÁSCARAS EXPANSIVAS", featureDesc: "A Máscara de Jade ocupa o rolo inteiro sempre que aparece. Nos giros grátis todos os ganhos valem x3.",
    tile: ["#115e59", "#422006"], icon: 0, lineColors: ["#5eead4", "#fde047", "#fb923c", "#a7f3d0", "#fbbf24"],
  },
  "vs-artico": {
    id: "vs-artico", art: ARTICO,
    bg: "radial-gradient(80% 50% at 50% 0%, rgba(74,222,128,0.25), transparent 70%), radial-gradient(70% 45% at 50% 20%, rgba(168,85,247,0.25), transparent 70%), linear-gradient(180deg,#06101f,#020611)",
    frame: "linear-gradient(180deg,#ffffff,#38bdf8 50%,#6366f1)", inner: "#061120", accent: "#bae6fd",
    title: "linear-gradient(180deg,#ffffff,#bae6fd 45%,#6366f1)", cell: "rounded-xl bg-gradient-to-b from-sky-100/[0.08] to-transparent",
    featureTitle: "LOBOS MULTIPLICADORES", featureDesc: "Nos giros grátis cada Lobo (Wild) uiva com um multiplicador de 2x a 10x, somado na linha.",
    tile: ["#0c4a6e", "#312e81"], icon: 0, lineColors: ["#bae6fd", "#a5b4fc", "#86efac", "#f0abfc", "#e0f2fe"],
  },
};
