/** Símbolos da Forja do Dragão (arte original em SVG, viewBox 0 0 100 100). */
import type { ReactNode } from "react";

const crystal = (grad: string, x: number, scale = 1) => (
  <g transform={`translate(${x} 0) scale(${scale}) translate(${-50} 0)`}>
    <path d="M50 14 L66 34 L58 84 L42 84 L34 34 Z" fill={`url(#${grad})`} stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
    <path d="M50 14 L50 84 L42 84 L34 34 Z" fill="#fff" opacity=".28" />
  </g>
);

export const FORGE_ART: Record<number, ReactNode> = {
  // 0 Ovo de dragão (curinga — dobra o prêmio)
  0: (
    <g filter="url(#a-soft)">
      <path d="M50 8 C 76 8, 86 50, 82 66 C 78 84, 64 92, 50 92 C 36 92, 22 84, 18 66 C 14 50, 24 8, 50 8 Z" fill="url(#c-egg)" stroke="url(#a-gold)" strokeWidth="3" />
      {[[40, 30], [58, 26], [32, 52], [50, 46], [66, 50], [42, 70], [60, 72]].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x - 7} ${y} q7 -9 14 0 q-7 6 -14 0z`} fill="#065f46" opacity=".7" />
      ))}
      <path d="M44 20 l4 14 l-8 10 l10 8" stroke="#fde68a" strokeWidth="2" fill="none" opacity=".9" />
      <text x="50" y="66" textAnchor="middle" fontFamily="Unbounded" fontWeight="900" fontSize="15" fill="url(#a-gold)" stroke="#022c22" strokeWidth="2.4" paintOrder="stroke">WILD</text>
    </g>
  ),
  // 1 Olho de dragão (maior pagamento)
  1: (
    <g filter="url(#a-soft)">
      <path d="M6 50 C 26 18, 74 18, 94 50 C 74 82, 26 82, 6 50 Z" fill="#450a0a" stroke="url(#a-gold)" strokeWidth="4" />
      <circle cx="50" cy="50" r="24" fill="url(#c-dragoneye)" />
      <path d="M50 26 C 56 40, 56 60, 50 74 C 44 60, 44 40, 50 26 Z" fill="#1c0505" />
      <circle cx="42" cy="40" r="4" fill="#fff" opacity=".85" />
      <path d="M6 50 L0 44 M94 50 L100 44" stroke="url(#a-gold)" strokeWidth="3" />
    </g>
  ),
  // 2 Três cristais
  2: <g filter="url(#a-soft)">{crystal("c-crystal3", 30, 0.75)}{crystal("c-crystal3", 70, 0.75)}{crystal("c-crystal3", 50, 0.95)}</g>,
  // 3 Dois cristais
  3: <g filter="url(#a-soft)">{crystal("c-crystal2", 36, 0.85)}{crystal("c-crystal2", 64, 0.85)}</g>,
  // 4 Um cristal
  4: <g filter="url(#a-soft)">{crystal("c-crystal", 50, 1)}</g>,
  // 5 Martelo rúnico
  5: (
    <g filter="url(#a-soft)">
      <rect x="45" y="36" width="10" height="56" rx="4" fill="#78350f" stroke="#451a03" strokeWidth="2" />
      <rect x="14" y="12" width="72" height="30" rx="6" fill="url(#c-iron)" stroke="#e2e8f0" strokeWidth="2" />
      <path d="M30 20 l6 14 M40 20 l-4 14 M60 20 l8 7 l-8 7 M72 20 v14" stroke="#38bdf8" strokeWidth="2.6" strokeLinecap="round" filter="url(#a-glow)" />
      <rect x="42" y="80" width="16" height="10" rx="3" fill="url(#a-gold)" />
    </g>
  ),
  // 6 Brasa
  6: (
    <g filter="url(#a-soft)">
      <path d="M50 6 C 60 26, 82 34, 78 60 C 75 80, 62 92, 50 92 C 36 92, 22 80, 22 62 C 22 46, 34 40, 38 26 C 44 36, 46 42, 50 44 C 52 30, 48 18, 50 6 Z" fill="url(#c-ember)" />
      <path d="M50 52 C 58 60, 62 66, 60 74 C 58 84, 42 84, 40 74 C 38 66, 46 62, 50 52 Z" fill="#fff7ed" opacity=".85" />
    </g>
  ),
  // 7 Vazio
  7: (
    <g opacity=".22">
      <circle cx="50" cy="50" r="14" fill="none" stroke="#fde68a" strokeWidth="2" />
      <path d="M50 40 v20 M40 50 h20" stroke="#fde68a" strokeWidth="2" />
    </g>
  ),
};

export const FORGE_NAMES: Record<number, string> = {
  0: "Ovo de Dragão (Wild)", 1: "Olho de Dragão", 2: "Três Cristais", 3: "Dois Cristais", 4: "Cristal", 5: "Martelo Rúnico", 6: "Brasa", 7: "Vazio",
};
