/** Arte da Onda 3: Doceria, Megafortuna, Colmeia, Minas de Cristal, Hold & Win, Duplo Slot, Ankh dourado */
import type { ReactNode } from "react";
import { Badge, lin, Medallion, rad, Ribbon, Sym } from "./kit";

/* ----------------------------------------------------------------- balas de gelatina (Doceria) */
const jelly = (id: string, c: [string, string, string], d: string) => (
  <Sym id={id} defs={<>{rad(`${id}-j`, [c[0], c[1], c[2]], "38%", "30%")}</>}>
    <path d={d} fill={`url(#${id}-j)`} stroke="#fff" strokeOpacity=".7" strokeWidth="2.5" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={c[2]} strokeWidth="1" opacity=".5" transform="translate(50 50) scale(.86) translate(-50 -50)" />
    <ellipse cx="38" cy="32" rx="10" ry="6" fill="#fff" opacity=".75" transform="rotate(-25 38 32)" />
    <circle cx="62" cy="64" r="3" fill="#fff" opacity=".5" />
  </Sym>
);
export const DOCERIA: Record<number, ReactNode> = {
  0: <g />,
  1: (
    <Sym id="dr1" defs={rad("dr1-c", ["#fef3c7", "#fb7185", "#9f1239"], "40%", "35%")}>
      <rect x="47" y="48" width="6" height="44" rx="3" fill="#f8fafc" />
      <circle cx="50" cy="36" r="27" fill="url(#dr1-c)" stroke="#fff" strokeWidth="3" />
      {[20, 14, 8].map((r, i) => <circle key={r} cx="50" cy="36" r={r} fill="none" stroke={i % 2 ? "#fde047" : "#fff"} strokeWidth="3.5" strokeDasharray="10 6" />)}
      <Ribbon id="dr1" text="FREE" colors={["#fbcfe8", "#db2777"]} ink="#fff" y={72} />
    </Sym>
  ),
  2: jelly("dr2", ["#fecdd3", "#f43f5e", "#881337"], "M50 86 L16 52 C4 38 14 14 32 14 C42 14 48 22 50 28 C52 22 58 14 68 14 C86 14 96 38 84 52 Z"),
  3: jelly("dr3", ["#fef9c3", "#facc15", "#a16207"], "M50 8 L62 36 L92 38 L68 58 L76 90 L50 72 L24 90 L32 58 L8 38 L38 36 Z"),
  4: jelly("dr4", ["#e0e7ff", "#818cf8", "#3730a3"], "M60 10 C34 12 18 34 20 54 C22 78 44 92 66 88 C46 82 34 64 36 46 C38 28 48 16 60 10 Z"),
  5: jelly("dr5", ["#cffafe", "#22d3ee", "#155e75"], "M50 8 C66 30 80 46 80 62 C80 80 66 92 50 92 C34 92 20 80 20 62 C20 46 34 30 50 8 Z"),
  6: jelly("dr6", ["#fed7aa", "#fb923c", "#9a3412"], "M50 12 A38 38 0 1 1 49.9 12 Z M50 38 A12 12 0 1 0 50.1 38 Z"),
  7: jelly("dr7", ["#dcfce7", "#4ade80", "#166534"], "M20 30 L80 30 L80 70 L20 70 Z"),
  8: jelly("dr8", ["#f5d0fe", "#c084fc", "#6b21a8"], "M30 82 C14 70 16 30 34 22 C46 16 54 16 66 22 C84 30 86 70 70 82 C60 90 40 90 30 82 Z"),
  9: jelly("dr9", ["#fef3c7", "#d97706", "#78350f"], "M50 14 L80 30 L80 70 L50 86 L20 70 L20 30 Z"),
  10: (
    <Sym id="dr10" defs={rad("dr10-b", ["#fff1f2", "#fb7185", "#9f1239"], "40%", "35%")}>
      <circle cx="50" cy="54" r="32" fill="url(#dr10-b)" stroke="#fff" strokeWidth="3" />
      <path d="M50 22 L50 12 M50 12 C56 6 62 10 64 4" stroke="#fde047" strokeWidth="3.5" fill="none" />
      <circle cx="64" cy="4" r="4" fill="#fde047" />
      <ellipse cx="38" cy="40" rx="9" ry="5" fill="#fff" opacity=".6" transform="rotate(-30 38 40)" />
    </Sym>
  ),
};

