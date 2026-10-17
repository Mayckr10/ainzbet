import { motion } from "framer-motion";
import { cls, fmt } from "../../lib/format";
import { appStore } from "../../lib/store";
import { PlayingCard, Shoe } from "../../ui/cards";
import { BetSpot } from "../../ui/chips";
import { GameShell } from "../../ui/GameShell";
import { BetInput, Btn, toast, useBet } from "../../ui/kit";
import { Felt } from "../Blackjack";
import { finishFx, Footer, ShareLink, useSession } from "./common";

type View = { player: number; dealer: number; burn?: number[]; player2?: number; dealer2?: number; outcome: string };
const OUT: Record<string, { t: string; tone: "win" | "lose" | "mid" }> = {
  win: { t: "VOCÊ VENCEU", tone: "win" },
  lose: { t: "A BANCA VENCEU", tone: "lose" },
  tie: { t: "EMPATE! GUERRA?", tone: "mid" },
  surrender: { t: "RENDIÇÃO · METADE DE VOLTA", tone: "mid" },
  warWin: { t: "VITÓRIA NA GUERRA!", tone: "win" },
  warTie: { t: "EMPATE NA GUERRA · VOCÊ VENCE", tone: "win" },
  warLose: { t: "PERDEU A GUERRA", tone: "lose" },
};

export default function Guerra() {
  const [bet, setBet] = useBet("guerra");
  const S = useSession<View>("guerra");
  const v = S.round?.view;
  const done = S.round?.done;
  const war = !!v?.player2 || v?.player2 === 0;

  async function deal() {
    const r = await S.start(bet);
    if (r?.done) setTimeout(() => finishFx(r.payout, bet), 900);
  }
  async function act(a: "war" | "surrender") {
    if (a === "war" && (appStore.get().user?.balance ?? 0) < bet) return toast("Saldo insuficiente para a guerra", "error");
    const r = await S.act(a);
    if (r) setTimeout(() => finishFx(r.payout, a === "war" ? bet * 2 : bet), a === "war" ? 1600 : 400);
  }
  const out = v ? OUT[v.outcome] : null;

  return (
    <GameShell title="Guerra de Cartas" game="guerra" info={<><p>Você e a banca recebem uma carta: a mais alta vence e paga 1:1 (Ás é a maior).</p><p>Empatou? Escolha: RENDER-SE (recebe metade da aposta de volta) ou ir à GUERRA (aposta mais um valor igual; 3 cartas são queimadas e cada lado recebe uma nova). Na guerra, se sua carta for igual ou maior, você ganha o aumento 1:1 e a aposta original empata. 6 baralhos. RTP ≈ 97,1%.</p></>}>
      <Felt color="purple">
        <Shoe />
        <div key={S.round?.id ?? 0} className="contents">
        <div className="absolute top-[14%] left-0 right-0 flex flex-col items-center gap-1">
          <div className="text-[10px] font-black tracking-widest text-rose-300">BANCA</div>
          <div className="flex gap-3">
            {v && <PlayingCard card={v.dealer} size="lg" index={1} dim={war} />}
            {war && <PlayingCard card={v!.dealer2!} size="lg" index={4} highlight={v!.outcome === "warLose"} />}
          </div>
        </div>
        {war && (
          <div className="absolute top-[43%] left-0 right-0 flex justify-center -space-x-8">
            {v!.burn!.map((c, i) => <div key={i} className="rotate-[-8deg] scale-75"><PlayingCard card={-1} size="sm" index={i} /></div>)}
            <span className="ml-10 self-center text-[10px] font-black text-white/40">QUEIMADAS</span>
          </div>
        )}
        <div className="absolute bottom-[22%] left-0 right-0 flex flex-col items-center gap-1">
          <div className="flex gap-3">
            {v && <PlayingCard card={v.player} size="lg" index={0} dim={war} />}
            {war && <PlayingCard card={v!.player2!} size="lg" index={3} highlight={v!.outcome !== "warLose"} />}
          </div>
          <div className="text-[10px] font-black tracking-widest text-sky-300">VOCÊ</div>
        </div>
        {out && (
          <motion.div key={v!.outcome} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: war ? 1.2 : 0.6 }} className={cls("absolute top-[50%] -translate-y-1/2 left-0 right-0 text-center font-display font-black text-xl", out.tone === "win" ? "gold-text" : out.tone === "lose" ? "text-loss-400" : "text-white")}>
            {out.t}
            {done && S.round!.payout > 0 && <span className="block text-sm text-win-400">+{fmt(S.round!.payout)}</span>}
          </motion.div>
        )}
        <div className="absolute bottom-4 left-4">
          <BetSpot label="APOSTA" amount={bet} active={!!v && !done} win={!!done && (S.round?.payout ?? 0) > bet} size={54} />
        </div>
        {war && (
          <div className="absolute bottom-4 left-[84px]">
            <BetSpot label="GUERRA" amount={bet} active win={!!done && (S.round?.payout ?? 0) > bet} size={54} />
          </div>
        )}
        </div>
      </Felt>
      <Footer>
        {v && !done ? (
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="glass" size="xl" disabled={S.busy} onClick={() => act("surrender")}>RENDER-SE</Btn>
            <Btn variant="red" size="xl" disabled={S.busy} onClick={() => act("war")}>GUERRA! +{fmt(bet)}</Btn>
          </div>
        ) : (
          <>
            <BetInput value={bet} onChange={setBet} disabled={S.busy} />
            <Btn variant="gold" size="lg" pulse={!S.busy} disabled={S.busy} onClick={deal}>DISTRIBUIR</Btn>
            <ShareLink id={S.lastWin} />
          </>
        )}
      </Footer>
    </GameShell>
  );
}
