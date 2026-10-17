/** Ouro dos Piratas · Dragão Imperial · Floresta Encantada */
import type { ReactNode } from "react";
import { Badge, lin, Medallion, rad, Ribbon, Sym } from "./kit";

/* =========================================================== OURO DOS PIRATAS */
export const PIRATAS: Record<number, ReactNode> = {
  0: (
    <Sym id="pr0" defs={rad("pr0-s", ["#ffffff", "#e7e5e4", "#a8a29e"])}>
      <path d="M22 70 L78 22 M22 22 L78 70" stroke="#f5f5f4" strokeWidth="9" strokeLinecap="round" />
      <path d="M22 70 L78 22 M22 22 L78 70" stroke="#a8a29e" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 12 C70 12 80 26 78 42 C76 52 70 56 66 58 L66 66 L34 66 L34 58 C30 56 24 52 22 42 C20 26 30 12 50 12 Z" fill="url(#pr0-s)" stroke="#57534e" strokeWidth="2" />
      <ellipse cx="38" cy="40" rx="8" ry="9" fill="#1c1917" />
      <ellipse cx="62" cy="40" rx="8" ry="9" fill="#1c1917" />
      <path d="M50 46 L46 54 L54 54 Z" fill="#1c1917" />
      <path d="M40 66 L40 60 M46 66 L46 60 M54 66 L54 60 M60 66 L60 60" stroke="#57534e" strokeWidth="2" />
      <path d="M22 26 C30 10 70 10 78 26 C66 22 34 22 22 26 Z" fill="#dc2626" />
      <Ribbon id="pr0" text="WILD" colors={["#fecaca", "#b91c1c"]} ink="#fff" />
    </Sym>
  ),
  1: (
    <Sym id="pr1" defs={lin("pr1-p", ["#fef3c7", "#e7c79a", "#b08856"])}>
      <path d="M12 18 C30 12 40 22 50 16 C62 10 74 20 88 14 L88 70 C74 76 62 66 50 72 C40 78 30 68 12 74 Z" fill="url(#pr1-p)" stroke="#78350f" strokeWidth="2" />
      <path d="M24 30 C34 40 40 30 50 42 C58 52 66 40 72 50" stroke="#92400e" strokeWidth="2" strokeDasharray="4 4" fill="none" />
      <path d="M68 44 L80 56 M80 44 L68 56" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
      <circle cx="26" cy="30" r="4" fill="#92400e" />
      <Ribbon id="pr1" text="FREE" />
    </Sym>
  ),
  2: (
    <Medallion id="pr2" bg={["#fde68a", "#f59e0b", "#7c2d12"]}>
      <path d="M26 98 L30 74 C34 66 66 66 70 74 L74 98 Z" fill="#7f1d1d" />
      <ellipse cx="50" cy="54" rx="18" ry="20" fill="#fcd9b6" />
      <path d="M32 52 C30 34 70 34 68 52 C64 44 36 44 32 52 Z" fill="#7c2d12" />
      <path d="M14 38 C30 14 70 14 86 38 C70 32 30 32 14 38 Z" fill="#1c1917" stroke="url(#pr2-gold)" strokeWidth="2" />
      <path d="M44 28 L50 22 L56 28 L50 34 Z" fill="#f5f5f4" />
      <path d="M38 54 L48 54 L48 50 L38 50 Z" fill="#1c1917" />
      <path d="M36 52 L30 46" stroke="#1c1917" strokeWidth="1.5" />
      <circle cx="58" cy="54" r="2.5" fill="#1c1917" />
      <path d="M38 64 C44 72 56 72 62 64 C58 80 42 80 38 64 Z" fill="#7c2d12" />
    </Medallion>
  ),
  3: (
    <Medallion id="pr3" bg={["#e0f2fe", "#38bdf8", "#0c4a6e"]}>
      <path d="M50 18 L50 66" stroke="#78350f" strokeWidth="3" />
      <path d="M50 20 C66 26 70 40 68 54 L50 54 Z" fill="#f5f5f4" stroke="#a8a29e" strokeWidth="1.2" />
      <path d="M50 24 C38 30 34 42 36 52 L50 52 Z" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1.2" />
      <path d="M50 18 L62 14 L50 12 Z" fill="#dc2626" />
      <path d="M20 64 L80 64 L72 78 L28 78 Z" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
      <path d="M8 84 C20 78 30 90 42 84 C54 78 64 90 76 84 C84 80 90 84 94 84 L94 96 L8 96 Z" fill="#0369a1" />
    </Medallion>
  ),
  4: (
    <Medallion id="pr4" bg={["#dcfce7", "#4ade80", "#14532d"]}>
      <path d="M40 92 C30 70 34 46 50 36 C66 46 70 70 60 92 Z" fill="#ef4444" />
      <path d="M50 36 C70 40 76 60 70 78 C64 66 58 56 50 50 Z" fill="#2563eb" />
      <circle cx="52" cy="30" r="14" fill="#ef4444" />
      <path d="M58 30 C68 30 70 38 64 42 C62 38 60 36 58 36 Z" fill="#facc15" stroke="#a16207" strokeWidth="1" />
      <circle cx="52" cy="27" r="4" fill="#fff" />
      <circle cx="53" cy="27" r="2" fill="#1c1917" />
      <path d="M44 18 C40 8 50 6 50 16" fill="#22c55e" />
    </Medallion>
  ),
  5: (
    <Sym id="pr5" defs={lin("pr5-w", ["#a16207", "#713f12"])}>
      <path d="M14 44 C14 24 86 24 86 44 Z" fill="url(#pr5-w)" stroke="url(#pr5-gold)" strokeWidth="3" />
      <rect x="14" y="44" width="72" height="40" rx="4" fill="url(#pr5-w)" stroke="url(#pr5-gold)" strokeWidth="3" />
      <rect x="14" y="44" width="72" height="8" fill="url(#pr5-gold)" />
      <rect x="44" y="48" width="12" height="16" rx="2" fill="url(#pr5-gold)" stroke="#78350f" strokeWidth="1.5" />
      {[[28, 38], [40, 32], [56, 32], [70, 38]].map(([x, y]) => <ellipse key={x} cx={x} cy={y} rx="8" ry="4" fill="url(#pr5-gold)" stroke="#92400e" strokeWidth="1" />)}
      <path d="M66 26 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2z" fill="#fff" />
    </Sym>
  ),
  6: <Badge id="pr6" colors={["#bae6fd", "#0369a1", "#082f49"]} glyph={<path d="M50 24 L50 74 M38 36 L62 36 M30 58 C32 72 44 76 50 74 C56 76 68 72 70 58" />} />,
  7: <Badge id="pr7" colors={["#fed7aa", "#c2410c", "#431407"]} shape="circle" glyph={<><circle cx="50" cy="50" r="14" /><path d="M50 22 L50 78 M22 50 L78 50 M30 30 L70 70 M70 30 L30 70" /></>} />,
  8: <Badge id="pr8" colors={["#bbf7d0", "#15803d", "#052e16"]} shape="diamond" glyph={<path d="M44 26 L56 26 L56 36 C66 42 66 56 64 72 L36 72 C34 56 34 42 44 36 Z" />} />,
  9: <Badge id="pr9" colors={["#fef08a", "#ca8a04", "#713f12"]} shape="circle" glyph={<><circle cx="50" cy="50" r="18" /><path d="M44 42 L56 42 M44 50 L56 50 M50 36 L50 64" /></>} />,
};

/* =========================================================== DRAGÃO IMPERIAL */
export const DRAGAO: Record<number, ReactNode> = {
  0: (
    <Sym id="dg0" defs={<>{lin("dg0-b", ["#4ade80", "#047857", "#022c22"])}{lin("dg0-m", ["#fca5a5", "#dc2626"])}</>}>
      <path d="M50 8 C76 8 90 30 84 52 C80 64 66 70 50 70 C34 70 20 64 16 52 C10 30 24 8 50 8 Z" fill="url(#dg0-b)" stroke="url(#dg0-gold)" strokeWidth="3" />
      <path d="M22 22 L10 6 L30 16 Z M78 22 L90 6 L70 16 Z" fill="url(#dg0-gold)" />
      <path d="M28 36 C34 30 42 32 44 38 C38 40 32 40 28 36 Z M72 36 C66 30 58 32 56 38 C62 40 68 40 72 36 Z" fill="#fde047" />
      <circle cx="37" cy="36" r="2.5" fill="#1c1917" />
      <circle cx="63" cy="36" r="2.5" fill="#1c1917" />
      <path d="M36 52 C44 60 56 60 64 52 C60 64 40 64 36 52 Z" fill="url(#dg0-m)" />
      <path d="M40 52 l3 5 l3 -5 M54 52 l3 5 l3 -5" fill="#fff" />
      <path d="M20 50 C6 52 4 62 12 64 M80 50 C94 52 96 62 88 64" stroke="url(#dg0-gold)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Ribbon id="dg0" text="WILD" colors={["#fecaca", "#b91c1c"]} ink="#fde68a" />
    </Sym>
  ),
  1: (
    <Sym id="dg1" defs={rad("dg1-p", ["#ffffff", "#f5d0fe", "#a855f7"])}>
      <circle cx="50" cy="42" r="28" fill="url(#dg1-p)" stroke="url(#dg1-gold)" strokeWidth="3" />
      <path d="M30 30 C40 22 52 22 60 26" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".8" />
      <path d="M50 70 C38 80 22 74 18 62 M50 70 C62 80 78 74 82 62" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" fill="none" />
      <Ribbon id="dg1" text="FREE" colors={["#fecaca", "#b91c1c"]} ink="#fde68a" />
    </Sym>
  ),
  2: (
    <Medallion id="dg2" bg={["#fef3c7", "#f59e0b", "#7f1d1d"]}>
      <path d="M22 98 L28 70 C34 62 66 62 72 70 L78 98 Z" fill="#b91c1c" stroke="url(#dg2-gold)" strokeWidth="2" />
      <path d="M40 66 L50 80 L60 66" stroke="url(#dg2-gold)" strokeWidth="3" fill="none" />
      <ellipse cx="50" cy="48" rx="16" ry="19" fill="#fde7c7" />
      <path d="M30 34 L70 34 L66 22 L34 22 Z" fill="#1c1917" stroke="url(#dg2-gold)" strokeWidth="2" />
      <path d="M26 22 L74 22" stroke="url(#dg2-gold)" strokeWidth="4" strokeLinecap="round" />
      <path d="M42 46 L47 47 M53 47 L58 46" stroke="#1c1917" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M44 58 C46 62 54 62 56 58 M40 60 C36 70 42 76 40 82 M60 60 C64 70 58 76 60 82" stroke="#1c1917" strokeWidth="1.8" fill="none" />
    </Medallion>
  ),
  3: (
    <Medallion id="dg3" bg={["#e0f2fe", "#38bdf8", "#075985"]}>
      <path d="M22 60 C30 36 60 30 74 44 C80 50 80 58 74 62 C60 74 34 76 22 60 Z" fill="#f97316" stroke="#fff7ed" strokeWidth="1.5" />
      <path d="M74 44 C84 34 92 40 88 50 C92 58 84 66 74 62" fill="#fb923c" />
      <path d="M40 46 C44 52 44 60 40 66 M52 44 C56 52 56 62 52 68" stroke="#fff" strokeWidth="2" fill="none" opacity=".7" />
      <circle cx="32" cy="52" r="3" fill="#1c1917" />
      <path d="M26 64 C22 70 18 70 14 66" stroke="#fdba74" strokeWidth="2" fill="none" />
    </Medallion>
  ),
  4: (
    <Sym id="dg4" defs={lin("dg4-f", ["#fecaca", "#dc2626"])}>
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d="M50 82 L50 18" stroke="#78350f" strokeWidth="2" transform={`rotate(${-64 + i * 16} 50 82)`} />
      ))}
      <path d="M50 82 L14 40 A50 50 0 0 1 86 40 Z" fill="url(#dg4-f)" stroke="url(#dg4-gold)" strokeWidth="3" />
      <path d="M50 82 L28 56 A30 30 0 0 1 72 56 Z" fill="#fef3c7" opacity=".85" />
      <circle cx="50" cy="44" r="8" fill="url(#dg4-gold)" />
      <circle cx="50" cy="84" r="5" fill="url(#dg4-gold)" />
    </Sym>
  ),
  5: (
    <Sym id="dg5" defs={rad("dg5-l", ["#fff7ed", "#f97316", "#b91c1c"], "50%", "45%")}>
      <path d="M44 8 L56 8 M50 8 L50 16" stroke="url(#dg5-gold)" strokeWidth="3" />
      <rect x="34" y="16" width="32" height="8" rx="3" fill="url(#dg5-gold)" />
      <ellipse cx="50" cy="50" rx="28" ry="26" fill="url(#dg5-l)" />
      <path d="M36 28 C30 40 30 60 36 72 M64 28 C70 40 70 60 64 72 M50 24 L50 76" stroke="#7f1d1d" strokeWidth="2" fill="none" opacity=".6" />
      <rect x="34" y="74" width="32" height="8" rx="3" fill="url(#dg5-gold)" />
      <path d="M50 82 L50 94" stroke="#dc2626" strokeWidth="3" />
    </Sym>
  ),
  6: <Badge id="dg6" colors={["#bbf7d0", "#15803d", "#052e16"]} shape="circle" glyph={<path d="M50 76 L50 56 C42 50 32 52 28 44 C38 40 46 46 50 52 C54 40 64 36 72 40 C66 50 58 50 50 56" />} />,
  7: <Badge id="dg7" colors={["#fde68a", "#ca8a04", "#713f12"]} shape="shield" glyph={<path d="M36 64 C36 40 42 30 50 30 C58 30 64 40 64 64 Z M30 64 L70 64 M50 64 L50 72" />} />,
  8: <Badge id="dg8" colors={["#fef3c7", "#d97706", "#78350f"]} shape="circle" glyph={<><circle cx="50" cy="50" r="18" /><rect x="44" y="44" width="12" height="12" /></>} />,
  9: <Badge id="dg9" colors={["#fecaca", "#dc2626", "#7f1d1d"]} shape="diamond" glyph={<path d="M50 30 L62 42 L50 54 L38 42 Z M50 54 L50 72 M42 62 L58 62" />} />,
};

