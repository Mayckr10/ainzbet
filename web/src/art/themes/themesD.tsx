/** Rainha do Nilo · Tigre Dourado · Vikings do Norte · Cassino Vampiro · Samurai Sombrio */
import type { ReactNode } from "react";
import { Badge, lin, Medallion, rad, Ribbon, Sym } from "./kit";

/* =========================================================== RAINHA DO NILO */
const scroll = (id: string, label: string, colors: [string, string], ink: string) => (
  <Sym id={id} defs={<>{lin(`${id}-p`, ["#fef3c7", "#fcd34d", "#d97706"])}{lin(`${id}-r`, ["#fde68a", "#92400e"])}</>}>
    <rect x="22" y="16" width="56" height="52" rx="4" fill={`url(#${id}-p)`} stroke="#78350f" strokeWidth="2" />
    <rect x="14" y="10" width="72" height="10" rx="5" fill={`url(#${id}-r)`} stroke="#78350f" strokeWidth="1.5" />
    <rect x="14" y="64" width="72" height="10" rx="5" fill={`url(#${id}-r)`} stroke="#78350f" strokeWidth="1.5" />
    <path d="M36 30 C40 24 48 24 50 32 C52 24 60 24 64 30 C60 40 50 46 50 46 C50 46 40 40 36 30 Z" fill="#0e7490" />
    <path d="M40 52 H60 M44 58 H56" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
    <Ribbon id={id} text={label} colors={colors} ink={ink} />
  </Sym>
);
export const NILO: Record<number, ReactNode> = {
  0: scroll("ni0", "WILD", ["#a5f3fc", "#0e7490"], "#fff7d6"),
  1: scroll("ni1", "FREE", ["#fde68a", "#b45309"], "#3b1d00"),
  2: (
    <Medallion id="ni2" bg={["#a5f3fc", "#0891b2", "#164e63"]}>
      <path d="M22 100 L28 74 C36 66 64 66 72 74 L78 100 Z" fill="#facc15" />
      <path d="M28 76 L72 76 L68 84 L32 84 Z" fill="#0e7490" />
      <path d="M26 30 L26 74 L74 74 L74 30 C74 14 26 14 26 30 Z" fill="#111827" />
      <ellipse cx="50" cy="48" rx="15" ry="18" fill="#c08457" />
      <path d="M36 42 L46 42 M54 42 L64 42" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M38 46 C40 44 44 44 46 46 M54 46 C56 44 60 44 62 46" stroke="#0e7490" strokeWidth="2" fill="none" />
      <path d="M45 58 C48 60 52 60 55 58" stroke="#9f1239" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M30 26 C40 18 60 18 70 26 L66 32 C56 26 44 26 34 32 Z" fill="url(#ni2-gold)" />
      <path d="M50 14 C46 8 54 6 52 14 C56 10 58 18 50 20 Z" fill="#facc15" stroke="#a16207" strokeWidth="1" />
    </Medallion>
  ),
  3: (
    <Medallion id="ni3" bg={["#fef3c7", "#f59e0b", "#78350f"]}>
      <path d="M32 96 C30 70 36 52 50 48 C64 52 70 70 68 96 Z" fill="#1f2937" />
      <path d="M36 50 L32 22 L46 40 Z M64 50 L68 22 L54 40 Z" fill="#1f2937" />
      <ellipse cx="50" cy="52" rx="16" ry="14" fill="#1f2937" />
      <ellipse cx="43" cy="50" rx="3.5" ry="4.5" fill="#fde047" />
      <ellipse cx="57" cy="50" rx="3.5" ry="4.5" fill="#fde047" />
      <path d="M43 48 V52 M57 48 V52" stroke="#111" strokeWidth="1.5" />
      <path d="M36 70 C44 74 56 74 64 70" stroke="url(#ni3-gold)" strokeWidth="4" fill="none" />
      <circle cx="50" cy="74" r="3.5" fill="#06b6d4" />
    </Medallion>
  ),
  4: (
    <Medallion id="ni4" bg={["#fff7ed", "#fdba74", "#9a3412"]}>
      <path d="M12 52 C30 40 42 44 50 52 C58 44 70 40 88 52 C72 50 62 56 56 64 L44 64 C38 56 28 50 12 52 Z" fill="#78350f" />
      <path d="M44 64 L50 86 L56 64 Z" fill="#92400e" />
      <circle cx="50" cy="40" r="10" fill="#a16207" />
      <circle cx="53" cy="38" r="2.4" fill="#fde047" />
      <path d="M58 40 L66 43 L58 45 Z" fill="#fbbf24" />
      <path d="M46 44 C44 48 46 52 50 52" stroke="#0e7490" strokeWidth="2" fill="none" />
    </Medallion>
  ),
  5: (
    <Medallion id="ni5" bg={["#d9f99d", "#65a30d", "#1a2e05"]}>
      <path d="M50 96 C38 80 60 70 50 56 C42 44 46 34 50 30" stroke="#a16207" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M34 26 C34 12 66 12 66 26 C66 40 56 42 50 34 C44 42 34 40 34 26 Z" fill="#ca8a04" stroke="#713f12" strokeWidth="2" />
      <circle cx="44" cy="24" r="2.6" fill="#111" />
      <circle cx="56" cy="24" r="2.6" fill="#111" />
      <path d="M50 30 L50 38 M47 38 L50 42 L53 38" stroke="#dc2626" strokeWidth="2" fill="none" />
    </Medallion>
  ),
  6: <Badge id="ni6" colors={["#a5f3fc", "#0891b2", "#164e63"]} shape="circle" glyph={<><path d="M28 40 C34 64 66 64 72 40" /><circle cx="36" cy="52" r="3" /><circle cx="50" cy="58" r="3" /><circle cx="64" cy="52" r="3" /></>} />,
  7: <Badge id="ni7" colors={["#fed7aa", "#ea580c", "#7c2d12"]} shape="shield" glyph={<path d="M40 28 L60 28 M42 28 C34 40 34 66 42 74 L58 74 C66 66 66 40 58 28 M38 46 L62 46" />} />,
  8: <Badge id="ni8" colors={["#bfdbfe", "#2563eb", "#1e3a8a"]} shape="hex" glyph={<path d="M50 70 C40 60 32 52 36 40 C42 46 46 52 50 60 C54 52 58 46 64 40 C68 52 60 60 50 70 M50 60 L50 32" />} />,
  9: <Badge id="ni9" colors={["#f1f5f9", "#94a3b8", "#334155"]} shape="diamond" glyph={<path d="M58 30 C44 32 38 44 40 54 C42 66 54 72 64 68 C52 66 46 58 46 48 C46 40 52 34 58 30 Z" />} />,
};

/* =========================================================== TIGRE DOURADO */
const tigerHead = (id: string) => (
  <g>
    <defs>{rad(`${id}-f`, ["#fff7d6", "#fbbf24", "#c2410c"], "50%", "40%")}</defs>
    <path d="M22 26 L32 14 L40 28 Z M78 26 L68 14 L60 28 Z" fill="#c2410c" stroke="#1c1917" strokeWidth="2" />
    <ellipse cx="50" cy="48" rx="32" ry="30" fill={`url(#${id}-f)`} stroke="#1c1917" strokeWidth="2" />
    <path d="M50 20 L46 30 L50 34 L54 30 Z M24 42 L34 44 M24 52 L34 50 M76 42 L66 44 M76 52 L66 50 M40 22 L42 32 M60 22 L58 32" stroke="#1c1917" strokeWidth="3.5" strokeLinecap="round" fill="#1c1917" />
    <ellipse cx="50" cy="62" rx="16" ry="11" fill="#fff7ed" />
    <path d="M38 44 L46 46 L38 48 Z M62 44 L54 46 L62 48 Z" fill="#16a34a" stroke="#1c1917" strokeWidth="1.5" />
    <path d="M45 56 L55 56 L50 62 Z" fill="#7f1d1d" />
    <path d="M50 62 V66 M50 66 Q44 70 40 66 M50 66 Q56 70 60 66" stroke="#1c1917" strokeWidth="2" fill="none" />
  </g>
);
export const TIGRE: Record<number, ReactNode> = {
  0: <Sym id="tg0">{tigerHead("tg0")}<Ribbon id="tg0" text="WILD" colors={["#fde68a", "#b91c1c"]} ink="#fff7d6" /></Sym>,
  1: (
    <Sym id="tg1" defs={lin("tg1-r", ["#f87171", "#991b1b"])}>
      <path d="M14 34 L50 14 L86 34 Z" fill="url(#tg1-r)" stroke="url(#tg1-gold)" strokeWidth="3" />
      <path d="M22 52 L50 36 L78 52 Z" fill="url(#tg1-r)" stroke="url(#tg1-gold)" strokeWidth="3" />
      <rect x="30" y="34" width="40" height="8" fill="#7f1d1d" />
      <rect x="32" y="52" width="36" height="20" fill="#7f1d1d" />
      <rect x="44" y="58" width="12" height="14" rx="6" fill="url(#tg1-gold)" />
      <Ribbon id="tg1" text="FREE" colors={["#fde68a", "#b91c1c"]} ink="#fff7d6" />
    </Sym>
  ),
  2: (
    <Medallion id="tg2" bg={["#fef3c7", "#f97316", "#7c2d12"]}>
      <path d="M22 100 L28 72 C38 62 62 62 72 72 L78 100 Z" fill="#ea580c" />
      <path d="M40 66 L50 100 L60 66" fill="#fde047" />
      <ellipse cx="50" cy="46" rx="16" ry="19" fill="#fcd9b6" />
      <path d="M43 44 C44 42 46 42 47 44 M53 44 C54 42 56 42 57 44" stroke="#1c1917" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M46 56 C48 57 52 57 54 56" stroke="#9a3412" strokeWidth="2" fill="none" />
      <circle cx="50" cy="34" r="2" fill="#dc2626" />
      <path d="M30 86 L30 70 M70 86 L70 70" stroke="#78350f" strokeWidth="3" />
    </Medallion>
  ),
  3: (
    <Medallion id="tg3" bg={["#fce7f3", "#f472b6", "#831843"]}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <ellipse key={i} cx="50" cy="30" rx="8" ry="20" fill={i % 2 ? "#fbcfe8" : "#f9a8d4"} stroke="#be185d" strokeWidth="1.2" transform={`rotate(${i * 45} 50 50)`} />)}
      <circle cx="50" cy="50" r="10" fill="url(#tg3-gold)" />
      {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={50 + Math.cos(i) * 5} cy={50 + Math.sin(i) * 5} r="1.6" fill="#a16207" />)}
    </Medallion>
  ),
  4: (
    <Medallion id="tg4" bg={["#ecfccb", "#84cc16", "#365314"]}>
      {[30, 50, 70].map((x, i) => (
        <g key={x}>
          <rect x={x - 5} y="10" width="10" height="90" rx="4" fill={["#4d7c0f", "#65a30d", "#3f6212"][i]} />
          {[28, 52, 76].map((y) => <rect key={y} x={x - 6} y={y} width="12" height="3" rx="1.5" fill="#1a2e05" />)}
          <path d={`M${x + 4} ${36 + i * 8} C${x + 18} ${28 + i * 8} ${x + 22} ${36 + i * 8} ${x + 26} ${40 + i * 8}`} stroke="#84cc16" strokeWidth="4" fill="none" />
        </g>
      ))}
    </Medallion>
  ),
  5: (
    <Sym id="tg5" defs={rad("tg5-j", ["#d1fae5", "#10b981", "#064e3b"])}>
      <circle cx="50" cy="50" r="38" fill="url(#tg5-j)" stroke="url(#tg5-gold)" strokeWidth="4" />
      <circle cx="50" cy="50" r="13" fill="#064e3b" stroke="url(#tg5-gold)" strokeWidth="3" />
      <path d="M50 18 C62 26 62 36 50 37 M82 50 C74 62 64 62 63 50 M50 82 C38 74 38 64 50 63 M18 50 C26 38 36 38 37 50" stroke="#a7f3d0" strokeWidth="3" fill="none" />
    </Sym>
  ),
  6: <Badge id="tg6" colors={["#fecaca", "#dc2626", "#7f1d1d"]} shape="circle" glyph={<path d="M30 64 L50 32 L70 64 M36 54 L64 54 M50 32 L50 70" />} />,
  7: <Badge id="tg7" colors={["#fef08a", "#ca8a04", "#713f12"]} shape="circle" glyph={<><circle cx="50" cy="50" r="18" /><rect x="44" y="44" width="12" height="12" /></>} />,
  8: <Badge id="tg8" colors={["#e0f2fe", "#38bdf8", "#0c4a6e"]} shape="hex" glyph={<path d="M30 56 C30 44 42 44 44 50 C46 40 60 40 60 50 C66 46 72 52 68 58 L32 58" />} />,
  9: <Badge id="tg9" colors={["#fed7aa", "#f97316", "#7c2d12"]} shape="shield" glyph={<path d="M50 26 L50 32 M36 66 C36 44 40 34 50 34 C60 34 64 44 64 66 Z M32 66 L68 66 M50 66 L50 72" />} />,
};