/* ----------------------------------------------------------------- Megafortuna (tesouro real) */
export const MEGA: Record<number, ReactNode> = {
  0: (
    <Sym id="mg0" defs={lin("mg0-c", ["#fff7d6", "#facc15", "#a16207"])}>
      <path d="M14 66 L20 26 L36 46 L50 18 L64 46 L80 26 L86 66 Z" fill="url(#mg0-c)" stroke="#713f12" strokeWidth="2.5" strokeLinejoin="round" />
      {[[20, 26], [50, 18], [80, 26]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="5" fill="#dc2626" stroke="#fde68a" strokeWidth="1.5" />)}
      <rect x="14" y="58" width="72" height="8" fill="#a16207" />
      <circle cx="50" cy="52" r="5" fill="#2563eb" />
      <Ribbon id="mg0" text="WILD" colors={["#fde68a", "#7c2d12"]} ink="#fff7d6" />
    </Sym>
  ),
  1: (
    <Sym id="mg1" defs={<>{lin("mg1-w", ["#b45309", "#78350f"])}{rad("mg1-g", ["#fffbeb", "#facc15", "#a16207"])}</>}>
      <ellipse cx="50" cy="34" rx="30" ry="12" fill="url(#mg1-g)" />
      {[[34, 30], [50, 26], [64, 32], [44, 36], [58, 38]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill="#facc15" stroke="#a16207" />)}
      <path d="M16 38 L84 38 L80 70 L20 70 Z" fill="url(#mg1-w)" stroke="#fde68a" strokeWidth="2.5" />
      <rect x="44" y="44" width="12" height="14" rx="2" fill="#fde047" />
      <Ribbon id="mg1" text="FREE" colors={["#fde68a", "#7c2d12"]} ink="#fff7d6" />
    </Sym>
  ),
  2: (
    <Medallion id="mg2" bg={["#fecaca", "#b91c1c", "#450a0a"]}>
      <path d="M20 100 L26 72 C36 62 64 62 74 72 L80 100 Z" fill="#7f1d1d" />
      <path d="M26 72 L74 72" stroke="#f8fafc" strokeWidth="6" strokeDasharray="3 3" />
      <ellipse cx="50" cy="50" rx="15" ry="17" fill="#fcd9b6" />
      <path d="M34 54 C32 80 68 80 66 54 C60 64 40 64 34 54 Z" fill="#a8a29e" />
      <path d="M43 48 L47 48 M53 48 L57 48" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 34 L36 20 L44 30 L50 16 L56 30 L64 20 L68 34 Z" fill="url(#mg2-gold)" />
    </Medallion>
  ),
  3: (
    <Medallion id="mg3" bg={["#ede9fe", "#7c3aed", "#2e1065"]}>
      <path d="M20 100 L26 72 C36 62 64 62 74 72 L80 100 Z" fill="#5b21b6" />
      <path d="M30 60 C26 30 34 24 50 24 C66 24 74 30 70 60 C66 50 60 46 50 46 C40 46 34 50 30 60 Z" fill="#a16207" />
      <ellipse cx="50" cy="50" rx="13" ry="15" fill="#fde7c7" />
      <path d="M44 48 L47 48 M53 48 L56 48" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M46 57 C48 58 52 58 54 57" stroke="#be123c" strokeWidth="2" fill="none" />
      <path d="M36 30 L40 18 L46 26 L50 14 L54 26 L60 18 L64 30 Z" fill="url(#mg3-gold)" />
      <circle cx="50" cy="20" r="2.5" fill="#22d3ee" />
    </Medallion>
  ),
  4: (
    <Sym id="mg4" defs={lin("mg4-g", ["#fef3c7", "#facc15", "#a16207"])}>
      <path d="M26 14 L74 14 C74 46 62 56 50 58 C38 56 26 46 26 14 Z" fill="url(#mg4-g)" stroke="#713f12" strokeWidth="2" />
      <path d="M46 58 L46 76 L54 76 L54 58 M30 88 C32 78 68 78 70 88 Z" fill="url(#mg4-g)" stroke="#713f12" strokeWidth="2" />
      {[38, 50, 62].map((x) => <circle key={x} cx={x} cy="30" r="4" fill={x === 50 ? "#dc2626" : "#16a34a"} />)}
    </Sym>
  ),
  5: (
    <Sym id="mg5" defs={lin("mg5-g", ["#fef3c7", "#facc15", "#a16207"], false)}>
      <rect x="46" y="28" width="8" height="64" rx="3" fill="url(#mg5-g)" stroke="#713f12" strokeWidth="1.5" />
      <circle cx="50" cy="22" r="13" fill="#2563eb" stroke="url(#mg5-g)" strokeWidth="4" />
      <path d="M50 12 L50 32 M40 22 L60 22" stroke="#fff" strokeWidth="2" opacity=".6" />
      <rect x="40" y="44" width="20" height="5" rx="2" fill="url(#mg5-g)" />
    </Sym>
  ),
  6: <Badge id="mg6" colors={["#fecaca", "#dc2626", "#450a0a"]} shape="circle" glyph={<><circle cx="50" cy="56" r="16" /><path d="M42 40 L50 28 L58 40" /></>} />,
  7: <Badge id="mg7" colors={["#fef9c3", "#ca8a04", "#422006"]} shape="circle" glyph={<><circle cx="50" cy="50" r="18" /><path d="M44 42 L56 42 M50 36 L50 64 M44 58 L56 58" /></>} />,
  8: <Badge id="mg8" colors={["#fef3c7", "#d97706", "#451a03"]} shape="shield" glyph={<path d="M34 30 L66 30 C60 36 60 64 66 70 L34 70 C40 64 40 36 34 30 M42 44 L58 44 M42 54 L58 54" />} />,
  9: <Badge id="mg9" colors={["#e2e8f0", "#64748b", "#0f172a"]} shape="hex" glyph={<><circle cx="38" cy="38" r="10" /><path d="M46 46 L70 70 M60 60 L66 54 M66 66 L72 60" /></>} />,
};

/* ----------------------------------------------------------------- Colmeia Dourada */
const hex = (cx: number, cy: number, r: number) => {
  const p = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    return `${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r}`;
  });
  return `M${p.join(" L")} Z`;
};
export const COLMEIA: Record<number, ReactNode> = {
  0: <g />,
  1: (
    <Sym id="cm1" defs={rad("cm1-b", ["#fef9c3", "#facc15", "#a16207"], "45%", "35%")}>
      <path d={hex(50, 40, 34)} fill="#422006" stroke="url(#cm1-gold)" strokeWidth="3" />
      <ellipse cx="50" cy="46" rx="14" ry="18" fill="url(#cm1-b)" />
      {[40, 48, 56].map((y) => <path key={y} d={`M37 ${y} L63 ${y}`} stroke="#1c1917" strokeWidth="4" />)}
      <path d="M38 22 L42 30 L50 24 L58 30 L62 22 L58 34 L42 34 Z" fill="url(#cm1-gold)" />
      <ellipse cx="34" cy="38" rx="9" ry="6" fill="#e0f2fe" opacity=".8" />
      <ellipse cx="66" cy="38" rx="9" ry="6" fill="#e0f2fe" opacity=".8" />
      <Ribbon id="cm1" text="FREE" colors={["#fde68a", "#a16207"]} ink="#1c1917" />
    </Sym>
  ),
  2: (
    <Medallion id="cm2" bg={["#fef9c3", "#facc15", "#713f12"]}>
      <ellipse cx="34" cy="40" rx="16" ry="11" fill="#e0f2fe" opacity=".85" transform="rotate(-25 34 40)" />
      <ellipse cx="66" cy="40" rx="16" ry="11" fill="#e0f2fe" opacity=".85" transform="rotate(25 66 40)" />
      <ellipse cx="50" cy="60" rx="16" ry="22" fill="#facc15" stroke="#1c1917" strokeWidth="2" />
      {[52, 62, 72].map((y) => <path key={y} d={`M35 ${y} L65 ${y}`} stroke="#1c1917" strokeWidth="5" />)}
      <circle cx="50" cy="34" r="10" fill="#1c1917" />
      <circle cx="46" cy="32" r="2.4" fill="#fff" />
      <circle cx="54" cy="32" r="2.4" fill="#fff" />
      <path d="M42 22 L44 14 M58 22 L56 14" stroke="#1c1917" strokeWidth="2" />
      <path d="M40 18 L44 10 L50 16 L56 10 L60 18 Z" fill="url(#cm2-gold)" />
    </Medallion>
  ),
  3: (
    <Sym id="cm3" defs={rad("cm3-p", ["#fef3c7", "#d97706", "#78350f"], "40%", "30%")}>
      <path d="M28 30 C14 50 18 86 50 88 C82 86 86 50 72 30 Z" fill="url(#cm3-p)" stroke="#451a03" strokeWidth="2" />
      <rect x="26" y="20" width="48" height="12" rx="4" fill="#a16207" stroke="#451a03" strokeWidth="2" />
      <path d="M34 32 C34 44 40 48 40 56 C40 62 46 62 46 56 C46 48 52 44 52 32" fill="#facc15" />
      <text x="50" y="74" textAnchor="middle" fontFamily="Unbounded" fontWeight="900" fontSize="12" fill="#451a03">MEL</text>
    </Sym>
  ),
  4: (
    <Sym id="cm4" defs={rad("cm4-c", ["#fef9c3", "#facc15", "#ca8a04"], "50%", "50%")}>
      {Array.from({ length: 8 }).map((_, i) => <ellipse key={i} cx="50" cy="26" rx="10" ry="20" fill="#f472b6" stroke="#be185d" strokeWidth="1.5" transform={`rotate(${i * 45} 50 50)`} />)}
      <circle cx="50" cy="50" r="13" fill="url(#cm4-c)" stroke="#a16207" strokeWidth="2" />
    </Sym>
  ),
  5: (
    <Sym id="cm5" defs={lin("cm5-h", ["#fef08a", "#f59e0b", "#b45309"])}>
      {[[50, 30], [32, 41], [68, 41], [32, 61], [68, 61], [50, 72], [50, 51]].map(([x, y], i) => <path key={i} d={hex(x, y, 12)} fill={i === 6 ? "url(#cm5-h)" : "#fde68a"} stroke="#a16207" strokeWidth="2" />)}
    </Sym>
  ),
  6: <Badge id="cm6" colors={["#fef08a", "#f59e0b", "#78350f"]} shape="circle" glyph={<path d="M50 26 C58 40 66 48 66 58 C66 68 58 74 50 74 C42 74 34 68 34 58 C34 48 42 40 50 26 Z" />} />,
  7: <Badge id="cm7" colors={["#fef9c3", "#eab308", "#713f12"]} shape="hex" glyph={<><circle cx="42" cy="44" r="5" /><circle cx="58" cy="44" r="5" /><circle cx="50" cy="58" r="5" /><circle cx="38" cy="62" r="3" /><circle cx="64" cy="60" r="3" /></>} />,
  8: <Badge id="cm8" colors={["#bbf7d0", "#16a34a", "#14532d"]} shape="diamond" glyph={<path d="M30 70 C30 40 50 28 72 28 C72 50 60 70 30 70 Z M30 70 L58 42" />} />,
};

