import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cls, fmt, fmtMult } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { GameShell, playInstant } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { ScratchCell } from "../Scratch";
import { finishFx, Footer, ShareLink } from "./common";

export default function ScratchMult() {
  const [bet, setBet] = useBet("scratch-mult");
  const [card, setCard] = useState<{ value: number; mult: number; payout: number; id: number; bet: number } | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [revealAll, setRevealAll] = useState(false);
  const [reset, setReset] = useState(0);
  const [busy, setBusy] = useState(false);
  const finished = useRef(false);

  async function buy() {
    if (busy) return;
    setBusy(true);
    const r = await playInstant<{ value: number; mult: number }>("scratch-mult", bet, {});
    setBusy(false);
    if (!r) return;
    finished.current = false;
    setRevealed(0);
    setRevealAll(false);
    setReset((x) => x + 1);
    setCard({ ...r.result, payout: r.payout, id: r.roundId, bet });
    sfx.card();
  }
  useEffect(() => {
    if (card && revealed >= 2 && !finished.current) {
      finished.current = true;
      finishFx(card.payout, card.bet);
    }
  }, [revealed, card]);
  const done = card && revealed >= 2;

  return (
    <GameShell
      title="Raspadinha Multiplicadora"
      game="scratch-mult"
      bg="radial-gradient(80% 50% at 50% 0%, rgba(34,197,94,0.3), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(250,204,21,0.25), transparent 70%), linear-gradient(180deg,#04140b,#020a05)"
      info={<><p>Raspe as duas áreas: o PRÊMIO (de 0,5x a 100x a aposta) e o MULTIPLICADOR (1x, 2x, 3x, 5x ou 10x). Você ganha prêmio × multiplicador.</p><p>Prêmio máximo: 1.000x. RTP 97,3%.</p></>}
    >
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-[350px] rounded-[26px] p-4" style={{ background: "linear-gradient(160deg,#22c55e,#15803d 55%,#052e16)", boxShadow: "0 20px 50px rgba(0,0,0,0.6), inset 0 0 0 4px #fde047" }}>
          <div className="text-center mb-3">
            <div className="font-display font-black text-xl text-gold-200 drop-shadow">MULTIPLICA $</div>
            <div className="text-[11px] font-black text-white/80">prêmio × multiplicador · até {fmt(bet * 1000)}</div>
          </div>
          {card ? (
            <div className="grid grid-cols-[1.6fr_1fr] gap-3">
              <div>
                <div className="text-[10px] font-black text-white/80 mb-1 text-center">PRÊMIO</div>
                <ScratchCell
                  key={`${reset}-a`}
                  value={card.value}
                  bet={card.bet}
                  reset={reset}
                  revealAll={revealAll}
                  win={card.value > 0}
                  onRevealed={() => setRevealed((x) => x + 1)}
                  cover={["#d4d4d8", "#fafafa", "#a1a1aa"]}
                  mark="$"
                  className="!aspect-[1.3/1]"
                  face={
                    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-yellow-100 to-yellow-400">
                      <div className="text-center">
                        <div className="font-display font-black text-3xl text-[#14532d]">{card.value ? fmt(card.value * card.bet) : "—"}</div>
                        <div className="text-[11px] font-black text-[#14532d]/70">{card.value ? fmtMult(card.value) : "sem prêmio"}</div>
                      </div>
                    </div>
                  }
                />
              </div>
              <div>
                <div className="text-[10px] font-black text-white/80 mb-1 text-center">MULTIPLICADOR</div>
                <ScratchCell
                  key={`${reset}-b`}
                  value={card.mult}
                  bet={1}
                  reset={reset}
                  revealAll={revealAll}
                  win={card.mult > 1 && card.value > 0}
                  onRevealed={() => setRevealed((x) => x + 1)}
                  cover={["#fde047", "#fef9c3", "#ca8a04"]}
                  mark="×"
                  className="!aspect-[0.78/1]"
                  face={
                    <div className={cls("absolute inset-0 grid place-items-center", card.mult >= 5 ? "bg-gradient-to-br from-fuchsia-300 to-fuchsia-700" : card.mult > 1 ? "bg-gradient-to-br from-sky-300 to-sky-700" : "bg-gradient-to-br from-slate-300 to-slate-600")}>
                      <div className="font-display font-black text-4xl text-white drop-shadow">{card.mult}x</div>
                    </div>
                  }
                />
              </div>
            </div>
          ) : (
            <div className="aspect-[2/1] rounded-2xl border-2 border-dashed border-white/30 grid place-items-center text-white/70 text-sm font-black">Compre um bilhete</div>
          )}
          {done && (
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center mt-3">
              <div className={cls("font-display font-black text-2xl", card!.payout > 0 ? "text-gold-200" : "text-white/70")}>{card!.payout > 0 ? `${fmt(card!.value * card!.bet)} × ${card!.mult} = ${fmt(card!.payout)}` : "Sem prêmio"}</div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer>
        <BetInput value={bet} onChange={setBet} disabled={!!card && !done} label="Preço do bilhete" />
        {card && !done ? <Btn variant="violet" size="lg" onClick={() => setRevealAll(true)}>REVELAR TUDO</Btn> : <Btn variant="gold" size="lg" pulse disabled={busy} onClick={buy}>COMPRAR · {fmt(bet)}</Btn>}
        <ShareLink id={done && card!.payout > 0 ? card!.id : null} />
      </Footer>
    </GameShell>
  );
}
