/** Rei da Savana · Cofre de Gemas · Livro do Faraó */
import type { ReactNode } from "react";
import { Badge, lin, Medallion, rad, Ribbon, Sym } from "./kit";

/* =========================================================== REI DA SAVANA */
const lionFace = (id: string) => (
  <g>
    <defs>
      {rad(`${id}-mane`, ["#fde68a", "#f59e0b", "#9a3412"], "50%", "45%")}
      {rad(`${id}-face`, ["#fff7d6", "#fbbf24", "#b45309"], "45%", "35%")}
    </defs>
    {Array.from({ length: 14 }).map((_, i) => (
      <path key={i} d="M50 50 L44 8 Q50 2 56 8 Z" fill={`url(#${id}-mane)`} transform={`rotate(${i * 25.7} 50 50)`} />
    ))}
    <circle cx="50" cy="50" r="30" fill={`url(#${id}-mane)`} />
    <ellipse cx="50" cy="54" rx="21" ry="24" fill={`url(#${id}-face)`} />
    <circle cx="36" cy="30" r="6" fill="#d97706" />
    <circle cx="64" cy="30" r="6" fill="#d97706" />
    <ellipse cx="41" cy="48" rx="3.6" ry="4.4" fill="#1c1917" />
    <ellipse cx="59" cy="48" rx="3.6" ry="4.4" fill="#1c1917" />
    <circle cx="42" cy="46.5" r="1.3" fill="#fff" />
    <circle cx="60" cy="46.5" r="1.3" fill="#fff" />
    <path d="M44 60 L56 60 L50 67 Z" fill="#7c2d12" />
    <path d="M50 67 Q44 73 39 70 M50 67 Q56 73 61 70" stroke="#7c2d12" strokeWidth="2.2" fill="none" strokeLinecap="round" />
  </g>
);