/* ----------------------------------------------------------------- Minas de Cristal */
const crystal = (id: string, c: [string, string, string], tall = 1) => (
  <Sym id={id} defs={lin(`${id}-c`, [c[0], c[1], c[2]], false)}>
    <path d={`M50 ${10 / tall} L70 ${30} L66 84 L34 84 L30 ${30} Z`} fill={`url(#${id}-c)`} stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinejoin="round" />
    <path d="M30 34 L20 46 L24 84 L34 84 Z M70 34 L80 46 L76 84 L66 84 Z" fill={c[2]} stroke="#fff" strokeOpacity=".5" strokeWidth="1.5" />
    <path d="M50 12 L50 84 M30 30 L70 30" stroke="#fff" strokeOpacity=".45" strokeWidth="1.5" />
    <path d="M38 40 L44 34" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8" />
    <rect x="16" y="82" width="68" height="8" rx="3" fill="#44403c" />
  </Sym>
);
export const CRISTAL: Record<number, ReactNode> = {
  0: <g />,
  1: (
    <Sym id="cr1" defs={rad("cr1-l", ["#fffbeb", "#fde047", "#f59e0b"], "50%", "55%")}>
      <path d="M36 16 L64 16 L60 24 L40 24 Z" fill="#44403c" />
      <path d="M50 6 L50 16" stroke="#44403c" strokeWidth="3" />
      <rect x="34" y="24" width="32" height="38" rx="6" fill="url(#cr1-l)" stroke="#44403c" strokeWidth="3" />
      <path d="M42 24 L42 62 M58 24 L58 62" stroke="#44403c" strokeWidth="2" />
      <path d="M32 62 L68 62 L64 70 L36 70 Z" fill="#44403c" />
      <Ribbon id="cr1" text="FREE" colors={["#fde68a", "#a16207"]} ink="#1c1917" />
    </Sym>
  ),
  2: crystal("cr2", ["#ffffff", "#bae6fd", "#0ea5e9"], 1.3),
  3: crystal("cr3", ["#fecdd3", "#e11d48", "#881337"]),
  4: crystal("cr4", ["#bbf7d0", "#10b981", "#064e3b"]),
  5: crystal("cr5", ["#f5d0fe", "#a855f7", "#4c1d95"]),
  6: (
    <Sym id="cr6" defs={rad("cr6-g", ["#fffbeb", "#facc15", "#a16207"], "40%", "35%")}>
      <path d="M22 60 C14 44 26 26 44 26 C54 18 74 22 78 38 C90 48 84 70 66 74 C54 82 32 78 22 60 Z" fill="url(#cr6-g)" stroke="#713f12" strokeWidth="2" />
      <ellipse cx="40" cy="40" rx="8" ry="5" fill="#fff" opacity=".7" />
    </Sym>
  ),
  7: <Badge id="cr7" colors={["#f1f5f9", "#94a3b8", "#334155"]} shape="hex" glyph={<path d="M34 64 L42 38 L58 34 L68 56 L52 70 Z" />} />,
  8: <Badge id="cr8" colors={["#a8a29e", "#44403c", "#0c0a09"]} shape="circle" glyph={<path d="M32 60 L40 38 L56 32 L70 50 L60 68 L40 70 Z" />} />,
};

