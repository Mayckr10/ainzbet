import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { cls, fmt, fmtMult } from "../lib/format";
import { sfx } from "../lib/sound";
import { revealBalance } from "../lib/store";
import { haptic } from "../lib/tg";
import { celebrate } from "../ui/effects";
import { GameShell, sessionAction, shareRound, startSession } from "../ui/GameShell";
import { BetInput, Btn, useBet } from "../ui/kit";

type View = { mines: number; revealed: number[]; multiplier: number; next: number; minePos?: number[]; outcome?: string; hit?: number };

function multFor(mines: number, safe: number) {
  let m = 0.99;
  for (let i = 0; i < safe; i++) m *= (25 - i) / (25 - mines - i);
  return Math.floor(m * 100) / 100;
}

function Gem() {
  return (
    <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]">
      <path d="M50 10 L84 36 L50 90 L16 36 Z" fill="url(#c-crystal2)" stroke="#ecfeff" strokeWidth="3" strokeLinejoin="round" />
      <path d="M16 36 L84 36 L50 90 Z" fill="#000" opacity=".12" />
      <path d="M34 36 L50 10 L66 36 L50 90 Z" fill="#fff" opacity=".22" />
    </svg>
  );
}
function Bomb() {
  return (
    <svg viewBox="0 0 100 100" className="w-[72%] h-[72%]">
      <circle cx="46" cy="58" r="30" fill="#1f1b2e" stroke="#ef4444" strokeWidth="3" />
      <circle cx="36" cy="48" r="7" fill="#fff" opacity=".35" />
      <rect x="54" y="20" width="14" height="14" rx="3" fill="#64748b" transform="rotate(30 61 27)" />
      <path d="M66 22 C 74 10, 84 14, 86 6" stroke="#f97316" strokeWidth="4" fill="none" />
      <circle cx="86" cy="6" r="5" fill="#fde047" />
    </svg>
  );
}

export default function Mines() {
  const [bet, setBet] = useBet("mines");
  const [mines, setMines] = useState(() => Number(localStorage.getItem("cc_mines_n")) || 3);
  const [round, setRound] = useState<{ id: number; view: View } | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const active = round && !round.view.outcome;

  useEffect(() => {
    api.get("/session/mines/active").then((r) => r.active && setRound({ id: r.active.roundId, view: r.active.view }));
  }, []);
  useEffect(() => localStorage.setItem("cc_mines_n", String(mines)), [mines]);

  async function start() {
    haptic.impact("medium");
    const r = await startSession<View>("mines", bet, { mines });
    if (r) {
      setRound({ id: r.roundId, view: r.view });
      setLastWin(null);
      sfx.whoosh();
    }
  }

  async function reveal(cell: number) {
    if (!active || busy || round!.view.revealed.includes(cell)) return;
    setBusy(true);
    haptic.impact("light");
    const r = await sessionAction<View>(round!.id, "reveal", { cell });
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

  async function randomPick() {
    if (!active) return;
    const free = Array.from({ length: 25 }, (_, i) => i).filter((i) => !round!.view.revealed.includes(i));
    reveal(free[(Math.random() * free.length) | 0]);
  }

  const v = round?.view;
  const revealedCount = v?.revealed.length ?? 0;
  const curMult = v ? v.multiplier : 1;
  const nextMult = multFor(active ? v!.mines : mines, revealedCount + 1);

  return (
    <GameShell title="Mines" game="mines" info={<><p>Grade 5×5 com quantas bombas você quiser (1 a 24). Cada diamante revelado aumenta o multiplicador. Saque quando quiser; se achar uma bomba, perde a aposta.</p><p>Multiplicador = 0,99 × probabilidade inversa de sobreviver. RTP 99%.</p></>}>
      <div className="px-3 grid grid-cols-3 gap-2 text-center">
        <div className="glass rounded-xl py-1.5"><div className="text-[9px] font-black text-white/45">ATUAL</div><div className="font-extrabold text-sm text-win-400">{fmtMult(curMult)}</div></div>
        <div className="glass rounded-xl py-1.5"><div className="text-[9px] font-black text-white/45">PRÓXIMO</div><div className="font-extrabold text-sm">{fmtMult(nextMult)}</div></div>
        <div className="glass rounded-xl py-1.5"><div className="text-[9px] font-black text-white/45">DIAMANTES</div><div className="font-extrabold text-sm">{revealedCount}/{25 - (v?.mines ?? mines)}</div></div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="grid grid-cols-5 gap-2 w-full max-w-[380px]">
          {Array.from({ length: 25 }).map((_, i) => {
            const isRev = v?.revealed.includes(i);
            const isMine = v?.minePos?.includes(i);
            const showMine = !!v?.outcome && isMine;
            const showGemEnd = !!v?.outcome && !isMine && !isRev;
            const hit = v?.hit === i;
            return (
              <motion.button
                key={i}
                whileTap={active ? { scale: 0.9 } : undefined}
                onClick={() => reveal(i)}
                className={cls(
                  "aspect-square rounded-xl grid place-items-center relative overflow-hidden",
                  isRev ? "bg-win-500/15 border border-win-400/40" : hit ? "bg-loss-500/40 border border-loss-400" : showMine || showGemEnd ? "bg-space-800/60" : "bg-gradient-to-b from-space-600 to-space-800 border-b-4 border-space-950/70 shadow-lg",
                  active && !isRev && "active:translate-y-0.5",
                )}
              >
                <AnimatePresence>
                  {(isRev || showMine || showGemEnd) && (
                    <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: showGemEnd ? 0.75 : 1, rotate: 0, opacity: showGemEnd || (showMine && !hit) ? 0.45 : 1 }} transition={{ type: "spring", damping: 12, delay: isRev ? 0 : (i % 7) * 0.02 }} className="w-full h-full grid place-items-center">
                      {showMine ? <Bomb /> : <Gem />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
      <div className="px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        {!active && (
          <>
            <div className="glass rounded-2xl px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black text-white/50">BOMBAS</span>
                <span className="font-display font-black text-loss-400">{mines}</span>
              </div>
              <input type="range" min={1} max={24} value={mines} onChange={(e) => { setMines(Number(e.target.value)); haptic.tap(); }} className="w-full" />
              <div className="flex gap-1.5 mt-1.5">
                {[1, 3, 5, 10, 20, 24].map((n) => <button key={n} onClick={() => setMines(n)} className={cls("press flex-1 h-7 rounded-lg text-[11px] font-black", mines === n ? "btn-violet" : "bg-white/5 text-white/60")}>{n}</button>)}
              </div>
            </div>
            <BetInput value={bet} onChange={setBet} />
            <Btn variant="gold" size="lg" pulse onClick={start}>COMEÇAR · {mines} {mines === 1 ? "bomba" : "bombas"}</Btn>
            {v?.outcome && v.outcome !== "bust" && lastWin && <button onClick={() => shareRound(lastWin)} className="text-[11px] font-black text-plasma-400 press">COMPARTILHAR ↗</button>}
          </>
        )}
        {active && (
          <div className="flex gap-2">
            <Btn variant="glass" size="xl" className="w-28" onClick={randomPick} disabled={busy}>ALEATÓRIO</Btn>
            <Btn variant="green" size="xl" className="flex-1" disabled={busy || revealedCount === 0} onClick={cashout}>
              SACAR {fmt(Math.floor(bet * curMult))}
            </Btn>
          </div>
        )}
      </div>
    </GameShell>
  );
}
