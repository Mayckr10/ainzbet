import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { cls, fmtCompact } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { appStore } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { CasinoChip, chipFor } from "../../ui/chips";
import { toast } from "../../ui/kit";

const RACK = [10, 50, 100, 500, 1000, 5000];

/** Apostas por área (com ficha selecionada, desfazer e repetir). */
export function useTableBets(key: string) {
  const [chip, setChip] = useState(() => Number(localStorage.getItem(`cc_chip_${key}`)) || 100);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [stack, setStack] = useState<{ k: string; v: number }[]>([]);
  const [lastBets, setLastBets] = useState<Record<string, number> | null>(null);
  const total = Object.values(bets).reduce((a, b) => a + b, 0);
  return {
    chip,
    setChip: (c: number) => {
      setChip(c);
      localStorage.setItem(`cc_chip_${key}`, String(c));
    },
    bets,
    total,
    /** fee: fator do custo total (ex.: 1,12 no Bacará Relâmpago) */
    place(k: string, fee = 1) {
      if ((total + chip) * fee > (appStore.get().user?.balance ?? 0)) return toast("Saldo insuficiente", "error");
      haptic.tap();
      sfx.chip();
      setBets((b) => ({ ...b, [k]: (b[k] ?? 0) + chip }));
      setStack((s) => [...s, { k, v: chip }]);
    },
    undo() {
      const last = stack[stack.length - 1];
      if (!last) return;
      setStack((s) => s.slice(0, -1));
      setBets((b) => {
        const n = { ...b, [last.k]: (b[last.k] ?? 0) - last.v };
        if (n[last.k] <= 0) delete n[last.k];
        return n;
      });
    },
    clear() {
      setBets({});
      setStack([]);
    },
    commit() {
      setLastBets(bets);
    },
    repeat() {
      if (!lastBets) return;
      setBets(lastBets);
      setStack(Object.entries(lastBets).map(([k, v]) => ({ k, v })));
    },
    canRepeat: !!lastBets && total === 0,
  };
}

export function ChipRack({ chip, onChip, disabled }: { chip: number; onChip: (c: number) => void; disabled?: boolean }) {
  return (
    <div className={cls("flex justify-between gap-1 px-1", disabled && "opacity-50 pointer-events-none")}>
      {RACK.map((c) => (
        <motion.button key={c} whileTap={{ scale: 0.9 }} animate={{ y: chip === c ? -6 : 0 }} onClick={() => { onChip(c); haptic.tap(); sfx.chip(); }} className="press">
          <CasinoChip value={c} size={44} glow={chip === c} />
        </motion.button>
      ))}
    </div>
  );
}

export function BetArea({ label, sub, amount, onClick, win, className, children, disabled }: { label: ReactNode; sub?: ReactNode; amount?: number; onClick?: () => void; win?: boolean; className?: string; children?: ReactNode; disabled?: boolean }) {
  return (
    <button disabled={disabled} onClick={onClick} className={cls("press relative rounded-2xl border-2 text-center overflow-visible transition-shadow", win ? "border-gold-300 shadow-[0_0_24px_rgba(253,224,71,0.6)]" : "border-white/20", className)}>
      {children}
      <div className="text-[11px] font-black tracking-wider">{label}</div>
      {sub && <div className="text-[10px] text-white/60 font-bold">{sub}</div>}
      {amount ? (
        <motion.div initial={{ scale: 0, y: -20 }} animate={{ scale: 1, y: 0 }} className="absolute -top-3 -right-2">
          <CasinoChip value={chipFor(amount)} size={34} label={fmtCompact(amount)} stack={Math.min(3, Math.ceil(amount / chipFor(amount)))} />
        </motion.div>
      ) : null}
    </button>
  );
}
