import type { ReactNode } from "react";

/** Ícones da Onda 1 (viewBox 0 0 100 100). */
const card = (x: number, y: number, r: number, label: string, red = false, w = 32) => (
  <g transform={`rotate(${r} ${x + w / 2} ${y + w * 0.69})`}>
    <rect x={x} y={y} width={w} height={w * 1.38} rx={w * 0.16} fill="#fff" stroke="#1e1b4b" strokeWidth="1.5" />
    <text x={x + w / 2} y={y + w * 0.94} textAnchor="middle" fontSize={w * 0.56} fontWeight="900" fill={red ? "#e11d48" : "#16132b"} fontFamily="Manrope">{label}</text>
  </g>
);
const ball = (cx: number, cy: number, r: number, fill: string, label?: string, color = "#111") => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill={fill} stroke="#fff" strokeOpacity=".6" strokeWidth="1.5" />
    <ellipse cx={cx - r * 0.35} cy={cy - r * 0.4} rx={r * 0.35} ry={r * 0.2} fill="#fff" opacity=".55" />
    {label && <text x={cx} y={cy + r * 0.38} textAnchor="middle" fontSize={r * 1.05} fontWeight="900" fill={color} fontFamily="Manrope">{label}</text>}
  </g>
);
const rocket = (x: number, y: number, rot: number, color: string, s = 1) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M0 -16 C 8 -6, 8 6, 5 13 L-5 13 C -8 6, -8 -6, 0 -16 Z" fill="#f5f3ff" />
    <path d="M0 -16 C 4 -11, 6 -7, 6 -4 L-6 -4 C -6 -7, -4 -11, 0 -16 Z" fill={color} />
    <circle cx="0" cy="0" r="3.2" fill="#22d3ee" />
    <path d="M-5 13 L0 24 L5 13 Z" fill="#fb923c" />
    <path d="M-5 6 L-11 14 L-5 12 Z M5 6 L11 14 L5 12 Z" fill={color} />
  </g>
);

