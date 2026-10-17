/** Ouro do Velho Oeste · Coruja da Meia-Noite · Recife de Coral · Deusa da Lua · Fortuna Celta */
import type { ReactNode } from "react";
import { Badge, lin, Medallion, rad, Ribbon, Sym } from "./kit";

/* =========================================================== VELHO OESTE */
export const OESTE: Record<number, ReactNode> = {
  0: (
    <Sym id="ow0" defs={lin("ow0-s", ["#fef3c7", "#facc15", "#a16207"])}>
      <path d="M50 8 L58 30 L82 30 L62 44 L70 68 L50 54 L30 68 L38 44 L18 30 L42 30 Z" fill="url(#ow0-s)" stroke="#713f12" strokeWidth="2.5" strokeLinejoin="round" />
      {[[50, 8], [82, 30], [70, 68], [30, 68], [18, 30]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="4.5" fill="url(#ow0-s)" stroke="#713f12" strokeWidth="1.5" />)}
      <circle cx="50" cy="40" r="10" fill="none" stroke="#713f12" strokeWidth="2" />
      <Ribbon id="ow0" text="WILD" colors={["#fde68a", "#92400e"]} ink="#fff7d6" />
    </Sym>
  ),
  1: (
    <Sym id="ow1" defs={lin("ow1-p", ["#fef3c7", "#e7c78f", "#b08a4f"])}>
      <path d="M18 10 L82 10 L80 70 L20 72 Z" fill="url(#ow1-p)" stroke="#78350f" strokeWidth="2" />
      <text x="50" y="24" textAnchor="middle" fontFamily="Unbounded" fontWeight="900" fontSize="10" fill="#7c2d12">PROCURADO</text>
      <circle cx="50" cy="44" r="13" fill="#78350f" opacity=".85" />
      <path d="M36 38 C40 26 60 26 64 38 Z" fill="#422006" />
      <text x="50" y="66" textAnchor="middle" fontFamily="Unbounded" fontWeight="900" fontSize="9" fill="#7c2d12">$ RECOMPENSA</text>
      <Ribbon id="ow1" text="FREE" colors={["#fecaca", "#991b1b"]} ink="#fff" />
    </Sym>
  ),
  2: (
    <Medallion id="ow2" bg={["#fed7aa", "#ea580c", "#431407"]}>
      <path d="M20 100 L26 72 C36 62 64 62 74 72 L80 100 Z" fill="#78350f" />
      <path d="M36 66 L50 78 L64 66" fill="#dc2626" />
      <ellipse cx="50" cy="50" rx="15" ry="17" fill="#e0a96d" />
      <path d="M42 48 L47 48 M53 48 L58 48" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M42 58 C46 62 54 62 58 58" stroke="#422006" strokeWidth="4" fill="none" />
      <path d="M14 38 C20 30 80 30 86 38 C80 42 20 42 14 38 Z" fill="#451a03" />
      <path d="M32 36 C32 18 68 18 68 36 Z" fill="#451a03" />
      <rect x="32" y="30" width="36" height="4" fill="#a16207" />
    </Medallion>
  ),
  3: (
    <Medallion id="ow3" bg={["#fef3c7", "#d97706", "#451a03"]}>
      <path d="M30 96 C32 70 30 56 40 40 L48 28 C54 22 64 22 70 30 L76 44 C72 50 64 48 60 44 L56 60 L58 96 Z" fill="#92400e" />
      <path d="M48 28 C44 20 44 16 50 18 M40 40 C34 46 30 54 30 64" stroke="#1c1917" strokeWidth="4" fill="none" />
      <circle cx="66" cy="34" r="2.6" fill="#1c1917" />
      <path d="M70 42 L76 44" stroke="#1c1917" strokeWidth="2" />
    </Medallion>
  ),
  4: (
    <Medallion id="ow4" bg={["#ffedd5", "#fb923c", "#7c2d12"]}>
      <path d="M16 70 L16 44 C16 34 84 34 84 44 L84 70 Z" fill="#b91c1c" stroke="#450a0a" strokeWidth="2" />
      <rect x="26" y="46" width="16" height="12" rx="2" fill="#fde68a" />
      <rect x="58" y="46" width="16" height="12" rx="2" fill="#fde68a" />
      <path d="M12 40 L88 40" stroke="#451a03" strokeWidth="4" />
      {[30, 70].map((x) => (
        <g key={x}>
          <circle cx={x} cy="76" r="12" fill="none" stroke="#451a03" strokeWidth="4" />
          <path d={`M${x - 12} 76 L${x + 12} 76 M${x} 64 L${x} 88`} stroke="#451a03" strokeWidth="2" />
        </g>
      ))}
    </Medallion>
  ),
  5: (
    <Medallion id="ow5" bg={["#fef9c3", "#facc15", "#713f12"]}>
      <path d="M44 100 L44 30 C44 20 56 20 56 30 L56 100 Z M44 60 L30 60 L30 40 C30 32 38 32 38 40 L38 52 L44 52 M56 50 L70 50 L70 34 C70 26 62 26 62 34 L62 44 L56 44" fill="#16a34a" stroke="#14532d" strokeWidth="2" />
      <circle cx="50" cy="20" r="4" fill="#f472b6" />
    </Medallion>
  ),
  6: <Badge id="ow6" colors={["#fde68a", "#b45309", "#451a03"]} shape="shield" glyph={<path d="M24 56 C30 52 70 52 76 56 M34 54 C34 34 66 34 66 54" />} />,
  7: <Badge id="ow7" colors={["#e2e8f0", "#64748b", "#1e293b"]} shape="circle" glyph={<path d="M34 34 C30 56 36 70 50 70 C64 70 70 56 66 34 M34 34 L40 34 M60 34 L66 34" />} />,
  8: <Badge id="ow8" colors={["#fecaca", "#b91c1c", "#450a0a"]} shape="hex" glyph={<path d="M30 46 L66 46 L70 40 L74 46 M36 46 L36 64 L46 64 L46 52" />} />,
  9: <Badge id="ow9" colors={["#d9f99d", "#4d7c0f", "#1a2e05"]} shape="diamond" glyph={<path d="M44 28 L56 28 M46 28 L46 40 C38 44 38 72 46 74 L54 74 C62 72 62 44 54 40 L54 28" />} />,
  10: (
    <Sym id="ow10" defs={rad("ow10-b", ["#fef3c7", "#d6a95c", "#7c4a1e"], "45%", "40%")}>
      <path d="M30 34 C20 50 20 82 50 84 C80 82 80 50 70 34 Z" fill="url(#ow10-b)" stroke="#451a03" strokeWidth="2.5" />
      <path d="M34 34 C40 26 60 26 66 34" stroke="#451a03" strokeWidth="4" fill="none" />
      <path d="M40 22 L50 30 L60 22" stroke="#a16207" strokeWidth="3" fill="none" />
      <text x="50" y="64" textAnchor="middle" fontFamily="Unbounded" fontWeight="900" fontSize="20" fill="#451a03" opacity=".35">$</text>
    </Sym>
  ),
};