/* ----------------------------------------------------------------- Hold & Win das Moedas */
export const MOEDAS: Record<number, ReactNode> = {
  0: (
    <Sym id="hw0" defs={lin("hw0-v", ["#e2e8f0", "#64748b", "#1e293b"])}>
      <rect x="14" y="10" width="72" height="60" rx="8" fill="url(#hw0-v)" stroke="url(#hw0-gold)" strokeWidth="3" />
      <circle cx="50" cy="40" r="18" fill="#cbd5e1" stroke="#1e293b" strokeWidth="3" />
      <path d="M50 26 L50 54 M36 40 L64 40 M40 30 L60 50 M60 30 L40 50" stroke="#1e293b" strokeWidth="2" />
      <Ribbon id="hw0" text="WILD" colors={["#fde68a", "#a16207"]} ink="#1c1917" />
    </Sym>
  ),
  1: <g />,
  2: (
    <Sym id="hw2" defs={lin("hw2-g", ["#fff7d6", "#facc15", "#a16207"])}>
      {[[14, 58], [42, 58], [28, 38]].map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y + 18} L${x + 8} ${y} L${x + 40} ${y} L${x + 48} ${y + 18} Z`} fill="url(#hw2-g)" stroke="#713f12" strokeWidth="2" />
          <path d={`M${x + 12} ${y + 6} L${x + 34} ${y + 6}`} stroke="#fff" strokeWidth="2" opacity=".7" />
        </g>
      ))}
    </Sym>
  ),
  3: (
    <Sym id="hw3" defs={rad("hw3-b", ["#ecfccb", "#65a30d", "#1a2e05"], "40%", "35%")}>
      <path d="M30 34 C18 50 18 86 50 88 C82 86 82 50 70 34 Z" fill="url(#hw3-b)" stroke="#14532d" strokeWidth="2.5" />
      <path d="M34 34 C40 24 60 24 66 34" stroke="#14532d" strokeWidth="5" fill="none" />
      <text x="50" y="70" textAnchor="middle" fontFamily="Unbounded" fontWeight="900" fontSize="26" fill="#fef9c3">$</text>
    </Sym>
  ),
  4: (
    <Sym id="hw4" defs={lin("hw4-n", ["#dcfce7", "#4ade80", "#166534"], false)}>
      {[0, 1, 2].map((i) => <rect key={i} x={14 + i * 4} y={24 + i * 8} width="66" height="36" rx="4" fill="url(#hw4-n)" stroke="#14532d" strokeWidth="2" />)}
      <circle cx="55" cy="58" r="10" fill="#bbf7d0" stroke="#14532d" strokeWidth="2" />
      <text x="55" y="63" textAnchor="middle" fontWeight="900" fontSize="12" fill="#14532d">$</text>
    </Sym>
  ),
  5: (
    <Medallion id="hw5" bg={["#fce7f3", "#f9a8d4", "#831843"]}>
      <ellipse cx="50" cy="56" rx="30" ry="24" fill="#f472b6" />
      <circle cx="74" cy="52" r="10" fill="#f9a8d4" />
      <circle cx="72" cy="50" r="2" fill="#831843" />
      <circle cx="78" cy="54" r="2" fill="#831843" />
      <path d="M30 36 L34 26 L42 34" fill="#f472b6" />
      <rect x="42" y="32" width="16" height="4" rx="2" fill="#831843" />
      <circle cx="40" cy="50" r="3" fill="#111" />
      <path d="M30 76 L30 86 M66 76 L66 86" stroke="#f472b6" strokeWidth="6" strokeLinecap="round" />
    </Medallion>
  ),
  6: <Badge id="hw6" colors={["#bbf7d0", "#16a34a", "#14532d"]} shape="circle" glyph={<path d="M60 34 C56 28 40 28 40 38 C40 48 60 46 60 58 C60 68 42 70 38 62 M50 24 L50 76" />} />,
  7: <Badge id="hw7" colors={["#fef3c7", "#d97706", "#451a03"]} shape="hex" glyph={<><circle cx="38" cy="40" r="10" /><path d="M46 48 L70 72 M60 62 L66 56" /></>} />,
  8: <Badge id="hw8" colors={["#fef9c3", "#eab308", "#713f12"]} shape="shield" glyph={<path d="M30 60 L38 40 L62 40 L70 60 Z M38 40 L42 32 L58 32 L62 40" />} />,
  9: <Badge id="hw9" colors={["#e2e8f0", "#94a3b8", "#334155"]} shape="diamond" glyph={<><circle cx="50" cy="50" r="16" /><circle cx="50" cy="50" r="8" /></>} />,
  10: (
    <Sym id="hw10" defs={rad("hw10-c", ["#fffbeb", "#facc15", "#b45309"], "38%", "32%")}>
      <circle cx="50" cy="50" r="40" fill="#92400e" />
      <circle cx="50" cy="47" r="40" fill="url(#hw10-c)" stroke="#fef3c7" strokeWidth="2" />
      <circle cx="50" cy="47" r="31" fill="none" stroke="#a16207" strokeWidth="2" strokeDasharray="3 3" />
    </Sym>
  ),
};

/* ----------------------------------------------------------------- Duplo Slot (gêmeos cósmicos) */
export const DUPLO: Record<number, ReactNode> = {
  0: (
    <Sym id="dp0" defs={<>{lin("dp0-m", ["#ffffff", "#c4b5fd", "#6366f1"], false)}</>}>
      <ellipse cx="50" cy="38" rx="26" ry="32" fill="url(#dp0-m)" stroke="url(#dp0-gold)" strokeWidth="4" />
      <path d="M40 22 L48 30 M38 34 L56 52" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8" />
      <Ribbon id="dp0" text="WILD" colors={["#e0e7ff", "#4338ca"]} ink="#fef9c3" />
    </Sym>
  ),
  1: (
    <Sym id="dp1" defs={rad("dp1-p", ["#ffffff", "#c084fc", "#4c1d95", "#0f0a24"])}>
      <circle cx="50" cy="40" r="32" fill="url(#dp1-p)" />
      {[24, 18, 12, 6].map((r, i) => <circle key={r} cx="50" cy="40" r={r} fill="none" stroke="#e9d5ff" strokeWidth="1.5" opacity={0.3 + i * 0.15} />)}
      <Ribbon id="dp1" text="FREE" colors={["#e0e7ff", "#4338ca"]} ink="#fef9c3" />
    </Sym>
  ),
  2: (
    <Medallion id="dp2" bg={["#e0e7ff", "#6366f1", "#1e1b4b"]}>
      {[36, 64].map((x, i) => (
        <g key={x}>
          <path d={`M${x - 14} 100 L${x - 12} 74 C${x - 8} 66 ${x + 8} 66 ${x + 12} 74 L${x + 14} 100 Z`} fill={i ? "#f472b6" : "#38bdf8"} />
          <circle cx={x} cy="52" r="11" fill="#fcd9b6" />
          <path d={`M${x - 11} 50 C${x - 12} 36 ${x + 12} 36 ${x + 11} 50`} fill={i ? "#a16207" : "#1c1917"} />
          <circle cx={x - 4} cy="54" r="1.6" fill="#111" />
          <circle cx={x + 4} cy="54" r="1.6" fill="#111" />
        </g>
      ))}
      <path d="M50 20 L52 26 L58 26 L53 30 L55 36 L50 32 L45 36 L47 30 L42 26 L48 26 Z" fill="url(#dp2-gold)" />
    </Medallion>
  ),
  3: (
    <Medallion id="dp3" bg={["#e0e7ff", "#312e81", "#020617"]}>
      <circle cx="40" cy="50" r="20" fill="#e0e7ff" />
      <circle cx="48" cy="44" r="18" fill="#312e81" />
      <circle cx="64" cy="58" r="14" fill="#fef9c3" />
      <circle cx="70" cy="54" r="12" fill="#312e81" />
    </Medallion>
  ),
  4: (
    <Medallion id="dp4" bg={["#fef9c3", "#f97316", "#7c2d12"]}>
      {[[38, 46, 14], [66, 60, 10]].map(([x, y, r], i) => (
        <g key={i}>
          {Array.from({ length: 10 }).map((_, k) => <path key={k} d={`M${x} ${y - r - 8} L${x - 3} ${y - r} L${x + 3} ${y - r} Z`} fill="#fde047" transform={`rotate(${k * 36} ${x} ${y})`} />)}
          <circle cx={x} cy={y} r={r} fill="#facc15" stroke="#ea580c" strokeWidth="2" />
        </g>
      ))}
    </Medallion>
  ),
  5: (
    <Sym id="dp5" defs={lin("dp5-t", ["rgba(125,211,252,0)", "#7dd3fc", "#ffffff"], false)}>
      <path d="M8 80 L70 34 L74 40 Z" fill="url(#dp5-t)" />
      <circle cx="72" cy="36" r="13" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="3" />
      <circle cx="68" cy="32" r="4" fill="#fff" />
    </Sym>
  ),
  6: <Badge id="dp6" colors={["#fed7aa", "#f97316", "#7c2d12"]} shape="circle" glyph={<><circle cx="50" cy="50" r="14" /><ellipse cx="50" cy="50" rx="26" ry="7" transform="rotate(-20 50 50)" /></>} />,
  7: <Badge id="dp7" colors={["#fef9c3", "#facc15", "#713f12"]} shape="hex" glyph={<path d="M50 26 L56 44 L74 46 L60 56 L64 74 L50 64 L36 74 L40 56 L26 46 L44 44 Z" />} />,
  8: <Badge id="dp8" colors={["#f5d0fe", "#c026d3", "#4a044e"]} shape="shield" glyph={<path d="M30 50 C30 30 70 30 70 50 C70 64 50 72 40 64 C34 58 40 48 50 50" />} />,
  9: <Badge id="dp9" colors={["#e7e5e4", "#78716c", "#1c1917"]} shape="diamond" glyph={<path d="M34 54 C30 40 42 30 54 32 C66 34 72 46 66 58 C60 68 40 68 34 54 Z M44 44 L48 46 M56 54 L58 58" />} />,
};

/* ----------------------------------------------------------------- Ankh dourado (Pirâmide) */
export const ANKH_GOLD: ReactNode = (
  <Sym id="ak10" defs={lin("ak10-g", ["#fffbeb", "#facc15", "#a16207"])}>
    <circle cx="50" cy="50" r="40" fill="#1e3a8a" stroke="url(#ak10-gold)" strokeWidth="4" />
    <path d="M50 22 C38 22 38 44 50 46 C62 44 62 22 50 22 Z M50 46 L50 82 M34 52 L66 52" stroke="url(#ak10-g)" strokeWidth="7" fill="none" strokeLinecap="round" />
  </Sym>
);

/* ----------------------------------------------------------------- Rolos Gigantes (Titãs da montanha) */
export const TITAS: Record<number, ReactNode> = {
  0: (
    <Sym id="tt0" defs={rad("tt0-f", ["#e7e5e4", "#78716c", "#292524"], "50%", "40%")}>
      <path d="M22 70 L26 30 C30 14 70 14 74 30 L78 70 Z" fill="url(#tt0-f)" stroke="#1c1917" strokeWidth="2" />
      <path d="M34 40 L46 44 M66 40 L54 44" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
      <path d="M40 58 L60 58" stroke="#1c1917" strokeWidth="3" />
      <path d="M30 26 L24 12 L38 22 M70 26 L76 12 L62 22" fill="#57534e" stroke="#1c1917" strokeWidth="1.5" />
      <path d="M40 30 L44 36 M58 28 L56 34 M48 62 L52 68" stroke="#f97316" strokeWidth="1.5" opacity=".8" />
      <Ribbon id="tt0" text="WILD" colors={["#fed7aa", "#c2410c"]} ink="#fff" />
    </Sym>
  ),
  1: (
    <Sym id="tt1" defs={lin("tt1-l", ["#fde047", "#f97316", "#b91c1c"])}>
      <path d="M10 72 L36 26 L46 32 L54 26 L64 32 L90 72 Z" fill="#44403c" stroke="#1c1917" strokeWidth="2" />
      <path d="M36 26 C40 14 60 14 64 32 L54 26 L46 32 Z" fill="url(#tt1-l)" />
      <path d="M50 22 C44 10 52 4 56 10 C60 2 70 8 64 16" fill="#9ca3af" opacity=".6" />
      <path d="M46 32 L42 52 M54 30 L58 46" stroke="url(#tt1-l)" strokeWidth="4" strokeLinecap="round" />
      <Ribbon id="tt1" text="FREE" colors={["#fed7aa", "#c2410c"]} ink="#fff" />
    </Sym>
  ),
  2: (
    <Medallion id="tt2" bg={["#d1fae5", "#10b981", "#022c22"]}>
      <ellipse cx="50" cy="56" rx="28" ry="30" fill="#a3a3a3" />
      <circle cx="50" cy="46" r="13" fill="#fff" stroke="#1c1917" strokeWidth="2" />
      <circle cx="50" cy="46" r="6" fill="#dc2626" />
      <circle cx="50" cy="46" r="2.5" fill="#111" />
      <path d="M38 68 C44 74 56 74 62 68" stroke="#1c1917" strokeWidth="3" fill="none" />
      <path d="M40 66 L42 72 M50 68 L50 74 M60 66 L58 72" stroke="#fff" strokeWidth="2" />
      <path d="M36 30 L32 18 M64 30 L68 18" stroke="#57534e" strokeWidth="5" strokeLinecap="round" />
    </Medallion>
  ),
  3: (
    <Medallion id="tt3" bg={["#e7e5e4", "#78716c", "#1c1917"]}>
      <path d="M24 96 L28 52 L40 40 L60 40 L72 52 L76 96 Z" fill="#57534e" stroke="#292524" strokeWidth="2" />
      <path d="M36 40 L36 24 L64 24 L64 40 Z" fill="#78716c" stroke="#292524" strokeWidth="2" />
      <path d="M42 32 L46 32 M54 32 L58 32" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 60 L44 70 M70 58 L60 74 M48 50 L52 60" stroke="#22d3ee" strokeWidth="1.5" opacity=".7" />
    </Medallion>
  ),
  4: (
    <Sym id="tt4" defs={lin("tt4-h", ["#e2e8f0", "#64748b", "#1e293b"])}>
      <rect x="46" y="38" width="8" height="54" rx="3" fill="#78350f" />
      <path d="M18 18 L82 18 L82 44 L18 44 Z" fill="url(#tt4-h)" stroke="#0f172a" strokeWidth="2.5" />
      <path d="M24 24 L76 24" stroke="#fff" strokeWidth="2" opacity=".5" />
      <path d="M44 28 L50 36 L56 28" stroke="#f97316" strokeWidth="2.5" fill="none" />
    </Sym>
  ),
  5: (
    <Medallion id="tt5" bg={["#e0f2fe", "#38bdf8", "#082f49"]}>
      <path d="M4 90 L36 36 L50 56 L64 30 L96 90 Z" fill="#475569" />
      <path d="M36 36 L44 50 L40 52 L32 46 Z M64 30 L72 44 L66 46 L58 40 Z" fill="#f8fafc" />
      <circle cx="78" cy="24" r="8" fill="#fde68a" />
    </Medallion>
  ),
  6: <Badge id="tt6" colors={["#e7e5e4", "#78716c", "#1c1917"]} shape="hex" glyph={<path d="M30 64 L38 38 L58 32 L70 50 L60 68 Z" />} />,
  7: <Badge id="tt7" colors={["#a5f3fc", "#0891b2", "#164e63"]} shape="diamond" glyph={<path d="M50 26 L64 44 L50 74 L36 44 Z M36 44 L64 44" />} />,
  8: <Badge id="tt8" colors={["#fed7aa", "#f97316", "#7c2d12"]} shape="shield" glyph={<path d="M46 74 L46 48 L54 48 L54 74 M50 48 C40 38 46 28 50 22 C52 30 60 36 50 48" />} />,
  9: <Badge id="tt9" colors={["#d1fae5", "#059669", "#022c22"]} shape="circle" glyph={<path d="M42 28 L42 72 M42 30 L58 44 L42 54 M42 54 L60 70" />} />,
};
