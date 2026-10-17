/** Trono do Olimpo · Neon Cyber · Templo Asteca · Lobo Ártico */
import type { ReactNode } from "react";
import { Badge, lin, Medallion, rad, Ribbon, Sym } from "./kit";

/* =========================================================== TRONO DO OLIMPO */
export const OLIMPO: Record<number, ReactNode> = {
  0: (
    <Sym id="ol0" defs={lin("ol0-b", ["#ffffff", "#fde047", "#f59e0b"])}>
      <circle cx="50" cy="40" r="32" fill="#1e1b4b" stroke="url(#ol0-gold)" strokeWidth="3" />
      <path d="M56 10 L34 44 L48 44 L40 74 L66 36 L52 36 Z" fill="url(#ol0-b)" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      <Ribbon id="ol0" text="WILD" colors={["#e0e7ff", "#4338ca"]} ink="#fde68a" />
    </Sym>
  ),
  1: (
    <Sym id="ol1" defs={lin("ol1-m", ["#ffffff", "#e2e8f0", "#94a3b8"])}>
      <path d="M12 30 L50 10 L88 30 Z" fill="url(#ol1-m)" stroke="url(#ol1-gold)" strokeWidth="3" strokeLinejoin="round" />
      <rect x="14" y="30" width="72" height="6" fill="url(#ol1-gold)" />
      {[22, 38, 54, 70].map((x) => <rect key={x} x={x} y="38" width="8" height="30" fill="url(#ol1-m)" />)}
      <rect x="10" y="68" width="80" height="6" fill="url(#ol1-gold)" />
      <Ribbon id="ol1" text="FREE" colors={["#e0e7ff", "#4338ca"]} ink="#fde68a" />
    </Sym>
  ),
  2: (
    <Medallion id="ol2" bg={["#e0e7ff", "#6366f1", "#1e1b4b"]}>
      <path d="M24 98 L30 72 C36 64 64 64 70 72 L76 98 Z" fill="#f8fafc" />
      <ellipse cx="50" cy="44" rx="15" ry="17" fill="#fde7c7" />
      <path d="M30 40 C26 20 74 20 70 40 C64 30 36 30 30 40 Z" fill="#f1f5f9" />
      <path d="M34 52 C30 80 44 86 50 86 C56 86 70 80 66 52 C62 62 38 62 34 52 Z" fill="#f1f5f9" />
      <path d="M43 44 L47 44 M53 44 L57 44" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M44 56 C48 58 52 58 56 56" stroke="#64748b" strokeWidth="1.5" fill="none" />
      <path d="M32 26 C36 14 64 14 68 26" stroke="url(#ol2-gold)" strokeWidth="4" fill="none" />
    </Medallion>
  ),
  3: (
    <Sym id="ol3" defs={lin("ol3-h", ["#fde68a", "#b45309"])}>
      <path d="M22 70 L22 44 C22 18 78 18 78 44 L78 70 L62 70 L62 50 L38 50 L38 70 Z" fill="url(#ol3-h)" stroke="#78350f" strokeWidth="2" />
      <path d="M44 50 L44 80 L56 80 L56 50" fill="#1c1917" opacity=".7" />
      <path d="M50 4 C70 6 84 18 82 32 C74 20 62 14 50 16 Z" fill="#dc2626" />
      <path d="M30 34 L70 34" stroke="#78350f" strokeWidth="2" />
    </Sym>
  ),
  4: (
    <Sym id="ol4" defs={lin("ol4-l", ["#fde68a", "#b45309"])}>
      <path d="M26 86 C14 60 18 26 30 14 L38 20 C30 34 28 60 36 80 M74 86 C86 60 82 26 70 14 L62 20 C70 34 72 60 64 80" fill="url(#ol4-l)" stroke="#78350f" strokeWidth="1.5" />
      <rect x="26" y="80" width="48" height="10" rx="3" fill="url(#ol4-l)" stroke="#78350f" strokeWidth="1.5" />
      <path d="M32 24 L68 24" stroke="url(#ol4-l)" strokeWidth="5" />
      {[40, 46, 52, 58].map((x) => <line key={x} x1={x} y1="24" x2={x} y2="80" stroke="#f8fafc" strokeWidth="1.4" />)}
    </Sym>
  ),
  5: (
    <Sym id="ol5" defs={lin("ol5-g", ["#bbf7d0", "#16a34a"])}>
      {Array.from({ length: 7 }).map((_, i) => (
        <g key={i}>
          <ellipse cx="26" cy={30 + i * 8} rx="9" ry="4" fill="url(#ol5-g)" transform={`rotate(${-40 + i * 8} 26 ${30 + i * 8})`} />
          <ellipse cx="74" cy={30 + i * 8} rx="9" ry="4" fill="url(#ol5-g)" transform={`rotate(${40 - i * 8} 74 ${30 + i * 8})`} />
        </g>
      ))}
      <path d="M30 86 C36 90 64 90 70 86" stroke="url(#ol5-gold)" strokeWidth="4" fill="none" />
      <circle cx="50" cy="86" r="5" fill="url(#ol5-gold)" />
    </Sym>
  ),
  6: <Badge id="ol6" colors={["#fed7aa", "#ea580c", "#7c2d12"]} shape="shield" glyph={<path d="M42 26 L58 26 M44 26 C44 34 36 38 36 52 C36 68 44 74 50 74 C56 74 64 68 64 52 C64 38 56 34 56 26 M34 44 C26 44 26 56 36 56 M66 44 C74 44 74 56 64 56" />} />,
  7: <Badge id="ol7" colors={["#bfdbfe", "#2563eb", "#1e3a8a"]} shape="circle" glyph={<><circle cx="50" cy="50" r="20" /><circle cx="50" cy="50" r="8" /></>} />,
  8: <Badge id="ol8" colors={["#f1f5f9", "#94a3b8", "#334155"]} shape="hex" glyph={<path d="M36 28 L64 28 M36 72 L64 72 M40 28 L40 72 M50 28 L50 72 M60 28 L60 72" />} />,
  9: <Badge id="ol9" colors={["#fef08a", "#ca8a04", "#713f12"]} shape="circle" glyph={<><circle cx="50" cy="50" r="18" /><path d="M42 46 C42 38 58 38 58 46 C58 54 42 54 42 62 L58 62" /></>} />,
  10: (
    <Sym id="ol10" defs={rad("ol10-o", ["#ffffff", "#a5b4fc", "#4338ca", "#1e1b4b"])}>
      <circle cx="50" cy="50" r="36" fill="url(#ol10-o)" stroke="#e0e7ff" strokeWidth="3" />
      <path d="M50 22 L44 46 L54 46 L48 74" stroke="#fde047" strokeWidth="3" fill="none" opacity=".55" />
      <ellipse cx="38" cy="34" rx="10" ry="6" fill="#fff" opacity=".5" transform="rotate(-30 38 34)" />
    </Sym>
  ),
};

