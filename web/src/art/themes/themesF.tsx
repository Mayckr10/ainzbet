/** Ninho do Dragão de Gelo · Templo Inca · Safari Noturno · Doces Cósmicos · Lendário Minotauro */
import type { ReactNode } from "react";
import { Badge, lin, Medallion, rad, Ribbon, Sym } from "./kit";

/* =========================================================== DRAGÃO DE GELO */
const dragonHead = (id: string, a: string, b: string, c: string, eye: string) => (
  <g>
    <defs>{lin(`${id}-d`, [a, b, c])}</defs>
    <path d="M18 66 C14 40 30 20 52 18 C72 16 86 30 84 46 L74 50 L84 58 C78 70 60 76 44 72 L36 82 L30 70 Z" fill={`url(#${id}-d)`} stroke={c} strokeWidth="2" />
    <path d="M40 22 L32 4 L50 18 M58 18 L66 2 L70 22" fill={`url(#${id}-d)`} stroke={c} strokeWidth="2" />
    <circle cx="58" cy="38" r="5" fill={eye} />
    <path d="M58 34 L58 42" stroke="#111" strokeWidth="2" />
    <path d="M70 58 L74 64 M64 60 L66 66" stroke="#fff" strokeWidth="2.5" />
    <path d="M24 50 C30 44 36 46 40 52" stroke={c} strokeWidth="2" fill="none" />
  </g>
);
export const GELO: Record<number, ReactNode> = {
  0: <Sym id="ge0">{dragonHead("ge0", "#e0f2fe", "#a855f7", "#4c1d95", "#fde047")}<Ribbon id="ge0" text="WILD" colors={["#e9d5ff", "#6d28d9"]} ink="#fff" /></Sym>,
  1: (
    <Sym id="ge1" defs={<>{lin("ge1-a", ["#fecaca", "#ef4444", "#7f1d1d"], false)}{lin("ge1-b", ["#e0f2fe", "#38bdf8", "#0c4a6e"], false)}</>}>
      <path d="M50 10 C70 10 80 34 80 50 C80 68 66 76 50 76 Z" fill="url(#ge1-b)" stroke="#e0f2fe" strokeWidth="2" />
      <path d="M50 10 C30 10 20 34 20 50 C20 68 34 76 50 76 Z" fill="url(#ge1-a)" stroke="#fecaca" strokeWidth="2" />
      <path d="M36 30 L42 36 L36 42 M64 28 L58 36 L66 40" stroke="#fff" strokeWidth="2.5" fill="none" />
      <Ribbon id="ge1" text="FREE" colors={["#e9d5ff", "#6d28d9"]} ink="#fff" />
    </Sym>
  ),
  2: <Medallion id="ge2" bg={["#fed7aa", "#ea580c", "#450a0a"]}>{dragonHead("ge2d", "#fde68a", "#ef4444", "#7f1d1d", "#fde047")}<path d="M84 50 C90 46 96 50 98 44 M84 54 C92 56 96 62 100 58" stroke="#f97316" strokeWidth="4" fill="none" /></Medallion>,
  3: <Medallion id="ge3" bg={["#e0f2fe", "#38bdf8", "#082f49"]}>{dragonHead("ge3d", "#ffffff", "#7dd3fc", "#0c4a6e", "#a5f3fc")}{[[88, 44], [94, 54], [90, 62]].map(([x, y]) => <path key={x} d={`M${x} ${y - 4} L${x} ${y + 4} M${x - 4} ${y} L${x + 4} ${y}`} stroke="#e0f2fe" strokeWidth="2" />)}</Medallion>,
  4: (
    <Medallion id="ge4" bg={["#e2e8f0", "#64748b", "#0f172a"]}>
      <path d="M20 100 L26 72 C36 62 64 62 74 72 L80 100 Z" fill="#475569" />
      <path d="M30 56 C26 26 74 26 70 56 L70 66 L30 66 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="2" />
      <path d="M36 46 L64 46 L64 52 L36 52 Z" fill="#0f172a" />
      <path d="M50 24 L50 66" stroke="#1e293b" strokeWidth="2" />
      <path d="M50 22 C44 12 56 6 52 16" stroke="#dc2626" strokeWidth="4" fill="none" />
    </Medallion>
  ),
  5: (
    <Medallion id="ge5" bg={["#ede9fe", "#8b5cf6", "#2e1065"]}>
      <path d="M20 96 L20 50 L28 40 L36 50 L36 60 L46 60 L46 34 L54 20 L62 34 L62 60 L70 60 L70 46 L78 36 L86 46 L86 96 Z" fill="#c4b5fd" stroke="#4c1d95" strokeWidth="2" />
      <path d="M46 96 L46 78 C46 70 56 70 56 78 L56 96 Z" fill="#2e1065" />
      <path d="M54 20 L54 8 L62 12 L54 14" fill="#dc2626" stroke="#4c1d95" />
    </Medallion>
  ),
  6: <Badge id="ge6" colors={["#e2e8f0", "#94a3b8", "#1e293b"]} shape="shield" glyph={<path d="M50 24 L50 66 M40 60 L60 60 M50 66 L50 76" />} />,
  7: <Badge id="ge7" colors={["#ddd6fe", "#7c3aed", "#2e1065"]} shape="shield" glyph={<path d="M50 28 C40 34 34 34 30 32 C30 54 40 68 50 74 C60 68 70 54 70 32 C66 34 60 34 50 28 Z" />} />,
  8: <Badge id="ge8" colors={["#fed7aa", "#f97316", "#7c2d12"]} shape="circle" glyph={<path d="M46 74 L46 50 L54 50 L54 74 M50 50 C40 40 46 30 50 24 C52 32 60 38 50 50" />} />,
  9: <Badge id="ge9" colors={["#cffafe", "#22d3ee", "#164e63"]} shape="diamond" glyph={<path d="M50 26 L64 44 L50 74 L36 44 Z M36 44 L64 44" />} />,
};

