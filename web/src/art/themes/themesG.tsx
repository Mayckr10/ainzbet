/** Império Romano · Fazenda Feliz · Robôs Gigantes · Lenda do Kraken · Carnaval do Rio */
import type { ReactNode } from "react";
import { Badge, lin, Medallion, rad, Ribbon, Sym } from "./kit";

/* =========================================================== IMPÉRIO ROMANO */
export const ROMANO: Record<number, ReactNode> = {
  0: (
    <Sym id="rm0" defs={lin("rm0-h", ["#fef3c7", "#d97706", "#78350f"])}>
      <path d="M24 66 L24 38 C24 12 76 12 76 38 L76 66 L62 66 L62 46 L38 46 L38 66 Z" fill="url(#rm0-h)" stroke="#451a03" strokeWidth="2" />
      <path d="M44 46 L44 72 L56 72 L56 46" fill="#1c1917" opacity=".75" />
      <path d="M28 14 C40 -2 60 -2 72 14 C62 10 38 10 28 14 Z" fill="#dc2626" />
      {[34, 42, 50, 58, 66].map((x) => <path key={x} d={`M${x} 14 L${x} 4`} stroke="#b91c1c" strokeWidth="4" />)}
      <Ribbon id="rm0" text="WILD" colors={["#fecaca", "#991b1b"]} ink="#fde68a" />
    </Sym>
  ),
  1: (
    <Sym id="rm1" defs={lin("rm1-s", ["#fef3c7", "#e7c78f", "#a16207"])}>
      <ellipse cx="50" cy="44" rx="40" ry="26" fill="url(#rm1-s)" stroke="#78350f" strokeWidth="2" />
      <ellipse cx="50" cy="48" rx="26" ry="14" fill="#a16207" />
      {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={14 + i * 6} y={i % 2 ? 26 : 30} width="4" height="10" rx="2" fill="#78350f" opacity=".7" />)}
      <Ribbon id="rm1" text="FREE" colors={["#fecaca", "#991b1b"]} ink="#fde68a" />
    </Sym>
  ),
  2: (
    <Medallion id="rm2" bg={["#ede9fe", "#7c3aed", "#2e1065"]}>
      <path d="M20 100 L26 72 C36 62 64 62 74 72 L80 100 Z" fill="#6d28d9" />
      <path d="M26 72 L50 82 L74 72" stroke="#facc15" strokeWidth="3" fill="none" />
      <ellipse cx="50" cy="48" rx="15" ry="18" fill="#fcd9b6" />
      <path d="M43 46 L47 46 M53 46 L57 46" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M46 56 L54 56" stroke="#9a3412" strokeWidth="2" />
      {Array.from({ length: 9 }).map((_, i) => <ellipse key={i} cx={30 + i * 5} cy={30 - Math.sin((i / 8) * Math.PI) * 6} rx="4" ry="2.2" fill="#16a34a" transform={`rotate(${-40 + i * 10} ${30 + i * 5} ${30 - Math.sin((i / 8) * Math.PI) * 6})`} />)}
    </Medallion>
  ),
  3: (
    <Medallion id="rm3" bg={["#fef3c7", "#f59e0b", "#451a03"]}>
      {Array.from({ length: 14 }).map((_, i) => <path key={i} d="M50 50 L44 10 Q50 4 56 10 Z" fill="#92400e" transform={`rotate(${i * 25.7} 50 50)`} />)}
      <circle cx="50" cy="52" r="22" fill="#d97706" />
      <ellipse cx="50" cy="60" rx="12" ry="8" fill="#fde68a" />
      <circle cx="42" cy="48" r="3" fill="#1c1917" />
      <circle cx="58" cy="48" r="3" fill="#1c1917" />
      <path d="M46 56 L54 56 L50 60 Z" fill="#7c2d12" />
    </Medallion>
  ),
  4: (
    <Medallion id="rm4" bg={["#fed7aa", "#c2410c", "#431407"]}>
      <path d="M30 70 L70 70 L76 46 L36 46 Z" fill="url(#rm4-gold)" stroke="#78350f" strokeWidth="2" />
      <circle cx="48" cy="76" r="12" fill="none" stroke="#78350f" strokeWidth="4" />
      <path d="M48 64 L48 88 M36 76 L60 76" stroke="#78350f" strokeWidth="2" />
      <path d="M36 50 C26 44 16 46 10 40 C14 34 22 34 28 38" fill="#f5f5f4" stroke="#78716c" strokeWidth="1.5" />
      <path d="M10 40 L6 50 M14 42 L12 54" stroke="#78716c" strokeWidth="2" />
    </Medallion>
  ),
  5: (
    <Sym id="rm5" defs={lin("rm5-g", ["#fef3c7", "#facc15", "#a16207"])}>
      <path d="M50 22 C40 22 36 30 40 38 L18 30 C26 44 36 50 46 50 L46 86 L54 86 L54 50 C64 50 74 44 82 30 L60 38 C64 30 60 22 50 22 Z" fill="url(#rm5-g)" stroke="#713f12" strokeWidth="2" />
      <circle cx="47" cy="30" r="2.4" fill="#111" />
      <path d="M52 32 L58 34 L52 36" fill="#b45309" />
      <rect x="38" y="84" width="24" height="6" rx="2" fill="url(#rm5-g)" stroke="#713f12" />
    </Sym>
  ),
  6: <Badge id="rm6" colors={["#fecaca", "#b91c1c", "#450a0a"]} shape="shield" glyph={<path d="M30 54 C30 32 70 32 70 54 L70 60 L30 60 Z M48 60 L48 72 L52 72 L52 60 M50 28 L50 34" />} />,
  7: <Badge id="rm7" colors={["#fef3c7", "#d97706", "#451a03"]} shape="hex" glyph={<path d="M34 30 L66 30 L66 58 C66 66 58 72 50 74 C42 72 34 66 34 58 Z M50 30 L50 74 M34 50 L66 50" />} />,
  8: <Badge id="rm8" colors={["#e2e8f0", "#64748b", "#0f172a"]} shape="diamond" glyph={<path d="M50 24 L56 34 L54 64 L46 64 L44 34 Z M40 64 L60 64 M50 64 L50 76" />} />,
  9: <Badge id="rm9" colors={["#fef9c3", "#ca8a04", "#422006"]} shape="circle" glyph={<><circle cx="50" cy="50" r="18" /><path d="M42 44 L58 44 M42 56 L58 56 M50 38 L50 62" /></>} />,
};