/* =========================================================== FLORESTA ENCANTADA */
export const FLORESTA: Record<number, ReactNode> = {
  0: (
    <Sym id="fl0" defs={<>{rad("fl0-w", ["#ffffff", "#a5f3fc", "#22d3ee"])}{rad("fl0-b", ["#fdf4ff", "#f0abfc", "#a21caf"])}</>}>
      <path d="M48 40 C26 14 8 22 14 40 C20 54 40 52 48 44 Z M52 40 C74 14 92 22 86 40 C80 54 60 52 52 44 Z" fill="url(#fl0-w)" opacity=".9" stroke="#fff" strokeWidth="1.5" />
      <path d="M48 48 C30 54 22 70 34 72 C42 72 46 60 48 52 Z M52 48 C70 54 78 70 66 72 C58 72 54 60 52 52 Z" fill="url(#fl0-w)" opacity=".75" />
      <ellipse cx="50" cy="52" rx="6" ry="16" fill="url(#fl0-b)" />
      <circle cx="50" cy="30" r="8" fill="#fde7d7" />
      <path d="M42 28 C42 18 58 18 58 28 C54 24 46 24 42 28 Z" fill="#f59e0b" />
      <path d="M50 14 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2z" fill="#fde047" transform="translate(-2 -6)" />
      <Ribbon id="fl0" text="WILD" colors={["#f5d0fe", "#a21caf"]} ink="#fff" />
    </Sym>
  ),
  1: (
    <Sym id="fl1" defs={rad("fl1-p", ["#ffffff", "#86efac", "#7c3aed", "#1e1b4b"], "50%", "50%")}>
      <path d="M22 72 L22 40 C22 14 78 14 78 40 L78 72 Z" fill="#422006" stroke="#78350f" strokeWidth="3" />
      <path d="M28 70 L28 42 C28 22 72 22 72 42 L72 70 Z" fill="url(#fl1-p)" />
      {[[30, 30], [70, 34], [24, 56], [76, 58], [50, 18]].map(([x, y]) => <path key={x} d={`M${x} ${y} c4 -8 10 -8 10 0 c-4 4 -6 4 -10 0z`} fill="#22c55e" />)}
      <Ribbon id="fl1" text="FREE" colors={["#bbf7d0", "#15803d"]} ink="#fff" />
    </Sym>
  ),
  2: (
    <Medallion id="fl2" bg={["#ede9fe", "#7c3aed", "#1e1b4b"]}>
      <path d="M24 98 C20 70 28 44 50 40 C72 44 80 70 76 98 Z" fill="#a16207" />
      <path d="M36 96 C34 76 40 62 50 60 C60 62 66 76 64 96 Z" fill="#fef3c7" />
      <circle cx="38" cy="46" r="11" fill="#fde68a" stroke="#78350f" strokeWidth="2" />
      <circle cx="62" cy="46" r="11" fill="#fde68a" stroke="#78350f" strokeWidth="2" />
      <circle cx="38" cy="46" r="6" fill="#1c1917" />
      <circle cx="62" cy="46" r="6" fill="#1c1917" />
      <circle cx="40" cy="44" r="2" fill="#fff" />
      <circle cx="64" cy="44" r="2" fill="#fff" />
      <path d="M46 56 L50 62 L54 56 Z" fill="#f59e0b" />
      <path d="M28 34 L22 22 L36 30 Z M72 34 L78 22 L64 30 Z" fill="#a16207" />
    </Medallion>
  ),
  3: (
    <Medallion id="fl3" bg={["#ecfccb", "#65a30d", "#1a2e05"]}>
      <path d="M50 92 C20 92 16 60 30 46 L22 18 L42 36 L58 36 L78 18 L70 46 C84 60 80 92 50 92 Z" fill="#ea580c" stroke="#7c2d12" strokeWidth="1.5" />
      <path d="M34 64 C40 82 60 82 66 64 C60 72 40 72 34 64 Z M50 92 C40 86 36 76 34 64 L66 64 C64 76 60 86 50 92 Z" fill="#fff7ed" />
      <path d="M38 56 C40 52 44 52 46 56 M54 56 C56 52 60 52 62 56" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="50" cy="70" rx="4" ry="3" fill="#1c1917" />
    </Medallion>
  ),
  4: (
    <Sym id="fl4" defs={rad("fl4-c", ["#fecaca", "#dc2626", "#7f1d1d"], "40%", "30%")}>
      <path d="M40 54 L36 90 L64 90 L60 54 Z" fill="#fef3c7" stroke="#d6d3d1" strokeWidth="1.5" />
      <path d="M10 56 C10 22 90 22 90 56 C70 62 30 62 10 56 Z" fill="url(#fl4-c)" stroke="#7f1d1d" strokeWidth="1.5" />
      {[[30, 38, 6], [52, 30, 7], [72, 42, 5], [44, 48, 4], [62, 50, 4]].map(([x, y, r]) => <circle key={x} cx={x} cy={y} r={r} fill="#fff" />)}
    </Sym>
  ),
  5: (
    <Sym id="fl5" defs={lin("fl5-l", ["#f0abfc", "#a21caf"])}>
      <path d="M42 10 L58 10 L58 30 C76 38 82 58 72 74 C64 88 36 88 28 74 C18 58 24 38 42 30 Z" fill="#e0f2fe" opacity=".5" stroke="#fff" strokeWidth="2.5" />
      <path d="M26 60 C28 80 72 80 74 60 C62 66 38 66 26 60 Z" fill="url(#fl5-l)" />
      <circle cx="40" cy="70" r="3" fill="#fff" opacity=".8" />
      <circle cx="58" cy="64" r="2" fill="#fff" opacity=".8" />
      <rect x="40" y="6" width="20" height="8" rx="2" fill="#92400e" />
    </Sym>
  ),
  6: <Badge id="fl6" colors={["#fde68a", "#a16207", "#422006"]} shape="circle" glyph={<path d="M34 42 C34 30 66 30 66 42 Z M38 42 C38 62 46 72 50 74 C54 72 62 62 62 42 M50 30 L52 22" />} />,
  7: <Badge id="fl7" colors={["#bbf7d0", "#16a34a", "#052e16"]} shape="hex" glyph={<path d="M50 50 C44 34 30 38 36 48 C28 52 34 66 46 56 M50 50 C56 34 70 38 64 48 C72 52 66 66 54 56 M50 50 L50 76" />} />,
  8: <Badge id="fl8" colors={["#fef9c3", "#eab308", "#713f12"]} shape="diamond" glyph={<><circle cx="50" cy="54" r="8" /><path d="M42 46 C30 36 30 28 40 30 C46 32 48 40 48 46 M58 46 C70 36 70 28 60 30 C54 32 52 40 52 46" /></>} />,
  9: <Badge id="fl9" colors={["#e0e7ff", "#6366f1", "#1e1b4b"]} shape="shield" glyph={<path d="M64 28 C40 34 32 56 36 72 M36 72 C48 62 56 48 64 28 M44 52 L54 50 M40 62 L50 60" />} />,
};
