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

const FEE = 0.12;
const val = (c: number) => {
  const k = c % 13;
  return k <= 7 ? k + 2 : k === 12 ? 1 : 0;
};
type Res = { player: number[]; banker: number[]; order: ("P" | "B")[]; winner: string; lightning: { card: number; mult: number }[]; applied: number };

export default function BaccaratLightning() {
  const T = useTableBets("baccarat-lightning");
  const [cards, setCards] = useState<{ P: number[]; B: number[] }>({ P: [], B: [] });
  const [totals, setTotals] = useState<{ P: number | null; B: number | null }>({ P: null, B: null });
  const [bolts, setBolts] = useState<Res["lightning"]>([]);
  const [flash, setFlash] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [applied, setApplied] = useState(1);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ id: number; payout: number } | null>(null);
  const cost = T.total + Math.ceil(T.total * FEE);
  const boltMap = new Map(bolts.map((b) => [b.card, b.mult]));

  async function deal() {
    if (busy || !T.total) return;
    setBusy(true);
    setWinner(null);
    setCards({ P: [], B: [] });
    setTotals({ P: null, B: null });
    setBolts([]);
    setApplied(1);
    haptic.impact("medium");
    T.commit();
    const r = await playInstant<Res>("baccarat-lightning", 1, { bets: T.bets }, cost);
    if (!r) return setBusy(false);
    const sf = speedFactor();
    const res = r.result;
    // relâmpagos
    for (const b of res.lightning) {
      setFlash(true);
      sfx.arcane();
      haptic.impact("heavy");
      setBolts((x) => [...x, b]);
      await sleep(120);
      setFlash(false);
      await sleep(380 * sf);
    }
    await sleep(300 * sf);
    const idx = { P: 0, B: 0 };
    for (const s of res.order) {
      const c = s === "P" ? res.player[idx.P++] : res.banker[idx.B++];
      setCards((x) => ({ ...x, [s]: [...x[s], c] }));
      await sleep(620 * sf);
      const hand = s === "P" ? res.player.slice(0, idx.P) : res.banker.slice(0, idx.B);
      setTotals((t) => ({ ...t, [s]: hand.reduce((a, x) => a + val(x), 0) % 10 }));
    }
    await sleep(300);
    setWinner(res.winner);
    setApplied(res.applied);
    setLast({ id: r.roundId, payout: r.payout });
    if (res.applied > 1) sfx.jackpot();
    await finishFx(r.payout, cost);
    T.clear();
    setBusy(false);
  }

  const hand = (s: "P" | "B", title: string, color: string) => (
    <div className={cls("flex-1 flex flex-col items-center rounded-2xl py-2", winner === (s === "P" ? "player" : "banker") && "bg-gold-400/15 ring-2 ring-gold-400")}>
      <div className="text-xs font-black tracking-widest" style={{ color }}>{title}</div>
      <div className="flex -space-x-6 min-h-[92px] mt-1">
        {cards[s].map((c, i) => (
          <div key={i} className={cls("relative", i === 2 && "rotate-90 translate-y-3")}>
            <PlayingCard card={c} index={0} highlight={boltMap.has(c % 52)} />
            {boltMap.has(c % 52) && <span className="absolute -top-2 -right-1 rounded-full bg-yellow-300 text-[#3b2300] text-[10px] font-black px-1.5 shadow-[0_0_10px_#fde047]">{boltMap.get(c % 52)}x</span>}
          </div>
        ))}
      </div>
      <div className="mt-1 h-7 w-9 rounded-full bg-black/50 grid place-items-center font-display font-black">{totals[s] ?? "–"}</div>
    </div>
  );

  return (
    <GameShell title="Bacará Relâmpago" game="baccarat-lightning" bg="radial-gradient(70% 45% at 50% 0%, rgba(250,204,21,0.25), transparent 70%), linear-gradient(180deg,#0b0a18,#040309)" info={<><p>Bacará clássico com relâmpagos: antes de cada mão, de 1 a 5 cartas (valor e naipe) recebem multiplicadores de 2x a 8x. Se a mão vencedora tiver cartas-relâmpago, o prêmio é multiplicado — e os multiplicadores se multiplicam entre si (até 512x).</p><p>Pagamentos base: Jogador 1:1 · Banca 0,95:1 · Empate 6,5:1. Taxa de relâmpago: 12% sobre as apostas. RTP ≈ 98%.</p></>}>
      <Felt color="blue">
        <Shoe />
        <AnimatePresence>{flash && <motion.div className="absolute inset-0 bg-yellow-100/60 z-30 pointer-events-none" initial={{ opacity: 1 }} exit={{ opacity: 0 }} />}</AnimatePresence>
        <div className="absolute top-3 left-3 right-16 flex gap-1.5 min-h-[44px] items-center">
          {bolts.map((b, i) => (
            <motion.div key={i} initial={{ scale: 2, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} className="relative scale-[0.62] origin-left -mr-6">
              <PlayingCard card={b.card} size="sm" index={-1} from={{ x: 0, y: 0 }} highlight />
              <span className="absolute -bottom-2 inset-x-0 text-center text-[14px] font-black text-yellow-300 drop-shadow-[0_0_6px_#fde047]">⚡{b.mult}x</span>
            </motion.div>
          ))}
        </div>
        <div className="absolute top-[70px] left-3 right-3 flex gap-2">
          {hand("P", "JOGADOR", "#7dd3fc")}
          {hand("B", "BANCA", "#fda4af")}
        </div>
        {winner && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute left-0 right-0 top-[250px] text-center font-display font-black text-xl gold-text">
            {winner === "tie" ? "EMPATE" : winner === "player" ? "JOGADOR VENCE" : "BANCA VENCE"}
            {applied > 1 && <span className="block text-yellow-300 text-lg">⚡ x{applied}</span>}
            {last && last.payout > 0 && <span className="block text-sm text-win-400">+{fmt(last.payout)}</span>}
          </motion.div>
        )}
        <div className="absolute bottom-3 left-3 right-3 grid grid-cols-3 gap-2">
          <BetArea label="JOGADOR" sub="1:1 ⚡" amount={T.bets.player} onClick={() => !busy && T.place("player", 1 + FEE)} win={winner === "player"} className="h-16 bg-sky-800/50" />
          <BetArea label="EMPATE" sub="6,5:1 ⚡" amount={T.bets.tie} onClick={() => !busy && T.place("tie", 1 + FEE)} win={winner === "tie"} className="h-16 bg-emerald-800/50" />
          <BetArea label="BANCA" sub="0,95:1 ⚡" amount={T.bets.banker} onClick={() => !busy && T.place("banker", 1 + FEE)} win={winner === "banker"} className="h-16 bg-rose-800/50" />
        </div>
      </Felt>
      <Footer>
        <ChipRack chip={T.chip} onChip={T.setChip} disabled={busy} />
        <div className="flex gap-2">
          <Btn variant="glass" size="lg" className="w-20 text-xs" disabled={busy || !T.total} onClick={T.undo}>↶</Btn>
          <Btn variant="glass" size="lg" className="w-24 text-xs" disabled={busy || (!T.total && !T.canRepeat)} onClick={T.total ? T.clear : T.repeat}>{T.total ? "LIMPAR" : "REPETIR"}</Btn>
          <Btn variant="gold" size="lg" className="flex-1" disabled={busy || !T.total} pulse={!!T.total && !busy} onClick={deal}>
            <ChipIcon size={18} /> {fmt(cost)} <span className="text-[10px] opacity-70">(+12%)</span>
          </Btn>
        </div>
        <ShareLink id={last && last.payout > 0 && !busy ? last.id : null} />
      </Footer>
    </GameShell>
  );
}
