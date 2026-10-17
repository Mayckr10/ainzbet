import { motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "../../lib/api";
import { cls, fmt, fmtMult } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { revealBalance } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { celebrate } from "../../ui/effects";
import { sessionAction, shareRound, startSession } from "../../ui/GameShell";

export type Round<V> = { id: number; view: V; done: boolean; payout: number };

/** Estado de uma rodada com etapas: retoma a ativa, começa, age e trata o fim. */
export function useSession<V = any>(game: string) {
  const [round, setRound] = useState<Round<V> | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    api.get(`/session/${game}/active`).then((r) => r.active && setRound({ id: r.active.roundId, view: r.active.view, done: false, payout: 0 })).catch(() => {});
  }, [game]);

  async function start(bet: number, params: any = {}, total = bet) {
    if (busyRef.current) return null;
    busyRef.current = true;
    setBusy(true);
    haptic.impact("medium");
    const r = await startSession<V>(game, bet, params, total);
    busyRef.current = false;
    setBusy(false);
    if (!r) return null;
    setLastWin(null);
    setRound({ id: r.roundId, view: r.view, done: r.done, payout: r.payout });
    return r;
  }

  async function act(action: string, payload: any = {}) {
    if (!round || round.done || busyRef.current) return null;
    busyRef.current = true;
    setBusy(true);
    const r = await sessionAction<V>(round.id, action, payload);
    busyRef.current = false;
    setBusy(false);
    if (!r) return null;
    setRound({ id: r.roundId, view: r.view, done: r.done, payout: r.payout });
    if (r.done && r.payout > 0) setLastWin(r.roundId);
    return r;
  }

  return { round, setRound, busy, start, act, lastWin, setLastWin, active: !!round && !round.done };
}

/** Efeitos de fim de rodada (ganho: moedas/big win; perda: som e saldo). */
export async function finishFx(payout: number, bet: number, from?: HTMLElement | null) {
  if (payout > 0) await celebrate(payout, bet, from);
  else {
    sfx.lose();
    haptic.error();
    revealBalance();
  }
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "win" | "gold" | "loss" }) {
  return (
    <div className="glass rounded-xl py-1.5 px-2 text-center min-w-0">
      <div className="text-[9px] font-black text-white/45 tracking-wider truncate">{label}</div>
      <div className={cls("font-extrabold text-sm tabular truncate", tone === "win" ? "text-win-400" : tone === "gold" ? "text-gold-300" : tone === "loss" ? "text-loss-400" : "text-white")}>{value}</div>
    </div>
  );
}

export function Stats({ children }: { children: ReactNode }) {
  return <div className="px-3 grid grid-flow-col auto-cols-fr gap-2">{children}</div>;
}

export function Footer({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
      {children}
    </div>
  );
}

export function ShareLink({ id }: { id: number | null }) {
  if (!id) return null;
  return (
    <button onClick={() => shareRound(id)} className="text-[11px] font-black text-plasma-400 press">
      COMPARTILHAR ↗
    </button>
  );
}

export function Hist({ items, format = fmtMult }: { items: { v: number; win: boolean }[]; format?: (v: number) => string }) {
  return (
    <div className="px-3 flex gap-1.5 overflow-x-auto no-scrollbar h-7 shrink-0">
      {items.map((h, i) => (
        <motion.span key={items.length - i} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cls("shrink-0 rounded-lg px-2 py-1 text-[11px] font-black tabular", h.win ? "bg-win-500/20 text-win-400" : "bg-white/5 text-white/50")}>
          {format(h.v)}
        </motion.span>
      ))}
    </div>
  );
}

/** Histórico local curto (por jogo). */
export function useHist(key: string, max = 16) {
  const [items, set] = useState<{ v: number; win: boolean }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`cc_h_${key}`) ?? "[]");
    } catch {
      return [];
    }
  });
  const push = (v: number, win: boolean) =>
    set((h) => {
      const n = [{ v, win }, ...h].slice(0, max);
      try {
        localStorage.setItem(`cc_h_${key}`, JSON.stringify(n));
      } catch {}
      return n;
    });
  return [items, push] as const;
}

export function usePersist<T>(key: string, def: T): [T, (v: T) => void] {
  const [v, set] = useState<T>(() => {
    try {
      const s = localStorage.getItem(`cc_p_${key}`);
      return s == null ? def : (JSON.parse(s) as T);
    } catch {
      return def;
    }
  });
  return [
    v,
    (x: T) => {
      set(x);
      try {
        localStorage.setItem(`cc_p_${key}`, JSON.stringify(x));
      } catch {}
    },
  ];
}

/** Botão de chips de opção (modos/dificuldades). */
export function Chips<T extends string | number>({ value, options, onChange, disabled }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className={cls("flex gap-1.5", disabled && "opacity-50 pointer-events-none")}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => {
            haptic.tap();
            sfx.click();
            onChange(o.value);
          }}
          className={cls("press flex-1 h-9 rounded-xl text-[11px] font-black", value === o.value ? "btn-violet" : "glass text-white/65")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const money = (bet: number, m: number) => fmt(Math.floor(bet * m));

/** Multiplicador da escada (igual ao servidor). */
export const ladderMult = (cols: number, bad: number, L: number) => (L <= 0 ? 1 : Math.min(50000, Math.floor(0.98 * (cols / (cols - bad)) ** L * 100 + 1e-9) / 100));
export function gridMult(n: number, bombs: number, safe: number) {
  let m = 0.98;
  for (let i = 0; i < safe; i++) m *= (n - i) / (n - bombs - i);
  return Math.min(50000, Math.floor(m * 100 + 1e-9) / 100);
}