/* =========================================================== FAZENDA FELIZ */
export const FAZENDA: Record<number, ReactNode> = {
  0: (
    <Sym id="fz0" defs={rad("fz0-f", ["#fef3c7", "#fde68a", "#d97706"], "50%", "40%")}>
      <path d="M20 22 L80 22 L72 30 L28 30 Z" fill="#78350f" />
      <path d="M32 22 C32 8 68 8 68 22 Z" fill="#a16207" />
      <circle cx="50" cy="44" r="18" fill="url(#fz0-f)" />
      <path d="M42 40 L46 44 M46 40 L42 44 M54 40 L58 44 M58 40 L54 44" stroke="#1c1917" strokeWidth="2" />
      <path d="M42 52 C46 56 54 56 58 52" stroke="#dc2626" strokeWidth="2.5" fill="none" />
      <path d="M26 62 L74 62 L70 70 L30 70 Z" fill="#2563eb" />
      <path d="M22 58 L14 52 M78 58 L86 52 M30 44 L26 38 M70 44 L74 38" stroke="#eab308" strokeWidth="3" />
      <Ribbon id="fz0" text="WILD" colors={["#fef08a", "#ca8a04"]} ink="#1c1917" />
    </Sym>
  ),
  1: (
    <Sym id="fz1" defs={lin("fz1-r", ["#f87171", "#b91c1c"])}>
      <path d="M14 70 L14 36 L50 12 L86 36 L86 70 Z" fill="url(#fz1-r)" stroke="#fff" strokeWidth="3" />
      <path d="M36 70 L36 46 L64 46 L64 70 M36 46 L64 70 M64 46 L36 70" stroke="#fff" strokeWidth="3" fill="none" />
      <circle cx="50" cy="32" r="5" fill="#fff" />
      <Ribbon id="fz1" text="FREE" colors={["#fef08a", "#ca8a04"]} ink="#1c1917" />
    </Sym>
  ),
  2: (
    <Medallion id="fz2" bg={["#dcfce7", "#4ade80", "#14532d"]}>
      <ellipse cx="50" cy="58" rx="28" ry="26" fill="#f8fafc" />
      <path d="M34 50 C30 40 40 36 44 44 Z M60 62 C66 54 76 60 70 70 Z" fill="#111827" />
      <ellipse cx="50" cy="72" rx="14" ry="9" fill="#fbcfe8" />
      <circle cx="45" cy="72" r="2" fill="#9d174d" />
      <circle cx="55" cy="72" r="2" fill="#9d174d" />
      <circle cx="40" cy="54" r="3" fill="#111" />
      <circle cx="60" cy="54" r="3" fill="#111" />
      <path d="M26 36 L18 28 M74 36 L82 28" stroke="#fef3c7" strokeWidth="5" strokeLinecap="round" />
    </Medallion>
  ),
  3: (
    <Medallion id="fz3" bg={["#fce7f3", "#f9a8d4", "#831843"]}>
      <ellipse cx="50" cy="56" rx="28" ry="26" fill="#f9a8d4" />
      <path d="M28 36 L22 20 L38 30 Z M72 36 L78 20 L62 30 Z" fill="#f472b6" />
      <ellipse cx="50" cy="64" rx="12" ry="9" fill="#f472b6" />
      <ellipse cx="46" cy="64" rx="2" ry="3" fill="#831843" />
      <ellipse cx="54" cy="64" rx="2" ry="3" fill="#831843" />
      <circle cx="40" cy="48" r="3" fill="#111" />
      <circle cx="60" cy="48" r="3" fill="#111" />
    </Medallion>
  ),
  4: (
    <Medallion id="fz4" bg={["#fef9c3", "#facc15", "#713f12"]}>
      <ellipse cx="48" cy="60" rx="26" ry="22" fill="#fff" />
      <circle cx="56" cy="38" r="14" fill="#fff" />
      <path d="M50 26 q3 -9 6 0 q3 -9 6 0 z" fill="#ef4444" />
      <path d="M68 38 L78 41 L68 44 Z" fill="#f59e0b" />
      <circle cx="60" cy="36" r="2.4" fill="#111" />
      <path d="M62 46 C64 50 60 52 58 50" fill="#ef4444" />
      <path d="M22 54 C16 50 16 62 24 64" fill="#e5e7eb" />
    </Medallion>
  ),
  5: (
    <Medallion id="fz5" bg={["#e0f2fe", "#7dd3fc", "#0c4a6e"]}>
      {[[34, 46], [50, 40], [66, 46], [30, 60], [70, 60], [40, 72], [60, 72], [50, 56]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="12" fill="#f8fafc" />)}
      <ellipse cx="50" cy="56" rx="10" ry="12" fill="#1f2937" />
      <circle cx="46" cy="54" r="1.8" fill="#fff" />
      <circle cx="54" cy="54" r="1.8" fill="#fff" />
      <path d="M38 52 L32 48 M62 52 L68 48" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
    </Medallion>
  ),
  6: <Badge id="fz6" colors={["#fef08a", "#eab308", "#713f12"]} shape="shield" glyph={<path d="M50 74 C40 66 38 44 50 26 C62 44 60 66 50 74 M44 40 L56 40 M43 50 L57 50 M44 60 L56 60" />} />,
  7: <Badge id="fz7" colors={["#fed7aa", "#f97316", "#7c2d12"]} shape="hex" glyph={<path d="M50 76 L40 40 L60 40 Z M50 40 L44 26 M50 40 L50 24 M50 40 L56 26" />} />,
  8: <Badge id="fz8" colors={["#fed7aa", "#ea580c", "#431407"]} shape="circle" glyph={<path d="M30 54 C30 36 70 36 70 54 C70 68 30 68 30 54 Z M44 40 C44 50 56 50 56 40 M50 38 L52 28" />} />,
  9: <Badge id="fz9" colors={["#fef3c7", "#fde68a", "#a16207"]} shape="diamond" glyph={<path d="M50 28 C62 28 66 46 66 54 C66 66 58 72 50 72 C42 72 34 66 34 54 C34 46 38 28 50 28 Z" />} />,
};

