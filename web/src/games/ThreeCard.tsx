import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { cls, fmt } from "../lib/format";
import { sfx } from "../lib/sound";
import { appStore, revealBalance } from "../lib/store";
import { haptic } from "../lib/tg";
import { PlayingCard, Shoe } from "../ui/cards";
import { celebrate } from "../ui/effects";
import { GameShell, sessionAction, shareRound, startSession } from "../ui/GameShell";
import { BetInput, Btn, toast, useBet } from "../ui/kit";
import { BetSpot, TablePrint } from "../ui/chips";
import { Felt } from "./Blackjack";

const H3 = ["Carta alta", "Par", "Flush", "Sequência", "Trinca", "Straight flush"];
const OUT: Record<string, string> = { win: "VOCÊ VENCEU", lose: "DEALER VENCEU", push: "EMPATE", noqualify: "DEALER NÃO QUALIFICOU", fold: "VOCÊ DESISTIU" };

export default function ThreeCard() {
  const [bet, setBet] = useBet("threecard");
  const [pp, setPp] = useState(() => Number(localStorage.getItem("cc_3c_pp")) || 0);
  const [round, setRound] = useState<{ id: number; view: any; done: boolean; payout: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/session/threecard/active").then((r) => r.active && setRound({ id: r.active.roundId, view: r.active.view, done: false, payout: 0 }));
  }, []);

  async function deal() {
    setBusy(true);
    setRound(null);
    const r = await startSession("threecard", bet, { pairPlus: pp }, bet + pp);
    setBusy(false);
    if (r) setRound({ id: r.roundId, view: r.view, done: false, payout: 0 });
  }

  async function act(a: "play" | "fold") {
    if (!round || busy) return;
    if (a === "play" && (appStore.get().user?.balance ?? 0) < round.view.ante) return toast("Saldo insuficiente para jogar", "error");
    setBusy(true);
    haptic.impact("medium");
    const r = await sessionAction(round.id, a);
    setBusy(false);
    if (!r) return;
    setRound({ id: r.roundId, view: r.view, done: true, payout: r.payout });
    setTimeout(async () => {
      if (r.payout > r.bet) await celebrate(r.payout, r.bet);
      else {
        if (!r.payout) sfx.lose();
        revealBalance();
      }
    }, 1200);
  }

  const v = round?.view;
  return (
    <GameShell title="Pôquer 3 Cartas" game="threecard" info={<><p>Aposte o Ante (e, se quiser, o Pair Plus). Veja suas 3 cartas e decida: Jogar (aposta igual ao Ante) ou Desistir.</p><p>O dealer qualifica com Dama ou melhor. Se não qualificar, o Ante paga 1:1 e o Jogar é devolvido. Bônus de Ante: sequência 1:1, trinca 4:1, straight flush 5:1. Pair Plus: par 1:1, flush 3:1, sequência 6:1, trinca 30:1, straight flush 40:1.</p></>}>
      <Felt color="blue">
        <Shoe />
        <TablePrint top="DEALER QUALIFICA COM DAMA" bottom="PAIR PLUS PAGA ATÉ 40 PARA 1" />
        <div className="absolute left-0 right-0 top-[52%] flex justify-center gap-5">
          <BetSpot label="PAIR PLUS" amount={v ? v.pairPlus : pp} active={!!v && !round?.done} win={!!round?.done && v?.pairPlusPay > 0} size={52} />
          <BetSpot label="ANTE" amount={v ? v.ante : bet} active={!!v && !round?.done} win={!!round?.done && ["win", "noqualify"].includes(v?.outcome)} size={52} />
          <BetSpot label="PLAY" amount={round?.done && v?.outcome !== "fold" ? v.ante : undefined} win={!!round?.done && v?.outcome === "win"} size={52} />
        </div>
        <div className="absolute top-12 left-0 right-0 flex flex-col items-center">
          <div className="text-[10px] font-black tracking-widest text-white/50 mb-1">DEALER {v?.dealerHand != null && `· ${H3[v.dealerHand]}`}</div>
          <div className="flex gap-1.5 min-h-[92px]">{(v?.dealer ?? []).map((c: number, i: number) => <PlayingCard key={`d${i}-${round?.id}`} card={c} index={i * 2 + 1} />)}</div>
        </div>
        {round?.done && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }} className="absolute left-0 right-0 top-[40%] text-center z-10">
            <div className="inline-block rounded-full bg-black/60 px-4 py-1.5 font-black text-sm">{OUT[v.outcome]}{round.payout ? ` · +${fmt(round.payout)}` : ""}</div>
          </motion.div>
        )}
        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center">
          <div className="flex gap-1.5 min-h-[92px]">{(v?.player ?? []).map((c: number, i: number) => <PlayingCard key={`p${i}-${round?.id}`} card={c} index={i * 2} highlight={v?.playerHand > 0} />)}</div>
          {v && <div className="mt-2 rounded-full bg-black/50 px-3 py-0.5 text-sm font-black">{H3[v.playerHand]}</div>}
          {!v && <div className="text-white/40 font-bold text-sm mb-10">Faça sua aposta</div>}
        </div>
      </Felt>
      <div className="px-3 pt-2 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        {v && !round?.done ? (
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="red" size="xl" disabled={busy} onClick={() => act("fold")}>DESISTIR</Btn>
            <Btn variant="green" size="xl" disabled={busy} onClick={() => act("play")}>JOGAR {fmt(v.ante)}</Btn>
          </div>
        ) : (
          <>
            <BetInput value={bet} onChange={setBet} disabled={busy} label="Ante" />
            <div className="glass rounded-2xl px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-extrabold">Pair Plus</span>
              <div className="flex gap-1.5">
                {[0, bet / 2, bet].map((x) => Math.floor(x)).map((x) => (
                  <button key={x} onClick={() => { setPp(x); localStorage.setItem("cc_3c_pp", String(x)); haptic.tap(); }} className={cls("press h-8 px-3 rounded-lg text-[11px] font-black", pp === x ? "btn-violet" : "bg-white/5 text-white/60")}>{x ? fmt(x) : "Sem"}</button>
                ))}
              </div>
            </div>
            <Btn variant="gold" size="lg" pulse={!busy} disabled={busy} onClick={deal}>DISTRIBUIR · {fmt(bet + pp)}</Btn>
            {round?.done && round.payout > 0 && <button onClick={() => shareRound(round.id)} className="text-[11px] font-black text-plasma-400 press">COMPARTILHAR ↗</button>}
          </>
        )}
      </div>
    </GameShell>
  );
}