/* =========================================================== CORUJA DA MEIA-NOITE */
export const CORUJA: Record<number, ReactNode> = {
  0: (
    <Sym id="cj0" defs={rad("cj0-b", ["#e9d5ff", "#7c3aed", "#2e1065"], "50%", "40%")}>
      <ellipse cx="50" cy="44" rx="30" ry="32" fill="url(#cj0-b)" />
      <path d="M24 22 L32 8 L40 22 M76 22 L68 8 L60 22" fill="#5b21b6" />
      <circle cx="38" cy="38" r="11" fill="#fef9c3" stroke="#facc15" strokeWidth="3" />
      <circle cx="62" cy="38" r="11" fill="#fef9c3" stroke="#facc15" strokeWidth="3" />
      <circle cx="38" cy="38" r="5" fill="#1e1b4b" />
      <circle cx="62" cy="38" r="5" fill="#1e1b4b" />
      <path d="M46 48 L50 56 L54 48 Z" fill="#f59e0b" />
      <Ribbon id="cj0" text="WILD" colors={["#e9d5ff", "#5b21b6"]} ink="#fff" />
    </Sym>
  ),
  1: (
    <Sym id="cj1" defs={rad("cj1-m", ["#ffffff", "#e0e7ff", "#a5b4fc"], "40%", "35%")}>
      <circle cx="50" cy="40" r="32" fill="#0f0a2e" stroke="url(#cj1-gold)" strokeWidth="3" />
      <circle cx="50" cy="38" r="20" fill="url(#cj1-m)" />
      <circle cx="44" cy="32" r="4" fill="#c7d2fe" />
      <circle cx="56" cy="44" r="3" fill="#c7d2fe" />
      <path d="M22 62 C34 54 40 60 50 58 C60 56 68 52 78 60" stroke="#1e1b4b" strokeWidth="6" fill="none" />
      <Ribbon id="cj1" text="FREE" colors={["#e0e7ff", "#3730a3"]} ink="#fff" />
    </Sym>
  ),
  2: (
    <Medallion id="cj2" bg={["#fed7aa", "#f97316", "#431407"]}>
      <path d="M26 96 C26 70 36 56 50 56 C64 56 74 70 74 96 Z" fill="#ea580c" />
      <path d="M28 30 L36 46 L50 40 L64 46 L72 30 L60 36 L50 30 L40 36 Z" fill="#ea580c" />
      <path d="M32 46 C32 70 50 76 50 76 C50 76 68 70 68 46 C60 40 40 40 32 46 Z" fill="#f97316" />
      <path d="M38 58 C44 66 56 66 62 58 C56 72 44 72 38 58 Z" fill="#fff7ed" />
      <path d="M40 52 L46 54 M60 52 L54 54" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="66" r="3" fill="#1c1917" />
    </Medallion>
  ),
  3: (
    <Medallion id="cj3" bg={["#fef3c7", "#a16207", "#1c1917"]}>
      <path d="M36 30 C30 20 26 12 20 10 M36 30 C28 22 22 24 16 22 M64 30 C70 20 74 12 80 10 M64 30 C72 22 78 24 84 22" stroke="#d6d3d1" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M36 40 C34 60 42 76 50 78 C58 76 66 60 64 40 C58 32 42 32 36 40 Z" fill="#b45309" />
      <circle cx="43" cy="48" r="2.8" fill="#1c1917" />
      <circle cx="57" cy="48" r="2.8" fill="#1c1917" />
      <ellipse cx="50" cy="72" rx="6" ry="4" fill="#1c1917" />
      <path d="M30 36 L36 42 M70 36 L64 42" stroke="#b45309" strokeWidth="6" strokeLinecap="round" />
    </Medallion>
  ),
  4: (
    <Medallion id="cj4" bg={["#e7e5e4", "#78716c", "#1c1917"]}>
      <path d="M18 70 C18 42 40 30 62 36 C80 40 86 56 82 70 Z" fill="#57534e" />
      {Array.from({ length: 12 }).map((_, i) => <path key={i} d={`M${24 + i * 5} ${60 - Math.sin(i / 2) * 18} L${22 + i * 5} ${48 - Math.sin(i / 2) * 18}`} stroke="#292524" strokeWidth="3" strokeLinecap="round" />)}
      <ellipse cx="78" cy="62" rx="10" ry="8" fill="#d6d3d1" />
      <circle cx="84" cy="60" r="2.5" fill="#1c1917" />
      <circle cx="80" cy="56" r="1.8" fill="#1c1917" />
    </Medallion>
  ),
  5: (
    <Sym id="cj5" defs={<>{rad("cj5-c", ["#fecaca", "#ef4444", "#7f1d1d"], "40%", "30%")}{lin("cj5-s", ["#fff7ed", "#e7e5e4"])}</>}>
      <path d="M14 50 C14 20 86 20 86 50 C86 56 14 56 14 50 Z" fill="url(#cj5-c)" stroke="#7f1d1d" strokeWidth="2" />
      {[[32, 36], [52, 30], [70, 40], [42, 46]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="5" fill="#fff" />)}
      <path d="M38 54 L36 86 C44 90 56 90 64 86 L62 54 Z" fill="url(#cj5-s)" stroke="#a8a29e" strokeWidth="2" />
    </Sym>
  ),
  6: <Badge id="cj6" colors={["#fef3c7", "#f59e0b", "#451a03"]} shape="shield" glyph={<><rect x="38" y="38" width="24" height="30" rx="4" /><path d="M42 38 C42 28 58 28 58 38 M50 48 L50 58" /></>} />,
  7: <Badge id="cj7" colors={["#e0e7ff", "#6366f1", "#1e1b4b"]} shape="circle" glyph={<path d="M34 70 C40 50 52 36 68 30 C62 46 52 60 34 70 Z M34 70 L60 40" />} />,
  8: <Badge id="cj8" colors={["#fed7aa", "#c2410c", "#431407"]} shape="hex" glyph={<path d="M36 46 C36 30 64 30 64 46 Z M38 46 C36 62 44 72 50 72 C56 72 64 62 62 46 M50 30 L50 24" />} />,
  9: <Badge id="cj9" colors={["#fef9c3", "#facc15", "#713f12"]} shape="diamond" glyph={<path d="M50 28 L56 44 L72 46 L60 56 L64 72 L50 64 L36 72 L40 56 L28 46 L44 44 Z" />} />,
};

