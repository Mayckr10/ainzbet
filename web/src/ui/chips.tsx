import { fmtCompact } from "../lib/format";

/* Fichas de cassino em SVG (listras na borda, miolo com valor), com pilha opcional. */
export const CHIP_STYLE: Record<number, { base: string; inner: string; text: string }> = {
  10: { base: "#9ca3af", inner: "#e5e7eb", text: "#1f2937" },
  50: { base: "#dc2626", inner: "#fecaca", text: "#7f1d1d" },
  100: { base: "#2563eb", inner: "#bfdbfe", text: "#1e3a8a" },
  500: { base: "#16a34a", inner: "#bbf7d0", text: "#14532d" },
  1000: { base: "#111827", inner: "#d1d5db", text: "#111827" },
  5000: { base: "#7c3aed", inner: "#ddd6fe", text: "#4c1d95" },
  25000: { base: "#ea580c", inner: "#fed7aa", text: "#7c2d12" },
};

export const CHIP_VALUES = [10, 50, 100, 500, 1000, 5000, 25000];
export const chipFor = (amount: number) => [...CHIP_VALUES].reverse().find((c) => c <= amount) ?? 10;

export function CasinoChip({ value, size = 40, label: text, stack = 1, glow }: { value: number; size?: number; label?: string; stack?: number; glow?: boolean }) {
  const st = CHIP_STYLE[value] ?? CHIP_STYLE[10];
  return (
    <div className="relative" style={{ width: size, height: size + Math.min(stack - 1, 3) * 3 }}>
      {Array.from({ length: Math.min(stack, 4) }).map((_, i, arr) => (
        <svg key={i} viewBox="0 0 100 100" width={size} height={size} className="absolute left-0" style={{ top: (arr.length - 1 - i) * 3, filter: glow && i === arr.length - 1 ? "drop-shadow(0 0 8px #fde047)" : "drop-shadow(0 2px 2px rgba(0,0,0,.55))" }}>
          <circle cx="50" cy="50" r="48" fill={st.base} />
          {Array.from({ length: 6 }).map((__, k) => (
            <rect key={k} x="44" y="2" width="12" height="16" rx="2" fill="#fff" transform={`rotate(${k * 60} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="34" fill={st.base} stroke="rgba(0,0,0,.25)" strokeWidth="2" />
          <circle cx="50" cy="50" r="29" fill={st.inner} />
          <circle cx="50" cy="50" r="29" fill="none" stroke={st.base} strokeWidth="2" strokeDasharray="4 4" />
          {i === arr.length - 1 && (
            <text x="50" y="58" textAnchor="middle" fontFamily="Manrope, sans-serif" fontWeight="900" fontSize={text && text.length > 3 ? 20 : 25} fill={st.text}>
              {text ?? (value >= 1000 ? `${value / 1000}K` : value)}
            </text>
          )}
        </svg>
      ))}
    </div>
  );
}


/** Área de aposta desenhada no feltro, com a pilha de fichas e o valor. */
export function BetSpot({ label, amount, active, win, size = 64 }: { label: string; amount?: number; active?: boolean; win?: boolean; size?: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={"relative rounded-full grid place-items-center transition-shadow " + (win ? "shadow-[0_0_22px_rgba(253,224,71,0.8)]" : "")}
        style={{ width: size, height: size, border: `2px solid ${active ? "rgba(253,224,71,0.9)" : "rgba(255,255,255,0.45)"}`, background: "rgba(0,0,0,0.12)" }}
      >
        {amount ? (
          <CasinoChip value={chipFor(amount)} size={size * 0.62} label={fmtCompact(amount)} stack={Math.min(4, Math.ceil(amount / chipFor(amount)))} glow={win} />
        ) : (
          <span className="text-[9px] font-black tracking-wider text-white/50 text-center leading-tight px-1">{label}</span>
        )}
      </div>
      {amount ? <span className="text-[9px] font-black tracking-widest text-white/55">{label}</span> : null}
    </div>
  );
}

/** Frases impressas em arco no feltro (como nas mesas reais). */
export function TablePrint({ top, bottom, color = "rgba(253,224,71,0.55)" }: { top: string; bottom?: string; color?: string }) {
  return (
    <svg viewBox="0 0 400 200" className="absolute left-1/2 -translate-x-1/2 w-[92%] max-w-[380px] pointer-events-none" style={{ top: "34%" }}>
      <defs>
        <path id="tp-arc1" d="M 30 60 Q 200 150 370 60" />
        <path id="tp-arc2" d="M 60 95 Q 200 170 340 95" />
      </defs>
      <text fontFamily="Unbounded, sans-serif" fontWeight="700" fontSize="15" letterSpacing="3" fill={color}>
        <textPath href="#tp-arc1" startOffset="50%" textAnchor="middle">{top}</textPath>
      </text>
      {bottom && (
        <text fontFamily="Manrope, sans-serif" fontWeight="800" fontSize="11" letterSpacing="2.5" fill="rgba(255,255,255,0.35)">
          <textPath href="#tp-arc2" startOffset="50%" textAnchor="middle">{bottom}</textPath>
        </text>
      )}
      <path d="M 30 60 Q 200 150 370 60" fill="none" stroke={color} strokeWidth="0.8" opacity="0.35" transform="translate(0,-18)" />
    </svg>
  );
}
