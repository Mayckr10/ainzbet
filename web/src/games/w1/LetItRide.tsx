import { motion } from "framer-motion";
import { cls, fmt } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { PlayingCard, Shoe } from "../../ui/cards";
import { BetSpot } from "../../ui/chips";
import { GameShell } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { Felt } from "../Blackjack";
import { finishFx, Footer, ShareLink, useSession } from "./common";

type View = { player: number[]; community: number[]; stage: number; ride: boolean[]; cat?: number; multiplier?: number; live?: number };
const PAYS: [number, string, string][] = [
  [9, "Royal Flush", "1000:1"],
  [8, "Straight Flush", "200:1"],
  [7, "Quadra", "50:1"],
  [6, "Full House", "11:1"],
  [5, "Flush", "8:1"],
  [4, "Sequência", "5:1"],
  [3, "Trinca", "3:1"],
  [2, "Dois Pares", "2:1"],
  [1, "Par de 10 ou +", "1:1"],
];

export default function LetItRide() {
  const [bet, setBet] = useBet("let-it-ride");
  const S = useSession<View>("let-it-ride");
  const v = S.round?.view;
  const done = S.round?.done;

  async function choose(ride: boolean) {
    sfx.chip();
    const r = await S.act(ride ? "ride" : "pull");
    if (r?.done) setTimeout(() => finishFx(r.payout, bet * 3), 900);
  }
  const spotState = (i: number) => {
    if (!v) return "on";
    if (i === 2) return "on";
    if (v.ride[i] === false) return "off";
    return "on";
  };
  const winCat = done && (v?.multiplier ?? 0) > 0 ? v!.cat : -1;

  return (
    <GameShell title="Let It Ride" game="let-it-ride" info={<><p>Você coloca 3 apostas iguais e recebe 3 cartas; duas cartas comunitárias ficam viradas. Depois de ver suas cartas, pode RECOLHER a 1ª aposta ou DEIXAR. Abre a 1ª comunitária e você decide a 2ª aposta. A 3ª aposta sempre fica.</p><p>As apostas que ficaram pagam pela mão final de 5 cartas: par de 10 ou maior 1:1 até Royal Flush 1000:1. Não existe mão do dealer. RTP ≈ 96,5% com estratégia ótima.</p></>}>
      <Felt color="teal">
        <Shoe />
        <div key={S.round?.id ?? 0} className="contents">
          <div className="absolute top-8 right-3 flex flex-col gap-0.5 text-[10px] font-black">
            {PAYS.map(([c, n, p]) => (
              <div key={c} className={cls("flex justify-between gap-3 rounded px-1.5", winCat === c ? "bg-gold-400 text-[#3b2300]" : "text-white/55")}>
                <span>{n}</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
          <div className="absolute top-10 left-4">
            <div className="text-[10px] font-black tracking-widest text-white/50 mb-1">COMUNITÁRIAS</div>
            <div className="flex gap-1.5">
              {(v?.community ?? [-1, -1]).map((c, i) => <PlayingCard key={`${i}-${c}`} card={c} index={i} size="md" />)}
            </div>
          </div>
          <div className="absolute top-[48%] left-0 right-0 flex justify-center gap-2">
            {(v?.player ?? []).map((c, i) => <PlayingCard key={i} card={c} index={i} size="lg" />)}
          </div>
          {done && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }} className={cls("absolute top-[37%] left-0 right-0 text-center font-display font-black text-xl", (v?.multiplier ?? 0) > 0 ? "gold-text" : "text-white/60")}>
              {(v?.multiplier ?? 0) > 0 ? `${PAYS.find((p) => p[0] === v!.cat)?.[1]} · ${v!.live} ${v!.live === 1 ? "aposta" : "apostas"}` : "Sem mão paga"}
              {(S.round?.payout ?? 0) > 0 && <span className="block text-sm text-win-400">recebe {fmt(S.round!.payout)}</span>}
            </motion.div>
          )}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-5">
            {["1", "2", "✓"].map((l, i) => (
              <div key={i} className={cls("transition-opacity", spotState(i) === "off" && "opacity-30")}>
                <BetSpot label={l} amount={bet} active={!!v && !done && v.stage === i + 1} win={done && (v?.multiplier ?? 0) > 0 && spotState(i) === "on"} size={56} />
              </div>
            ))}
          </div>
        </div>
      </Felt>
      <Footer>
        {v && !done ? (
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="glass" size="xl" disabled={S.busy} onClick={() => choose(false)}>RECOLHER {v.stage}ª</Btn>
            <Btn variant="gold" size="xl" disabled={S.busy} onClick={() => choose(true)}>DEIXAR ✓</Btn>
          </div>
        ) : (
          <>
            <BetInput value={bet} onChange={setBet} disabled={S.busy} label="Aposta (×3)" />
            <Btn variant="gold" size="lg" pulse={!S.busy} disabled={S.busy} onClick={() => S.start(bet, {}, bet * 3).then((r) => r && sfx.card())}>DISTRIBUIR · {fmt(bet * 3)}</Btn>
            <ShareLink id={S.lastWin} />
          </>
        )}
      </Footer>
    </GameShell>
  );
}
