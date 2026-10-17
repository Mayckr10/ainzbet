import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { fmt } from "../lib/format";
import { sfx } from "../lib/sound";
import { appStore, revealBalance } from "../lib/store";
import { haptic } from "../lib/tg";
import { PlayingCard, Shoe } from "../ui/cards";
import { celebrate } from "../ui/effects";
import { GameShell, sessionAction, shareRound, startSession } from "../ui/GameShell";
import { BetInput, Btn, toast, useBet } from "../ui/kit";
import { BetSpot, TablePrint } from "../ui/chips";
import { Felt } from "./Blackjack";

const H5 = ["Carta alta", "Par", "Dois pares", "Trinca", "Sequência", "Flush", "Full house", "Quadra", "Straight flush", "Royal flush"];
const OUT: Record<string, string> = { win: "VOCÊ VENCEU", lose: "DEALER VENCEU", push: "EMPATE", noqualify: "DEALER NÃO QUALIFICOU", fold: "VOCÊ DESISTIU" };

export default function Caribbean() {
  const [bet, setBet] = useBet("caribbean");
  const [round, setRound] = useState<{ id: number; view: any; done: boolean; payout: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/session/caribbean/active").then((r) => r.active && setRound({ id: r.active.roundId, view: r.active.view, done: false, payout: 0 }));
  }, []);

  async function deal() {
    setBusy(true);
    setRound(null);
    const r = await startSession("caribbean", bet, {});
    setBusy(false);
    if (r) setRound({ id: r.roundId, view: r.view, done: false, payout: 0 });
  }

  async function act(a: "call" | "fold") {
    if (!round || busy) return;
    if (a === "call" && (appStore.get().user?.balance ?? 0) < round.view.ante * 2) return toast("Saldo insuficiente para o call (2x ante)", "error");
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
    }, 1500);
  }

  const v = round?.view;
  return (
    <GameShell title="Caribbean Stud" game="caribbean" info={<><p>Aposte o Ante e receba 5 cartas; o dealer mostra uma. Pague o Call (2x o Ante) para continuar ou desista.</p><p>O dealer qualifica com Ás e Rei ou melhor. Sem qualificação: Ante paga 1:1 e o Call volta. Se você vencer, o Call paga pela mão: par 1:1, dois pares 2:1, trinca 3:1, sequência 4:1, flush 5:1, full house 7:1, quadra 20:1, straight flush 50:1, royal flush 100:1.</p></>}>
      <Felt color="teal">
        <Shoe />
        <TablePrint top="DEALER QUALIFICA COM ÁS E REI" bottom="ROYAL FLUSH PAGA 100 PARA 1" />
        <div className="absolute left-0 right-0 top-[54%] flex justify-center gap-6">
          <BetSpot label="ANTE" amount={v ? v.ante : bet} active={!!v && !round?.done} win={!!round?.done && ["win", "noqualify"].includes(v?.outcome)} size={54} />
          <BetSpot label="CALL" amount={round?.done && v?.outcome !== "fold" ? v.ante * 2 : undefined} win={!!round?.done && v?.outcome === "win"} size={54} />
        </div>
        <div className="absolute top-12 left-0 right-0 flex flex-col items-center">
          <div className="text-[10px] font-black tracking-widest text-white/50 mb-1">DEALER {round?.done && v?.dealerHand != null && `· ${H5[v.dealerHand]}`}</div>
          <div className="flex -space-x-5 min-h-[84px]">{(v?.dealer ?? []).map((c: number, i: number) => <PlayingCard key={`d${i}-${round?.id}`} card={c} index={i * 2 + 1} size="sm" />)}</div>
        </div>
        {round?.done && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 }} className="absolute left-0 right-0 top-[40%] text-center z-10">
            <div className="inline-block rounded-full bg-black/60 px-4 py-1.5 font-black text-sm">{OUT[v.outcome]}{round.payout ? ` · +${fmt(round.payout)}` : ""}</div>
          </motion.div>
        )}
        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center">
          <div className="flex -space-x-4 min-h-[92px]">{(v?.player ?? []).map((c: number, i: number) => <PlayingCard key={`p${i}-${round?.id}`} card={c} index={i * 2} highlight={v?.playerHand > 0} />)}</div>
          {v && <div className="mt-2 rounded-full bg-black/50 px-3 py-0.5 text-sm font-black">{H5[v.playerHand]}</div>}
          {!v && <div className="text-white/40 font-bold text-sm mb-10">Faça sua aposta</div>}
        </div>
      </Felt>
      <div className="px-3 pt-2 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        {v && !round?.done ? (
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="red" size="xl" disabled={busy} onClick={() => act("fold")}>DESISTIR</Btn>
            <Btn variant="green" size="xl" disabled={busy} onClick={() => act("call")}>CALL {fmt(v.ante * 2)}</Btn>
          </div>
        ) : (
          <>
            <BetInput value={bet} onChange={setBet} disabled={busy} label="Ante" />
            <Btn variant="gold" size="lg" pulse={!busy} disabled={busy} onClick={deal}>DISTRIBUIR</Btn>
            {round?.done && round.payout > 0 && <button onClick={() => shareRound(round.id)} className="text-[11px] font-black text-plasma-400 press">COMPARTILHAR ↗</button>}
          </>
        )}
      </div>
    </GameShell>
  );
}
