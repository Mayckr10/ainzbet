import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { cls, fmt, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { speedFactor } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { PlayingCard, Shoe } from "../../ui/cards";
import { GameShell, playInstant } from "../../ui/GameShell";
import { Btn, ChipIcon } from "../../ui/kit";
import { Felt } from "../Blackjack";
import { finishFx, Footer, ShareLink } from "./common";
import { BetArea, ChipRack, useTableBets } from "./table";

function Emblem({ kind }: { kind: "dragon" | "tiger" }) {
  return kind === "dragon" ? (
    <svg viewBox="0 0 100 100" className="w-14 h-14 opacity-90">
      <path d="M20 70 C 10 40, 40 20, 60 30 C 80 40, 90 20, 84 10 C 96 24, 92 48, 70 54 C 56 58, 50 70, 64 80 C 44 84, 28 80, 20 70 Z" fill="#dc2626" stroke="#fde68a" strokeWidth="3" />
      <circle cx="66" cy="38" r="4" fill="#fde047" />
      <path d="M30 60 L18 54 M34 66 L22 66 M40 72 L30 78" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 100 100" className="w-14 h-14 opacity-90">
      <circle cx="50" cy="54" r="32" fill="#f59e0b" stroke="#fde68a" strokeWidth="3" />
      <path d="M24 30 L30 16 L40 28 Z M76 30 L70 16 L60 28 Z" fill="#f59e0b" stroke="#fde68a" strokeWidth="3" />
      <path d="M50 26 V40 M36 30 L42 42 M64 30 L58 42 M22 54 H34 M66 54 H78" stroke="#111" strokeWidth="4" strokeLinecap="round" />
      <circle cx="40" cy="52" r="4" fill="#111" />
      <circle cx="60" cy="52" r="4" fill="#111" />
      <path d="M44 66 Q50 72 56 66" stroke="#111" strokeWidth="3" fill="none" />
    </svg>
  );
}

const dtVal = (c: number) => (c % 13 === 12 ? 1 : (c % 13) + 2);
const label = (v: number) => (v === 1 ? "A" : v === 11 ? "J" : v === 12 ? "Q" : v === 13 ? "K" : String(v));

export default function DragonTiger() {
  const T = useTableBets("dragon-tiger");
  const [cards, setCards] = useState<{ d: number | null; t: number | null }>({ d: null, t: null });
  const [winner, setWinner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [road, setRoad] = useState<string[]>([]);
  const [last, setLast] = useState<{ id: number; payout: number } | null>(null);

  async function deal() {
    if (busy || !T.total) return;
    setBusy(true);
    setWinner(null);
    setCards({ d: null, t: null });
    haptic.impact("medium");
    T.commit();
    const r = await playInstant<{ dragon: number; tiger: number; winner: string }>("dragon-tiger", 1, { bets: T.bets }, T.total);
    if (!r) return setBusy(false);
    const sf = speedFactor();
    setCards({ d: -1, t: -1 });
    await sleep(500 * sf);
    setCards({ d: r.result.dragon, t: -1 });
    await sleep(700 * sf);
    setCards({ d: r.result.dragon, t: r.result.tiger });
    await sleep(700 * sf);
    setWinner(r.result.winner);
    setRoad((x) => [r.result.winner, ...x].slice(0, 30));
    setLast({ id: r.roundId, payout: r.payout });
    haptic.impact("heavy");
    await finishFx(r.payout, T.total);
    T.clear();
    setBusy(false);
  }

  const side = (k: "dragon" | "tiger") => (
    <div className={cls("flex-1 flex flex-col items-center gap-2 rounded-3xl py-3 transition-all", winner === k && "bg-gold-400/15 ring-2 ring-gold-400")}>
      <Emblem kind={k} />
      <div className={cls("text-xs font-black tracking-[0.25em]", k === "dragon" ? "text-red-400" : "text-amber-400")}>{k === "dragon" ? "DRAGÃO" : "TIGRE"}</div>
      <div className="h-[92px]">
        <AnimatePresence>{cards[k === "dragon" ? "d" : "t"] != null && <PlayingCard card={cards[k === "dragon" ? "d" : "t"]!} size="lg" />}</AnimatePresence>
      </div>
      <div className="h-6 text-sm font-black text-white/70">{cards[k === "dragon" ? "d" : "t"]! >= 0 && cards[k === "dragon" ? "d" : "t"] != null ? label(dtVal(cards[k === "dragon" ? "d" : "t"]!)) : ""}</div>
    </div>
  );

  return (
    <GameShell title="Dragon Tiger" game="dragon-tiger" info={<><p>Uma carta para o Dragão, uma para o Tigre: a mais alta vence. Ás é a menor carta e o Rei a maior; naipes não contam.</p><p>Dragão ou Tigre pagam 1:1 (no empate você recebe metade de volta). Empate paga 12:1. 8 baralhos. RTP ≈ 96,3% (lados) · 97% (empate).</p></>}>
      <Felt color="purple">
        <Shoe />
        <div className="absolute top-10 left-3 right-3 flex gap-3">
          {side("dragon")}
          <div className="self-center font-display font-black text-white/30">VS</div>
          {side("tiger")}
        </div>
        {winner && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute left-0 right-0 top-[60%] text-center font-display font-black text-2xl gold-text">
            {winner === "tie" ? "EMPATE!" : winner === "dragon" ? "DRAGÃO VENCE" : "TIGRE VENCE"}
            {last && last.payout > 0 && <span className="block text-sm text-win-400">+{fmt(last.payout)}</span>}
          </motion.div>
        )}
        <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-1 justify-center">
            {road.map((w, i) => <span key={i} className={cls("w-4 h-4 rounded-full text-[8px] font-black grid place-items-center", w === "dragon" ? "bg-red-500" : w === "tiger" ? "bg-amber-500 text-space-950" : "bg-emerald-500")}>{w === "dragon" ? "D" : w === "tiger" ? "T" : "E"}</span>)}
          </div>
          <div className="grid grid-cols-[1fr_0.8fr_1fr] gap-2">
            <BetArea label="DRAGÃO" sub="1:1" amount={T.bets.dragon} onClick={() => !busy && T.place("dragon")} win={winner === "dragon"} className="h-16 bg-red-900/40" />
            <BetArea label="EMPATE" sub="12:1" amount={T.bets.tie} onClick={() => !busy && T.place("tie")} win={winner === "tie"} className="h-16 bg-emerald-900/40" />
            <BetArea label="TIGRE" sub="1:1" amount={T.bets.tiger} onClick={() => !busy && T.place("tiger")} win={winner === "tiger"} className="h-16 bg-amber-900/40" />
          </div>
        </div>
      </Felt>
      <Footer>
        <ChipRack chip={T.chip} onChip={T.setChip} disabled={busy} />
        <div className="flex gap-2">
          <Btn variant="glass" size="lg" className="w-20 text-xs" disabled={busy || !T.total} onClick={T.undo}>↶</Btn>
          <Btn variant="glass" size="lg" className="w-24 text-xs" disabled={busy || (!T.total && !T.canRepeat)} onClick={T.total ? T.clear : T.repeat}>{T.total ? "LIMPAR" : "REPETIR"}</Btn>
          <Btn variant="gold" size="lg" className="flex-1" disabled={busy || !T.total} pulse={!!T.total && !busy} onClick={deal}><ChipIcon size={18} /> {fmt(T.total)}</Btn>
        </div>
        <ShareLink id={last && last.payout > 0 && !busy ? last.id : null} />
      </Footer>
    </GameShell>
  );
}
