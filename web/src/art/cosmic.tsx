/** Símbolos do Oráculo Cósmico (arte original em SVG, viewBox 0 0 100 100). */
import type { ReactNode } from "react";

const Label = ({ text, y = 88, size = 13, fill = "url(#a-gold)" }: { text: string; y?: number; size?: number; fill?: string }) => (
  <text x="50" y={y} textAnchor="middle" fontFamily="Unbounded, sans-serif" fontWeight="900" fontSize={size} fill={fill} stroke="#1a0b3d" strokeWidth="2.6" paintOrder="stroke" letterSpacing=".5">
    {text}
  </text>
);

const runeGem = (grad: string, glyph: ReactNode) => (
  <g filter="url(#a-soft)">
    <path d="M50 10 L84 30 L84 70 L50 90 L16 70 L16 30 Z" fill={`url(#${grad})`} stroke="url(#a-gold)" strokeWidth="4" />
    <path d="M50 10 L84 30 L50 50 L16 30 Z" fill="#fff" opacity=".22" />
    <path d="M50 50 L84 70 L50 90 Z" fill="#000" opacity=".18" />
    <g stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".92">{glyph}</g>
  </g>
);

export const COSMIC_ART: Record<number, ReactNode> = {
  // 0 Portal (Wild)
  0: (
    <g>
      <circle cx="50" cy="44" r="36" fill="url(#a-portal)" />
      {[30, 23, 16].map((r, i) => (
        <ellipse key={r} cx="50" cy="44" rx={r} ry={r * 0.92} fill="none" stroke={i % 2 ? "#22d3ee" : "#e9d5ff"} strokeWidth="2" strokeDasharray={`${r * 1.6} ${r * 0.9}`} transform={`rotate(${i * 50} 50 44)`} opacity=".85" />
      ))}
      <circle cx="50" cy="44" r="7" fill="#fff" filter="url(#a-glow)" />
      <Label text="WILD" y={90} size={17} />
    </g>
  ),
  // 1 Nebulosa (Scatter)
  1: (
    <g>
      <circle cx="50" cy="44" r="40" fill="url(#a-nebula)" />
      <path d="M22 52 C 18 30, 46 20, 54 32 C 64 18, 88 30, 78 48 C 92 60, 70 76, 56 66 C 44 80, 18 72, 22 52 Z" fill="#f472b6" opacity=".35" />
      <path d="M50 18 L56 38 L77 38 L60 50 L66 70 L50 58 L34 70 L40 50 L23 38 L44 38 Z" fill="url(#a-gold)" stroke="#fff7d6" strokeWidth="1.5" filter="url(#a-glow)" />
      <Label text="FREE" y={92} size={16} fill="#fdf2f8" />
    </g>
  ),
  // 2 Orbe do Destino (Bônus)
  2: (
    <g filter="url(#a-soft)">
      <path d="M30 80 L70 80 L62 68 L38 68 Z" fill="url(#a-gold-d)" />
      <circle cx="50" cy="42" r="28" fill="url(#a-orb)" stroke="url(#a-gold)" strokeWidth="3" />
      <path d="M44 28 A16 16 0 1 0 60 56 A13 13 0 1 1 44 28 Z" fill="#fff8db" opacity=".9" />
      <circle cx="40" cy="32" r="5" fill="#fff" opacity=".8" />
      <Label text="BÔNUS" y={96} size={13} />
    </g>
  ),
  // 3 Orbe multiplicador (o valor é desenhado por cima)
  3: (
    <g filter="url(#a-soft)">
      <circle cx="50" cy="50" r="36" fill="url(#a-multorb)" stroke="#a5f3fc" strokeWidth="3" />
      <circle cx="50" cy="50" r="28" fill="none" stroke="#ecfeff" strokeWidth="1.2" strokeDasharray="4 5" opacity=".7" />
      <ellipse cx="38" cy="34" rx="10" ry="6" fill="#fff" opacity=".55" transform="rotate(-30 38 34)" />
    </g>
  ),
  // 4 Ampulheta Estelar
  4: (
    <g filter="url(#a-soft)">
      <rect x="22" y="10" width="56" height="9" rx="4" fill="url(#a-gold)" />
      <rect x="22" y="81" width="56" height="9" rx="4" fill="url(#a-gold)" />
      <path d="M30 19 L70 19 C 70 38, 54 44, 54 50 C 54 56, 70 62, 70 81 L30 81 C 30 62, 46 56, 46 50 C 46 44, 30 38, 30 19 Z" fill="#c4b5fd" opacity=".25" stroke="#e9d5ff" strokeWidth="2.5" />
      <path d="M36 24 L64 24 C 62 34, 52 40, 50 46 C 48 40, 38 34, 36 24 Z" fill="#a78bfa" />
      <path d="M33 78 L67 78 C 64 68, 56 64, 50 62 C 44 64, 36 68, 33 78 Z" fill="url(#a-gold)" />
      <circle cx="50" cy="55" r="1.8" fill="#fde68a" />
      <circle cx="50" cy="59" r="1.5" fill="#fde68a" />
      <path d="M44 72 l2 -4 l2 4 l4 1 l-4 1 l-2 4 l-2 -4 l-4 -1z" fill="#fff" />
      <rect x="24" y="19" width="4" height="62" fill="url(#a-gold-d)" />
      <rect x="72" y="19" width="4" height="62" fill="url(#a-gold-d)" />
    </g>
  ),
  // 5 Astrolábio
  5: (
    <g filter="url(#a-soft)">
      <circle cx="50" cy="50" r="38" fill="#1e1b4b" stroke="url(#a-gold)" strokeWidth="5" />
      <circle cx="50" cy="50" r="28" fill="none" stroke="url(#a-gold)" strokeWidth="1.5" />
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={i} x1="50" y1="14" x2="50" y2="20" stroke="#fde68a" strokeWidth="2" transform={`rotate(${i * 30} 50 50)`} />
      ))}
      <ellipse cx="50" cy="50" rx="30" ry="10" fill="none" stroke="#22d3ee" strokeWidth="2" transform="rotate(-25 50 50)" />
      <path d="M50 22 L54 50 L50 78 L46 50 Z" fill="url(#a-gold)" transform="rotate(35 50 50)" />
      <circle cx="50" cy="50" r="6" fill="url(#a-gold)" stroke="#78350f" strokeWidth="1.5" />
      <circle cx="70" cy="34" r="3" fill="#f0abfc" />
    </g>
  ),
  // 6 Prisma
  6: (
    <g filter="url(#a-soft)">
      <path d="M8 62 L34 52" stroke="#fff" strokeWidth="3" opacity=".9" />
      <path d="M62 50 L94 36 M62 54 L95 48 M62 58 L95 60 M62 62 L94 72" stroke="url(#a-rainbow)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M50 12 L80 80 L20 80 Z" fill="url(#a-prism)" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M50 12 L50 80 L20 80 Z" fill="#fff" opacity=".35" />
      <path d="M50 12 L62 80 L50 80 Z" fill="#312e81" opacity=".25" />
    </g>
  ),
  // 7 Planeta anelado
  7: (
    <g filter="url(#a-soft)">
      <ellipse cx="50" cy="52" rx="44" ry="13" fill="none" stroke="url(#a-planet-ring)" strokeWidth="5" transform="rotate(-18 50 52)" />
      <circle cx="50" cy="50" r="26" fill="url(#a-planet)" />
      <path d="M26 46 C 40 40, 60 54, 75 46" stroke="#99f6e4" strokeWidth="3" fill="none" opacity=".6" />
      <path d="M28 58 C 44 52, 58 64, 73 58" stroke="#0f766e" strokeWidth="3" fill="none" opacity=".6" />
      <path d="M8 63 C 30 70, 70 52, 92 41" stroke="#fde68a" strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  ),
  // 8 Runa de fogo
  8: runeGem("a-fire", <path d="M50 30 L50 70 M38 42 L50 30 L62 42 M40 60 L60 60" />),
  // 9 Runa d'água
  9: runeGem("a-water", <path d="M32 44 Q 41 36 50 44 T 68 44 M32 58 Q 41 50 50 58 T 68 58" />),
  // 10 Runa da terra
  10: runeGem("a-earth", <path d="M50 30 L50 70 M50 46 L36 34 M50 46 L64 34 M50 60 L38 52 M50 60 L62 52" />),
  // 11 Olho do Oráculo (maior pagamento)
  11: (
    <g filter="url(#a-soft)">
      <path d="M50 6 L94 84 L6 84 Z" fill="#1e1b4b" stroke="url(#a-gold)" strokeWidth="5" strokeLinejoin="round" />
      <path d="M18 56 C 34 32, 66 32, 82 56 C 66 78, 34 78, 18 56 Z" fill="#fff8e6" stroke="url(#a-gold)" strokeWidth="3" />
      <circle cx="50" cy="56" r="15" fill="url(#a-iris)" />
      <circle cx="44" cy="50" r="4" fill="#fff" />
      {[-60, -30, 0, 30, 60].map((a) => (
        <line key={a} x1="50" y1="26" x2="50" y2="16" stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${a} 50 56)`} />
      ))}
    </g>
  ),
  // 12 Sol (arcano: coluna inteira Wild)
  12: (
    <g filter="url(#a-soft)">
      {Array.from({ length: 16 }).map((_, i) => (
        <path key={i} d="M50 4 L54 20 L46 20 Z" fill={i % 2 ? "#fbbf24" : "#fde68a"} transform={`rotate(${i * 22.5} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="27" fill="url(#a-sun)" stroke="#fff7d6" strokeWidth="2" />
      <path d="M38 46 q4 -4 8 0 M54 46 q4 -4 8 0" stroke="#9a3412" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M40 58 q10 8 20 0" stroke="#9a3412" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ),
  // 13 Lua (arcano: multiplicador na próxima vitória)
  13: (
    <g filter="url(#a-soft)">
      <path d="M62 10 A40 40 0 1 0 90 66 A32 32 0 1 1 62 10 Z" fill="url(#a-moon)" stroke="#e0e7ff" strokeWidth="2.5" />
      <circle cx="34" cy="44" r="5" fill="#818cf8" opacity=".55" />
      <circle cx="42" cy="68" r="7" fill="#818cf8" opacity=".45" />
      <circle cx="26" cy="62" r="3" fill="#818cf8" opacity=".5" />
      <path d="M74 26 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2z" fill="#fff" />
    </g>
  ),
  // 14 Cometa (arcano: 2–4 Wilds)
  14: (
    <g filter="url(#a-soft)">
      <path d="M92 8 L30 58 L42 70 Z" fill="url(#a-comet-tail)" />
      <path d="M86 4 L24 52 L48 76 Z" fill="url(#a-comet-tail)" opacity=".5" />
      <circle cx="34" cy="64" r="20" fill="#ecfeff" stroke="#67e8f9" strokeWidth="3" filter="url(#a-glow)" />
      <circle cx="28" cy="58" r="6" fill="#fff" />
      <circle cx="40" cy="70" r="3" fill="#a5f3fc" />
    </g>
  ),
  // 15 Eclipse (arcano: Re-Spin)
  15: (
    <g filter="url(#a-soft)">
      <circle cx="50" cy="50" r="46" fill="url(#a-corona)" />
      <circle cx="50" cy="50" r="27" fill="#05030d" stroke="#fff7d6" strokeWidth="2" />
      <circle cx="56" cy="44" r="27" fill="none" stroke="#f59e0b" strokeWidth="1" opacity=".5" />
      <path d="M50 18 A32 32 0 0 1 82 50" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M77 42 L83 52 L89 42" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
};

export const COSMIC_NAMES: Record<number, string> = {
  0: "Portal (Wild)", 1: "Nebulosa (Scatter)", 2: "Orbe do Destino (Bônus)", 3: "Orbe multiplicador",
  4: "Ampulheta Estelar", 5: "Astrolábio", 6: "Prisma", 7: "Planeta Anelado", 8: "Runa de Fogo", 9: "Runa d'Água", 10: "Runa da Terra",
  11: "Olho do Oráculo", 12: "Sol", 13: "Lua", 14: "Cometa", 15: "Eclipse",
};
