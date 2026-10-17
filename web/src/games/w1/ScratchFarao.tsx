import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cls, fmt, fmtCompact } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { FARAO } from "../../art/themes/themesA";
import { SymbolArt } from "../../art/Symbol";
import { GameShell, playInstant } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { ScratchCell } from "../Scratch";
import { finishFx, Footer, ShareLink } from "./common";

const TIERS = [5000, 500, 50, 10, 5, 2, 1];
const SYM = [2, 3, 4, 5, 6, 7, 8]; // arte do Livro do Faraó para cada prêmio

export default function ScratchFarao() {
  const [bet, setBet] = useBet("scratch-farao");
  const [card, setCard] = useState<{ grid: number[]; win: number; winCells: number[]; payout: number; id: number; bet: number } | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [revealAll, setRevealAll] = useState(false);
  const [reset, setReset] = useState(0);
  const [busy, setBusy] = useState(false);
  const finished = useRef(false);

  async function buy() {
    if (busy) return;
    setBusy(true);
    const r = await playInstant<{ grid: number[]; win: number; winCells: number[] }>("scratch-farao", bet, {});
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
    if (card && revealed >= 9 && !finished.current) {
      finished.current = true;
      finishFx(card.payout, card.bet);
    }
  }, [revealed, card]);
  const done = card && revealed >= 9;

  return (
    <GameShell
      title="Raspadinha do Faraó"
      game="scratch-farao"
      bg="radial-gradient(80% 50% at 50% 0%, rgba(250,204,21,0.35), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(30,64,175,0.35), transparent 70%), linear-gradient(180deg,#1c1404,#0b0802)"
      info={<><p>Raspe a areia das 9 casas do papiro. Três símbolos iguais do Livro do Faraó ganham o prêmio do símbolo.</p><p>Faraó 5.000x · Escaravelho 500x · Anubis 50x · Olho de Hórus 10x · Ankh 5x · Pirâmide 2x · Lótus 1x. RTP 96%.</p></>}
    >
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-[340px] rounded-[26px] p-4 relative" style={{ background: "linear-gradient(160deg,#fde68a,#d97706 60%,#78350f)", boxShadow: "0 20px 50px rgba(0,0,0,0.6), inset 0 0 0 4px #1e3a8a, inset 0 0 0 7px #fde68a" }}>
          <div className="text-center mb-3">
            <div className="font-display font-black text-xl text-[#1e3a8a] drop-shadow-[0_1px_0_#fde68a]">TESOURO DO FARAÓ</div>
            <div className="text-[11px] font-black text-[#422006]">3 iguais = prêmio · até {fmt(bet * 5000)}</div>
          </div>
          {card ? (
            <div className="grid grid-cols-3 gap-2">
              {card.grid.map((s, i) => (
                <ScratchCell
                  key={`${reset}-${i}`}
                  value={TIERS[s]}
                  bet={card.bet}
                  reset={reset}
                  revealAll={revealAll}
                  win={card.winCells.includes(i)}
                  onRevealed={() => setRevealed((x) => x + 1)}
                  cover={["#fcd34d", "#fef3c7", "#d97706"]}
                  face={
                    <div className="absolute inset-0 grid place-items-center" style={{ background: "radial-gradient(circle,#1e3a8a,#0b1a4a)" }}>
                      <div className="w-[74%] h-[74%]"><SymbolArt art={FARAO[SYM[s]]} /></div>
                      <span className="absolute bottom-0.5 inset-x-0 text-center text-[10px] font-black text-gold-200 drop-shadow">{fmtCompact(TIERS[s] * card.bet)}</span>
                    </div>
                  }
                />
              ))}
            </div>
          ) : (
            <div className="aspect-square rounded-2xl border-2 border-dashed border-[#78350f]/50 grid place-items-center text-[#422006] text-sm font-black">Compre um papiro</div>
          )}
          {done && (
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center mt-3">
              <div className={cls("font-display font-black text-2xl", card!.payout > 0 ? "text-[#1e3a8a]" : "text-[#422006]/70")}>{card!.payout > 0 ? `+${fmt(card!.payout)}` : "Sem prêmio"}</div>
            </motion.div>
          )}
        </div>
        <div className="mt-3 flex gap-1 flex-wrap justify-center max-w-[360px]">
          {TIERS.map((t, i) => (
            <div key={t} className="flex items-center gap-1 rounded-lg bg-black/30 pr-2">
              <div className="w-7 h-7"><SymbolArt art={FARAO[SYM[i]]} /></div>
              <span className="text-[10px] font-black text-gold-200">{fmtCompact(t)}x</span>
            </div>
          ))}
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
