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

type Hand = { cards: number[]; bet: number; done: boolean; doubled?: boolean; result?: string; payout?: number; total: number; soft: boolean };
type View = { dealer: number[]; dealerTotal: number; hands: Hand[]; active: number; actions: string[] };

const RESULT: Record<string, { t: string; c: string }> = {
  blackjack: { t: "BLACKJACK!", c: "bg-gold-400 text-[#3b2300]" },
  win: { t: "VITÓRIA", c: "bg-win-500 text-space-950" },
  push: { t: "EMPATE", c: "bg-white/80 text-space-950" },
  lose: { t: "DERROTA", c: "bg-loss-500 text-white" },
  bust: { t: "ESTOUROU", c: "bg-loss-500 text-white" },
};

export function Felt({ children, color = "emerald" }: { children: React.ReactNode; color?: "emerald" | "purple" | "blue" | "teal" }) {
  const bg = { emerald: "#0b3d24", purple: "#2e1065", blue: "#0c2a5e", teal: "#06343a" }[color];
  return (
    <div className="relative flex-1 mx-2 my-1 rounded-[36px] overflow-hidden" style={{ background: `radial-gradient(120% 80% at 50% 30%, ${bg}, #050510 95%)`, boxShadow: "inset 0 0 0 3px rgba(245,196,81,0.35), inset 0 0 60px rgba(0,0,0,0.6)" }}>
      <div className="absolute inset-3 rounded-[30px] border border-gold-400/15 pointer-events-none" />
      {children}
    </div>
  );
}

export default function Blackjack() {
  const [bet, setBet] = useBet("blackjack");
  const [round, setRound] = useState<{ id: number; view: View; done: boolean; payout: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/session/blackjack/active").then((r) => r.active && setRound({ id: r.active.roundId, view: r.active.view, done: false, payout: 0 }));
  }, []);

  async function deal() {
    setBusy(true);
    setRound(null);
    haptic.impact("medium");
    const r = await startSession<View>("blackjack", bet, {});
    setBusy(false);
    if (!r) return;
    setRound({ id: r.roundId, view: r.view, done: r.done, payout: r.payout });
    if (r.done) setTimeout(() => finish(r.payout, r.view), 1200);
  }

  async function act(action: string) {
    if (!round || busy) return;
    const h = round.view.hands[round.view.active];
    if ((action === "double" || action === "split") && (appStore.get().user?.balance ?? 0) < h.bet) return toast("Saldo insuficiente", "error");
    setBusy(true);
    haptic.impact("light");
    const r = await sessionAction<View>(round.id, action);
    setBusy(false);
    if (!r) return;
    setRound({ id: r.roundId, view: r.view, done: r.done, payout: r.payout });
    if (r.done) setTimeout(() => finish(r.payout, r.view), 900);
  }

  async function finish(payout: number, view: View) {
    const totalBet = view.hands.reduce((s, h) => s + h.bet, 0);
    if (payout > totalBet) await celebrate(payout, totalBet);
    else {
      if (payout === 0) sfx.lose();
      revealBalance();
    }
  }

  const v = round?.view;
  const done = round?.done;
  const dealerCards = v?.dealer ?? [];

  return (
    <GameShell title="Blackjack" game="blackjack" info={<><p>Chegue mais perto de 21 que o dealer sem estourar. Blackjack paga 3:2. O dealer para em 17 (inclusive soft 17).</p><p>Dobrar: dobra a aposta e recebe só mais uma carta. Dividir: pares viram duas mãos (uma divisão por rodada; ases recebem uma carta cada). 6 baralhos embaralhados a cada mão.</p></>}>
      <Felt>
        <Shoe />
        <TablePrint top="BLACKJACK PAGA 3 PARA 2" bottom="DEALER PARA EM 17 · 6 BARALHOS" />
        <div className="absolute left-4 bottom-5">
          <BetSpot label="APOSTA" amount={v ? v.hands.reduce((a, h) => a + h.bet, 0) : bet} active={!!v && !done} win={!!done && round!.payout > 0} size={58} />
        </div>
        {/* dealer */}
        <div className="absolute top-12 left-0 right-0 flex flex-col items-center">
          <div className="flex -space-x-7 min-h-[92px]">
            {dealerCards.map((c, i) => <PlayingCard key={`d${i}-${round?.id}`} card={c} index={i === 0 ? 1 : i === 1 ? 3 : i + 2} size="lg" />)}
          </div>
          {v && <div className="mt-2 rounded-full bg-black/50 px-3 py-0.5 text-sm font-black">{done ? v.dealerTotal : v.dealerTotal}{!done && " + ?"}</div>}
        </div>
        {/* jogador */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6">
          {v?.hands.map((h, hi) => (
            <div key={hi} className={cls("flex flex-col items-center transition-opacity", v.hands.length > 1 && !done && hi !== v.active && "opacity-50")}>
              {h.result && done && (
                <motion.div initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.6 }} className={cls("mb-2 rounded-full px-3 py-1 text-xs font-black", RESULT[h.result].c)}>
                  {RESULT[h.result].t}{h.payout ? ` +${fmt(h.payout)}` : ""}
                </motion.div>
              )}
              <div className="flex -space-x-7">
                {h.cards.map((c, i) => <PlayingCard key={`p${hi}-${i}-${round?.id}`} card={c} index={hi === 0 && i < 2 ? i * 2 : i} highlight={!done && hi === v.active && v.hands.length > 1} size={v.hands.length > 1 ? "md" : "lg"} />)}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-black/50 px-3 py-0.5 text-sm font-black">{h.soft && h.total < 21 ? `${h.total - 10}/${h.total}` : h.total}</span>
                <span className="text-[11px] font-bold text-white/60">{fmt(h.bet)}{h.doubled ? " (x2)" : ""}</span>
              </div>
            </div>
          ))}
          {!v && <div className="text-white/40 font-bold text-sm mb-16">Faça sua aposta</div>}
        </div>
      </Felt>
      <div className="px-3 pt-2 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        {v && !done ? (
          <div className="grid grid-cols-4 gap-2">
            <Btn variant="green" size="lg" disabled={busy || !v.actions.includes("hit")} onClick={() => act("hit")}>PEDIR</Btn>
            <Btn variant="red" size="lg" disabled={busy || !v.actions.includes("stand")} onClick={() => act("stand")}>PARAR</Btn>
            <Btn variant="violet" size="lg" disabled={busy || !v.actions.includes("double")} onClick={() => act("double")}>DOBRAR</Btn>
            <Btn variant="glass" size="lg" disabled={busy || !v.actions.includes("split")} onClick={() => act("split")}>DIVIDIR</Btn>
          </div>
        ) : (
          <>
            <BetInput value={bet} onChange={setBet} disabled={busy} />
            <Btn variant="gold" size="lg" pulse={!busy} disabled={busy} onClick={deal}>{done ? "NOVA MÃO" : "DISTRIBUIR"}</Btn>
            {done && round!.payout > 0 && <button onClick={() => shareRound(round!.id)} className="text-[11px] font-black text-plasma-400 press">COMPARTILHAR ↗</button>}
          </>
        )}
      </div>
    </GameShell>
  );
}
