import { motion } from "framer-motion";
import { useRef, useState } from "react";
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

export default function AndarBahar() {
  const T = useTableBets("andar-bahar");
  const [joker, setJoker] = useState<number | null>(null);
  const [andar, setAndar] = useState<number[]>([]);
  const [bahar, setBahar] = useState<number[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ id: number; payout: number } | null>(null);
  const skip = useRef(false);

  async function deal() {
    if (busy || !T.total) return;
    setBusy(true);
    skip.current = false;
    setWinner(null);
    setAndar([]);
    setBahar([]);
    setJoker(null);
    haptic.impact("medium");
    T.commit();
    const r = await playInstant<{ joker: number; andar: number[]; bahar: number[]; winner: string }>("andar-bahar", 1, { bets: T.bets }, T.total);
    if (!r) return setBusy(false);
    const sf = speedFactor();
    setJoker(r.result.joker);
    await sleep(800 * sf);
    const n = r.result.andar.length + r.result.bahar.length;
    for (let i = 0; i < n; i++) {
      const k = Math.floor(i / 2);
      if (i % 2 === 0) setAndar(r.result.andar.slice(0, k + 1));
      else setBahar(r.result.bahar.slice(0, k + 1));
      if (!skip.current) await sleep(Math.max(90, 320 - i * 12) * sf);
    }
    await sleep(400);
    setWinner(r.result.winner);
    setLast({ id: r.roundId, payout: r.payout });
    haptic.impact("heavy");
    await finishFx(r.payout, T.total);
    T.clear();
    setBusy(false);
  }

  const row = (cards: number[], name: string, k: string) => {
    const shown = cards.slice(-6);
    return (
      <div className={cls("rounded-2xl p-2 transition-all", winner === k && "bg-gold-400/15 ring-2 ring-gold-400")}>
        <div className="flex items-center justify-between mb-1">
          <span className={cls("text-xs font-black tracking-[0.25em]", k === "andar" ? "text-sky-300" : "text-rose-300")}>{name}</span>
          <span className="text-[10px] font-black text-white/45">{cards.length} cartas</span>
        </div>
        <div className="flex -space-x-8 h-[70px] items-center">
          {shown.map((c, i) => (
            <div key={cards.length - shown.length + i} className={cls(i === shown.length - 1 && winner === k && "z-10")}>
              <PlayingCard card={c} size="sm" index={0} highlight={winner === k && i === shown.length - 1} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <GameShell title="Andar Bahar" game="andar-bahar" info={<><p>Uma carta coringa é aberta no centro. Depois, as cartas são distribuídas alternadamente em Andar (dentro) e Bahar (fora), começando pelo Andar. Vence o lado que receber primeiro uma carta do mesmo valor do coringa.</p><p>Andar paga 0,9:1 e Bahar 1:1 (o Andar tem leve vantagem por receber primeiro). 1 baralho. RTP ≈ 97%.</p></>}>
      <Felt color="teal">
        <Shoe />
        <div className="absolute top-10 left-3 right-3 flex flex-col gap-2">
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-black tracking-widest text-gold-300 mb-1">CORINGA</div>
            <div className="h-[92px]">{joker != null && <PlayingCard card={joker} size="lg" highlight />}</div>
          </div>
          {row(andar, "ANDAR", "andar")}
          {row(bahar, "BAHAR", "bahar")}
        </div>
        {winner && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute left-0 right-0 bottom-[96px] text-center font-display font-black text-2xl gold-text">
            {winner === "andar" ? "ANDAR VENCE" : "BAHAR VENCE"}
            {last && last.payout > 0 && <span className="block text-sm text-win-400">+{fmt(last.payout)}</span>}
          </motion.div>
        )}
        <div className="absolute bottom-3 left-3 right-3 grid grid-cols-2 gap-2">
          <BetArea label="ANDAR" sub="0,9:1" amount={T.bets.andar} onClick={() => !busy && T.place("andar")} win={winner === "andar"} className="h-16 bg-sky-900/40" />
          <BetArea label="BAHAR" sub="1:1" amount={T.bets.bahar} onClick={() => !busy && T.place("bahar")} win={winner === "bahar"} className="h-16 bg-rose-900/40" />
        </div>
      </Felt>
      <Footer>
        <ChipRack chip={T.chip} onChip={T.setChip} disabled={busy} />
        <div className="flex gap-2">
          <Btn variant="glass" size="lg" className="w-20 text-xs" disabled={busy || !T.total} onClick={T.undo}>↶</Btn>
          {busy ? (
            <Btn variant="glass" size="lg" className="flex-1" onClick={() => (skip.current = true)}>ACELERAR ⏩</Btn>
          ) : (
            <>
              <Btn variant="glass" size="lg" className="w-24 text-xs" disabled={!T.total && !T.canRepeat} onClick={T.total ? T.clear : T.repeat}>{T.total ? "LIMPAR" : "REPETIR"}</Btn>
              <Btn variant="gold" size="lg" className="flex-1" disabled={!T.total} pulse={!!T.total} onClick={deal}><ChipIcon size={18} /> {fmt(T.total)}</Btn>
            </>
          )}
        </div>
        <ShareLink id={last && last.payout > 0 && !busy ? last.id : null} />
      </Footer>
    </GameShell>
  );
}
