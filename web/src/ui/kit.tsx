import { AnimatePresence, motion, animate, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cls, fmt } from "../lib/format";
import { haptic } from "../lib/tg";
import { sfx } from "../lib/sound";
import { appStore, useApp } from "../lib/store";

/* ---------------------------------------------------------------- Botão */
type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "gold" | "violet" | "green" | "red" | "glass" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  className?: string;
  pulse?: boolean;
};

export function Btn({ children, onClick, variant = "glass", size = "md", disabled, className, pulse }: BtnProps) {
  const v = {
    gold: "btn-gold",
    violet: "btn-violet",
    green: "btn-green",
    red: "btn-red",
    glass: "glass text-white",
    ghost: "bg-transparent text-white/70",
  }[variant];
  const s = { sm: "h-9 px-3 text-xs rounded-xl", md: "h-11 px-4 text-sm rounded-2xl", lg: "h-14 px-5 text-base rounded-2xl", xl: "h-16 px-6 text-lg rounded-3xl" }[size];
  return (
    <button
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        haptic.tap();
        sfx.click();
        onClick?.();
      }}
      className={cls("press font-extrabold tracking-wide select-none inline-flex items-center justify-center gap-2", v, s, pulse && !disabled && "pulse-glow", className)}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------- Contagem animada */
export function CountUp({ value, duration = 0.6, format = fmt, className, onTick }: { value: number; duration?: number; format?: (n: number) => string; className?: string; onTick?: () => void }) {
  const mv = useMotionValue(value);
  const [shown, setShown] = useState(value);
  const last = useRef(value);
  useEffect(() => {
    const from = last.current;
    last.current = value;
    if (from === value) return;
    mv.set(from);
    let lastTick = 0;
    const ctrl = animate(mv, value, {
      duration: Math.abs(value - from) < 1 ? 0 : duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        setShown(v);
        const now = performance.now();
        if (onTick && now - lastTick > 55) {
          lastTick = now;
          onTick();
        }
      },
    });
    return () => ctrl.stop();
  }, [value]);
  return <span className={cls("tabular", className)}>{format(shown)}</span>;
}

/* ---------------------------------------------------------------- Ícone de ficha */
export function ChipIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <radialGradient id="chipg" cx="35%" cy="30%">
          <stop offset="0" stopColor="#fff2bf" />
          <stop offset=".5" stopColor="#f5c451" />
          <stop offset="1" stopColor="#a8700f" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#chipg)" />
      <circle cx="12" cy="12" r="7.5" fill="none" stroke="#7a4d05" strokeWidth="1.2" strokeDasharray="2.6 2.2" />
      <path d="M12 7.6l1.3 2.7 3 .4-2.2 2 .6 3-2.7-1.5-2.7 1.5.6-3-2.2-2 3-.4z" fill="#7a4d05" />
    </svg>
  );
}

export function StarIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 1.8l3.1 6.4 7 1-5.1 4.9 1.2 7-6.2-3.3-6.2 3.3 1.2-7L1.9 9.2l7-1z" fill="#fbbf24" stroke="#b45309" strokeWidth=".9" />
      <path d="M12 4.6l2.2 4.6 4.4.6-3.3 3" fill="none" stroke="#fff7d6" strokeWidth="1" opacity=".7" />
    </svg>
  );
}

/* ---------------------------------------------------------------- Saldo */
export function BalancePill({ onClick }: { onClick?: () => void }) {
  const bal = useApp((s) => s.displayBalance);
  const prev = useRef(bal);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    if (bal > prev.current) setFlash("up");
    else if (bal < prev.current) setFlash("down");
    prev.current = bal;
    const t = setTimeout(() => setFlash(null), 600);
    return () => clearTimeout(t);
  }, [bal]);
  return (
    <button
      onClick={onClick}
      data-balance-target
      className={cls(
        "press glass rounded-full h-9 pl-1.5 pr-1 flex items-center gap-1.5 transition-shadow",
        flash === "up" && "shadow-[0_0_18px_rgba(74,222,128,0.6)]",
      )}
    >
      <ChipIcon size={22} />
      <CountUp value={bal} className={cls("font-extrabold text-sm", flash === "up" ? "text-win-400" : flash === "down" ? "text-white/80" : "text-white")} />
      <span className="ml-1 w-7 h-7 rounded-full btn-gold grid place-items-center text-base font-black leading-none">+</span>
    </button>
  );
}

