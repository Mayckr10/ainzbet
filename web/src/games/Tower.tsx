import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { cls, fmt, fmtMult } from "../lib/format";
import { sfx } from "../lib/sound";
import { revealBalance, useApp } from "../lib/store";
import { haptic } from "../lib/tg";
import { celebrate } from "../ui/effects";
import { GameShell, sessionAction, shareRound, startSession } from "../ui/GameShell";
import { BetInput, Btn, Segmented, useBet } from "../ui/kit";

type View = { mode: string; picks: number[]; level: number; multiplier: number; next: number; rows?: number[][]; outcome?: string; hit?: { level: number; col: number } };
const MODES = [
  { value: "easy", label: "Fácil" },
  { value: "medium", label: "Médio" },
  { value: "hard", label: "Difícil" },
  { value: "expert", label: "Expert" },
  { value: "master", label: "Mestre" },
];

export default function Tower() {
  const cfg = useApp((s) => s.config?.tower);
  const [bet, setBet] = useBet("tower");
  const [mode, setMode] = useState<string>(() => localStorage.getItem("cc_tower_mode") || "medium");
  const [round, setRound] = useState<{ id: number; view: View } | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const active = round && !round.view.outcome;
  const m = active || round ? round!.view.mode : mode;
  const spec = cfg?.modes?.[m] ?? { cols: 3, bad: 1 };
  const levels = cfg?.levels ?? 9;
  const mult = (L: number) => Math.floor((0.99 / ((spec.cols - spec.bad) / spec.cols) ** L) * 100) / 100;

  useEffect(() => {
    api.get("/session/tower/active").then((r) => r.active && setRound({ id: r.active.roundId, view: r.active.view }));
  }, []);
  useEffect(() => localStorage.setItem("cc_tower_mode", mode), [mode]);

  async function start() {
    const r = await startSession<View>("tower", bet, { mode });
    if (r) {
      setRound({ id: r.roundId, view: r.view });
      setLastWin(null);
      sfx.whoosh();
    }
  }
  async function pick(col: number) {
    if (!active || busy) return;
    setBusy(true);
    haptic.impact("light");
    const r = await sessionAction<View>(round!.id, "pick", { col });
    setBusy(false);
    if (!r) return;
    setRound({ id: r.roundId, view: r.view });
    if (r.view.outcome === "bust") {
      sfx.explode();
      haptic.error();
      revealBalance();
    } else {
      sfx.gem();
      if (r.done) {
        setLastWin(r.roundId);
        await celebrate(r.payout, bet);
      }
    }
  }
  async function cashout() {
    if (!active || busy) return;
    setBusy(true);
    const r = await sessionAction<View>(round!.id, "cashout");
    setBusy(false);
    if (!r) return;
    setRound({ id: r.roundId, view: r.view });
    setLastWin(r.roundId);
    await celebrate(r.payout, bet);
  }

  const v = round?.view;
  const level = v?.level ?? 0;

  return (
    <GameShell title="Torre" game="tower" info={<><p>Suba a torre escolhendo um bloco por andar. Blocos com caveira encerram a rodada. Cada andar multiplica o prêmio; saque quando quiser.</p><p>Fácil: 4 blocos/1 armadilha · Médio: 3/1 · Difícil: 2/1 · Expert: 3/2 · Mestre: 4/3. RTP 99%.</p></>}>
      <div className="flex-1 min-h-0 flex items-center justify-center px-4">
        <div className="w-full max-w-[360px] flex flex-col-reverse gap-1.5">
          {Array.from({ length: levels }).map((_, L) => {
            const isCurrent = !!active && L === level;
            const passed = v && L < (v.picks.length ?? 0);
            return (
              <div key={L} className={cls("flex items-center gap-2 transition-opacity", !isCurrent && active && L > level && "opacity-45")}>
                <div className={cls("w-14 text-right text-[11px] font-black tabular", passed ? "text-win-400" : isCurrent ? "text-gold-300" : "text-white/40")}>{fmtMult(mult(L + 1))}</div>
                <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${spec.cols}, 1fr)` }}>
                  {Array.from({ length: spec.cols }).map((_, c) => {
                    const picked = v?.picks[L] === c;
                    const trap = v?.rows?.[L]?.includes(c);
                    const hit = v?.hit?.level === L && v.hit.col === c;
                    return (
                      <motion.button
                        key={c}
                        whileTap={isCurrent ? { scale: 0.92 } : undefined}
                        onClick={() => isCurrent && pick(c)}
                        className={cls(
                          "h-9 rounded-lg grid place-items-center text-base font-black",
                          picked ? "bg-win-500/80 shadow-[0_0_14px_rgba(74,222,128,0.6)]" : hit ? "bg-loss-500" : trap && v?.outcome ? "bg-loss-500/30" : isCurrent ? "bg-gradient-to-b from-gold-400/70 to-gold-600/60 animate-pulse" : "bg-space-700/80",
                        )}
                      >
                        {picked ? "◆" : hit || (trap && v?.outcome) ? "☠" : ""}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        {!active ? (
          <>
            <Segmented value={mode} onChange={setMode} options={MODES} />
            <BetInput value={bet} onChange={setBet} />
            <Btn variant="gold" size="lg" pulse onClick={start}>COMEÇAR · até {fmtMult(Math.floor((0.99 / (((cfg?.modes?.[mode]?.cols ?? 3) - (cfg?.modes?.[mode]?.bad ?? 1)) / (cfg?.modes?.[mode]?.cols ?? 3)) ** levels) * 100) / 100)}</Btn>
            {v?.outcome && v.outcome !== "bust" && lastWin && <button onClick={() => shareRound(lastWin)} className="text-[11px] font-black text-plasma-400 press">COMPARTILHAR ↗</button>}
          </>
        ) : (
          <Btn variant="green" size="xl" disabled={busy || level === 0} onClick={cashout}>SACAR {fmt(Math.floor(bet * (v?.multiplier ?? 1)))}</Btn>
        )}
      </div>
    </GameShell>
  );
}