export const GAME_ICONS2: Record<string, ReactNode> = {
  "crash-duplo": (
    <g filter="url(#a-soft)">
      <path d="M8 88 C 40 86, 58 66, 76 26" stroke="#f472b6" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M8 88 C 44 84, 70 70, 90 46" stroke="#38bdf8" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      {rocket(76, 24, 30, "#f472b6")}
      {rocket(88, 44, 55, "#38bdf8", 0.85)}
    </g>
  ),
  "crash-aviao": (
    <g filter="url(#a-soft)">
      <path d="M8 88 C 40 86, 62 66, 80 30" stroke="#fbbf24" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeDasharray="1 7" />
      <g transform="translate(70 34) rotate(-30)">
        <ellipse cx="0" cy="0" rx="26" ry="7" fill="#ef4444" />
        <rect x="-6" y="-22" width="10" height="44" rx="3" fill="#fecaca" />
        <rect x="-24" y="-11" width="6" height="12" rx="2" fill="#ef4444" />
        <circle cx="16" cy="-1" r="3.5" fill="#fff" />
      </g>
    </g>
  ),
  hilo: (
    <g filter="url(#a-soft)">
      {card(30, 22, 0, "7", true, 40)}
      <path d="M14 40 L22 26 L30 40 Z" fill="#facc15" />
      <path d="M70 62 L78 76 L86 62 Z" fill="#38bdf8" />
    </g>
  ),
  overunder: (
    <g filter="url(#a-soft)">
      <rect x="10" y="44" width="80" height="12" rx="6" fill="#ef4444" />
      <rect x="50" y="44" width="40" height="12" rx="6" fill="#22c55e" />
      <rect x="44" y="36" width="12" height="28" rx="4" fill="#fff" />
      <rect x="22" y="12" width="26" height="22" rx="6" fill="#fff" />
      <text x="35" y="28" textAnchor="middle" fontSize="12" fontWeight="900" fill="#7c3aed" fontFamily="Manrope">72</text>
      <path d="M30 74 L40 84 L50 74 M60 84 L70 74 L80 84" stroke="#a78bfa" strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  ),
  wheel: (
    <g filter="url(#a-soft)">
      {Array.from({ length: 12 }).map((_, i) => {
        const a0 = ((i * 30 - 90) * Math.PI) / 180;
        const a1 = (((i + 1) * 30 - 90) * Math.PI) / 180;
        const p = (a: number, r: number) => `${50 + Math.cos(a) * r} ${52 + Math.sin(a) * r}`;
        return <path key={i} d={`M50 52 L${p(a0, 38)} A38 38 0 0 1 ${p(a1, 38)} Z`} fill={["#a855f7", "#334155", "#22c55e", "#334155", "#3b82f6", "#334155", "#f59e0b", "#334155", "#22c55e", "#334155", "#ef4444", "#334155"][i]} />;
      })}
      <circle cx="50" cy="52" r="12" fill="#0f0a24" stroke="#fde68a" strokeWidth="3" />
      <path d="M50 22 L42 6 L58 6 Z" fill="#fde047" />
    </g>
  ),
  bolhas: (
    <g filter="url(#a-soft)">
      {[[34, 38, 22], [66, 32, 16], [62, 68, 20], [28, 72, 12]].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="rgba(125,211,252,0.25)" stroke="#bae6fd" strokeWidth="2" />
          <ellipse cx={x - r * 0.35} cy={y - r * 0.4} rx={r * 0.3} ry={r * 0.18} fill="#fff" opacity=".8" />
        </g>
      ))}
      <circle cx="34" cy="38" r="8" fill="#f0f9ff" />
    </g>
  ),
  escada: (
    <g filter="url(#a-soft)">
      {[0, 1, 2, 3].map((i) => <rect key={i} x={14 + i * 16} y={76 - i * 16} width={70 - i * 16} height="12" rx="3" fill={i === 3 ? "#f5c451" : "#7c3aed"} stroke="#c4b5fd" strokeWidth="1.5" />)}
      <path d="M22 90 L28 80 L34 90 Z M40 90 L46 80 L52 90 Z" fill="#cbd5e1" />
    </g>
  ),
  galinha: (
    <g filter="url(#a-soft)">
      <rect x="4" y="56" width="92" height="34" rx="4" fill="#374151" />
      <path d="M8 73 H92" stroke="#fde047" strokeWidth="3" strokeDasharray="10 8" />
      <ellipse cx="50" cy="44" rx="20" ry="18" fill="#fff" />
      <circle cx="50" cy="24" r="12" fill="#fff" />
      <path d="M44 14 q3 -9 6 0 q3 -9 6 0 z" fill="#ef4444" />
      <path d="M60 24 l9 3 -9 4 z" fill="#f59e0b" />
      <circle cx="54" cy="22" r="2.4" fill="#111" />
    </g>
  ),
  diamantes: (
    <g filter="url(#a-soft)">
      <path d="M50 10 L80 34 L50 84 L20 34 Z" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="2.5" />
      <path d="M20 34 L80 34 L50 84 Z" fill="#000" opacity=".15" />
      <path d="M26 56 L38 64 L26 88 L14 64 Z" fill="#f472b6" stroke="#fce7f3" strokeWidth="2" />
      <path d="M74 56 L86 64 L74 88 L62 64 Z" fill="#a3e635" stroke="#ecfccb" strokeWidth="2" />
    </g>
  ),
  "cofre-secreto": (
    <g filter="url(#a-soft)">
      <rect x="14" y="16" width="72" height="68" rx="10" fill="#475569" stroke="#cbd5e1" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="20" fill="#cbd5e1" stroke="#1e293b" strokeWidth="3" />
      <circle cx="50" cy="50" r="7" fill="#64748b" />
      <path d="M50 30 V38" stroke="#ef4444" strokeWidth="4" />
      {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={50 + Math.cos(i) * 14} cy={50 + Math.sin(i) * 14} r="1.6" fill="#1e293b" />)}
    </g>
  ),
  moedas: (
    <g filter="url(#a-soft)">
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 14} ${-i * 12})`}>
          <ellipse cx="34" cy="70" rx="24" ry="8" fill="#a16207" />
          <ellipse cx="34" cy="66" rx="24" ry="8" fill="url(#a-gold)" />
        </g>
      ))}
      <text x="78" y="30" textAnchor="middle" fontSize="18" fontWeight="900" fill="#fde047" fontFamily="Unbounded">x2</text>
    </g>
  ),
  "plinko-duo": (
    <g filter="url(#a-soft)">
      {[0, 1, 2, 3].map((r) => Array.from({ length: r + 2 }).map((_, i) => <circle key={`${r}${i}`} cx={50 - (r + 1) * 9 + i * 18} cy={20 + r * 16} r="3" fill="#e9d5ff" />))}
      <circle cx="40" cy="48" r="6" fill="#f472b6" />
      <circle cx="62" cy="64" r="6" fill="#38bdf8" />
      <path d="M50 6 L50 14" stroke="#fff" strokeWidth="3" />
    </g>
  ),
  "limbo-turbo": (
    <g filter="url(#a-soft)">
      {[0, 1, 2].map((i) => <circle key={i} cx={50} cy={50} r={36 - i * 11} fill="none" stroke={["#ec4899", "#a855f7", "#f5c451"][i]} strokeWidth="5" />)}
      <path d="M38 14 L56 14 L46 34 L60 34 L34 62 L42 40 L30 40 Z" fill="#fde047" stroke="#a16207" strokeWidth="2" />
    </g>
  ),
  mines7: (
    <g filter="url(#a-soft)">
      {Array.from({ length: 16 }).map((_, i) => <rect key={i} x={12 + (i % 4) * 20} y={12 + Math.floor(i / 4) * 20} width="17" height="17" rx="4" fill={i === 5 || i === 10 ? "#4ade80" : i === 15 ? "#ef4444" : "#312e81"} />)}
    </g>
  ),
  penalti: (
    <g filter="url(#a-soft)">
      <path d="M10 70 V24 H90 V70" stroke="#fff" strokeWidth="4" fill="none" />
      <path d="M14 28 H86 M14 40 H86 M14 52 H86 M14 64 H86 M26 24 V70 M42 24 V70 M58 24 V70 M74 24 V70" stroke="#fff" strokeWidth="1" opacity=".35" />
      <rect x="4" y="70" width="92" height="22" fill="#16a34a" />
      <circle cx="70" cy="38" r="10" fill="#fff" stroke="#111" strokeWidth="2" />
      <path d="M70 32 L75 36 L73 42 L67 42 L65 36 Z" fill="#111" />
    </g>
  ),
  "dragon-tiger": (
    <g filter="url(#a-soft)">
      {card(14, 26, -12, "K", true)}
      {card(54, 26, 12, "Q")}
      <text x="50" y="22" textAnchor="middle" fontSize="13" fontWeight="900" fill="#fde047" fontFamily="Unbounded">VS</text>
    </g>
  ),
  "andar-bahar": (
    <g filter="url(#a-soft)">
      {card(34, 10, 0, "J", true, 30)}
      {card(10, 54, -10, "J", false, 24)}
      {card(66, 54, 10, "5", true, 24)}
    </g>
  ),
  "bj-eu": <g filter="url(#a-soft)">{card(18, 22, -12, "A")}{card(46, 24, 10, "Q", true)}<circle cx="80" cy="20" r="10" fill="#1d4ed8" stroke="#fde047" strokeWidth="2" /><text x="80" y="24" textAnchor="middle" fontSize="9" fontWeight="900" fill="#fde047">EU</text></g>,
  "bj-multi": <g filter="url(#a-soft)">{card(6, 30, -14, "A", false, 28)}{card(36, 22, 0, "K", true, 28)}{card(66, 30, 14, "J", false, 28)}</g>,
  "bj-switch": (
    <g filter="url(#a-soft)">
      {card(10, 26, -8, "10", true, 30)}
      {card(60, 26, 8, "K", false, 30)}
      <path d="M38 30 Q50 18 62 30 M62 70 Q50 82 38 70" stroke="#fde047" strokeWidth="3.5" fill="none" />
      <path d="M58 24 L63 31 L55 33 Z M42 76 L37 69 L45 67 Z" fill="#fde047" />
    </g>
  ),
  "bj-213": <g filter="url(#a-soft)">{card(16, 26, -12, "7", true)}{card(46, 24, 8, "8", true)}<text x="72" y="92" textAnchor="middle" fontSize="15" fontWeight="900" fill="#fde047" fontFamily="Unbounded">21+3</text></g>,
  "vp-deuces": <g filter="url(#a-soft)">{[0, 1, 2, 3].map((i) => card(10 + i * 18, 28 + Math.abs(i - 1.5) * 3, (i - 1.5) * 9, "2", i % 2 === 1, 28))}</g>,
  "vp-double": <g filter="url(#a-soft)">{[0, 1, 2, 3].map((i) => card(10 + i * 18, 28 + Math.abs(i - 1.5) * 3, (i - 1.5) * 9, "A", i % 2 === 0, 28))}<text x="50" y="22" textAnchor="middle" fontSize="12" fontWeight="900" fill="#fde047" fontFamily="Unbounded">x2</text></g>,
  "vp-joker": (
    <g filter="url(#a-soft)">
      {card(18, 28, -12, "K", true)}
      <g transform="rotate(10 66 50)">
        <rect x="50" y="26" width="32" height="44" rx="5" fill="#fff" stroke="#1e1b4b" strokeWidth="1.5" />
        <path d="M56 50 L60 36 L66 46 L70 32 L74 46 L78 36 L80 50 Z" fill="#7c3aed" />
        <circle cx="68" cy="58" r="6" fill="#fde68a" stroke="#3b0764" strokeWidth="1.5" />
      </g>
    </g>
  ),
  "let-it-ride": (
    <g filter="url(#a-soft)">
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={22 + i * 28} cy="70" r="12" fill="#16a34a" stroke="#fff" strokeWidth="2" strokeDasharray="4 3" />
          <text x={22 + i * 28} y="75" textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff">{["1", "2", "$"][i]}</text>
        </g>
      ))}
      {card(26, 12, -8, "10", true, 24)}
      {card(50, 12, 8, "J", false, 24)}
    </g>
  ),
  "baccarat-lightning": (
    <g filter="url(#a-soft)">
      {card(14, 30, -12, "9", true)}
      {card(46, 30, 10, "8")}
      <path d="M58 4 L44 34 L56 34 L44 62 L74 26 L60 26 L70 4 Z" fill="#fde047" stroke="#a16207" strokeWidth="2" />
    </g>
  ),
  "red-dog": (
    <g filter="url(#a-soft)">
      {card(6, 30, -10, "4", true, 26)}
      {card(37, 24, 0, "?", false, 26)}
      {card(68, 30, 10, "J", true, 26)}
      <path d="M18 22 Q50 2 82 22" stroke="#ef4444" strokeWidth="3" fill="none" />
    </g>
  ),
  guerra: (
    <g filter="url(#a-soft)">
      {card(14, 26, -16, "A")}
      {card(54, 26, 16, "A", true)}
      <path d="M38 80 L62 56 M62 80 L38 56" stroke="#fde047" strokeWidth="5" strokeLinecap="round" />
    </g>
  ),
  "scratch-farao": (
    <g filter="url(#a-soft)">
      <path d="M50 8 L92 86 H8 Z" fill="#facc15" stroke="#a16207" strokeWidth="2.5" />
      <path d="M50 8 L64 86 H8 Z" fill="#ca8a04" />
      <rect x="30" y="56" width="40" height="20" rx="3" fill="#cbd5e1" />
      <path d="M30 70 C 40 60, 50 76, 70 62 L70 76 H30 Z" fill="#1e3a8a" />
    </g>
  ),
  "bau-pirata": (
    <g filter="url(#a-soft)">
      <rect x="16" y="44" width="68" height="40" rx="5" fill="#92400e" stroke="#fde68a" strokeWidth="2.5" />
      <path d="M16 46 Q16 22 50 22 Q84 22 84 46 Z" fill="#b45309" stroke="#fde68a" strokeWidth="2.5" />
      <rect x="44" y="40" width="12" height="16" rx="2" fill="#fde047" />
      <path d="M70 10 L82 22 M82 10 L70 22" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  "scratch-mult": (
    <g filter="url(#a-soft)">
      <rect x="8" y="20" width="84" height="60" rx="8" fill="#16a34a" stroke="#fde047" strokeWidth="2.5" />
      <rect x="16" y="30" width="40" height="40" rx="5" fill="#fef08a" />
      <text x="36" y="56" textAnchor="middle" fontSize="16" fontWeight="900" fill="#14532d" fontFamily="Unbounded">$</text>
      <rect x="62" y="30" width="22" height="40" rx="5" fill="#c026d3" />
      <text x="73" y="56" textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff" fontFamily="Unbounded">x5</text>
    </g>
  ),
  megasena: (
    <g filter="url(#a-soft)">
      <circle cx="50" cy="44" r="30" fill="rgba(16,185,129,0.25)" stroke="#a7f3d0" strokeWidth="2.5" />
      {ball(40, 40, 8, "#fde047", "6", "#3b2300")}
      {ball(58, 50, 8, "#fff", "60")}
      {ball(48, 58, 6, "#86efac")}
      <rect x="38" y="76" width="24" height="10" rx="3" fill="#065f46" />
    </g>
  ),
  bingo90: (
    <g filter="url(#a-soft)">
      <rect x="8" y="24" width="84" height="52" rx="6" fill="#ffe4e6" />
      {Array.from({ length: 15 }).map((_, i) => <rect key={i} x={12 + (i % 5) * 16} y={28 + Math.floor(i / 5) * 16} width="13" height="13" rx="2" fill={i % 4 === 0 ? "#e11d48" : "#fff"} stroke="#fda4af" />)}
      {ball(78, 18, 12, "#fb7185", "90", "#fff")}
    </g>
  ),
  "bingo-flash": (
    <g filter="url(#a-soft)">
      <rect x="12" y="12" width="76" height="76" rx="10" fill="#6d28d9" stroke="#fde047" strokeWidth="2.5" />
      {Array.from({ length: 16 }).map((_, i) => {
        const r = Math.floor(i / 4);
        const c = i % 4;
        const on = r === c || r + c === 3;
        return <rect key={i} x={20 + c * 16} y={20 + r * 16} width="13" height="13" rx="3" fill={on ? "#fde047" : "#fff"} />;
      })}
    </g>
  ),
  "keno-turbo": (
    <g filter="url(#a-soft)">
      {[0, 1, 2, 3].map((i) => [0, 1, 2].map((j) => {
        const on = (i + j) % 2 === 0;
        return <circle key={`${i}${j}`} cx={20 + i * 19} cy={36 + j * 19} r="7.5" fill={on ? "#f59e0b" : "#312e81"} stroke={on ? "#fff7d6" : "#6366f1"} strokeWidth="1.5" />;
      }))}
      <path d="M60 6 L48 26 L58 26 L50 42 L72 20 L62 20 L70 6 Z" fill="#fde047" stroke="#a16207" strokeWidth="1.5" />
    </g>
  ),
  bicho: (
    <g filter="url(#a-soft)">
      <circle cx="50" cy="52" r="32" fill="#f59e0b" />
      <path d="M22 40 C 20 24, 34 18, 40 26 M78 40 C 80 24, 66 18, 60 26" fill="#f59e0b" stroke="#78350f" strokeWidth="3" />
      <circle cx="40" cy="48" r="4" fill="#111" />
      <circle cx="60" cy="48" r="4" fill="#111" />
      <path d="M44 62 Q50 68 56 62" stroke="#111" strokeWidth="3" fill="none" />
      <path d="M50 54 L46 58 H54 Z" fill="#111" />
      <text x="50" y="96" textAnchor="middle" fontSize="12" fontWeight="900" fill="#fde047" fontFamily="Unbounded">16</text>
    </g>
  ),
  "loto-dados": (
    <g filter="url(#a-soft)">
      {[[8, 40], [30, 24], [52, 44], [70, 22], [34, 62]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width="24" height="24" rx="5" fill="#fff" stroke="#a1a1aa" />
          <circle cx={x + 12} cy={y + 12} r="3.4" fill={i === 2 ? "#dc2626" : "#18181b"} />
          {i % 2 === 1 && <><circle cx={x + 6} cy={y + 6} r="2.6" fill="#18181b" /><circle cx={x + 18} cy={y + 18} r="2.6" fill="#18181b" /></>}
        </g>
      ))}
    </g>
  ),
  pescaria: (
    <g filter="url(#a-soft)">
      <path d="M8 70 Q30 60 50 70 T92 70 V92 H8 Z" fill="#0369a1" />
      <path d="M60 4 Q70 30 52 56" stroke="#a16207" strokeWidth="3" fill="none" />
      <path d="M52 56 V64" stroke="#e5e7eb" strokeWidth="1.5" />
      <g transform="translate(46 64)">
        <ellipse cx="0" cy="8" rx="16" ry="9" fill="#fb923c" />
        <path d="M14 8 L24 0 L24 16 Z" fill="#fb923c" />
        <circle cx="-8" cy="6" r="2" fill="#111" />
      </g>
    </g>
  ),
  "cofre-banco": (
    <g filter="url(#a-soft)">
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${10 + (i % 2) * 42} ${10 + Math.floor(i / 2) * 42})`}>
          <rect width="38" height="38" rx="6" fill={i === 1 ? "#facc15" : "#64748b"} stroke="#cbd5e1" strokeWidth="2" />
          <circle cx="19" cy="19" r="8" fill="none" stroke={i === 1 ? "#a16207" : "#1e293b"} strokeWidth="3" />
        </g>
      ))}
    </g>
  ),
  garra: (
    <g filter="url(#a-soft)">
      <rect x="10" y="8" width="80" height="86" rx="10" fill="#db2777" />
      <rect x="16" y="16" width="68" height="64" rx="6" fill="#e0f2fe" opacity=".25" />
      <path d="M50 16 V40" stroke="#cbd5e1" strokeWidth="2.5" />
      <path d="M44 40 Q34 48 40 58 M56 40 Q66 48 60 58" stroke="#cbd5e1" strokeWidth="3.5" fill="none" />
      <circle cx="50" cy="66" r="12" fill="#c084fc" />
      <circle cx="46" cy="64" r="2" fill="#111" />
      <circle cx="54" cy="64" r="2" fill="#111" />
    </g>
  ),
  blocos: (
    <g filter="url(#a-soft)">
      {["#f472b6", "#60a5fa", "#facc15", "#4ade80"].map((c, i) => <rect key={i} x={24 + ((i * 7) % 9) - 4} y={76 - i * 16} width="52" height="14" rx="3" fill={c} stroke="#0003" strokeWidth="2" />)}
      <path d="M50 4 V14" stroke="#fde047" strokeWidth="3" />
      <rect x="10" y="2" width="80" height="4" fill="#facc15" />
    </g>
  ),
  tesouro: (
    <g filter="url(#a-soft)">
      <rect x="8" y="12" width="84" height="76" rx="6" fill="#fcd34d" stroke="#b45309" strokeWidth="2.5" />
      <path d="M16 74 C 30 60, 26 40, 46 40 S 70 26, 82 20" stroke="#7c2d12" strokeWidth="2.5" strokeDasharray="4 4" fill="none" />
      <path d="M74 14 L88 28 M88 14 L74 28" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
    </g>
  ),
  "tiro-alvo": (
    <g filter="url(#a-soft)">
      {[38, 28, 18, 8].map((r, i) => <circle key={r} cx="50" cy="50" r={r} fill={["#f8fafc", "#3b82f6", "#ef4444", "#facc15"][i]} stroke="#111" strokeWidth="1" />)}
      <path d="M50 4 V24 M50 76 V96 M4 50 H24 M76 50 H96" stroke="#22c55e" strokeWidth="3" />
      <circle cx="54" cy="47" r="3" fill="#111" />
    </g>
  ),
  foguetes: (
    <g filter="url(#a-soft)">
      <rect x="84" y="8" width="6" height="84" fill="#fff" />
      <path d="M87 8 V92" stroke="#111" strokeWidth="6" strokeDasharray="6 6" />
      {[["#38bdf8", 64, 20], ["#f97316", 46, 42], ["#a855f7", 56, 64], ["#facc15", 34, 84]].map(([c, x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(90) scale(.62)`}>
          <path d="M0 -16 C 8 -6, 8 6, 5 13 L-5 13 C -8 6, -8 -6, 0 -16 Z" fill="#f5f3ff" />
          <path d="M0 -16 C 4 -11, 6 -7, 6 -4 L-6 -4 C -6 -7, -4 -11, 0 -16 Z" fill={c as string} />
          <path d="M-5 13 L0 24 L5 13 Z" fill="#fb923c" />
        </g>
      ))}
    </g>
  ),
  caixas: (
    <g filter="url(#a-soft)">
      {[["#f43f5e", 6], ["#3b82f6", 36], ["#22c55e", 66]].map(([c, x], i) => (
        <g key={i} transform={`translate(${x} ${i === 1 ? 34 : 44})`}>
          <rect width="28" height="24" rx="3" fill={c as string} />
          <rect x="-2" y="-6" width="32" height="8" rx="2" fill={c as string} stroke="#fff" strokeOpacity=".4" />
          <rect x="12" y="-6" width="4" height="30" fill="#fde047" />
        </g>
      ))}
      <text x="50" y="24" textAnchor="middle" fontSize="18" fontWeight="900" fill="#fde047" fontFamily="Unbounded">?</text>
    </g>
  ),
  maca: (
    <g filter="url(#a-soft)">
      <path d="M50 26 C 28 12, 10 30, 14 56 C 18 82, 38 92, 50 86 C 62 92, 82 82, 86 56 C 90 30, 72 12, 50 26 Z" fill="url(#a-gold)" stroke="#a16207" strokeWidth="2" />
      <path d="M50 26 C 50 16 52 10 58 6" stroke="#78350f" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M56 14 C 66 4, 82 8, 84 14 C 74 20, 62 20, 56 14 Z" fill="#22c55e" />
      <ellipse cx="34" cy="44" rx="6" ry="10" fill="#fff" opacity=".55" transform="rotate(25 34 44)" />
    </g>
  ),
  dardos: (
    <g filter="url(#a-soft)">
      <circle cx="48" cy="54" r="38" fill="#111" />
      {Array.from({ length: 10 }).map((_, i) => {
        const a0 = ((i * 36 - 90) * Math.PI) / 180;
        const a1 = (((i + 1) * 36 - 90) * Math.PI) / 180;
        const p = (a: number, r: number) => `${48 + Math.cos(a) * r} ${54 + Math.sin(a) * r}`;
        return <path key={i} d={`M48 54 L${p(a0, 34)} A34 34 0 0 1 ${p(a1, 34)} Z`} fill={i % 2 ? "#f5f5dc" : "#1c1917"} stroke={i % 2 ? "#16a34a" : "#dc2626"} strokeWidth="3" />;
      })}
      <circle cx="48" cy="54" r="6" fill="#dc2626" />
      <path d="M50 52 L86 16" stroke="#e5e7eb" strokeWidth="3" />
      <path d="M80 22 L92 10 L88 22 L92 26 Z" fill="#f43f5e" />
    </g>
  ),
  "fruta-neon": (
    <g filter="url(#a-soft)">
      <circle cx="40" cy="56" r="22" fill="none" stroke="#22d3ee" strokeWidth="6" style={{ filter: "drop-shadow(0 0 6px #22d3ee)" }} />
      <path d="M66 20 L86 54 H46 Z" fill="none" stroke="#f472b6" strokeWidth="6" strokeLinejoin="round" />
      <path d="M10 90 L90 10" stroke="#f0abfc" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
};

type Cat = "slots" | "originals" | "table" | "cards" | "lottery" | "arcade";
export const GAMES2: { id: string; name: string; tag?: string; cat: Cat; colors: [string, string]; max?: string }[] = [
  // originais
  { id: "crash-duplo", name: "Foguete Duplo", cat: "originals", colors: ["#831843", "#0c4a6e"], max: "50.000x" },
  { id: "crash-aviao", name: "Aviãozinho", cat: "originals", colors: ["#7f1d1d", "#1e1b4b"], max: "50.000x" },
  { id: "hilo", name: "Hi-Lo de Cartas", cat: "originals", colors: ["#065f46", "#022c22"], max: "50.000x" },
  { id: "overunder", name: "Over/Under", cat: "originals", colors: ["#4c1d95", "#1e1b4b"], max: "49x" },
  { id: "wheel", name: "Roda Wheel", cat: "originals", colors: ["#6b21a8", "#1e1b4b"], max: "49,5x" },
  { id: "bolhas", name: "Bolhas", cat: "originals", colors: ["#0369a1", "#1e1b4b"] },
  { id: "escada", name: "Escada", cat: "originals", colors: ["#5b21b6", "#1c1917"], max: "50.000x" },
  { id: "galinha", name: "Galinha Atravessa", cat: "originals", colors: ["#374151", "#111827"], max: "50.000x" },
  { id: "diamantes", name: "Diamantes 5", cat: "originals", colors: ["#0e7490", "#4c1d95"], max: "50x" },
  { id: "cofre-secreto", name: "Cofre Secreto", cat: "originals", colors: ["#334155", "#0f172a"], max: "9.700x" },
  { id: "moedas", name: "Moedas em Série", cat: "originals", colors: ["#a16207", "#1e1b4b"], max: "50.000x" },
  { id: "plinko-duo", name: "Plinko Pirâmide", cat: "originals", colors: ["#9d174d", "#0c4a6e"], max: "1.000x" },
  { id: "limbo-turbo", name: "Limbo Turbo", cat: "originals", colors: ["#9d174d", "#3b0764"], max: "50.000x" },
  { id: "mines7", name: "Mines 7x7", cat: "originals", colors: ["#1e3a8a", "#064e3b"], max: "50.000x" },
  { id: "penalti", name: "Gol de Pênalti", cat: "originals", colors: ["#15803d", "#052e16"], max: "95x" },
  // cartas
  { id: "dragon-tiger", name: "Dragon Tiger", cat: "cards", colors: ["#991b1b", "#78350f"] },
  { id: "andar-bahar", name: "Andar Bahar", cat: "cards", colors: ["#0f766e", "#1e1b4b"] },
  { id: "bj-eu", name: "Blackjack Europeu", cat: "cards", colors: ["#1e3a8a", "#022c22"] },
  { id: "bj-multi", name: "Blackjack Multimão", cat: "cards", colors: ["#065f46", "#1e1b4b"] },
  { id: "bj-switch", name: "Blackjack Switch", cat: "cards", colors: ["#5b21b6", "#022c22"] },
  { id: "bj-213", name: "Blackjack 21+3", cat: "cards", colors: ["#0f766e", "#022c22"], max: "100:1" },
  { id: "vp-deuces", name: "Deuces Wild", cat: "cards", colors: ["#14532d", "#172554"], max: "800x" },
  { id: "vp-double", name: "Double Bonus", cat: "cards", colors: ["#7f1d1d", "#172554"], max: "800x" },
  { id: "vp-joker", name: "Joker Poker", cat: "cards", colors: ["#4c1d95", "#172554"], max: "800x" },
  { id: "let-it-ride", name: "Let It Ride", cat: "cards", colors: ["#0f766e", "#042f2e"], max: "1000:1" },
  { id: "baccarat-lightning", name: "Bacará Relâmpago", cat: "cards", colors: ["#a16207", "#1e1b4b"], max: "512x" },
  { id: "red-dog", name: "Red Dog", cat: "cards", colors: ["#b91c1c", "#022c22"] },
  { id: "guerra", name: "Guerra de Cartas", cat: "cards", colors: ["#581c87", "#450a0a"] },
  // sorteios
  { id: "scratch-farao", name: "Raspadinha do Faraó", cat: "lottery", colors: ["#a16207", "#1e3a8a"], max: "5.000x" },
  { id: "bau-pirata", name: "Baú Pirata", cat: "lottery", colors: ["#0c4a6e", "#422006"], max: "50x" },
  { id: "scratch-mult", name: "Raspadinha Multiplicadora", cat: "lottery", colors: ["#15803d", "#713f12"], max: "1.000x" },
  { id: "megasena", name: "Mega Sena Virtual", cat: "lottery", colors: ["#047857", "#022c22"], max: "50.000x" },
  { id: "bingo90", name: "Bingo 90 Bolas", cat: "lottery", colors: ["#be123c", "#4c0519"], max: "2.000x" },
  { id: "bingo-flash", name: "Bingo Relâmpago", cat: "lottery", colors: ["#6d28d9", "#713f12"], max: "50.000x" },
  { id: "keno-turbo", name: "Keno Turbo", cat: "lottery", colors: ["#b45309", "#1e1b4b"], max: "1.500x" },
  { id: "bicho", name: "Jogo do Bicho", cat: "lottery", colors: ["#4d7c0f", "#1a2e05"], max: "9.600x" },
  { id: "loto-dados", name: "Loto Dados", cat: "lottery", colors: ["#991b1b", "#14532d"], max: "7.542x" },
  { id: "pescaria", name: "Pescaria", cat: "lottery", colors: ["#0369a1", "#082f49"], max: "300x" },
  // arcade
  { id: "cofre-banco", name: "Cofre do Banco", cat: "arcade", colors: ["#475569", "#713f12"], max: "150x" },
  { id: "garra", name: "Garra de Pelúcia", cat: "arcade", colors: ["#be185d", "#4c0519"], max: "250x" },
  { id: "blocos", name: "Torre de Blocos", cat: "arcade", colors: ["#1d4ed8", "#0c4a6e"], max: "600x" },
  { id: "tesouro", name: "Caça-Tesouro", cat: "arcade", colors: ["#b45309", "#0c4a6e"], max: "50.000x" },
  { id: "tiro-alvo", name: "Tiro ao Alvo", cat: "arcade", colors: ["#c2410c", "#1c1917"], max: "200x" },
  { id: "foguetes", name: "Corrida de Foguetes", cat: "arcade", colors: ["#1e3a8a", "#020617"], max: "9,7x" },
  { id: "caixas", name: "Escolha a Caixa", cat: "arcade", colors: ["#be123c", "#1e3a8a"] },
  { id: "maca", name: "Maçã Dourada", cat: "arcade", colors: ["#15803d", "#713f12"], max: "50.000x" },
  { id: "dardos", name: "Dardos", cat: "arcade", colors: ["#166534", "#450a0a"], max: "1.000x" },
  { id: "fruta-neon", name: "Fruta Neon", cat: "arcade", colors: ["#a21caf", "#1e1b4b"] },
];
