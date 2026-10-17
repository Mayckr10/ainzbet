import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cls, fmt } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { appStore } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { PlayingCard, Shoe } from "../../ui/cards";
import { BetSpot, TablePrint } from "../../ui/chips";
import { GameShell } from "../../ui/GameShell";
import { BetInput, Btn, toast, useBet } from "../../ui/kit";
import { Felt } from "../Blackjack";
import { Chips, finishFx, Footer, ShareLink, usePersist, useSession } from "./common";

type Hand = { cards: number[]; bet: number; seat: number; done: boolean; split?: boolean; doubled?: boolean; result?: string; payout?: number; total: number; soft: boolean };
type View = { variant: string; dealer: number[]; dealerTotal: number; hands: Hand[]; active: number; actions: string[]; phase: "switch" | "play" | "done"; switched: boolean; side: number; sideCat: string | null; sidePay: number };

const RESULT: Record<string, { t: string; c: string }> = {
  blackjack: { t: "BLACKJACK!", c: "bg-gold-400 text-[#3b2300]" },
  win: { t: "VITÓRIA", c: "bg-win-500 text-space-950" },
  push: { t: "EMPATE", c: "bg-white/80 text-space-950" },
  lose: { t: "DERROTA", c: "bg-loss-500 text-white" },
  bust: { t: "ESTOUROU", c: "bg-loss-500 text-white" },
};
const SIDE_NAMES: Record<string, string> = { suitedTrips: "Trinca do mesmo naipe 100:1", straightFlush: "Straight flush 40:1", trips: "Trinca 30:1", straight: "Sequência 10:1", flush: "Flush 5:1" };

const CFG: Record<string, { title: string; top: string; bottom: string; felt: "emerald" | "purple" | "blue" | "teal"; info: ReactNode }> = {
  "bj-eu": {
    title: "Blackjack Europeu",
    top: "BLACKJACK PAGA 3 PARA 2",
    bottom: "SEM CARTA OCULTA · DOBRA 9 A 11",
    felt: "blue",
    info: <><p>Regras europeias: o dealer recebe só uma carta no início e compra a segunda depois que você joga. Se ele fizer blackjack, todas as apostas da mão são perdidas (inclusive dobras e divisões), exceto um blackjack seu, que empata.</p><p>Dobrar só com total 9, 10 ou 11. Uma divisão por mão. Dealer para em 17. Blackjack paga 3:2. 6 baralhos. RTP ≈ 99,4% com estratégia básica.</p></>,
  },
  "bj-multi": {
    title: "Blackjack Multimão",
    top: "JOGUE ATÉ 3 MÃOS",
    bottom: "BJ PAGA 3:2 · DEALER PARA EM 17",
    felt: "emerald",
    info: <><p>Jogue 1, 2 ou 3 mãos ao mesmo tempo contra o mesmo dealer, cada uma com a aposta escolhida. Cada mão pode dobrar e dividir uma vez.</p><p>Dealer para em 17, blackjack paga 3:2, 6 baralhos. RTP ≈ 99,5% com estratégia básica.</p></>,
  },
  "bj-switch": {
    title: "Blackjack Switch",
    top: "TROQUE AS CARTAS",
    bottom: "BJ PAGA 1:1 · DEALER 22 EMPATA",
    felt: "purple",
    info: <><p>Você joga duas mãos (duas apostas iguais) e, antes de jogar, pode TROCAR a segunda carta de uma mão com a da outra. Ex.: 10+5 e 6+K viram 10+K e 6+5.</p><p>Em troca: blackjack paga 1:1, um 21 de duas cartas depois da troca não é blackjack, e se o dealer fizer 22 as mãos não estouradas empatam. RTP ≈ 99,1%.</p></>,
  },
  "bj-213": {
    title: "Blackjack 21+3",
    top: "21+3 PAGA ATÉ 100 PARA 1",
    bottom: "BJ PAGA 3:2 · 6 BARALHOS",
    felt: "teal",
    info: <><p>Blackjack clássico com a aposta lateral 21+3: suas duas primeiras cartas e a carta aberta do dealer formam uma mão de pôquer de 3 cartas.</p><p>Trinca do mesmo naipe 100:1 · Straight flush 40:1 · Trinca 30:1 · Sequência 10:1 · Flush 5:1. A aposta lateral é resolvida na hora. RTP do 21+3 ≈ 96,3%.</p></>,
  },
};