/* =========================================================== ROBÔS GIGANTES */
const mech = (id: string, a: string, b: string, eye: string) => (
  <g>
    <defs>{lin(`${id}-m`, [a, b])}</defs>
    <path d="M30 22 L70 22 L76 40 L70 62 L30 62 L24 40 Z" fill={`url(#${id}-m)`} stroke="#0f172a" strokeWidth="2.5" />
    <path d="M34 34 L66 34 L62 44 L38 44 Z" fill="#0f172a" />
    <path d="M40 39 L60 39" stroke={eye} strokeWidth="4" strokeLinecap="round" />
    <path d="M50 22 L50 10 M44 10 L56 10" stroke="#0f172a" strokeWidth="3" />
    <path d="M38 52 L62 52 M42 56 L58 56" stroke="#0f172a" strokeWidth="2" />
    <rect x="14" y="30" width="10" height="20" rx="3" fill={b} stroke="#0f172a" strokeWidth="2" />
    <rect x="76" y="30" width="10" height="20" rx="3" fill={b} stroke="#0f172a" strokeWidth="2" />
  </g>
);
export const ROBOS: Record<number, ReactNode> = {
  0: <Sym id="rb0">{mech("rb0", "#fde68a", "#f59e0b", "#ef4444")}<Ribbon id="rb0" text="WILD" colors={["#fde68a", "#c2410c"]} ink="#1c1917" /></Sym>,
  1: (
    <Sym id="rb1" defs={rad("rb1-r", ["#ffffff", "#67e8f9", "#0e7490", "#083344"])}>
      <circle cx="50" cy="40" r="32" fill="#0f172a" stroke="url(#rb1-gold)" strokeWidth="3" />
      <circle cx="50" cy="40" r="22" fill="url(#rb1-r)" />
      {[0, 120, 240].map((a) => <path key={a} d="M50 40 L44 22 L56 22 Z" fill="#0f172a" opacity=".55" transform={`rotate(${a} 50 40)`} />)}
      <circle cx="50" cy="40" r="6" fill="#fff" />
      <Ribbon id="rb1" text="FREE" colors={["#a5f3fc", "#0e7490"]} ink="#fff" />
    </Sym>
  ),
  2: <Medallion id="rb2" bg={["#dbeafe", "#3b82f6", "#172554"]}>{mech("rb2m", "#e2e8f0", "#3b82f6", "#22d3ee")}<path d="M24 66 L76 66 L72 96 L28 96 Z" fill="#1d4ed8" stroke="#0f172a" strokeWidth="2" /></Medallion>,
  3: <Medallion id="rb3" bg={["#fecaca", "#ef4444", "#450a0a"]}>{mech("rb3m", "#1f2937", "#991b1b", "#facc15")}<path d="M24 66 L76 66 L72 96 L28 96 Z" fill="#7f1d1d" stroke="#0f172a" strokeWidth="2" /><path d="M30 18 L22 6 M70 18 L78 6" stroke="#991b1b" strokeWidth="4" /></Medallion>,
  4: (
    <Medallion id="rb4" bg={["#e0f2fe", "#38bdf8", "#082f49"]}>
      <path d="M10 56 L40 44 L84 50 L40 60 Z" fill="#cbd5e1" stroke="#334155" strokeWidth="2" />
      <path d="M40 44 L56 30 L62 48 Z M40 60 L56 74 L62 52 Z" fill="#94a3b8" stroke="#334155" strokeWidth="2" />
      <ellipse cx="66" cy="50" rx="8" ry="3" fill="#38bdf8" />
      <path d="M10 56 L0 50 L2 62 Z" fill="#fb923c" />
    </Medallion>
  ),
  5: (
    <Sym id="rb5" defs={lin("rb5-c", ["#e2e8f0", "#64748b", "#1e293b"])}>
      <rect x="20" y="40" width="64" height="18" rx="6" fill="url(#rb5-c)" stroke="#0f172a" strokeWidth="2" transform="rotate(-20 50 50)" />
      <circle cx="30" cy="62" r="16" fill="#334155" stroke="#0f172a" strokeWidth="2" />
      <circle cx="30" cy="62" r="6" fill="#ef4444" />
      <path d="M78 26 L90 20 M80 32 L94 32 M78 38 L90 44" stroke="#fde047" strokeWidth="3" strokeLinecap="round" />
    </Sym>
  ),
  6: <Badge id="rb6" colors={["#bbf7d0", "#22c55e", "#14532d"]} shape="shield" glyph={<path d="M38 34 L62 34 L62 72 L38 72 Z M46 28 L54 28 M44 46 L56 46 M44 56 L56 56" />} />,
  7: <Badge id="rb7" colors={["#e2e8f0", "#94a3b8", "#1e293b"]} shape="hex" glyph={<path d="M40 30 L60 30 L60 40 L54 40 L54 74 L46 74 L46 40 L40 40 Z M46 52 L54 52 M46 62 L54 62" />} />,
  8: <Badge id="rb8" colors={["#a5f3fc", "#06b6d4", "#164e63"]} shape="diamond" glyph={<path d="M38 38 L62 38 L62 62 L38 62 Z M44 30 L44 38 M56 30 L56 38 M44 62 L44 70 M56 62 L56 70 M30 44 L38 44 M30 56 L38 56 M62 44 L70 44 M62 56 L70 56" />} />,
  9: <Badge id="rb9" colors={["#fecaca", "#ef4444", "#450a0a"]} shape="circle" glyph={<path d="M50 74 L50 40 M38 30 C44 36 56 36 62 30 M32 22 C42 32 58 32 68 22 M50 40 L50 36" />} />,
};