/* =========================================================== VIKINGS DO NORTE */
export const VIKINGS: Record<number, ReactNode> = {
  0: (
    <Sym id="vk0" defs={rad("vk0-f", ["#fde7c7", "#e0a96d", "#7c4a1e"], "50%", "40%")}>
      <path d="M20 30 C16 18 22 10 28 14 L32 30 Z M80 30 C84 18 78 10 72 14 L68 30 Z" fill="#e7e5e4" stroke="#57534e" strokeWidth="2" />
      <path d="M24 40 C24 20 76 20 76 40 Z" fill="#94a3b8" stroke="#334155" strokeWidth="2" />
      <ellipse cx="50" cy="50" rx="20" ry="16" fill="url(#vk0-f)" />
      <path d="M30 54 C30 82 70 82 70 54 C62 62 38 62 30 54 Z" fill="#c2410c" />
      <path d="M40 48 L46 50 M60 48 L54 50" stroke="#111" strokeWidth="3" strokeLinecap="round" />
      <path d="M42 64 L58 64" stroke="#7c2d12" strokeWidth="3" />
      <Ribbon id="vk0" text="WILD" colors={["#bae6fd", "#1e3a8a"]} ink="#fff" />
    </Sym>
  ),
  1: (
    <Sym id="vk1" defs={<>{lin("vk1-s", ["#7dd3fc", "#0c4a6e"])}{lin("vk1-w", ["#a16207", "#422006"])}</>}>
      <circle cx="50" cy="40" r="34" fill="url(#vk1-s)" stroke="url(#vk1-gold)" strokeWidth="3" />
      <path d="M50 12 L50 52" stroke="#78350f" strokeWidth="3" />
      <path d="M50 14 L74 30 L50 44 Z" fill="#dc2626" stroke="#fff" strokeWidth="1.5" />
      <path d="M50 14 L54 22 L50 30 L54 38" stroke="#fff" strokeWidth="2" fill="none" />
      <path d="M16 52 L84 52 L74 66 L26 66 Z" fill="url(#vk1-w)" />
      <path d="M16 52 C10 44 12 36 18 34" stroke="url(#vk1-w)" strokeWidth="5" fill="none" />
      {[30, 42, 54, 66].map((x) => <circle key={x} cx={x} cy="58" r="4" fill="#facc15" stroke="#713f12" />)}
      <Ribbon id="vk1" text="FREE" colors={["#bae6fd", "#1e3a8a"]} ink="#fff" />
    </Sym>
  ),
  2: (
    <Medallion id="vk2" bg={["#e0f2fe", "#38bdf8", "#0c4a6e"]}>
      <path d="M22 100 L28 74 C38 64 62 64 72 74 L78 100 Z" fill="#78350f" />
      <path d="M30 34 C30 18 70 18 70 34 L70 40 L30 40 Z" fill="#a8a29e" stroke="#44403c" strokeWidth="2" />
      <path d="M48 40 L52 40 L52 54 L48 54 Z" fill="#78716c" />
      <ellipse cx="50" cy="50" rx="16" ry="15" fill="#fcd9b6" />
      <path d="M32 56 C30 86 70 86 68 56 C60 66 40 66 32 56 Z" fill="#fef3c7" />
      <path d="M42 48 L46 48 M54 48 L58 48" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 30 C20 24 22 16 28 18 M74 30 C80 24 78 16 72 18" stroke="#e7e5e4" strokeWidth="5" fill="none" strokeLinecap="round" />
    </Medallion>
  ),
  3: (
    <Medallion id="vk3" bg={["#fef9c3", "#facc15", "#713f12"]}>
      <path d="M22 100 L28 72 C38 62 62 62 72 72 L78 100 Z" fill="#cbd5e1" />
      <path d="M30 60 C26 34 34 22 50 22 C66 22 74 34 70 60 C66 50 62 46 50 46 C38 46 34 50 30 60 Z" fill="#fde047" />
      <ellipse cx="50" cy="48" rx="13" ry="15" fill="#fde7c7" />
      <path d="M44 46 L47 46 M53 46 L56 46" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M46 56 C48 57 52 57 54 56" stroke="#be123c" strokeWidth="2" fill="none" />
      <path d="M32 30 C34 22 66 22 68 30 L66 34 L34 34 Z" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
      <path d="M30 28 L14 18 L28 34 M70 28 L86 18 L72 34" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
    </Medallion>
  ),
  4: (
    <Medallion id="vk4" bg={["#f1f5f9", "#94a3b8", "#1e293b"]}>
      <path d="M20 90 C24 60 34 46 50 44 C66 46 76 60 80 90 Z" fill="#64748b" />
      <path d="M32 44 L28 18 L42 34 Z M68 44 L72 18 L58 34 Z" fill="#475569" />
      <path d="M30 56 C30 36 70 36 70 56 C70 66 60 76 50 78 C40 76 30 66 30 56 Z" fill="#94a3b8" />
      <path d="M40 54 L46 56 M60 54 L54 56" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 66 L50 74 L56 66 Z" fill="#1e293b" />
      <path d="M44 70 L46 74 M56 70 L54 74" stroke="#fff" strokeWidth="1.5" />
    </Medallion>
  ),
  5: (
    <Medallion id="vk5" bg={["#e0e7ff", "#818cf8", "#1e1b4b"]}>
      <path d="M14 60 C26 36 40 34 50 42 C40 50 30 56 14 60 Z M86 60 C74 36 60 34 50 42 C60 50 70 56 86 60 Z" fill="#111827" />
      <ellipse cx="50" cy="52" rx="10" ry="14" fill="#1f2937" />
      <circle cx="50" cy="36" r="8" fill="#1f2937" />
      <path d="M56 36 L66 38 L56 41 Z" fill="#a16207" />
      <circle cx="52" cy="34" r="1.8" fill="#facc15" />
      <path d="M46 66 L44 76 M54 66 L56 76" stroke="#1f2937" strokeWidth="3" />
    </Medallion>
  ),
  6: <Badge id="vk6" colors={["#e2e8f0", "#64748b", "#1e293b"]} shape="shield" glyph={<path d="M50 26 L50 76 M50 30 C64 26 72 36 70 48 C62 44 56 44 50 48 M50 30 C36 26 28 36 30 48 C38 44 44 44 50 48" />} />,
  7: <Badge id="vk7" colors={["#fecaca", "#b91c1c", "#450a0a"]} shape="circle" glyph={<><circle cx="50" cy="50" r="20" /><path d="M50 30 L50 70 M30 50 L70 50" /></>} />,
  8: <Badge id="vk8" colors={["#e0f2fe", "#0284c7", "#082f49"]} shape="hex" glyph={<path d="M30 52 C30 30 70 30 70 52 L70 58 L30 58 Z M48 58 L48 70 L52 70 L52 58 M26 48 L18 36 M74 48 L82 36" />} />,
  9: <Badge id="vk9" colors={["#d1fae5", "#059669", "#022c22"]} shape="diamond" glyph={<path d="M44 28 L44 72 M44 30 L58 42 L44 52 M44 52 L60 66" />} />,
};