/* =========================================================== TEMPLO INCA */
const sunDisc = (id: string, label: string, colors: string[], ink: string) => (
  <Sym id={id} defs={rad(`${id}-s`, ["#fff7d6", "#facc15", "#a16207"])}>
    {Array.from({ length: 16 }).map((_, i) => <path key={i} d="M50 40 L46 8 L54 8 Z" fill="#f59e0b" transform={`rotate(${i * 22.5} 50 40)`} />)}
    <circle cx="50" cy="40" r="22" fill={`url(#${id}-s)`} stroke="#713f12" strokeWidth="2.5" />
    <circle cx="43" cy="36" r="3" fill="#713f12" />
    <circle cx="57" cy="36" r="3" fill="#713f12" />
    <path d="M42 48 C46 52 54 52 58 48 M50 38 L50 44" stroke="#713f12" strokeWidth="2.5" fill="none" />
    <Ribbon id={id} text={label} colors={colors} ink={ink} />
  </Sym>
);
export const INCA: Record<number, ReactNode> = {
  0: sunDisc("in0", "WILD", ["#bbf7d0", "#047857"], "#fef9c3"),
  1: sunDisc("in1", "FREE", ["#fde68a", "#b45309"], "#3b1d00"),
  2: (
    <Medallion id="in2" bg={["#fef3c7", "#d97706", "#451a03"]}>
      <path d="M20 100 L26 72 C36 62 64 62 74 72 L80 100 Z" fill="#b91c1c" />
      <path d="M26 74 L74 74" stroke="#facc15" strokeWidth="4" />
      <ellipse cx="50" cy="50" rx="15" ry="17" fill="#b45309" />
      <path d="M42 48 L47 48 M53 48 L58 48" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M45 58 L55 58" stroke="#451a03" strokeWidth="2" />
      <path d="M28 34 L72 34 L66 26 L34 26 Z" fill="url(#in2-gold)" />
      {[34, 42, 50, 58, 66].map((x) => <path key={x} d={`M${x} 26 L${x - 3} 10 L${x + 3} 10 Z`} fill={x === 50 ? "#dc2626" : "#16a34a"} />)}
      <circle cx="34" cy="56" r="4" fill="url(#in2-gold)" />
      <circle cx="66" cy="56" r="4" fill="url(#in2-gold)" />
    </Medallion>
  ),
  3: (
    <Medallion id="in3" bg={["#e0f2fe", "#7dd3fc", "#0c4a6e"]}>
      <path d="M6 46 C24 30 40 36 50 46 C60 36 76 30 94 46 C80 46 70 52 62 60 L38 60 C30 52 20 46 6 46 Z" fill="#1c1917" />
      <path d="M38 60 L50 78 L62 60 Z" fill="#292524" />
      <circle cx="50" cy="40" r="9" fill="#f5f5f4" />
      <path d="M50 34 C54 30 58 30 60 34" fill="#dc2626" />
      <path d="M56 40 L64 44 L56 46 Z" fill="#fbbf24" />
      <circle cx="52" cy="38" r="1.6" fill="#111" />
    </Medallion>
  ),
  4: (
    <Medallion id="in4" bg={["#fce7f3", "#f9a8d4", "#831843"]}>
      <path d="M30 96 L32 56 C32 46 40 44 44 48 L46 30 C46 22 40 18 42 12 L48 18 L52 12 L54 20 C62 22 64 32 60 40 L58 56 C66 60 70 70 70 96 Z" fill="#fef3c7" stroke="#a8a29e" strokeWidth="1.5" />
      <circle cx="52" cy="28" r="2.4" fill="#111" />
      <path d="M56 36 L60 38" stroke="#111" strokeWidth="1.5" />
      <path d="M34 66 L66 66 L64 78 L36 78 Z" fill="#dc2626" />
      <path d="M36 70 L64 70 M36 74 L64 74" stroke="#facc15" strokeWidth="1.5" />
    </Medallion>
  ),
  5: (
    <Medallion id="in5" bg={["#fef9c3", "#ca8a04", "#422006"]}>
      <path d="M22 36 L30 22 L36 34 M78 36 L70 22 L64 34" fill="#a16207" stroke="#422006" strokeWidth="2" />
      <ellipse cx="50" cy="52" rx="28" ry="26" fill="#ca8a04" />
      <ellipse cx="50" cy="66" rx="14" ry="10" fill="#fef3c7" />
      <path d="M38 46 L46 48 L38 50 Z M62 46 L54 48 L62 50 Z" fill="#16a34a" stroke="#111" />
      <path d="M46 60 L54 60 L50 64 Z" fill="#111" />
      {[[30, 40], [70, 40], [28, 56], [72, 56]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="3" fill="#422006" />)}
    </Medallion>
  ),
  6: <Badge id="in6" colors={["#fde68a", "#d97706", "#451a03"]} shape="shield" glyph={<path d="M34 30 L66 30 L66 60 L50 72 L34 60 Z M42 42 L46 42 M54 42 L58 42 M42 56 L58 56" />} />,
  7: <Badge id="in7" colors={["#fecaca", "#dc2626", "#450a0a"]} shape="circle" glyph={<path d="M32 30 L68 30 M38 30 L38 66 M50 30 L50 72 M62 30 L62 60 M38 50 L42 50 M50 56 L54 56 M62 44 L66 44" />} />,
  8: <Badge id="in8" colors={["#fef9c3", "#eab308", "#713f12"]} shape="hex" glyph={<path d="M50 74 L50 28 M50 28 C38 36 38 64 50 74 C62 64 62 36 50 28 M44 40 L56 40 M43 50 L57 50 M44 60 L56 60" />} />,
  9: <Badge id="in9" colors={["#e7e5e4", "#78716c", "#1c1917"]} shape="diamond" glyph={<path d="M34 50 L50 34 L66 50 L50 66 Z M42 50 L50 42 L58 50 L50 58 Z" />} />,
};