/* =========================================================== RECIFE DE CORAL */
export const RECIFE: Record<number, ReactNode> = {
  0: (
    <Sym id="rc0" defs={rad("rc0-b", ["#bae6fd", "#0284c7", "#082f49"], "50%", "40%")}>
      <circle cx="50" cy="42" r="32" fill="url(#rc0-b)" />
      <path d="M26 30 C26 14 74 14 74 30 Z" fill="#facc15" stroke="#a16207" strokeWidth="2" />
      <path d="M20 30 L80 30" stroke="#a16207" strokeWidth="4" />
      <ellipse cx="50" cy="44" rx="14" ry="13" fill="#e0a96d" />
      <path d="M36 52 C36 70 64 70 64 52 C58 58 42 58 36 52 Z" fill="#f8fafc" />
      <circle cx="44" cy="42" r="2.5" fill="#111" />
      <circle cx="56" cy="42" r="2.5" fill="#111" />
      <path d="M74 20 L86 60" stroke="#a16207" strokeWidth="3" />
      <Ribbon id="rc0" text="WILD" colors={["#bae6fd", "#0369a1"]} ink="#fff" />
    </Sym>
  ),
  1: (
    <Sym id="rc1" defs={lin("rc1-s", ["#fff1f2", "#fda4af", "#e11d48"])}>
      <path d="M50 70 L14 34 C24 14 76 14 86 34 Z" fill="url(#rc1-s)" stroke="#9f1239" strokeWidth="2" />
      {[-3, -2, -1, 0, 1, 2, 3].map((i) => <path key={i} d={`M50 70 L${50 + i * 11} ${18 + Math.abs(i) * 3}`} stroke="#9f1239" strokeWidth="1.8" />)}
      <circle cx="50" cy="60" r="6" fill="#fff" stroke="#fda4af" />
      <Ribbon id="rc1" text="FREE" colors={["#fecdd3", "#be123c"]} ink="#fff" />
    </Sym>
  ),
  2: (
    <Medallion id="rc2" bg={["#ccfbf1", "#14b8a6", "#042f2e"]}>
      <ellipse cx="46" cy="56" rx="28" ry="20" fill="#4d7c0f" stroke="#1a2e05" strokeWidth="2" />
      {[[36, 50], [50, 46], [58, 58], [42, 62]].map(([x, y]) => <path key={`${x}${y}`} d={`M${x - 6} ${y} l6 -6 l6 6 l-6 6z`} fill="#65a30d" stroke="#1a2e05" />)}
      <ellipse cx="80" cy="50" rx="10" ry="8" fill="#84cc16" />
      <circle cx="84" cy="48" r="2" fill="#111" />
      <path d="M26 70 L18 80 M40 74 L36 86 M58 74 L62 86" stroke="#84cc16" strokeWidth="6" strokeLinecap="round" />
    </Medallion>
  ),
  3: (
    <Medallion id="rc3" bg={["#e0f2fe", "#0ea5e9", "#082f49"]}>
      <path d="M14 50 C30 26 70 26 82 50 C70 74 30 74 14 50 Z" fill="#f97316" />
      <path d="M34 32 C30 44 30 56 34 68 M56 30 C52 44 52 56 56 70" stroke="#fff" strokeWidth="7" fill="none" />
      <path d="M34 32 C30 44 30 56 34 68 M56 30 C52 44 52 56 56 70" stroke="#111" strokeWidth="1.5" fill="none" />
      <path d="M82 50 L94 38 L94 62 Z" fill="#f97316" />
      <circle cx="24" cy="46" r="3.5" fill="#111" />
    </Medallion>
  ),
  4: (
    <Medallion id="rc4" bg={["#f5d0fe", "#c026d3", "#3b0764"]}>
      <ellipse cx="50" cy="40" rx="22" ry="20" fill="#a21caf" />
      <circle cx="42" cy="40" r="4" fill="#fff" />
      <circle cx="58" cy="40" r="4" fill="#fff" />
      <circle cx="42" cy="41" r="2" fill="#111" />
      <circle cx="58" cy="41" r="2" fill="#111" />
      {[-30, -15, 0, 15, 30].map((a, i) => <path key={a} d={`M${36 + i * 7} 56 C${30 + i * 9} 74 ${40 + i * 6} 82 ${34 + i * 8} 94`} stroke="#a21caf" strokeWidth="6" fill="none" strokeLinecap="round" />)}
    </Medallion>
  ),
  5: (
    <Medallion id="rc5" bg={["#fef9c3", "#eab308", "#422006"]}>
      <path d="M56 18 C40 18 40 34 50 38 C60 44 60 58 48 64 C40 70 42 82 52 86 C46 76 56 72 60 64 C70 50 62 38 54 34 C48 30 54 22 62 22 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
      <circle cx="56" cy="24" r="2" fill="#111" />
      <path d="M62 22 L72 24" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
    </Medallion>
  ),
  6: <Badge id="rc6" colors={["#fecdd3", "#f43f5e", "#4c0519"]} shape="shield" glyph={<path d="M50 74 L50 46 M50 54 L38 38 M50 50 L62 34 M38 38 L32 30 M62 34 L68 28 M50 46 L50 28" />} />,
  7: <Badge id="rc7" colors={["#fed7aa", "#fb923c", "#7c2d12"]} shape="circle" glyph={<path d="M50 26 L56 44 L74 44 L60 56 L66 74 L50 62 L34 74 L40 56 L26 44 L44 44 Z" />} />,
  8: <Badge id="rc8" colors={["#cffafe", "#22d3ee", "#164e63"]} shape="hex" glyph={<><circle cx="44" cy="52" r="12" /><circle cx="60" cy="38" r="7" /><circle cx="62" cy="62" r="5" /></>} />,
  9: <Badge id="rc9" colors={["#d1fae5", "#10b981", "#022c22"]} shape="diamond" glyph={<path d="M42 74 C34 60 50 52 42 38 C38 32 42 26 46 24 M58 74 C66 60 50 52 58 38 C62 32 58 26 54 24" />} />,
  10: (
    <Sym id="rc10" defs={rad("rc10-f", ["#fff7d6", "#facc15", "#a16207"], "40%", "35%")}>
      <path d="M12 50 C26 24 66 24 80 50 C66 76 26 76 12 50 Z" fill="url(#rc10-f)" stroke="#713f12" strokeWidth="2.5" />
      <path d="M80 50 L94 36 L94 64 Z" fill="url(#rc10-f)" stroke="#713f12" strokeWidth="2" />
      <circle cx="26" cy="46" r="4" fill="#111" />
      <path d="M40 34 C46 42 46 58 40 66 M54 32 C60 42 60 58 54 68" stroke="#a16207" strokeWidth="2.5" fill="none" />
    </Sym>
  ),
};