/* =========================================================== NEON CYBER */
const neon = (id: string, color: string, body: ReactNode) => (
  <Sym id={id} defs={<filter id={`${id}-ng`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>}>
    <rect x="8" y="8" width="84" height="84" rx="16" fill="#0b0618" stroke={color} strokeWidth="2.5" opacity=".95" />
    <g filter={`url(#${id}-ng)`} stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">{body}</g>
  </Sym>
);

export const CYBER: Record<number, ReactNode> = {
  0: (
    <Sym id="cy0" defs={<>{lin("cy0-h", ["#e2e8f0", "#64748b"])}<filter id="cy0-g"><feGaussianBlur stdDeviation="2" /></filter></>}>
      <path d="M26 36 C26 10 74 10 74 36 L74 56 C74 70 62 78 50 78 C38 78 26 70 26 56 Z" fill="url(#cy0-h)" stroke="#22d3ee" strokeWidth="2.5" />
      <rect x="30" y="34" width="40" height="14" rx="7" fill="#0b0618" />
      <rect x="34" y="38" width="32" height="6" rx="3" fill="#f0abfc" filter="url(#cy0-g)" />
      <rect x="34" y="38" width="32" height="6" rx="3" fill="#f0abfc" />
      <path d="M40 62 L60 62 M44 68 L56 68" stroke="#0b0618" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 44 L18 44 M74 44 L82 44" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
      <Ribbon id="cy0" text="WILD" colors={["#f0abfc", "#7e22ce"]} ink="#fff" />
    </Sym>
  ),
  1: (
    <Sym id="cy1" defs={rad("cy1-c", ["#ffffff", "#22d3ee", "#0e7490", "#082f49"], "50%", "50%")}>
      <circle cx="50" cy="42" r="30" fill="#0b0618" stroke="#22d3ee" strokeWidth="2" />
      <circle cx="50" cy="42" r="18" fill="url(#cy1-c)" />
      {[0, 60, 120, 180, 240, 300].map((a) => <rect key={a} x="48" y="8" width="4" height="10" rx="2" fill="#f0abfc" transform={`rotate(${a} 50 42)`} />)}
      <Ribbon id="cy1" text="FREE" colors={["#a5f3fc", "#0e7490"]} ink="#fff" />
    </Sym>
  ),
  2: neon("cy2", "#f0abfc", <><rect x="30" y="30" width="40" height="34" rx="6" /><circle cx="42" cy="46" r="4" /><circle cx="58" cy="46" r="4" /><path d="M42 56 L58 56 M50 30 L50 20 M44 20 L56 20 M30 46 L22 46 M70 46 L78 46 M38 64 L38 76 M62 64 L62 76" /></>),
  3: neon("cy3", "#22d3ee", <><ellipse cx="50" cy="52" rx="12" ry="8" /><path d="M20 34 L38 46 M80 34 L62 46 M20 34 L32 34 M80 34 L68 34 M46 60 L44 70 M54 60 L56 70" /><circle cx="20" cy="30" r="6" /><circle cx="80" cy="30" r="6" /></>),
  4: neon("cy4", "#a3e635", <><path d="M18 44 C28 30 72 30 82 44 L78 58 C66 64 34 64 22 58 Z" /><path d="M30 48 L46 48 M54 48 L70 48" /></>),
  5: neon("cy5", "#fbbf24", <><rect x="32" y="32" width="36" height="36" rx="4" /><rect x="42" y="42" width="16" height="16" /><path d="M38 32 L38 22 M50 32 L50 22 M62 32 L62 22 M38 68 L38 78 M50 68 L50 78 M62 68 L62 78 M32 40 L22 40 M32 60 L22 60 M68 40 L78 40 M68 60 L78 60" /></>),
  6: <Badge id="cy6" colors={["#bbf7d0", "#16a34a", "#052e16"]} shape="hex" glyph={<path d="M40 28 L60 28 L60 74 L40 74 Z M46 22 L54 22 M44 40 L56 40 M44 50 L56 50 M44 60 L56 60" />} />,
  7: <Badge id="cy7" colors={["#fbcfe8", "#db2777", "#500724"]} shape="circle" glyph={<path d="M50 74 L50 40 M36 34 C42 26 58 26 64 34 M30 26 C40 14 60 14 70 26 M50 40 L42 50 M50 40 L58 50" />} />,
  8: <Badge id="cy8" colors={["#cbd5e1", "#475569", "#0f172a"]} shape="shield" glyph={<><circle cx="50" cy="50" r="10" /><path d="M50 26 L50 34 M50 66 L50 74 M26 50 L34 50 M66 50 L74 50 M33 33 L39 39 M61 61 L67 67 M67 33 L61 39 M39 61 L33 67" /></>} />,
  9: <Badge id="cy9" colors={["#a5f3fc", "#0891b2", "#083344"]} shape="diamond" glyph={<path d="M38 36 L44 36 L44 64 M38 64 L50 64 M56 36 L64 36 L64 64 L56 64 Z" />} />,
};

/* =========================================================== TEMPLO ASTECA */
export const ASTECA: Record<number, ReactNode> = {
  0: (
    <Sym id="az0" defs={<>{lin("az0-j", ["#5eead4", "#0f766e", "#042f2e"])}</>}>
      <path d="M20 16 L80 16 L84 50 C84 66 68 76 50 76 C32 76 16 66 16 50 Z" fill="url(#az0-j)" stroke="url(#az0-gold)" strokeWidth="3" />
      <path d="M28 36 L44 36 L42 44 L30 44 Z M72 36 L56 36 L58 44 L70 44 Z" fill="#fde047" />
      <path d="M46 46 L50 58 L54 46" stroke="url(#az0-gold)" strokeWidth="3" fill="none" />
      <path d="M34 62 L66 62 M38 62 L38 68 M46 62 L46 68 M54 62 L54 68 M62 62 L62 68" stroke="#fff" strokeWidth="2" />
      <path d="M20 22 L80 22" stroke="url(#az0-gold)" strokeWidth="3" />
      <Ribbon id="az0" text="WILD" colors={["#99f6e4", "#0f766e"]} ink="#fff" />
    </Sym>
  ),
  1: (
    <Sym id="az1" defs={rad("az1-s", ["#fef3c7", "#d6a54a", "#78350f"], "50%", "50%")}>
      <circle cx="50" cy="44" r="34" fill="url(#az1-s)" stroke="#78350f" strokeWidth="2" />
      <circle cx="50" cy="44" r="24" fill="none" stroke="#78350f" strokeWidth="2" />
      {Array.from({ length: 16 }).map((_, i) => <rect key={i} x="48.5" y="12" width="3" height="7" fill="#78350f" transform={`rotate(${i * 22.5} 50 44)`} />)}
      <circle cx="50" cy="44" r="10" fill="#b45309" stroke="#78350f" strokeWidth="2" />
      <path d="M46 42 L48 42 M52 42 L54 42 M46 48 L54 48" stroke="#fef3c7" strokeWidth="2" />
      <Ribbon id="az1" text="FREE" />
    </Sym>
  ),
  2: (
    <Medallion id="az2" bg={["#fef9c3", "#eab308", "#713f12"]}>
      <path d="M18 62 C18 30 82 30 82 62 C82 82 66 92 50 92 C34 92 18 82 18 62 Z" fill="#f59e0b" />
      {[[34, 54], [64, 52], [44, 76], [58, 74], [28, 70], [72, 70]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="4" fill="none" stroke="#1c1917" strokeWidth="2.5" />)}
      <path d="M26 34 L20 20 L36 30 Z M74 34 L80 20 L64 30 Z" fill="#f59e0b" />
      <ellipse cx="40" cy="52" rx="5" ry="4" fill="#bef264" />
      <ellipse cx="60" cy="52" rx="5" ry="4" fill="#bef264" />
      <path d="M44 66 L56 66 L50 72 Z" fill="#1c1917" />
    </Medallion>
  ),
  3: (
    <Medallion id="az3" bg={["#dcfce7", "#22c55e", "#052e16"]}>
      <path d="M20 86 C24 60 70 70 70 50 C70 34 40 34 40 46 C40 54 56 54 56 46" stroke="#16a34a" strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M20 86 C24 60 70 70 70 50 C70 34 40 34 40 46" stroke="#fde047" strokeWidth="3" strokeDasharray="4 6" fill="none" />
      <path d="M56 46 C60 36 74 38 72 48 C70 56 58 56 56 46 Z" fill="#15803d" />
      <circle cx="64" cy="44" r="2" fill="#1c1917" />
      <path d="M72 50 L80 52 L76 54" stroke="#dc2626" strokeWidth="2" fill="none" />
    </Medallion>
  ),
  4: (
    <Sym id="az4" defs={lin("az4-i", ["#fde68a", "#b45309", "#78350f"])}>
      <path d="M28 90 L30 30 C30 14 70 14 70 30 L72 90 Z" fill="url(#az4-i)" stroke="#451a03" strokeWidth="2" />
      <path d="M36 38 L46 38 M54 38 L64 38" stroke="#1c1917" strokeWidth="4" strokeLinecap="round" />
      <rect x="42" y="50" width="16" height="8" rx="2" fill="#1c1917" />
      <path d="M30 66 L70 66 M30 76 L70 76" stroke="#451a03" strokeWidth="2" />
      <circle cx="50" cy="20" r="5" fill="#14b8a6" stroke="#451a03" strokeWidth="1.5" />
    </Sym>
  ),
  5: (
    <Sym id="az5" defs={lin("az5-f", ["#fca5a5", "#dc2626"])}>
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d="M50 70 C46 50 44 30 50 10 C56 30 54 50 50 70 Z" fill={i % 3 === 0 ? "#16a34a" : i % 3 === 1 ? "url(#az5-f)" : "#facc15"} transform={`rotate(${-64 + i * 16} 50 74)`} />
      ))}
      <path d="M24 74 L76 74 L72 86 L28 86 Z" fill="url(#az5-gold)" stroke="#78350f" strokeWidth="1.5" />
    </Sym>
  ),
  6: <Badge id="az6" colors={["#fed7aa", "#c2410c", "#431407"]} shape="diamond" glyph={<path d="M50 22 L60 40 L50 78 L40 40 Z M50 40 L50 60" />} />,
  7: <Badge id="az7" colors={["#bbf7d0", "#15803d", "#052e16"]} shape="shield" glyph={<path d="M60 24 C40 30 36 52 40 74 M40 74 C52 64 58 46 60 24 M46 46 L56 44 M42 58 L52 56" />} />,
  8: <Badge id="az8" colors={["#99f6e4", "#0d9488", "#042f2e"]} shape="hex" glyph={<path d="M38 26 L62 26 L62 74 L38 74 Z M38 42 L62 42 M38 58 L62 58 M44 34 L48 34 M52 50 L56 50" />} />,
  9: <Badge id="az9" colors={["#e7e5e4", "#78716c", "#292524"]} shape="circle" glyph={<path d="M30 56 L40 34 L60 30 L72 48 L64 68 L40 70 Z" />} />,
};