/* =========================================================== SAFARI NOTURNO */
export const SAFARI: Record<number, ReactNode> = {
  0: (
    <Sym id="sf0" defs={rad("sf0-e", ["#fef9c3", "#facc15", "#a16207"], "50%", "50%")}>
      <rect x="10" y="12" width="80" height="54" rx="14" fill="#020617" stroke="url(#sf0-gold)" strokeWidth="3" />
      {[30, 70].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="40" rx="14" ry="10" fill="url(#sf0-e)" />
          <ellipse cx={x} cy="40" rx="3" ry="9" fill="#111" />
          <circle cx={x - 4} cy="36" r="2.4" fill="#fff" />
        </g>
      ))}
      <Ribbon id="sf0" text="WILD" colors={["#fde68a", "#a16207"]} ink="#1c1917" />
    </Sym>
  ),
  1: (
    <Sym id="sf1" defs={rad("sf1-m", ["#ffffff", "#fef3c7", "#fbbf24"])}>
      <circle cx="50" cy="40" r="32" fill="#0c0a1d" stroke="url(#sf1-gold)" strokeWidth="3" />
      <circle cx="50" cy="34" r="16" fill="url(#sf1-m)" />
      <path d="M18 64 L18 52 C30 48 34 56 40 52 L46 44 L52 52 C60 48 70 54 82 50 L82 64 Z" fill="#000" />
      <path d="M62 52 C60 40 64 34 72 32 C66 36 68 42 70 48" stroke="#000" strokeWidth="3" fill="none" />
      <Ribbon id="sf1" text="FREE" colors={["#fde68a", "#a16207"]} ink="#1c1917" />
    </Sym>
  ),
  2: (
    <Medallion id="sf2" bg={["#fef3c7", "#ca8a04", "#1c1917"]}>
      <path d="M24 30 L34 18 L40 30 M76 30 L66 18 L60 30" fill="#ca8a04" />
      <ellipse cx="50" cy="52" rx="28" ry="28" fill="#eab308" />
      {[[34, 42], [66, 42], [30, 58], [70, 58], [42, 32], [58, 32], [38, 70], [62, 70]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="4" fill="none" stroke="#1c1917" strokeWidth="2.5" />)}
      <ellipse cx="50" cy="64" rx="12" ry="9" fill="#fef3c7" />
      <ellipse cx="42" cy="48" rx="4" ry="5" fill="#a3e635" />
      <ellipse cx="58" cy="48" rx="4" ry="5" fill="#a3e635" />
      <path d="M46 58 L54 58 L50 62 Z" fill="#7c2d12" />
    </Medallion>
  ),
  3: (
    <Medallion id="sf3" bg={["#e0e7ff", "#6366f1", "#1e1b4b"]}>
      <ellipse cx="50" cy="66" rx="34" ry="26" fill="#7c6f8a" />
      <ellipse cx="50" cy="44" rx="24" ry="20" fill="#8b7d99" />
      <circle cx="36" cy="28" r="6" fill="#8b7d99" />
      <circle cx="64" cy="28" r="6" fill="#8b7d99" />
      <circle cx="40" cy="38" r="3" fill="#111" />
      <circle cx="60" cy="38" r="3" fill="#111" />
      <ellipse cx="42" cy="56" rx="4" ry="3" fill="#4c4459" />
      <ellipse cx="58" cy="56" rx="4" ry="3" fill="#4c4459" />
      <path d="M20 80 Q50 74 80 80 L80 100 L20 100 Z" fill="#1e3a8a" opacity=".8" />
    </Medallion>
  ),
  4: (
    <Medallion id="sf4" bg={["#fef3c7", "#a16207", "#1c1917"]}>
      <path d="M26 30 L36 16 L42 34 M74 30 L64 16 L58 34" fill="#78716c" stroke="#1c1917" strokeWidth="2" />
      <path d="M28 42 C28 24 72 24 72 42 L66 70 C60 78 40 78 34 70 Z" fill="#a8a29e" />
      {[[36, 40], [62, 38], [44, 32], [58, 50]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="3" fill="#44403c" />)}
      <path d="M40 46 L46 48 M60 46 L54 48" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 62 C46 70 54 70 60 62" stroke="#1c1917" strokeWidth="3" fill="#fff" />
      <path d="M44 64 L46 68 M50 66 L50 70 M56 64 L54 68" stroke="#1c1917" strokeWidth="1.5" />
    </Medallion>
  ),
  5: (
    <Medallion id="sf5" bg={["#ecfccb", "#65a30d", "#1a2e05"]}>
      <path d="M50 96 L50 70" stroke="#422006" strokeWidth="6" />
      <path d="M20 70 L80 70" stroke="#422006" strokeWidth="5" />
      <ellipse cx="50" cy="48" rx="20" ry="24" fill="#a16207" />
      <circle cx="42" cy="42" r="8" fill="#fef3c7" stroke="#facc15" strokeWidth="2" />
      <circle cx="58" cy="42" r="8" fill="#fef3c7" stroke="#facc15" strokeWidth="2" />
      <circle cx="42" cy="42" r="3.5" fill="#111" />
      <circle cx="58" cy="42" r="3.5" fill="#111" />
      <path d="M47 52 L50 58 L53 52 Z" fill="#f59e0b" />
      <path d="M34 26 L40 34 M66 26 L60 34" stroke="#a16207" strokeWidth="5" strokeLinecap="round" />
    </Medallion>
  ),
  6: <Badge id="sf6" colors={["#fde68a", "#a16207", "#1c1917"]} shape="shield" glyph={<><ellipse cx="50" cy="60" rx="10" ry="12" /><circle cx="36" cy="40" r="5" /><circle cx="50" cy="34" r="5" /><circle cx="64" cy="40" r="5" /></>} />,
  7: <Badge id="sf7" colors={["#d9f99d", "#4d7c0f", "#1a2e05"]} shape="hex" glyph={<path d="M26 60 L30 46 L40 40 L62 40 L70 46 L74 60 Z M34 60 C34 68 42 68 42 60 M58 60 C58 68 66 68 66 60" />} />,
  8: <Badge id="sf8" colors={["#fef3c7", "#f59e0b", "#451a03"]} shape="circle" glyph={<path d="M40 70 L60 70 M42 70 L42 48 L58 48 L58 70 M38 48 L62 48 M46 48 L46 38 L54 38 L54 48 M50 38 L50 30" />} />,
  9: <Badge id="sf9" colors={["#bbf7d0", "#15803d", "#052e16"]} shape="diamond" glyph={<path d="M50 28 C66 38 66 62 50 72 C34 62 34 38 50 28 M50 30 L50 72 M50 44 L58 38 M50 54 L42 48" />} />,
};