/* =========================================================== LENDA DO KRAKEN */
export const KRAKEN: Record<number, ReactNode> = {
  0: (
    <Sym id="kr0" defs={rad("kr0-k", ["#fbcfe8", "#be185d", "#4a044e"], "50%", "35%")}>
      <path d="M26 40 C26 10 74 10 74 40 C74 50 68 56 60 58 L40 58 C32 56 26 50 26 40 Z" fill="url(#kr0-k)" />
      <circle cx="40" cy="38" r="7" fill="#fde047" />
      <circle cx="60" cy="38" r="7" fill="#fde047" />
      <ellipse cx="40" cy="38" rx="2" ry="6" fill="#111" />
      <ellipse cx="60" cy="38" rx="2" ry="6" fill="#111" />
      {[20, 34, 50, 66, 80].map((x, i) => <path key={x} d={`M${30 + i * 10} 56 C${x - 6} 64 ${x + 6} 70 ${x} 76`} stroke="#9d174d" strokeWidth="6" fill="none" strokeLinecap="round" />)}
      <Ribbon id="kr0" text="WILD" colors={["#a5f3fc", "#155e75"]} ink="#fff" />
    </Sym>
  ),
  1: (
    <Sym id="kr1" defs={lin("kr1-s", ["#94a3b8", "#1e293b"])}>
      <circle cx="50" cy="40" r="32" fill="#052e2b" stroke="url(#kr1-gold)" strokeWidth="3" />
      <path d="M24 56 L76 56 L70 66 L30 66 Z" fill="url(#kr1-s)" />
      <path d="M40 56 L40 18 M60 56 L60 24" stroke="#1e293b" strokeWidth="3" />
      <path d="M40 20 C52 26 52 40 40 46 Z M60 26 C70 30 70 42 60 48 Z" fill="#a7f3d0" opacity=".6" />
      <Ribbon id="kr1" text="FREE" colors={["#a5f3fc", "#155e75"]} ink="#fff" />
    </Sym>
  ),
  2: (
    <Medallion id="kr2" bg={["#ccfbf1", "#2dd4bf", "#042f2e"]}>
      <path d="M30 100 C30 76 38 64 50 64 C62 64 70 76 70 100 Z" fill="#fcd9b6" />
      <path d="M28 30 C24 70 36 96 30 100 L22 100 C30 80 18 50 28 30 Z M72 30 C76 70 64 96 70 100 L78 100 C70 80 82 50 72 30 Z" fill="#dc2626" />
      <ellipse cx="50" cy="46" rx="14" ry="17" fill="#fcd9b6" />
      <path d="M30 34 C30 14 70 14 70 34 C64 26 36 26 30 34 Z" fill="#dc2626" />
      <path d="M43 44 C44 42 46 42 47 44 M53 44 C54 42 56 42 57 44" stroke="#0e7490" strokeWidth="2.5" fill="none" />
      <path d="M46 54 C48 56 52 56 54 54" stroke="#be123c" strokeWidth="2" fill="none" />
      <path d="M38 80 L50 76 L62 80" stroke="#a855f7" strokeWidth="4" fill="none" />
    </Medallion>
  ),
  3: (
    <Medallion id="kr3" bg={["#bae6fd", "#0284c7", "#082f49"]}>
      <path d="M20 100 L26 72 C36 62 64 62 74 72 L80 100 Z" fill="#0e7490" />
      <ellipse cx="50" cy="48" rx="15" ry="17" fill="#a5f3fc" />
      <path d="M32 52 C30 82 70 82 68 52 C60 62 40 62 32 52 Z" fill="#e0f2fe" />
      <path d="M43 46 L47 46 M53 46 L57 46" stroke="#0c4a6e" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M30 32 L38 18 L44 30 L50 14 L56 30 L62 18 L70 32 Z" fill="url(#kr3-gold)" />
    </Medallion>
  ),
  4: (
    <Medallion id="kr4" bg={["#e2e8f0", "#64748b", "#0f172a"]}>
      <path d="M8 60 C24 40 60 36 88 50 C70 64 34 72 8 60 Z" fill="#64748b" />
      <path d="M48 42 L54 22 L62 44 Z" fill="#475569" />
      <path d="M8 60 L0 48 L4 64 Z" fill="#475569" />
      <circle cx="74" cy="50" r="2.5" fill="#111" />
      <path d="M66 58 L80 56" stroke="#f8fafc" strokeWidth="2" />
      <path d="M68 56 L70 60 M74 56 L75 60" stroke="#f8fafc" strokeWidth="1.5" />
      <path d="M20 62 Q50 70 80 58" stroke="#cbd5e1" strokeWidth="2" fill="none" />
    </Medallion>
  ),
  5: (
    <Sym id="kr5" defs={lin("kr5-a", ["#e2e8f0", "#64748b"])}>
      <circle cx="50" cy="18" r="8" fill="none" stroke="url(#kr5-a)" strokeWidth="5" />
      <path d="M50 26 L50 86 M36 36 L64 36 M20 64 C24 82 40 88 50 86 C60 88 76 82 80 64" stroke="url(#kr5-a)" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M14 66 L22 58 L26 70 Z M86 66 L78 58 L74 70 Z" fill="#64748b" />
    </Sym>
  ),
  6: <Badge id="kr6" colors={["#fde68a", "#ca8a04", "#422006"]} shape="shield" glyph={<path d="M50 26 L50 76 M36 26 L36 44 C36 52 64 52 64 44 L64 26 M42 76 L58 76" />} />,
  7: <Badge id="kr7" colors={["#fecdd3", "#fb7185", "#881337"]} shape="hex" glyph={<path d="M50 72 L28 40 C34 28 66 28 72 40 Z M50 72 L40 34 M50 72 L50 30 M50 72 L60 34" />} />,
  8: <Badge id="kr8" colors={["#f8fafc", "#cbd5e1", "#475569"]} shape="circle" glyph={<><circle cx="50" cy="50" r="14" /><circle cx="45" cy="45" r="3" /></>} />,
  9: <Badge id="kr9" colors={["#a5f3fc", "#0891b2", "#164e63"]} shape="diamond" glyph={<><circle cx="50" cy="50" r="18" /><path d="M50 34 L56 50 L50 66 L44 50 Z" /></>} />,
};

/* =========================================================== CARNAVAL DO RIO */
const plumes = (cx: number, cy: number, colors: string[]) =>
  colors.map((c, i) => <path key={i} d={`M${cx} ${cy} C${cx - 30 + i * 12} ${cy - 30} ${cx - 34 + i * 14} ${cy - 50} ${cx - 24 + i * 12} ${cy - 56} C${cx - 18 + i * 10} ${cy - 40} ${cx - 8 + i * 4} ${cy - 20} ${cx} ${cy}`} fill={c} opacity=".95" />);
export const CARNAVAL: Record<number, ReactNode> = {
  0: (
    <Sym id="cv0" defs={rad("cv0-f", ["#fde7c7", "#c08457", "#7c4a1e"], "50%", "40%")}>
      {plumes(50, 34, ["#22c55e", "#facc15", "#f472b6", "#a855f7", "#38bdf8"])}
      <ellipse cx="50" cy="44" rx="13" ry="15" fill="url(#cv0-f)" />
      <path d="M38 40 C42 34 58 34 62 40 L58 44 L42 44 Z" fill="#a855f7" />
      <path d="M46 52 C48 54 52 54 54 52" stroke="#be123c" strokeWidth="2" fill="none" />
      <Ribbon id="cv0" text="WILD" colors={["#bbf7d0", "#15803d"]} ink="#fef08a" />
    </Sym>
  ),
  1: (
    <Sym id="cv1" defs={lin("cv1-c", ["#fef08a", "#facc15", "#ca8a04"])}>
      <path d="M10 66 L18 40 L82 40 L90 66 Z" fill="url(#cv1-c)" stroke="#713f12" strokeWidth="2" />
      <path d="M30 40 C30 16 70 16 70 40" fill="#22c55e" stroke="#14532d" strokeWidth="2" />
      <circle cx="50" cy="26" r="8" fill="#f472b6" />
      {[24, 40, 60, 76].map((x) => <circle key={x} cx={x} cy="54" r="4" fill="#a855f7" />)}
      <Ribbon id="cv1" text="FREE" colors={["#bbf7d0", "#15803d"]} ink="#fef08a" />
    </Sym>
  ),
  2: (
    <Medallion id="cv2" bg={["#fce7f3", "#ec4899", "#500724"]}>
      {plumes(50, 40, ["#facc15", "#fde68a", "#facc15", "#f59e0b", "#facc15"])}
      <path d="M20 100 L28 74 C38 64 62 64 72 74 L80 100 Z" fill="#facc15" />
      <ellipse cx="50" cy="52" rx="13" ry="16" fill="#8d5524" />
      <path d="M44 50 L47 50 M53 50 L56 50" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M45 60 C48 62 52 62 55 60" stroke="#be123c" strokeWidth="2.5" fill="none" />
      <path d="M36 38 L64 38 L60 30 L40 30 Z" fill="url(#cv2-gold)" />
    </Medallion>
  ),
  3: (
    <Medallion id="cv3" bg={["#dcfce7", "#22c55e", "#052e16"]}>
      <path d="M20 100 L26 72 C36 62 64 62 74 72 L80 100 Z" fill="#f8fafc" />
      <path d="M40 66 L50 76 L60 66" fill="#15803d" />
      <ellipse cx="50" cy="50" rx="14" ry="16" fill="#c08457" />
      <path d="M43 48 L47 48 M53 48 L57 48" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M46 58 C48 60 52 60 54 58" stroke="#7c2d12" strokeWidth="2" fill="none" />
      <path d="M28 36 C30 26 70 26 72 36 L66 36 C62 32 38 32 34 36 Z M34 36 L66 36 L62 26 L38 26 Z" fill="#facc15" stroke="#a16207" />
      <path d="M72 70 L88 40" stroke="#facc15" strokeWidth="4" />
      <path d="M88 40 C94 36 98 44 92 46 Z" fill="#22c55e" />
    </Medallion>
  ),
  4: (
    <Sym id="cv4" defs={lin("cv4-t", ["#fef08a", "#facc15", "#a16207"])}>
      <ellipse cx="50" cy="40" rx="34" ry="12" fill="url(#cv4-t)" stroke="#713f12" strokeWidth="2" />
      <path d="M16 40 L16 64 C16 72 84 72 84 64 L84 40" fill="#16a34a" stroke="#14532d" strokeWidth="2" />
      <ellipse cx="50" cy="40" rx="28" ry="8" fill="#fef9c3" />
      <path d="M22 44 L30 66 M40 46 L44 70 M60 46 L56 70 M78 44 L70 66" stroke="#facc15" strokeWidth="2" />
      <path d="M62 34 L86 14 M70 36 L92 22" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
    </Sym>
  ),
  5: (
    <Sym id="cv5" defs={lin("cv5-m", ["#f5d0fe", "#c026d3", "#701a75"], false)}>
      <path d="M10 44 C10 28 40 26 50 36 C60 26 90 28 90 44 C90 58 72 64 60 56 L50 50 L40 56 C28 64 10 58 10 44 Z" fill="url(#cv5-m)" stroke="#facc15" strokeWidth="3" />
      <ellipse cx="32" cy="44" rx="9" ry="6" fill="#0f0a1a" />
      <ellipse cx="68" cy="44" rx="9" ry="6" fill="#0f0a1a" />
      {plumes(84, 34, ["#22c55e", "#facc15", "#38bdf8"])}
      <path d="M50 52 L50 92" stroke="#facc15" strokeWidth="3" />
    </Sym>
  ),
  6: <Badge id="cv6" colors={["#fef08a", "#eab308", "#713f12"]} shape="circle" glyph={<><circle cx="50" cy="50" r="20" />{[0, 60, 120, 180, 240, 300].map((a) => <circle key={a} cx={50 + Math.cos((a * Math.PI) / 180) * 20} cy={50 + Math.sin((a * Math.PI) / 180) * 20} r="3" />)}</>} />,
  7: <Badge id="cv7" colors={["#fbcfe8", "#ec4899", "#831843"]} shape="hex" glyph={<><circle cx="36" cy="38" r="4" /><circle cx="62" cy="34" r="4" /><circle cx="50" cy="56" r="4" /><circle cx="34" cy="66" r="4" /><circle cx="66" cy="62" r="4" /></>} />,
  8: <Badge id="cv8" colors={["#bbf7d0", "#22c55e", "#14532d"]} shape="shield" glyph={<path d="M40 74 C46 60 38 46 46 34 C52 26 62 24 66 28 C58 32 56 40 56 50 C56 60 50 68 40 74 Z" />} />,
  9: <Badge id="cv9" colors={["#bae6fd", "#0ea5e9", "#0c4a6e"]} shape="diamond" glyph={<path d="M30 40 C40 30 44 50 54 40 C64 30 68 50 74 44 M28 56 C38 46 42 66 52 56 C62 46 66 66 72 60" />} />,
};