/* =========================================================== DEUSA DA LUA */
export const LUA: Record<number, ReactNode> = {
  0: (
    <Sym id="lu0" defs={rad("lu0-b", ["#e0e7ff", "#818cf8", "#1e1b4b"], "50%", "45%")}>
      <circle cx="50" cy="42" r="32" fill="url(#lu0-b)" />
      <path d="M30 20 C20 40 30 66 54 70 C34 62 30 40 42 22 Z" fill="#fef9c3" />
      <ellipse cx="54" cy="44" rx="13" ry="15" fill="#f1f5f9" />
      <path d="M40 34 C40 18 70 18 68 36 C62 28 50 28 40 34 Z" fill="#c7d2fe" />
      <path d="M48 42 L52 42 M58 42 L60 42" stroke="#312e81" strokeWidth="2" strokeLinecap="round" />
      <circle cx="54" cy="28" r="3" fill="#fde047" />
      <Ribbon id="lu0" text="WILD" colors={["#e0e7ff", "#4338ca"]} ink="#fef9c3" />
    </Sym>
  ),
  1: (
    <Sym id="lu1" defs={lin("lu1-m", ["#ffffff", "#c7d2fe", "#6366f1"])}>
      <circle cx="50" cy="20" r="12" fill="#fef9c3" />
      <path d="M14 70 L14 44 L50 28 L86 44 L86 70 Z" fill="url(#lu1-m)" stroke="url(#lu1-gold)" strokeWidth="3" />
      {[24, 40, 56, 72].map((x) => <rect key={x} x={x} y="46" width="5" height="24" fill="#312e81" opacity=".5" />)}
      <Ribbon id="lu1" text="FREE" colors={["#e0e7ff", "#4338ca"]} ink="#fef9c3" />
    </Sym>
  ),
  2: (
    <Medallion id="lu2" bg={["#ffffff", "#c7d2fe", "#312e81"]}>
      <ellipse cx="50" cy="66" rx="22" ry="20" fill="#f8fafc" />
      <ellipse cx="50" cy="44" rx="16" ry="14" fill="#f8fafc" />
      <ellipse cx="40" cy="20" rx="5" ry="16" fill="#f8fafc" stroke="#e0e7ff" />
      <ellipse cx="60" cy="20" rx="5" ry="16" fill="#f8fafc" stroke="#e0e7ff" />
      <ellipse cx="40" cy="22" rx="2" ry="10" fill="#fbcfe8" />
      <ellipse cx="60" cy="22" rx="2" ry="10" fill="#fbcfe8" />
      <circle cx="44" cy="44" r="2.5" fill="#be123c" />
      <circle cx="56" cy="44" r="2.5" fill="#be123c" />
      <path d="M48 50 L50 52 L52 50" stroke="#f472b6" strokeWidth="2" fill="none" />
    </Medallion>
  ),
  3: (
    <Medallion id="lu3" bg={["#f1f5f9", "#94a3b8", "#0f172a"]}>
      <path d="M38 40 C30 30 24 18 30 10 M38 40 C28 34 18 32 14 24 M62 40 C70 30 76 18 70 10 M62 40 C72 34 82 32 86 24" stroke="#e2e8f0" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M38 44 C36 62 44 78 50 80 C56 78 64 62 62 44 C56 36 44 36 38 44 Z" fill="#cbd5e1" />
      <circle cx="44" cy="52" r="2.6" fill="#1e293b" />
      <circle cx="56" cy="52" r="2.6" fill="#1e293b" />
      <ellipse cx="50" cy="74" rx="5" ry="3.5" fill="#1e293b" />
    </Medallion>
  ),
  4: (
    <Medallion id="lu4" bg={["#ffffff", "#e2e8f0", "#475569"]}>
      <ellipse cx="50" cy="56" rx="22" ry="26" fill="#f8fafc" />
      <circle cx="40" cy="48" r="9" fill="#fef9c3" stroke="#facc15" strokeWidth="2" />
      <circle cx="60" cy="48" r="9" fill="#fef9c3" stroke="#facc15" strokeWidth="2" />
      <circle cx="40" cy="48" r="4" fill="#111" />
      <circle cx="60" cy="48" r="4" fill="#111" />
      <path d="M47 58 L50 64 L53 58 Z" fill="#475569" />
      {[[36, 72], [50, 76], [64, 72]].map(([x, y]) => <path key={x} d={`M${x - 3} ${y} l3 3 l3 -3`} stroke="#94a3b8" strokeWidth="2" fill="none" />)}
    </Medallion>
  ),
  5: (
    <Sym id="lu5" defs={lin("lu5-h", ["#fef9c3", "#facc15", "#a16207"])}>
      <path d="M28 88 C20 60 26 26 50 14 C40 34 42 60 52 80 L70 80 C76 60 72 40 64 30" fill="none" stroke="url(#lu5-h)" strokeWidth="7" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={38 + i * 6} y1={30 + i * 6} x2={44 + i * 5} y2="80" stroke="#e0e7ff" strokeWidth="1.5" />)}
      <circle cx="50" cy="14" r="4" fill="#c7d2fe" />
    </Sym>
  ),
  6: <Badge id="lu6" colors={["#e0e7ff", "#818cf8", "#1e1b4b"]} shape="circle" glyph={<><circle cx="50" cy="44" r="16" /><path d="M50 60 L50 76 M42 76 L58 76" /></>} />,
  7: <Badge id="lu7" colors={["#f8fafc", "#cbd5e1", "#475569"]} shape="hex" glyph={<><circle cx="50" cy="50" r="14" /><circle cx="44" cy="44" r="3" /></>} />,
  8: <Badge id="lu8" colors={["#ede9fe", "#a78bfa", "#2e1065"]} shape="shield" glyph={<path d="M50 72 C40 62 32 54 36 42 C42 48 46 54 50 62 C54 54 58 48 64 42 C68 54 60 62 50 72 M50 62 L50 30 M50 30 C44 36 44 42 50 46 C56 42 56 36 50 30" />} />,
  9: <Badge id="lu9" colors={["#fef9c3", "#facc15", "#713f12"]} shape="diamond" glyph={<path d="M50 28 L54 46 L72 50 L54 54 L50 72 L46 54 L28 50 L46 46 Z" />} />,
  10: (
    <Sym id="lu10" defs={rad("lu10-o", ["#ffffff", "#c7d2fe", "#6366f1", "#1e1b4b"])}>
      <circle cx="50" cy="50" r="36" fill="url(#lu10-o)" stroke="#e0e7ff" strokeWidth="3" />
      <path d="M38 26 C26 40 30 66 54 72 C38 64 34 42 46 28 Z" fill="#fef9c3" opacity=".6" />
      <ellipse cx="38" cy="34" rx="9" ry="5" fill="#fff" opacity=".6" transform="rotate(-30 38 34)" />
    </Sym>
  ),
};