/* =========================================================== DOCES CÓSMICOS */
const candy = (id: string, body: ReactNode, defs?: ReactNode) => <Sym id={id} defs={defs}>{body}</Sym>;
export const DOCES: Record<number, ReactNode> = {
  0: (
    <Sym id="dc0" defs={rad("dc0-v", ["#ffffff", "#bae6fd", "#0284c7"], "40%", "35%")}>
      <circle cx="50" cy="42" r="30" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />
      <ellipse cx="50" cy="42" rx="22" ry="18" fill="url(#dc0-v)" />
      <ellipse cx="42" cy="36" rx="6" ry="4" fill="#fff" opacity=".8" />
      <circle cx="78" cy="22" r="6" fill="#f472b6" />
      <path d="M72 24 L64 30" stroke="#cbd5e1" strokeWidth="3" />
      <Ribbon id="dc0" text="WILD" colors={["#fbcfe8", "#db2777"]} ink="#fff" />
    </Sym>
  ),
  1: (
    <Sym id="dc1" defs={rad("dc1-p", ["#fce7f3", "#f472b6", "#9d174d"], "40%", "35%")}>
      <ellipse cx="50" cy="40" rx="42" ry="10" fill="none" stroke="#fde047" strokeWidth="4" transform="rotate(-12 50 40)" />
      <circle cx="50" cy="40" r="24" fill="url(#dc1-p)" />
      <path d="M28 34 C36 30 44 38 50 32 C56 26 66 32 72 30" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
      {[[40, 44], [56, 48], [48, 52]].map(([x, y]) => <rect key={x} x={x} y={y} width="5" height="2" rx="1" fill={["#22d3ee", "#facc15", "#a3e635"][x % 3]} transform={`rotate(${x} ${x} ${y})`} />)}
      <Ribbon id="dc1" text="FREE" colors={["#fbcfe8", "#db2777"]} ink="#fff" />
    </Sym>
  ),
  2: candy(
    "dc2",
    <>
      <path d="M48 52 L52 52 L52 94 L48 94 Z" fill="#f8fafc" />
      <circle cx="50" cy="36" r="28" fill="#f472b6" />
      {[22, 16, 10, 4].map((r, i) => <circle key={r} cx={50 + (i % 2 ? 2 : -2)} cy="36" r={r} stroke={i % 2 ? "#fff" : "#a855f7"} strokeWidth="4" fill="none" />)}
      <ellipse cx="40" cy="24" rx="7" ry="4" fill="#fff" opacity=".6" transform="rotate(-30 40 24)" />
    </>,
  ),
  3: candy(
    "dc3",
    <>
      <circle cx="50" cy="50" r="36" fill="#d97706" />
      <path d="M14 50 C14 28 86 28 86 50 C86 44 78 42 72 46 C66 40 58 46 50 42 C42 46 34 40 28 46 C22 42 14 44 14 50 Z" fill="#f9a8d4" />
      <circle cx="50" cy="50" r="12" fill="#1e1b4b" />
      {[[30, 40], [44, 34], [62, 36], [72, 44]].map(([x, y], i) => <rect key={i} x={x} y={y} width="6" height="2.4" rx="1.2" fill={["#22d3ee", "#fde047", "#a3e635", "#fff"][i]} transform={`rotate(${i * 40} ${x} ${y})`} />)}
    </>,
  ),
  4: candy(
    "dc4",
    <>
      <path d="M26 56 L74 56 L66 92 L34 92 Z" fill="#a855f7" />
      {[34, 44, 54, 64].map((x) => <path key={x} d={`M${x} 56 L${x + 2} 92`} stroke="#7e22ce" strokeWidth="2" />)}
      <path d="M22 58 C16 38 36 22 50 26 C64 22 84 38 78 58 Z" fill="#fde68a" />
      <path d="M30 46 C40 40 60 40 70 46" stroke="#f472b6" strokeWidth="4" fill="none" />
      <circle cx="50" cy="18" r="8" fill="#ef4444" />
    </>,
  ),
  5: candy(
    "dc5",
    <>
      <path d="M36 52 L50 96 L64 52 Z" fill="#d97706" />
      <path d="M38 58 L62 58 M42 70 L58 70 M46 82 L54 82" stroke="#92400e" strokeWidth="2" />
      <circle cx="50" cy="40" r="18" fill="#a5f3fc" />
      <circle cx="40" cy="26" r="14" fill="#f9a8d4" />
      <circle cx="60" cy="24" r="12" fill="#bef264" />
    </>,
  ),
  6: <Badge id="dc6" colors={["#fbcfe8", "#ec4899", "#831843"]} shape="circle" glyph={<path d="M26 50 L36 40 L36 60 Z M74 50 L64 40 L64 60 Z M36 50 C36 36 64 36 64 50 C64 64 36 64 36 50" />} />,
  7: <Badge id="dc7" colors={["#bbf7d0", "#22c55e", "#14532d"]} shape="hex" glyph={<path d="M36 64 C30 48 40 32 50 32 C60 32 70 48 64 64 C58 70 42 70 36 64 Z" />} />,
  8: <Badge id="dc8" colors={["#bae6fd", "#0ea5e9", "#0c4a6e"]} shape="shield" glyph={<><circle cx="50" cy="48" r="16" /><path d="M42 44 C44 40 48 40 50 44" /></>} />,
  9: <Badge id="dc9" colors={["#fde68a", "#d97706", "#451a03"]} shape="diamond" glyph={<><circle cx="50" cy="50" r="16" /><circle cx="44" cy="46" r="2" /><circle cx="56" cy="52" r="2" /><circle cx="48" cy="58" r="2" /></>} />,
  10: (
    <Sym id="dc10" defs={rad("dc10-b", ["#fff1f2", "#fb7185", "#9f1239"], "40%", "35%")}>
      <circle cx="50" cy="54" r="32" fill="url(#dc10-b)" stroke="#fff" strokeWidth="3" />
      <path d="M50 22 L50 12 M50 12 C56 6 62 10 64 4" stroke="#fde047" strokeWidth="3.5" fill="none" />
      <circle cx="64" cy="4" r="4" fill="#fde047" />
      <ellipse cx="38" cy="40" rx="9" ry="5" fill="#fff" opacity=".6" transform="rotate(-30 38 40)" />
    </Sym>
  ),
};