export const SAVANA: Record<number, ReactNode> = {
  0: <Sym id="sv0">{lionFace("sv0")}<Ribbon id="sv0" text="WILD" /></Sym>,
  1: (
    <Sym id="sv1" defs={<>{rad("sv1-sky", ["#fef3c7", "#fb923c", "#9f1239"], "50%", "70%")}{lin("sv1-sun", ["#fff7d6", "#fbbf24"])}</>}>
      <circle cx="50" cy="44" r="38" fill="url(#sv1-sky)" stroke="url(#sv1-gold)" strokeWidth="4" />
      <circle cx="50" cy="52" r="15" fill="url(#sv1-sun)" />
      <path d="M12 60 L88 60 L88 82 L12 82 Z" fill="#431407" />
      <path d="M58 60 C60 48 56 40 66 36 M66 36 C58 34 54 38 50 36 M66 36 C72 32 78 34 82 38 M66 36 C70 40 76 42 80 46" stroke="#1c0a03" strokeWidth="3" fill="none" />
      <path d="M22 58 C26 52 30 52 34 58" fill="#1c0a03" />
      <Ribbon id="sv1" text="FREE" colors={["#fecaca", "#be123c"]} ink="#fff" />
    </Sym>
  ),
  2: (
    <Medallion id="sv2" bg={["#e0f2fe", "#7dd3fc", "#0369a1"]}>
      <ellipse cx="50" cy="60" rx="26" ry="22" fill="#94a3b8" />
      <path d="M26 46 C10 40 10 70 26 72 Z M74 46 C90 40 90 70 74 72 Z" fill="#64748b" />
      <path d="M44 66 C42 80 46 90 40 94 L48 94 C54 86 52 76 54 66 Z" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
      <path d="M38 70 Q32 76 30 86 M62 70 Q68 76 70 86" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="40" cy="54" r="3" fill="#0f172a" />
      <circle cx="60" cy="54" r="3" fill="#0f172a" />
    </Medallion>
  ),
  3: (
    <Medallion id="sv3" bg={["#fef9c3", "#bef264", "#3f6212"]}>
      <ellipse cx="50" cy="62" rx="28" ry="20" fill="#78716c" />
      <path d="M50 44 L58 22 L62 46 Z" fill="#e7e5e4" stroke="#57534e" strokeWidth="1.5" />
      <path d="M38 48 L42 36 L46 48 Z" fill="#d6d3d1" />
      <circle cx="40" cy="58" r="2.8" fill="#1c1917" />
      <path d="M26 54 C20 50 18 44 24 42" fill="#57534e" />
      <path d="M30 70 Q50 78 70 70" stroke="#44403c" strokeWidth="2" fill="none" />
    </Medallion>
  ),
  4: (
    <Medallion id="sv4" bg={["#fef3c7", "#fdba74", "#c2410c"]}>
      <path d="M44 96 L46 40 C46 26 52 18 58 20 L62 22 L60 40 L56 96 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="1.5" />
      <path d="M58 20 C66 18 72 22 72 28 L60 30 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="1.5" />
      {[[50, 46], [54, 60], [49, 72], [53, 84], [55, 34]].map(([x, y]) => <path key={`${x}${y}`} d={`M${x - 4} ${y} l4 -4 l4 4 l-4 4z`} fill="#92400e" />)}
      <path d="M58 16 l-2 -7 M63 17 l1 -7" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="64" cy="25" r="1.8" fill="#1c1917" />
    </Medallion>
  ),
  5: (
    <Medallion id="sv5" bg={["#f5f5f4", "#d6d3d1", "#57534e"]}>
      <path d="M30 96 L36 46 C38 30 50 22 62 26 C70 30 72 40 68 50 L64 96 Z" fill="#fafaf9" />
      {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${32 + i * 2} ${50 + i * 8} Q50 ${44 + i * 8} 68 ${52 + i * 8}`} stroke="#1c1917" strokeWidth="4" fill="none" />)}
      <path d="M44 28 L40 14 L50 24 Z M58 26 L64 12 L62 26 Z" fill="#1c1917" />
      <circle cx="56" cy="38" r="2.8" fill="#1c1917" />
    </Medallion>
  ),
  6: <Badge id="sv6" colors={["#fde68a", "#d97706", "#78350f"]} glyph={<path d="M34 64 C34 46 42 36 46 30 M50 66 C50 46 54 36 56 28 M66 64 C66 48 62 38 60 32" />} />,
  7: <Badge id="sv7" colors={["#bbf7d0", "#16a34a", "#14532d"]} shape="circle" glyph={<><ellipse cx="50" cy="60" rx="10" ry="12" /><circle cx="36" cy="40" r="5" /><circle cx="50" cy="34" r="5" /><circle cx="64" cy="40" r="5" /></>} />,
  8: <Badge id="sv8" colors={["#d9f99d", "#65a30d", "#365314"]} shape="diamond" glyph={<path d="M50 28 C66 38 66 62 50 72 C34 62 34 38 50 28 M50 30 L50 72" />} />,
  9: <Badge id="sv9" colors={["#fecaca", "#dc2626", "#7f1d1d"]} shape="shield" glyph={<><ellipse cx="50" cy="36" rx="16" ry="6" /><path d="M34 36 L38 66 Q50 72 62 66 L66 36 M40 44 L60 58 M60 44 L40 58" /></>} />,
};

/* =========================================================== COFRE DE GEMAS */
const gem = (id: string, c: [string, string, string], shape: "round" | "emerald" | "pear" | "heart" | "princess" | "marquise") => {
  const d = {
    round: "M50 12 L78 26 L88 50 L78 74 L50 88 L22 74 L12 50 L22 26 Z",
    emerald: "M32 12 L68 12 L86 30 L86 70 L68 88 L32 88 L14 70 L14 30 Z",
    pear: "M50 8 C66 28 84 48 84 64 C84 80 68 92 50 92 C32 92 16 80 16 64 C16 48 34 28 50 8 Z",
    heart: "M50 88 L14 50 C2 36 12 14 30 14 C40 14 46 20 50 28 C54 20 60 14 70 14 C88 14 98 36 86 50 Z",
    princess: "M14 14 L86 14 L86 86 L14 86 Z",
    marquise: "M50 6 C74 26 86 40 86 50 C86 60 74 74 50 94 C26 74 14 60 14 50 C14 40 26 26 50 6 Z",
  }[shape];
  return (
    <Sym id={id} defs={<>{lin(`${id}-g`, [c[0], c[1], c[2]])}{rad(`${id}-h`, ["#ffffff", "rgba(255,255,255,0)"], "35%", "25%")}</>}>
      <path d={d} fill={`url(#${id}-g)`} stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M50 30 L70 50 L50 70 L30 50 Z" fill={c[0]} opacity=".55" />
      <path d="M50 30 L50 70 M30 50 L70 50" stroke="#fff" strokeWidth="1" opacity=".5" />
      <path d={d} fill={`url(#${id}-h)`} opacity=".7" />
      <path d="M30 24 l3 -6 l3 6 l6 3 l-6 3 l-3 6 l-3 -6 l-6 -3z" fill="#fff" />
    </Sym>
  );
};

export const GEMAS: Record<number, ReactNode> = {
  0: (
    <Sym id="gm0" defs={lin("gm0-d", ["#ffffff", "#bae6fd", "#7dd3fc", "#e0f2fe"])}>
      <path d="M20 30 L36 14 L64 14 L80 30 L50 70 Z" fill="url(#gm0-d)" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M20 30 L80 30 M36 14 L42 30 L50 70 L58 30 L64 14 M42 30 L50 14 L58 30" stroke="#38bdf8" strokeWidth="1.4" fill="none" />
      <path d="M26 20 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2z" fill="#fff" />
      <Ribbon id="gm0" text="WILD" colors={["#e0f2fe", "#0284c7"]} ink="#fff" />
    </Sym>
  ),
  1: (
    <Sym id="gm1" defs={<>{lin("gm1-s", ["#94a3b8", "#334155"])}{rad("gm1-dial", ["#fde68a", "#b45309"])}</>}>
      <rect x="14" y="10" width="72" height="62" rx="8" fill="url(#gm1-s)" stroke="url(#gm1-gold)" strokeWidth="4" />
      <circle cx="50" cy="41" r="18" fill="url(#gm1-dial)" stroke="#78350f" strokeWidth="2" />
      {[0, 60, 120, 180, 240, 300].map((a) => <line key={a} x1="50" y1="25" x2="50" y2="30" stroke="#78350f" strokeWidth="2" transform={`rotate(${a} 50 41)`} />)}
      <path d="M50 41 L50 29" stroke="#3b1d00" strokeWidth="3" strokeLinecap="round" />
      <rect x="20" y="16" width="5" height="10" rx="2" fill="#cbd5e1" />
      <rect x="20" y="56" width="5" height="10" rx="2" fill="#cbd5e1" />
      <Ribbon id="gm1" text="FREE" colors={["#fde68a", "#b45309"]} />
    </Sym>
  ),
  2: gem("gm2", ["#fecdd3", "#e11d48", "#881337"], "heart"),
  3: gem("gm3", ["#bfdbfe", "#2563eb", "#1e3a8a"], "round"),
  4: gem("gm4", ["#bbf7d0", "#16a34a", "#14532d"], "emerald"),
  5: gem("gm5", ["#e9d5ff", "#9333ea", "#4c1d95"], "pear"),
  6: gem("gm6", ["#fef08a", "#f59e0b", "#92400e"], "marquise"),
  7: gem("gm7", ["#f1f5f9", "#cbd5e1", "#64748b"], "princess"),
  8: gem("gm8", ["#fbcfe8", "#ec4899", "#831843"], "round"),
  9: gem("gm9", ["#ccfbf1", "#14b8a6", "#134e4a"], "emerald"),
};

/* =========================================================== LIVRO DO FARAÓ */
const book = (id: string, label: string) => (
  <Sym id={id} defs={<>{lin(`${id}-c`, ["#b91c1c", "#7f1d1d"])}{lin(`${id}-p`, ["#fef3c7", "#fcd34d"])}</>}>
    <path d="M14 22 L50 30 L86 22 L86 70 L50 78 L14 70 Z" fill={`url(#${id}-p)`} stroke="#92400e" strokeWidth="2" />
    <path d="M10 18 L50 26 L50 82 L10 74 Z" fill={`url(#${id}-c)`} stroke={`url(#${id}-gold)`} strokeWidth="3" />
    <path d="M90 18 L50 26 L50 82 L90 74 Z" fill={`url(#${id}-c)`} stroke={`url(#${id}-gold)`} strokeWidth="3" />
    <path d="M30 40 C30 32 40 30 40 40 C40 48 30 50 30 40 Z M30 40 L40 40" stroke={`url(#${id}-gold)`} strokeWidth="2.4" fill="none" />
    <path d="M62 34 L74 34 L68 50 Z M68 50 L68 60" stroke={`url(#${id}-gold)`} strokeWidth="2.4" fill="none" />
    <Ribbon id={id} text={label} y={72} />
  </Sym>
);

export const FARAO: Record<number, ReactNode> = {
  0: book("fr0", "WILD"),
  1: book("fr1", "FREE"),
  2: (
    <Sym id="fr2" defs={<>{lin("fr2-n", ["#1e3a8a", "#fbbf24", "#1e3a8a", "#fbbf24", "#1e3a8a"], false)}{lin("fr2-f", ["#fcd34d", "#b45309"])}</>}>
      <path d="M20 40 C20 10 80 10 80 40 L86 90 L14 90 Z" fill="url(#fr2-n)" stroke="url(#fr2-gold)" strokeWidth="3" />
      <path d="M32 36 C32 22 68 22 68 36 L66 64 C62 76 38 76 34 64 Z" fill="url(#fr2-f)" stroke="#78350f" strokeWidth="1.5" />
      <path d="M38 46 L46 46 M54 46 L62 46" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 46 L30 50 M64 46 L70 50" stroke="#1c1917" strokeWidth="2" />
      <path d="M50 50 L48 58 L52 58" stroke="#78350f" strokeWidth="1.6" fill="none" />
      <path d="M44 64 Q50 67 56 64" stroke="#78350f" strokeWidth="1.8" fill="none" />
      <path d="M46 74 L54 74 L52 92 L48 92 Z" fill="url(#fr2-n)" />
      <path d="M50 14 C46 18 46 22 50 24 C54 22 54 18 50 14 Z" fill="#dc2626" stroke="url(#fr2-gold)" strokeWidth="1.5" />
    </Sym>
  ),
  3: (
    <Sym id="fr3" defs={<>{rad("fr3-b", ["#86efac", "#0d9488", "#134e4a"])}{lin("fr3-w", ["#93c5fd", "#1d4ed8"])}</>}>
      <path d="M8 52 C14 30 34 34 40 44 L40 60 C30 64 14 66 8 52 Z" fill="url(#fr3-w)" stroke="url(#fr3-gold)" strokeWidth="2" />
      <path d="M92 52 C86 30 66 34 60 44 L60 60 C70 64 86 66 92 52 Z" fill="url(#fr3-w)" stroke="url(#fr3-gold)" strokeWidth="2" />
      <ellipse cx="50" cy="58" rx="16" ry="24" fill="url(#fr3-b)" stroke="url(#fr3-gold)" strokeWidth="3" />
      <path d="M50 36 L50 82" stroke="url(#fr3-gold)" strokeWidth="2" />
      <circle cx="50" cy="28" r="10" fill="url(#fr3-b)" stroke="url(#fr3-gold)" strokeWidth="2.5" />
      <circle cx="50" cy="14" r="7" fill="#f97316" stroke="url(#fr3-gold)" strokeWidth="2" />
    </Sym>
  ),
  4: (
    <Sym id="fr4" defs={lin("fr4-k", ["#334155", "#020617"])}>
      <path d="M30 90 L32 50 C30 36 34 26 42 22 L38 4 L48 18 L52 18 L62 4 L58 22 C66 26 70 36 68 50 L70 90 Z" fill="url(#fr4-k)" stroke="url(#fr4-gold)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M42 40 L48 42 M58 40 L52 42" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
      <path d="M46 52 L50 66 L54 52" stroke="#64748b" strokeWidth="2" fill="none" />
      <path d="M30 74 L70 74 M32 82 L68 82" stroke="url(#fr4-gold)" strokeWidth="4" />
    </Sym>
  ),
  5: (
    <Sym id="fr5" defs={lin("fr5-e", ["#1e40af", "#1e3a8a"])}>
      <path d="M10 46 C30 22 70 22 90 46 C70 62 30 62 10 46 Z" fill="#fff7ed" stroke="url(#fr5-gold)" strokeWidth="4" />
      <circle cx="50" cy="44" r="12" fill="url(#fr5-e)" />
      <circle cx="50" cy="44" r="5" fill="#020617" />
      <path d="M10 46 C24 40 30 30 50 28 C70 30 82 34 92 30" stroke="url(#fr5-gold)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M40 58 L36 86 M36 86 C30 92 24 86 28 80" stroke="url(#fr5-gold)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M58 58 C62 70 72 74 80 70" stroke="url(#fr5-gold)" strokeWidth="5" fill="none" strokeLinecap="round" />
    </Sym>
  ),
  6: <Badge id="fr6" colors={["#fde68a", "#d97706", "#78350f"]} shape="shield" glyph={<><ellipse cx="50" cy="34" rx="9" ry="11" /><path d="M50 45 L50 76 M36 50 L64 50" /></>} />,
  7: <Badge id="fr7" colors={["#fef3c7", "#ca8a04", "#713f12"]} glyph={<path d="M50 26 L72 68 L28 68 Z M40 50 L60 50 M35 59 L65 59" />} />,
  8: <Badge id="fr8" colors={["#bae6fd", "#0284c7", "#0c4a6e"]} shape="circle" glyph={<path d="M50 70 C40 60 34 50 38 36 C44 44 48 50 50 58 C52 50 56 44 62 36 C66 50 60 60 50 70 Z M50 70 C42 70 32 66 28 56 M50 70 C58 70 68 66 72 56" />} />,
  9: <Badge id="fr9" colors={["#d9f99d", "#4d7c0f", "#1a2e05"]} shape="diamond" glyph={<path d="M36 32 L64 32 L64 68 L36 68 Z M42 42 L58 42 M42 50 L58 50 M42 58 L52 58" />} />,
};