/* =========================================================== CASSINO VAMPIRO */
export const VAMPIRO: Record<number, ReactNode> = {
  0: (
    <Sym id="vp0" defs={rad("vp0-f", ["#f1f5f9", "#cbd5e1", "#64748b"], "50%", "40%")}>
      <path d="M12 86 L22 40 L50 60 L78 40 L88 86 Z" fill="#7f1d1d" />
      <path d="M22 40 L50 60 L78 40 L72 24 L50 34 L28 24 Z" fill="#111827" />
      <ellipse cx="50" cy="40" rx="16" ry="18" fill="url(#vp0-f)" />
      <path d="M34 30 C36 18 64 18 66 30 L50 26 Z" fill="#111827" />
      <path d="M42 38 L48 40 M58 38 L52 40" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 50 L56 50" stroke="#7f1d1d" strokeWidth="2" />
      <path d="M46 50 L47 55 L48 50 M52 50 L53 55 L54 50" fill="#fff" />
      <Ribbon id="vp0" text="WILD" colors={["#fecaca", "#7f1d1d"]} ink="#fff" />
    </Sym>
  ),
  1: (
    <Sym id="vp1" defs={rad("vp1-m", ["#fecaca", "#dc2626", "#450a0a"], "45%", "40%")}>
      <circle cx="50" cy="40" r="32" fill="#0f0a1a" stroke="url(#vp1-gold)" strokeWidth="3" />
      <circle cx="50" cy="38" r="22" fill="url(#vp1-m)" />
      <path d="M22 60 L30 50 L34 56 L40 46 L46 58 L54 44 L60 56 L66 48 L70 56 L78 52 L78 66 L22 66 Z" fill="#0f0a1a" />
      <path d="M38 22 q6 -4 10 0 q4 -4 10 0" stroke="#0f0a1a" strokeWidth="2.5" fill="none" />
      <Ribbon id="vp1" text="FREE" colors={["#fecaca", "#7f1d1d"]} ink="#fff" />
    </Sym>
  ),
  2: (
    <Medallion id="vp2" bg={["#fecaca", "#be123c", "#3f0a17"]}>
      <path d="M20 100 L28 70 C38 60 62 60 72 70 L80 100 Z" fill="#1f0a14" />
      <path d="M36 66 L50 86 L64 66" fill="#be123c" />
      <path d="M28 52 C24 22 76 22 72 52 C72 70 62 74 62 74 L38 74 C38 74 28 70 28 52 Z" fill="#111827" />
      <ellipse cx="50" cy="48" rx="14" ry="17" fill="#f1f5f9" />
      <path d="M43 46 C44 44 46 44 47 46 M53 46 C54 44 56 44 57 46" stroke="#991b1b" strokeWidth="2.5" fill="none" />
      <path d="M45 57 C48 59 52 59 55 57" stroke="#be123c" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="30" r="3" fill="#be123c" stroke="url(#vp2-gold)" />
    </Medallion>
  ),
  3: (
    <Medallion id="vp3" bg={["#ddd6fe", "#7c3aed", "#1e1b4b"]}>
      <path d="M8 50 C18 32 30 34 36 44 C40 36 46 34 50 40 C54 34 60 36 64 44 C70 34 82 32 92 50 C80 46 74 52 70 60 C64 54 56 56 50 64 C44 56 36 54 30 60 C26 52 20 46 8 50 Z" fill="#111827" />
      <ellipse cx="50" cy="50" rx="8" ry="12" fill="#1f2937" />
      <path d="M44 38 L46 30 L48 38 M52 38 L54 30 L56 38" fill="#1f2937" />
      <circle cx="47" cy="44" r="1.8" fill="#ef4444" />
      <circle cx="53" cy="44" r="1.8" fill="#ef4444" />
    </Medallion>
  ),
  4: (
    <Medallion id="vp4" bg={["#e0e7ff", "#6366f1", "#1e1b4b"]}>
      <circle cx="70" cy="28" r="10" fill="#fde68a" />
      <path d="M20 96 L20 50 L28 40 L36 50 L36 60 L46 60 L46 34 L54 22 L62 34 L62 60 L70 60 L70 46 L78 38 L86 46 L86 96 Z" fill="#111827" />
      {[[52, 40], [52, 50], [28, 56], [76, 54]].map(([x, y]) => <rect key={`${x}${y}`} x={x - 2} y={y} width="4" height="6" fill="#fde047" />)}
    </Medallion>
  ),
  5: (
    <Sym id="vp5" defs={lin("vp5-g", ["#fde68a", "#b45309"])}>
      <path d="M30 18 L70 18 C70 44 60 52 50 54 C40 52 30 44 30 18 Z" fill="url(#vp5-g)" stroke="#78350f" strokeWidth="2" />
      <path d="M34 24 L66 24 C64 40 58 46 50 48 C42 46 36 40 34 24 Z" fill="#991b1b" />
      <path d="M46 54 L46 74 L54 74 L54 54 M34 84 C36 76 64 76 66 84 Z" fill="url(#vp5-g)" stroke="#78350f" strokeWidth="2" />
      <circle cx="50" cy="64" r="4" fill="#dc2626" />
    </Sym>
  ),
  6: <Badge id="vp6" colors={["#fef3c7", "#d97706", "#451a03"]} shape="shield" glyph={<path d="M44 74 L44 40 L56 40 L56 74 M50 40 C44 32 50 24 50 24 C50 24 56 32 50 40" />} />,
  7: <Badge id="vp7" colors={["#fecdd3", "#e11d48", "#4c0519"]} shape="circle" glyph={<path d="M50 70 L50 46 M50 46 C38 46 36 32 44 28 C46 34 50 34 50 34 C50 34 54 34 56 28 C64 32 62 46 50 46 M50 58 C44 56 40 58 38 62" />} />,
  8: <Badge id="vp8" colors={["#e9d5ff", "#9333ea", "#3b0764"]} shape="hex" glyph={<><circle cx="50" cy="56" r="14" /><path d="M42 42 L50 30 L58 42" /></>} />,
  9: <Badge id="vp9" colors={["#f1f5f9", "#64748b", "#0f172a"]} shape="diamond" glyph={<path d="M50 28 L50 72 M36 42 L64 42" />} />,
};