/* =========================================================== LENDÁRIO MINOTAURO */
export const MINOTAURO: Record<number, ReactNode> = {
  0: (
    <Sym id="mn0" defs={rad("mn0-f", ["#d6d3d1", "#78350f", "#1c1917"], "50%", "40%")}>
      <path d="M26 30 C12 26 6 14 12 6 C18 18 26 20 34 22 Z M74 30 C88 26 94 14 88 6 C82 18 74 20 66 22 Z" fill="#f5f5f4" stroke="#57534e" strokeWidth="2" />
      <path d="M28 30 C28 18 72 18 72 30 L70 56 C66 70 34 70 30 56 Z" fill="url(#mn0-f)" />
      <path d="M38 38 L46 42 M62 38 L54 42" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx="50" cy="58" rx="12" ry="8" fill="#a8a29e" />
      <circle cx="45" cy="58" r="2" fill="#1c1917" />
      <circle cx="55" cy="58" r="2" fill="#1c1917" />
      <circle cx="50" cy="66" r="4" fill="none" stroke="url(#mn0-gold)" strokeWidth="2.5" />
      <Ribbon id="mn0" text="WILD" colors={["#fecaca", "#7f1d1d"]} ink="#fff" />
    </Sym>
  ),
  1: (
    <Sym id="mn1" defs={lin("mn1-s", ["#e7e5e4", "#a8a29e"])}>
      <rect x="14" y="8" width="72" height="62" rx="6" fill="#292524" stroke="url(#mn1-gold)" strokeWidth="3" />
      <path d="M22 16 L78 16 L78 62 L30 62 L30 24 L70 24 L70 54 L38 54 L38 32 L62 32 L62 46 L46 46" stroke="url(#mn1-s)" strokeWidth="5" fill="none" />
      <circle cx="52" cy="40" r="4" fill="#facc15" />
      <Ribbon id="mn1" text="FREE" colors={["#fde68a", "#92400e"]} ink="#3b1d00" />
    </Sym>
  ),
  2: (
    <Medallion id="mn2" bg={["#fef3c7", "#d97706", "#451a03"]}>
      <path d="M20 100 L26 72 C36 62 64 62 74 72 L80 100 Z" fill="#b91c1c" />
      <ellipse cx="50" cy="52" rx="15" ry="17" fill="#e0a96d" />
      <path d="M42 50 L47 50 M53 50 L58 50" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 46 C30 22 70 22 68 46 L64 40 L36 40 Z" fill="url(#mn2-gold)" />
      <path d="M36 26 C40 10 60 10 64 26" fill="#dc2626" />
      <path d="M40 64 C44 70 56 70 60 64" stroke="#78350f" strokeWidth="4" fill="none" />
    </Medallion>
  ),
  3: (
    <Medallion id="mn3" bg={["#f5f3ff", "#a78bfa", "#2e1065"]}>
      <path d="M22 100 L28 72 C38 62 62 62 72 72 L78 100 Z" fill="#f8fafc" />
      <path d="M30 58 C26 30 34 22 50 22 C66 22 74 30 70 58 C64 50 60 46 50 46 C40 46 36 50 30 58 Z" fill="#78350f" />
      <ellipse cx="50" cy="50" rx="13" ry="15" fill="#fde7c7" />
      <path d="M44 48 L47 48 M53 48 L56 48" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M46 58 C48 59 52 59 54 58" stroke="#be123c" strokeWidth="2" fill="none" />
      <path d="M30 34 C40 28 60 28 70 34" stroke="url(#mn3-gold)" strokeWidth="3" fill="none" />
      <circle cx="74" cy="76" r="8" fill="#dc2626" />
      <path d="M68 72 C72 70 76 74 80 72 M68 78 C72 76 76 80 80 78" stroke="#fecaca" strokeWidth="1.5" fill="none" />
    </Medallion>
  ),
  4: (
    <Sym id="mn4" defs={lin("mn4-b", ["#f1f5f9", "#94a3b8", "#475569"], false)}>
      <rect x="47" y="20" width="6" height="74" rx="3" fill="#78350f" />
      <path d="M50 22 C30 10 14 24 18 44 C26 38 38 38 50 42 Z M50 22 C70 10 86 24 82 44 C74 38 62 38 50 42 Z" fill="url(#mn4-b)" stroke="#334155" strokeWidth="2" />
      <circle cx="50" cy="20" r="5" fill="url(#mn4-gold)" />
    </Sym>
  ),
  5: (
    <Sym id="mn5" defs={lin("mn5-h", ["#fef3c7", "#d97706", "#78350f"])}>
      <path d="M22 70 L22 44 C22 18 78 18 78 44 L78 70 L62 70 L62 50 L38 50 L38 70 Z" fill="url(#mn5-h)" stroke="#451a03" strokeWidth="2" />
      <path d="M44 50 L44 80 L56 80 L56 50" fill="#1c1917" opacity=".7" />
      <path d="M26 20 C40 4 60 4 74 20 C64 16 36 16 26 20 Z" fill="#1d4ed8" />
      <path d="M22 18 C36 0 64 0 78 18" stroke="#3b82f6" strokeWidth="5" fill="none" />
    </Sym>
  ),
  6: <Badge id="mn6" colors={["#fecaca", "#dc2626", "#450a0a"]} shape="circle" glyph={<><circle cx="50" cy="50" r="18" /><path d="M36 42 C46 38 56 52 66 46 M34 54 C44 50 54 62 66 56" /></>} />,
  7: <Badge id="mn7" colors={["#fed7aa", "#ea580c", "#431407"]} shape="shield" glyph={<path d="M46 74 L46 48 L54 48 L54 74 M50 48 C40 38 46 28 50 22 C52 30 60 36 50 48" />} />,
  8: <Badge id="mn8" colors={["#f5f5f4", "#a8a29e", "#292524"]} shape="hex" glyph={<path d="M36 28 L64 28 M36 72 L64 72 M40 28 L40 72 M50 28 L50 72 M60 28 L60 72 M34 34 L66 34 M34 66 L66 66" />} />,
  9: <Badge id="mn9" colors={["#fef9c3", "#ca8a04", "#422006"]} shape="diamond" glyph={<><circle cx="50" cy="50" r="16" /><path d="M44 44 L56 56 M56 44 L44 56" /></>} />,
};