/* ---------------------------------------------------------------- Toasts */
type Toast = { id: number; text: string; kind: "info" | "error" | "success" };
const toastStore = { list: [] as Toast[], subs: new Set<() => void>() };
let toastId = 0;
export function toast(text: string, kind: Toast["kind"] = "info") {
  const t = { id: ++toastId, text, kind };
  toastStore.list = [...toastStore.list, t];
  toastStore.subs.forEach((f) => f());
  if (kind === "error") haptic.error();
  setTimeout(() => {
    toastStore.list = toastStore.list.filter((x) => x.id !== t.id);
    toastStore.subs.forEach((f) => f());
  }, 2600);
}
export function Toasts() {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    toastStore.subs.add(f);
    return () => {
      toastStore.subs.delete(f);
    };
  }, []);
  return (
    <div className="fixed left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none" style={{ top: "calc(var(--safe-top) + 64px)" }}>
      <AnimatePresence>
        {toastStore.list.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={cls(
              "px-4 py-2.5 rounded-2xl text-sm font-bold shadow-2xl max-w-[86vw] text-center",
              t.kind === "error" ? "bg-loss-500/95 text-white" : t.kind === "success" ? "bg-win-500/95 text-space-950" : "bg-space-700/95 text-white border border-white/10",
            )}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ---------------------------------------------------------------- Sheet / modal */
export function Sheet({ open, onClose, title, children, tall }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; tall?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70" onClick={onClose} />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className={cls("relative w-full max-w-lg rounded-t-[28px] bg-space-900 border-t border-white/10 flex flex-col", tall ? "h-[88vh]" : "max-h-[88vh]")}
            style={{ paddingBottom: "calc(var(--safe-bottom) + 12px)" }}
          >
            <div className="mx-auto mt-2.5 mb-1 h-1.5 w-12 rounded-full bg-white/20" />
            {title && (
              <div className="flex items-center justify-between px-5 pt-2 pb-3">
                <div className="font-display font-bold text-lg">{title}</div>
                <button onClick={onClose} className="press w-9 h-9 rounded-full glass grid place-items-center text-white/70">
                  ✕
                </button>
              </div>
            )}
            <div className="overflow-y-auto no-scrollbar px-5 pb-2 flex-1">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------------------------------------------- Segmentado */
export function Segmented<T extends string | number>({ value, options, onChange, disabled, className }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; disabled?: boolean; className?: string }) {
  return (
    <div className={cls("glass rounded-2xl p-1 flex gap-1", disabled && "opacity-50 pointer-events-none", className)}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => {
            haptic.tap();
            onChange(o.value);
          }}
          className={cls("press flex-1 h-9 rounded-xl text-xs font-extrabold transition-colors", value === o.value ? "btn-violet" : "text-white/60")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- Seletor de aposta */
export function BetInput({ value, onChange, disabled, maxOverride, label = "Aposta" }: { value: number; onChange: (v: number) => void; disabled?: boolean; maxOverride?: number; label?: string }) {
  const user = useApp((s) => s.user);
  const min = user?.limits.minBet ?? 1;
  const max = Math.max(min, Math.min(maxOverride ?? Infinity, user?.limits.maxBet ?? 100000, user?.balance ?? 0));
  const set = (v: number) => {
    haptic.tap();
    sfx.chip();
    onChange(Math.max(min, Math.min(Math.floor(v) || min, Math.max(min, max))));
  };
  return (
    <div className={cls("glass rounded-2xl p-1.5 flex items-center gap-1.5", disabled && "opacity-50 pointer-events-none")}>
      <div className="flex-1 flex items-center gap-2 pl-2 min-w-0">
        <ChipIcon size={20} />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-white/45 font-bold leading-none">{label}</span>
          <input
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value))))}
            onBlur={() => set(value)}
            className="bg-transparent outline-none w-full font-extrabold text-base text-white tabular leading-tight"
          />
        </div>
      </div>
      <button onClick={() => set(value / 2)} className="press w-11 h-10 rounded-xl bg-white/8 font-extrabold text-sm text-white/85">½</button>
      <button onClick={() => set(value * 2)} className="press w-11 h-10 rounded-xl bg-white/8 font-extrabold text-sm text-white/85">2×</button>
      <button onClick={() => set(max)} className="press w-12 h-10 rounded-xl bg-gold-400/15 text-gold-300 font-extrabold text-xs">MAX</button>
    </div>
  );
}

/** Aposta lembrada por jogo. */
export function useBet(game: string, def = 100): [number, (v: number) => void] {
  const key = `cc_bet_${game}`;
  const [bet, setBet] = useState(() => {
    const v = Number(localStorage.getItem(key));
    return v > 0 ? v : def;
  });
  return [
    bet,
    (v: number) => {
      setBet(v);
      try {
        localStorage.setItem(key, String(v));
      } catch {}
    },
  ];
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cls("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold", className)}>{children}</span>;
}

export function Avatar({ name, photo, size = 36, ring }: { name: string; photo?: string | null; size?: number; ring?: string }) {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return photo ? (
    <img src={photo} alt="" width={size} height={size} className={cls("rounded-full object-cover shrink-0", ring)} style={{ width: size, height: size }} />
  ) : (
    <div
      className={cls("rounded-full grid place-items-center font-black text-white shrink-0", ring)}
      style={{ width: size, height: size, background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 50) % 360} 70% 38%))`, fontSize: size * 0.42 }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function TierBadge({ tier, vip }: { tier?: string | null; vip?: boolean }) {
  if (!tier && !vip) return null;
  const color: Record<string, string> = {
    Diamante: "from-cyan-200 to-sky-500 text-sky-950",
    Ouro: "from-amber-200 to-amber-500 text-amber-950",
    Prata: "from-slate-100 to-slate-400 text-slate-900",
    Bronze: "from-orange-300 to-orange-700 text-orange-950",
  };
  return (
    <span className="inline-flex gap-1">
      {vip && <span className="rounded-md px-1.5 py-[1px] text-[9px] font-black bg-gradient-to-b from-gold-300 to-gold-500 text-[#3b2300]">VIP</span>}
      {tier && <span className={cls("rounded-md px-1.5 py-[1px] text-[9px] font-black bg-gradient-to-b", color[tier])}>{tier.toUpperCase()}</span>}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <div className={cls("w-6 h-6 rounded-full border-2 border-white/20 border-t-gold-400 animate-spin", className)} />;
}

export function useDisplayLock() {
  return () => appStore.set({ holdBalance: false });
}