/* =========================================================== SAMURAI SOMBRIO */
export const SAMURAI: Record<number, ReactNode> = {
  0: (
    <Sym id="sm0" defs={<>{lin("sm0-b", ["#ffffff", "#cbd5e1", "#64748b"], false)}{rad("sm0-m", ["#fecaca", "#dc2626", "#450a0a"], "50%", "50%")}</>}>
      <circle cx="50" cy="40" r="30" fill="url(#sm0-m)" stroke="url(#sm0-gold)" strokeWidth="3" />
      <path d="M18 70 L76 12 L82 18 L24 76 Z" fill="url(#sm0-b)" stroke="#334155" strokeWidth="1.5" />
      <path d="M24 76 L14 86 M18 70 L24 76" stroke="#1c1917" strokeWidth="7" strokeLinecap="round" />
      <rect x="18" y="64" width="12" height="4" rx="2" fill="url(#sm0-gold)" transform="rotate(45 24 66)" />
      <Ribbon id="sm0" text="WILD" colors={["#fecaca", "#991b1b"]} ink="#fff" />
    </Sym>
  ),
  1: (
    <Sym id="sm1" defs={lin("sm1-r", ["#f87171", "#991b1b"])}>
      <circle cx="50" cy="40" r="32" fill="#1c1917" stroke="url(#sm1-gold)" strokeWidth="3" />
      <circle cx="62" cy="30" r="10" fill="#fecaca" />
      <path d="M18 26 C30 20 70 20 82 26 L80 32 L20 32 Z" fill="url(#sm1-r)" />
      <rect x="22" y="36" width="56" height="6" fill="url(#sm1-r)" />
      <rect x="28" y="32" width="7" height="38" fill="url(#sm1-r)" />
      <rect x="65" y="32" width="7" height="38" fill="url(#sm1-r)" />
      <Ribbon id="sm1" text="FREE" colors={["#fecaca", "#991b1b"]} ink="#fff" />
    </Sym>
  ),
  2: (
    <Medallion id="sm2" bg={["#fecaca", "#b91c1c", "#1c1917"]}>
      <path d="M20 100 L26 72 L50 80 L74 72 L80 100 Z" fill="#7f1d1d" />
      <path d="M26 72 L36 62 L50 80 L64 62 L74 72" fill="#1c1917" stroke="url(#sm2-gold)" strokeWidth="1.5" />
      <path d="M26 38 C26 22 74 22 74 38 L78 46 L22 46 Z" fill="#1c1917" stroke="url(#sm2-gold)" strokeWidth="2" />
      <path d="M50 28 L40 10 M50 28 L60 10" stroke="url(#sm2-gold)" strokeWidth="4" strokeLinecap="round" />
      <path d="M34 46 L66 46 L62 66 L38 66 Z" fill="#991b1b" />
      <path d="M38 52 L46 54 M62 52 L54 54" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />
      <path d="M42 60 L58 60" stroke="#fff" strokeWidth="2" />
    </Medallion>
  ),
  3: (
    <Medallion id="sm3" bg={["#e2e8f0", "#475569", "#020617"]}>
      <path d="M20 100 L26 72 C36 62 64 62 74 72 L80 100 Z" fill="#0f172a" />
      <path d="M28 52 C24 26 76 26 72 52 C72 70 64 76 50 76 C36 76 28 70 28 52 Z" fill="#0f172a" />
      <rect x="32" y="44" width="36" height="10" rx="5" fill="#fcd9b6" />
      <path d="M38 49 L46 49 M54 49 L62 49" stroke="#111" strokeWidth="3" strokeLinecap="round" />
      <path d="M70 40 L86 30 M70 44 L86 44" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
    </Medallion>
  ),
  4: (
    <Medallion id="sm4" bg={["#fce7f3", "#ec4899", "#500724"]}>
      <path d="M20 100 L28 72 C38 62 62 62 72 72 L80 100 Z" fill="#7e22ce" />
      <path d="M34 72 L50 90 L66 72" fill="#fde68a" />
      <path d="M26 46 C22 18 78 18 74 46 C74 54 70 58 70 58 L30 58 C30 58 26 54 26 46 Z" fill="#111827" />
      <ellipse cx="50" cy="48" rx="14" ry="16" fill="#fafafa" />
      <path d="M43 46 C44 44 46 44 47 46 M53 46 C54 44 56 44 57 46" stroke="#111" strokeWidth="2" fill="none" />
      <circle cx="50" cy="57" r="2.6" fill="#dc2626" />
      <path d="M64 24 L76 14 M66 28 L80 22" stroke="url(#sm4-gold)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="78" cy="14" r="3" fill="#f472b6" />
    </Medallion>
  ),
  5: (
    <Medallion id="sm5" bg={["#d1fae5", "#10b981", "#022c22"]}>
      <path d="M10 70 C24 70 22 50 36 50 C50 50 46 70 60 70 C74 70 72 44 86 40" stroke="#064e3b" strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d="M10 70 C24 70 22 50 36 50 C50 50 46 70 60 70 C74 70 72 44 86 40" stroke="#34d399" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="4 4" />
      <circle cx="84" cy="38" r="9" fill="#065f46" />
      <circle cx="86" cy="35" r="2" fill="#fde047" />
      <path d="M78 30 L72 22 M84 28 L84 18" stroke="#fde68a" strokeWidth="2" />
    </Medallion>
  ),
  6: <Badge id="sm6" colors={["#fecaca", "#b91c1c", "#450a0a"]} shape="shield" glyph={<path d="M30 52 C30 30 70 30 70 52 L74 58 L26 58 Z M50 36 L40 22 M50 36 L60 22" />} />,
  7: <Badge id="sm7" colors={["#fef3c7", "#d97706", "#451a03"]} shape="circle" glyph={<path d="M50 70 L28 38 M50 70 L38 32 M50 70 L50 30 M50 70 L62 32 M50 70 L72 38 M28 38 C40 28 60 28 72 38" />} />,
  8: <Badge id="sm8" colors={["#fce7f3", "#f472b6", "#831843"]} shape="hex" glyph={<><circle cx="50" cy="50" r="6" />{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="50" cy="34" rx="7" ry="10" transform={`rotate(${a} 50 50)`} />)}</>} />,
  9: <Badge id="sm9" colors={["#e2e8f0", "#475569", "#0f172a"]} shape="diamond" glyph={<path d="M50 26 L56 44 L74 50 L56 56 L50 74 L44 56 L26 50 L44 44 Z" />} />,
};