/* =========================================================== FORTUNA CELTA */
export const CELTA: Record<number, ReactNode> = {
  0: (
    <Sym id="ct0" defs={rad("ct0-f", ["#fde7c7", "#e0a96d", "#7c4a1e"], "50%", "40%")}>
      <path d="M28 32 L50 4 L72 32 Z" fill="#15803d" stroke="#052e16" strokeWidth="2" />
      <path d="M22 32 L78 32" stroke="#052e16" strokeWidth="5" strokeLinecap="round" />
      <rect x="42" y="24" width="16" height="8" fill="#facc15" stroke="#713f12" strokeWidth="1.5" />
      <ellipse cx="50" cy="46" rx="16" ry="14" fill="url(#ct0-f)" />
      <path d="M34 50 C34 76 66 76 66 50 C58 58 42 58 34 50 Z" fill="#ea580c" />
      <circle cx="44" cy="44" r="2.5" fill="#111" />
      <circle cx="56" cy="44" r="2.5" fill="#111" />
      <path d="M45 52 C48 54 52 54 55 52" stroke="#7c2d12" strokeWidth="2" fill="none" />
      <Ribbon id="ct0" text="WILD" colors={["#bbf7d0", "#15803d"]} ink="#fef9c3" />
    </Sym>
  ),
  1: (
    <Sym id="ct1">
      {["#ef4444", "#f97316", "#facc15", "#22c55e", "#3b82f6", "#8b5cf6"].map((c, i) => (
        <path key={c} d={`M${12 + i * 4} 66 C${12 + i * 4} ${30 - i * 0} ${88 - i * 4} ${30 - i * 0} ${88 - i * 4} 66`} stroke={c} strokeWidth="4.5" fill="none" />
      ))}
      <ellipse cx="18" cy="66" rx="10" ry="5" fill="#f8fafc" />
      <ellipse cx="82" cy="66" rx="10" ry="5" fill="#f8fafc" />
      <Ribbon id="ct1" text="FREE" colors={["#bbf7d0", "#15803d"]} ink="#fef9c3" />
    </Sym>
  ),
  2: (
    <Medallion id="ct2" bg={["#bbf7d0", "#16a34a", "#052e16"]}>
      {[[34, 40], [50, 34], [66, 40], [42, 48], [58, 48], [50, 44]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="8" fill="#facc15" stroke="#a16207" strokeWidth="1.5" />)}
      <path d="M22 50 L78 50 L72 86 C66 92 34 92 28 86 Z" fill="#1c1917" />
      <path d="M20 50 L80 50" stroke="#44403c" strokeWidth="6" strokeLinecap="round" />
      <path d="M30 86 L26 94 M70 86 L74 94" stroke="#1c1917" strokeWidth="4" />
    </Medallion>
  ),
  3: (
    <Sym id="ct3" defs={lin("ct3-h", ["#fef3c7", "#d97706", "#78350f"])}>
      <path d="M26 88 L26 30 C26 14 46 10 58 18 C70 26 74 44 82 50 C80 70 70 82 66 88 Z" fill="none" stroke="url(#ct3-h)" strokeWidth="7" strokeLinejoin="round" />
      {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={32 + i * 7} y1={24 + i * 4} x2={32 + i * 7} y2="86" stroke="#fef9c3" strokeWidth="1.5" />)}
      <path d="M26 30 C20 30 18 22 24 18" stroke="url(#ct3-h)" strokeWidth="5" fill="none" />
    </Sym>
  ),
  4: (
    <Medallion id="ct4" bg={["#dcfce7", "#4ade80", "#14532d"]}>
      <path d="M20 96 C24 70 30 56 44 46 L50 30 C56 22 68 22 72 32 L78 42 C74 48 66 46 62 42 L60 56 L64 96 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
      <path d="M50 30 C44 22 40 14 48 16 M44 46 C36 52 32 60 30 70" stroke="#e2e8f0" strokeWidth="5" fill="none" />
      <circle cx="66" cy="34" r="2.5" fill="#1c1917" />
      <path d="M52 22 L48 8" stroke="#facc15" strokeWidth="3" />
    </Medallion>
  ),
  5: (
    <Sym id="ct5" defs={lin("ct5-g", ["#fef3c7", "#facc15", "#a16207"])}>
      <path d="M28 16 L72 16 C72 46 60 56 50 58 C40 56 28 46 28 16 Z" fill="url(#ct5-g)" stroke="#713f12" strokeWidth="2" />
      <path d="M46 58 L46 76 L54 76 L54 58 M32 88 C34 78 66 78 68 88 Z" fill="url(#ct5-g)" stroke="#713f12" strokeWidth="2" />
      <circle cx="50" cy="34" r="7" fill="#16a34a" stroke="#052e16" />
    </Sym>
  ),
  6: <Badge id="ct6" colors={["#bbf7d0", "#16a34a", "#052e16"]} shape="circle" glyph={<><circle cx="40" cy="42" r="9" /><circle cx="60" cy="42" r="9" /><circle cx="40" cy="58" r="9" /><circle cx="60" cy="58" r="9" /></>} />,
  7: <Badge id="ct7" colors={["#e2e8f0", "#94a3b8", "#1e293b"]} shape="shield" glyph={<path d="M34 30 C30 56 36 70 50 70 C64 70 70 56 66 30" />} />,
  8: <Badge id="ct8" colors={["#fecaca", "#dc2626", "#450a0a"]} shape="hex" glyph={<path d="M30 50 C30 34 70 34 70 50 Z M44 50 L44 70 L56 70 L56 50 M40 42 L42 42 M56 40 L58 40" />} />,
  9: <Badge id="ct9" colors={["#fef9c3", "#ca8a04", "#422006"]} shape="diamond" glyph={<><circle cx="50" cy="50" r="18" /><path d="M50 38 L50 62 M42 44 L58 44" /></>} />,
};