export default function BlackjackPro({ id }: { id: string }) {
  const C = CFG[id];
  const [bet, setBet] = useBet(id);
  const [hands, setHands] = usePersist(`${id}_h`, 2);
  const [side, setSide] = usePersist(`${id}_s`, 0);
  const S = useSession<View>(id);
  const v = S.round?.view;
  const done = S.round?.done;
  const nHands = id === "bj-switch" ? 2 : id === "bj-multi" ? hands : 1;
  const sideAmt = id === "bj-213" ? side : 0;
  const totalBet = bet * nHands + sideAmt;

  async function deal() {
    const r = await S.start(bet, { hands: nHands, side: sideAmt }, totalBet);
    if (r) {
      sfx.card();
      if (r.view.sidePay) setTimeout(() => sfx.win(), 900);
      if (r.done) setTimeout(() => end(r.payout, r.view), 1300);
    }
  }
  async function act(a: string) {
    const h = v!.hands[v!.active];
    if ((a === "double" || a === "split") && (appStore.get().user?.balance ?? 0) < h.bet) return toast("Saldo insuficiente", "error");
    haptic.impact("light");
    const r = await S.act(a);
    if (r?.done) setTimeout(() => end(r.payout, r.view), 900);
  }
  async function end(payout: number, view: View) {
    const staked = view.hands.reduce((s, h) => s + h.bet, 0) + view.side;
    await finishFx(payout, staked);
  }

  const multi = (v?.hands.length ?? nHands) > 1;

  return (
    <GameShell title={C.title} game={id} info={C.info}>
      <Felt color={C.felt}>
        <Shoe />
        <TablePrint top={C.top} bottom={C.bottom} />
        <div key={S.round?.id ?? 0} className="contents">
          {/* dealer */}
          <div className="absolute top-10 left-0 right-0 flex flex-col items-center">
            <div className="flex -space-x-7 min-h-[92px]">
              {v?.dealer.map((c, i) => <PlayingCard key={i} card={c} index={i === 0 ? 1 : i + 2} size="lg" />)}
            </div>
            {v && <div className="mt-2 rounded-full bg-black/50 px-3 py-0.5 text-sm font-black">{v.dealerTotal}{!done && v.dealer.length > 1 ? " + ?" : ""}</div>}
          </div>
          {v?.sideCat != null || (v && v.side > 0) ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }} className={cls("absolute top-[37%] left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-black whitespace-nowrap", v!.sideCat ? "bg-gold-400 text-[#3b2300]" : "bg-black/50 text-white/60")}>
              21+3: {v!.sideCat ? `${SIDE_NAMES[v!.sideCat]} · +${fmt(v!.sidePay)}` : "sem combinação"}
            </motion.div>
          ) : null}
          {/* mãos */}
          <div className="absolute bottom-5 left-0 right-0 flex justify-center items-end gap-3 px-2">
            {v?.hands.map((h, hi) => (
              <div key={hi} className={cls("flex flex-col items-center transition-opacity min-w-0", multi && !done && v.phase === "play" && hi !== v.active && "opacity-50")}>
                {h.result && done && (
                  <motion.div initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.6 }} className={cls("mb-2 rounded-full px-2 py-0.5 text-[10px] font-black whitespace-nowrap", RESULT[h.result].c)}>
                    {RESULT[h.result].t}{h.payout ? ` +${fmt(h.payout)}` : ""}
                  </motion.div>
                )}
                <div className={cls("flex", v.hands.length > 2 ? "-space-x-9" : "-space-x-7")}>
                  {h.cards.map((c, i) => (
                    <motion.div key={`${i}-${c}`} layout>
                      <PlayingCard card={c} index={i < 2 ? hi + i * v.hands.length + (i ? 1 : 0) : 0} highlight={!done && v.phase === "play" && hi === v.active && multi} size={v.hands.length > 2 ? "sm" : v.hands.length > 1 ? "md" : "lg"} />
                    </motion.div>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="rounded-full bg-black/50 px-2.5 py-0.5 text-sm font-black">{h.soft && h.total < 21 ? `${h.total - 10}/${h.total}` : h.total}</span>
                  <span className="text-[10px] font-bold text-white/60">{fmt(h.bet)}{h.doubled ? " ×2" : ""}</span>
                </div>
              </div>
            ))}
            {!v && (
              <div className="flex gap-3 mb-10">
                {Array.from({ length: nHands }).map((_, i) => <BetSpot key={i} label={`MÃO ${i + 1}`} amount={bet} size={54} />)}
                {id === "bj-213" && <BetSpot label="21+3" amount={side || undefined} size={46} />}
              </div>
            )}
          </div>
        </div>
      </Felt>
      <Footer>
        {v && !done ? (
          v.phase === "switch" ? (
            <div className="grid grid-cols-2 gap-2">
              <Btn variant="glass" size="xl" disabled={S.busy} onClick={() => act("noswitch")}>MANTER</Btn>
              <Btn variant="gold" size="xl" disabled={S.busy} onClick={() => act("switch")}>⇄ TROCAR</Btn>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <Btn variant="green" size="lg" disabled={S.busy || !v.actions.includes("hit")} onClick={() => act("hit")}>PEDIR</Btn>
              <Btn variant="red" size="lg" disabled={S.busy || !v.actions.includes("stand")} onClick={() => act("stand")}>PARAR</Btn>
              <Btn variant="violet" size="lg" disabled={S.busy || !v.actions.includes("double")} onClick={() => act("double")}>DOBRAR</Btn>
              <Btn variant="glass" size="lg" disabled={S.busy || !v.actions.includes("split")} onClick={() => act("split")}>DIVIDIR</Btn>
            </div>
          )
        ) : (
          <>
            {id === "bj-multi" && <Chips value={hands} onChange={setHands} options={[1, 2, 3].map((n) => ({ value: n, label: `${n} ${n === 1 ? "mão" : "mãos"}` }))} />}
            <BetInput value={bet} onChange={setBet} disabled={S.busy} label={nHands > 1 ? "Aposta por mão" : "Aposta"} />
            {id === "bj-213" && (
              <div className="glass rounded-2xl px-3 py-1.5 flex items-center gap-2">
                <span className="text-[10px] font-black text-white/50 w-14">21+3</span>
                {[0, 10, 50, 100, 500].map((x) => (
                  <button key={x} onClick={() => { setSide(x); haptic.tap(); }} className={cls("press flex-1 h-8 rounded-lg text-[11px] font-black", side === x ? "btn-violet" : "bg-white/5 text-white/60")}>{x ? fmt(x) : "sem"}</button>
                ))}
              </div>
            )}
            <Btn variant="gold" size="lg" pulse={!S.busy} disabled={S.busy} onClick={deal}>{done ? "NOVA MÃO" : "DISTRIBUIR"} · {fmt(totalBet)}</Btn>
            <ShareLink id={done && (S.round?.payout ?? 0) > 0 ? S.round!.id : null} />
          </>
        )}
      </Footer>
    </GameShell>
  );
}
