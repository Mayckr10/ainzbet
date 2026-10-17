import { motion } from "framer-motion";
import { cls, fmt } from "../../lib/format";
import { appStore } from "../../lib/store";
import { PlayingCard, Shoe } from "../../ui/cards";
import { GameShell } from "../../ui/GameShell";
import { BetInput, Btn, toast, useBet } from "../../ui/kit";
import { BetSpot } from "../../ui/chips";
import { Felt } from "../Blackjack";
import { finishFx, Footer, ShareLink, useSession } from "./common";

type View = { cards: number[]; spread: number; pay?: number; raised?: boolean; outcome?: string };
const PAYS = [
  { s: "1", p: "5:1" },
  { s: "2", p: "4:1" },
  { s: "3", p: "2:1" },
  { s: "4+", p: "1:1" },
  { s: "Trinca", p: "11:1" },
];
const OUT: Record<string, { t: string; win: boolean | null }> = {
  win: { t: "ENTROU!", win: true },
  lose: { t: "FORA DO INTERVALO", win: false },
  consecutive: { t: "CONSECUTIVAS · EMPATE", win: null },
  pair: { t: "PAR · EMPATE", win: null },
  trips: { t: "TRINCA! 11:1", win: true },
};

export default function RedDog() {
  const [bet, setBet] = useBet("red-dog");
  const S = useSession<View>("red-dog");
  const v = S.round?.view;
  const done = S.round?.done;

  async function deal() {
    const r = await S.start(bet);
    if (r?.done) setTimeout(() => finishFx(r.payout, bet), 1100);
  }
  async function act(a: "raise" | "call") {
    if (a === "raise" && (appStore.get().user?.balance ?? 0) < bet) return toast("Saldo insuficiente para aumentar", "error");
    const r = await S.act(a);
    if (r) setTimeout(() => finishFx(r.payout, bet * (a === "raise" ? 2 : 1)), 900);
  }

  const out = v?.outcome ? OUT[v.outcome] : null;
  const [a, b, c] = v?.cards ?? [];

  return (
    <GameShell title="Red Dog" game="red-dog" info={<><p>Duas cartas são abertas. Se forem consecutivas, empate (aposta devolvida). Se formarem par, sai uma terceira: trinca paga 11:1, senão empate.</p><p>Caso contrário, aparece o intervalo entre elas e você pode AUMENTAR (dobrar a aposta) ou só seguir. Se a terceira carta cair estritamente entre as duas, você ganha conforme o intervalo: 1 → 5:1 · 2 → 4:1 · 3 → 2:1 · 4 ou mais → 1:1. Ás é a carta mais alta. 8 baralhos. RTP ≈ 97,2%.</p></>}>
      <Felt color="emerald">
        <Shoe />
        <div key={S.round?.id ?? 0} className="contents">
        <div className="absolute top-[22%] left-0 right-0 flex justify-center items-center gap-3">
          <div className="w-[64px]">{a != null && <PlayingCard card={a} size="lg" index={0} />}</div>
          <div className="w-[76px] h-[104px] rounded-xl border-2 border-dashed border-gold-400/40 grid place-items-center">
            {c != null ? <PlayingCard card={c} size="lg" index={0} highlight={out?.win === true} /> : v && !done ? <span className="text-[10px] font-black text-gold-300/70 text-center">?</span> : null}
          </div>
          <div className="w-[64px]">{b != null && <PlayingCard card={b} size="lg" index={1} />}</div>
        </div>
        {v && v.spread > 0 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-[52%] left-0 right-0 text-center">
            <span className="rounded-full bg-black/50 px-4 py-1 text-sm font-black">INTERVALO {v.spread} · paga {PAYS[Math.min(3, v.spread - 1)].p}</span>
          </motion.div>
        )}
        {out && done && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} className={cls("absolute top-[60%] left-0 right-0 text-center font-display font-black text-2xl", out.win ? "gold-text" : out.win === false ? "text-loss-400" : "text-white/80")}>
            {out.t}
            {S.round!.payout > 0 && <span className="block text-sm text-win-400">+{fmt(S.round!.payout)}</span>}
          </motion.div>
        )}
        <div className="absolute bottom-4 left-4">
          <BetSpot label="APOSTA" amount={v ? bet * (v.raised ? 2 : 1) : bet} active={!!v && !done} win={!!done && (S.round?.payout ?? 0) > bet} size={58} />
        </div>
        <div className="absolute bottom-4 right-3 flex flex-col gap-0.5 text-[10px] font-black">
          {PAYS.map((p, i) => (
            <div key={p.s} className={cls("flex justify-between gap-3 rounded px-1.5", v && ((i < 4 && Math.min(4, v.spread) === i + 1) || (i === 4 && v.outcome === "trips")) ? "bg-gold-400 text-[#3b2300]" : "text-white/55")}>
              <span>{p.s}</span>
              <span>{p.p}</span>
            </div>
          ))}
        </div>
        </div>
      </Felt>
      <Footer>
        {v && !done ? (
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="glass" size="xl" disabled={S.busy} onClick={() => act("call")}>SEGUIR</Btn>
            <Btn variant="gold" size="xl" disabled={S.busy} onClick={() => act("raise")}>AUMENTAR +{fmt(bet)}</Btn>
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
