/** Símbolos do Jardim Abissal (arte original em SVG, viewBox 0 0 100 100). */
import type { ReactNode } from "react";

const Label = ({ text, fill = "url(#a-gold)" }: { text: string; fill?: string }) => (
  <text x="50" y="92" textAnchor="middle" fontFamily="Unbounded, sans-serif" fontWeight="900" fontSize="15" fill={fill} stroke="#04162b" strokeWidth="2.6" paintOrder="stroke">
    {text}
  </text>
);

export const ABYSS_ART: Record<number, ReactNode> = {
  // 0 Olho do Kraken (Wild)
  0: (
    <g filter="url(#a-soft)">
      {[-50, -25, 25, 50].map((a) => (
        <path key={a} d="M50 50 C 40 70, 30 78, 20 92" stroke="#7e22ce" strokeWidth="8" fill="none" strokeLinecap="round" transform={`rotate(${a} 50 50)`} opacity=".8" />
      ))}
      <ellipse cx="50" cy="44" rx="34" ry="26" fill="#3b0764" stroke="#c084fc" strokeWidth="3" />
      <ellipse cx="50" cy="44" rx="20" ry="20" fill="url(#b-kraken)" />
      <ellipse cx="50" cy="44" rx="4" ry="15" fill="#000" />
      <circle cx="43" cy="37" r="3.5" fill="#fff" />
      <Label text="WILD" />
    </g>
  ),
  // 1 Pérola Negra (Scatter)
  1: (
    <g filter="url(#a-soft)">
      <path d="M14 58 C 14 30, 86 30, 86 58 L 80 64 L 20 64 Z" fill="url(#b-clam)" stroke="#bae6fd" strokeWidth="2" />
      {[24, 37, 50, 63, 76].map((x) => (
        <path key={x} d={`M50 62 L${x} 36`} stroke="#e0f2fe" strokeWidth="1.5" opacity=".6" />
      ))}
      <path d="M16 62 C 30 80, 70 80, 84 62 Z" fill="#0369a1" />
      <circle cx="50" cy="56" r="17" fill="url(#b-pearl)" filter="url(#a-glow)" />
      <ellipse cx="44" cy="50" rx="5" ry="3" fill="#fff" opacity=".8" transform="rotate(-30 44 50)" />
      <Label text="FREE" fill="#e0f2fe" />
    </g>
  ),
  // 2 Peixe-lanterna (maior pagamento)
  2: (
    <g filter="url(#a-soft)">
      <path d="M50 30 C 52 14, 70 8, 76 16" stroke="#a78bfa" strokeWidth="2.5" fill="none" />
      <circle cx="77" cy="17" r="10" fill="url(#b-glow)" />
      <circle cx="77" cy="17" r="4.5" fill="#ecfeff" />
      <path d="M14 56 C 14 30, 66 24, 82 50 C 70 74, 22 80, 14 56 Z" fill="url(#b-angler)" stroke="#a78bfa" strokeWidth="2.5" />
      <path d="M14 56 L2 42 L4 70 Z" fill="#5b21b6" />
      <circle cx="56" cy="44" r="9" fill="#fef08a" stroke="#facc15" strokeWidth="2" />
      <circle cx="58" cy="44" r="4" fill="#000" />
      <path d="M58 58 L82 52 L80 66 Z" fill="#0b0618" />
      {[62, 67, 72, 77].map((x) => (
        <path key={x} d={`M${x} 55 l2 5 l2 -5`} fill="#f8fafc" />
      ))}
    </g>
  ),
  // 3 Água-viva
  3: (
    <g filter="url(#a-soft)">
      {[30, 40, 50, 60, 70].map((x, i) => (
        <path key={x} d={`M${x} 52 C ${x - 6} 64, ${x + 6} 74, ${x - 2} 92`} stroke="#f0abfc" strokeWidth={i % 2 ? 2 : 3} fill="none" opacity=".85" />
      ))}
      <path d="M16 54 C 16 16, 84 16, 84 54 C 72 48, 64 58, 50 52 C 36 58, 28 48, 16 54 Z" fill="url(#b-jelly)" stroke="#fdf4ff" strokeWidth="2" />
      <path d="M30 40 C 34 28, 46 24, 54 26" stroke="#fff" strokeWidth="3" fill="none" opacity=".7" strokeLinecap="round" />
    </g>
  ),
  // 4 Náutilo
  4: (
    <g filter="url(#a-soft)">
      <path d="M50 50 m-38 0 a38 38 0 1 0 76 0 a38 38 0 1 0 -76 0" fill="url(#b-nautilus)" />
      <path d="M50 50 C 50 40, 64 40, 64 52 C 64 68, 40 70, 36 52 C 32 30, 70 24, 78 48 C 86 74, 50 92, 26 78" stroke="#7c2d12" strokeWidth="3" fill="none" />
      {[0, 30, 60, 90, 120, 150].map((a) => (
        <line key={a} x1="50" y1="50" x2="50" y2="14" stroke="#9a3412" strokeWidth="1.5" opacity=".45" transform={`rotate(${a + 200} 50 50)`} />
      ))}
    </g>
  ),
  // 5 Cavalo-marinho
  5: (
    <g filter="url(#a-soft)">
      <path d="M56 14 C 74 14, 78 32, 64 38 C 76 46, 72 62, 58 66 C 50 70, 54 82, 64 82 C 70 82, 70 74, 64 74" stroke="url(#b-seahorse)" strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d="M58 20 L36 22 L40 30 Z" fill="#eab308" />
      <circle cx="60" cy="22" r="3.5" fill="#1c1917" />
      <path d="M70 40 L82 34 L78 48 Z" fill="#fde047" opacity=".8" />
    </g>
  ),
  // 6 Estrela-do-mar
  6: (
    <g filter="url(#a-soft)">
      <path d="M50 8 C 56 30, 58 34, 90 38 C 66 54, 66 58, 74 90 C 52 74, 48 74, 26 90 C 34 58, 34 54, 10 38 C 42 34, 44 30, 50 8 Z" fill="url(#b-star)" stroke="#fecdd3" strokeWidth="2" strokeLinejoin="round" />
      {[[50, 30], [62, 44], [58, 62], [42, 62], [38, 44], [50, 48]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" fill="#fff1f2" />
      ))}
    </g>
  ),
  // 7 Coral
  7: (
    <g filter="url(#a-soft)">
      <path d="M50 90 L50 54 M50 66 L32 46 L28 26 M32 46 L18 38 M50 58 L68 40 L70 20 M68 40 L84 34 M50 54 L48 30 L56 14" stroke="url(#b-coral)" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {[[28, 26], [18, 38], [70, 20], [84, 34], [56, 14]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="#fed7aa" />
      ))}
    </g>
  ),
  // 8 Bolha-concha
  8: (
    <g filter="url(#a-soft)">
      <circle cx="50" cy="50" r="34" fill="#0ea5e9" opacity=".25" stroke="#bae6fd" strokeWidth="2.5" />
      <path d="M32 60 C 32 40, 68 40, 68 60 Z" fill="url(#b-clam)" />
      {[38, 44, 50, 56, 62].map((x) => (
        <line key={x} x1="50" y1="60" x2={x} y2="44" stroke="#e0f2fe" strokeWidth="1.3" />
      ))}
      <ellipse cx="38" cy="32" rx="8" ry="5" fill="#fff" opacity=".7" transform="rotate(-35 38 32)" />
      <circle cx="74" cy="22" r="5" fill="none" stroke="#bae6fd" strokeWidth="1.5" />
    </g>
  ),
};

export const ABYSS_NAMES: Record<number, string> = {
  0: "Olho do Kraken (Wild)", 1: "Pérola Negra (Scatter)", 2: "Peixe-lanterna", 3: "Água-viva", 4: "Náutilo",
  5: "Cavalo-marinho", 6: "Estrela-do-mar", 7: "Coral", 8: "Bolha-concha",
};
