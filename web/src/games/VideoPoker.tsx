import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { cls, fmt } from "../lib/format";
import { sfx } from "../lib/sound";
import { revealBalance, useApp } from "../lib/store";
import { haptic } from "../lib/tg";
import { PlayingCard } from "../ui/cards";
import { celebrate } from "../ui/effects";
import { GameShell, sessionAction, shareRound, startSession } from "../ui/GameShell";
import { BetInput, Btn, useBet } from "../ui/kit";

const NAMES: Record<number, string> = { 9: "Royal Flush", 8: "Straight Flush", 7: "Quadra", 6: "Full House", 5: "Flush", 4: "Sequência", 3: "Trinca", 2: "Dois Pares", 1: "Valetes ou +" };
const ORDER = [9, 8, 7, 6, 5, 4, 3, 2, 1];

export default function VideoPoker() {
  const pays: Record<string, number> = useApp((s) => s.config?.videopoker ?? {});
  const [bet, setBet] = useBet("videopoker");
  const [round, setRound] = useState<{ id: number; hand: number[]; phase: "hold" | "done"; rank?: number; mult?: number; payout?: number; current?: { cat: number; mult: number } } | null>(null);
  const [hold, setHold] = useState<boolean[]>([false, false, false, false, false]);
  const [busy, setBusy] = useState(false);
  const [dealId, setDealId] = useState(0);

  useEffect(() => {
    api.get("/session/videopoker/active").then((r) => {
      if (r.active) setRound({ id: r.active.roundId, hand: r.active.view.hand, phase: "hold", current: r.active.view.current });
    });
  }, []);

  async function deal() {
    setBusy(true);
    setHold([false, false, false, false, false]);
    const r = await startSession<any>("videopoker", bet, {});
    setBusy(false);
    if (!r) return;
    setDealId((x) => x + 1);
    setRound({ id: r.roundId, hand: r.view.hand, phase: "hold", current: r.view.current });
  }

  async function draw() {
    if (!round || busy) return;
    setBusy(true);
    const r = await sessionAction<any>(round.id, "draw", { hold });
    setBusy(false);
    if (!r) return;
    setRound({ id: r.roundId, hand: r.view.hand, phase: "done", rank: r.view.hand_rank, mult: r.view.multiplier, payout: r.payout });
    setTimeout(async () => {
      if (r.payout > 0) await celebrate(r.payout, bet);
      else {
        sfx.lose();
        revealBalance();
      }
    }, 700);
  }

  const toggle = (i: number) => {
    if (round?.phase !== "hold") return;
    haptic.tap();
    sfx.click();
    setHold((h) => h.map((x, j) => (j === i ? !x : x)));
  };
  const hl = round?.phase === "done" && (round.mult ?? 0) > 0 ? round.rank : round?.phase === "hold" && (round.current?.mult ?? 0) > 0 ? round.current?.cat : undefined;

  return (
    <GameShell title="Video Pôquer" game="videopoker" info={<p>Jacks or Better 9/6. Receba 5 cartas, toque nas que quer segurar e troque as outras uma vez. Par de valetes ou maior já paga. RTP ≈ 99,5% com jogo ótimo.</p>}>
      <div className="mx-3 rounded-2xl overflow-hidden border border-gold-400/30 bg-[#0c1a4a]">
        {ORDER.map((r) => (
          <div key={r} className={cls("flex justify-between px-3 py-[3px] text-[12px] font-extrabold", hl === r ? "bg-gold-400 text-[#2a1700]" : r % 2 ? "bg-white/[0.03] text-gold-300/90" : "text-gold-300/90")}>
            <span>{NAMES[r]}</span>
            <span className="tabular">{fmt((pays[r] ?? 0) * bet)}</span>
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex gap-1.5">
          {(round?.hand ?? [-1, -1, -1, -1, -1]).map((c, i) => (
            <PlayingCard key={`${dealId}-${i}-${c}`} card={round ? c : -1} index={round?.phase === "done" && !hold[i] ? 0 : i} size="lg" held={round?.phase === "hold" && hold[i]} onClick={() => toggle(i)} from={{ x: 0, y: -260 }} />
          ))}
        </div>
        <div className="h-14 mt-6 text-center">
          {round?.phase === "done" && (
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cls("font-display font-black text-xl", round.payout ? "text-gold-300" : "text-white/60")}>
              {round.mult ? `${NAMES[round.rank!]} · +${fmt(round.payout!)}` : "Sem combinação"}
              {round.payout ? <div><button onClick={() => shareRound(round.id)} className="text-[11px] font-black text-plasma-400 press">COMPARTILHAR ↗</button></div> : null}
            </motion.div>
          )}
          {round?.phase === "hold" && <div className="text-sm font-bold text-white/60">Toque nas cartas para segurar</div>}
        </div>
      </div>
      <div className="px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        {round?.phase === "hold" ? (
          <Btn variant="gold" size="xl" pulse disabled={busy} onClick={draw}>TROCAR CARTAS</Btn>
        ) : (
          <>
            <BetInput value={bet} onChange={setBet} disabled={busy} />
            <Btn variant="gold" size="lg" pulse disabled={busy} onClick={deal}>DISTRIBUIR</Btn>
          </>
        )}
      </div>
    </GameShell>
  );
}