/* =========================================================== LOBO ÁRTICO */
export const ARTICO: Record<number, ReactNode> = {
  0: (
    <Sym id="ar0" defs={<>{lin("ar0-f", ["#f8fafc", "#cbd5e1", "#64748b"])}</>}>
      <path d="M50 74 C34 72 22 60 22 44 L18 12 L36 28 C44 24 56 24 64 28 L82 12 L78 44 C78 60 66 72 50 74 Z" fill="url(#ar0-f)" stroke="#e2e8f0" strokeWidth="2" />
      <path d="M50 74 C42 66 40 56 50 50 C60 56 58 66 50 74 Z" fill="#f8fafc" />
      <path d="M34 42 L44 46 M66 42 L56 46" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="50" cy="60" rx="5" ry="3.5" fill="#1e293b" />
      <Ribbon id="ar0" text="WILD" colors={["#e0f2fe", "#0369a1"]} ink="#fff" />
    </Sym>
  ),
  1: (
    <Sym id="ar1" defs={<>{lin("ar1-s", ["#020617", "#1e1b4b"])}{lin("ar1-a", ["#4ade80", "#22d3ee", "#a855f7"], false)}</>}>
      <circle cx="50" cy="42" r="34" fill="url(#ar1-s)" stroke="url(#ar1-gold)" strokeWidth="3" />
      <path d="M18 36 C30 20 40 44 52 28 C62 16 72 36 84 26" stroke="url(#ar1-a)" strokeWidth="9" fill="none" opacity=".85" strokeLinecap="round" />
      <path d="M16 60 L36 44 L50 56 L66 40 L84 60 Z" fill="#e2e8f0" />
      <Ribbon id="ar1" text="FREE" colors={["#bbf7d0", "#0f766e"]} ink="#fff" />
    </Sym>
  ),
  2: (
    <Medallion id="ar2" bg={["#e0f2fe", "#7dd3fc", "#075985"]}>
      <ellipse cx="50" cy="62" rx="28" ry="26" fill="#f8fafc" />
      <circle cx="28" cy="40" r="8" fill="#f8fafc" />
      <circle cx="72" cy="40" r="8" fill="#f8fafc" />
      <circle cx="40" cy="58" r="3" fill="#1e293b" />
      <circle cx="60" cy="58" r="3" fill="#1e293b" />
      <ellipse cx="50" cy="72" rx="10" ry="7" fill="#e2e8f0" />
      <ellipse cx="50" cy="69" rx="4" ry="3" fill="#1e293b" />
    </Medallion>
  ),
  3: (
    <Medallion id="ar3" bg={["#ede9fe", "#818cf8", "#312e81"]}>
      <ellipse cx="50" cy="62" rx="26" ry="30" fill="#f8fafc" />
      {[[38, 74], [56, 80], [62, 66], [42, 86]].map(([x, y]) => <path key={x} d={`M${x} ${y} l4 -3 l4 3`} stroke="#94a3b8" strokeWidth="2" fill="none" />)}
      <circle cx="40" cy="50" r="9" fill="#fde047" stroke="#1e293b" strokeWidth="2" />
      <circle cx="60" cy="50" r="9" fill="#fde047" stroke="#1e293b" strokeWidth="2" />
      <circle cx="40" cy="50" r="4" fill="#1e293b" />
      <circle cx="60" cy="50" r="4" fill="#1e293b" />
      <path d="M46 60 L50 66 L54 60 Z" fill="#1e293b" />
    </Medallion>
  ),
  4: (
    <Medallion id="ar4" bg={["#cffafe", "#22d3ee", "#164e63"]}>
      <path d="M50 92 C24 92 20 64 32 50 L26 22 L42 38 L58 38 L74 22 L68 50 C80 64 76 92 50 92 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <path d="M40 56 C42 52 46 52 48 56 M52 56 C54 52 58 52 60 56" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="50" cy="70" rx="4" ry="3" fill="#1e293b" />
    </Medallion>
  ),
  5: (
    <Medallion id="ar5" bg={["#e0f2fe", "#38bdf8", "#0c4a6e"]}>
      <ellipse cx="50" cy="66" rx="30" ry="22" fill="#94a3b8" />
      <circle cx="50" cy="48" r="20" fill="#94a3b8" />
      <circle cx="42" cy="44" r="4.5" fill="#0f172a" />
      <circle cx="58" cy="44" r="4.5" fill="#0f172a" />
      <circle cx="43" cy="43" r="1.5" fill="#fff" />
      <circle cx="59" cy="43" r="1.5" fill="#fff" />
      <ellipse cx="50" cy="54" rx="5" ry="3.5" fill="#0f172a" />
      <path d="M38 56 L26 54 M38 58 L26 60 M62 56 L74 54 M62 58 L74 60" stroke="#e2e8f0" strokeWidth="1.2" />
    </Medallion>
  ),
  6: <Badge id="ar6" colors={["#e0f2fe", "#38bdf8", "#0c4a6e"]} shape="hex" glyph={<path d="M50 24 L50 76 M28 37 L72 63 M72 37 L28 63 M44 28 L50 34 L56 28 M44 72 L50 66 L56 72" />} />,
  7: <Badge id="ar7" colors={["#f1f5f9", "#94a3b8", "#334155"]} shape="circle" glyph={<path d="M24 66 C24 40 76 40 76 66 Z M44 66 L44 56 C44 50 56 50 56 56 L56 66" />} />,
  8: <Badge id="ar8" colors={["#bbf7d0", "#15803d", "#052e16"]} shape="shield" glyph={<path d="M50 22 L66 46 L58 46 L70 62 L30 62 L42 46 L34 46 Z M50 62 L50 74" />} />,
  9: <Badge id="ar9" colors={["#e9d5ff", "#9333ea", "#3b0764"]} shape="diamond" glyph={<path d="M50 24 L64 44 L50 76 L36 44 Z M36 44 L64 44" />} />,
};
