import { AnimatePresence, motion } from "framer-motion";
import { cls, fmtMult } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { haptic } from "../../lib/tg";
import { PlayingCard, RANKS } from "../../ui/cards";
import { GameShell } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { finishFx, Footer, money, ShareLink, Stat, Stats, useSession } from "./common";

type Step = { card: number; dir: string; ok: boolean };
type View = { first: number; card: number; steps: Step[]; multiplier: number; hi: { p: number; mult: number }; lo: { p: number; mult: number }; outcome?: string };

export default function HiLo() {
  const [bet, setBet] = useBet("hilo");
  const S = useSession<View>("hilo");
  const v = S.round?.view;
  const active = S.active;
  const r = v ? v.card % 13 : 0;
  const hiLabel = r === 0 ? "MAIOR" : r === 12 ? "IGUAL" : "MAIOR OU IGUAL";
  const loLabel = r === 12 ? "MENOR" : r === 0 ? "IGUAL" : "MENOR OU IGUAL";
  const hasWin = !!v?.steps.some((s) => s.ok && s.dir !== "skip");

  async function guess(dir: "hi" | "lo" | "skip") {
    haptic.impact("light");
    const res = await S.act(dir);
    if (!res) return;
    if (res.view.outcome === "bust") await finishFx(0, bet);
    else if (dir !== "skip") sfx.gem();
    if (res.done && res.payout) await finishFx(res.payout, bet);
  }
  async function cashout() {
    const res = await S.act("cashout");
    if (res) await finishFx(res.payout, bet);
  }

  const cards = v ? [v.first, ...v.steps.map((s) => s.card)] : [];

  return (
    <GameShell
      title="Hi-Lo de Cartas"
      game="hilo"
      bg="radial-gradient(90% 55% at 50% 10%, rgba(16,185,129,0.3), transparent 70%), linear-gradient(180deg,#05231a,#02100b)"
      info={<><p>Adivinhe se a próxima carta será maior ou menor que a atual. Cada acerto multiplica o prêmio pela chance inversa; saque quando quiser ou pule uma carta difícil.</p><p>Ordem: 2 &lt; 3 &lt; … &lt; K &lt; Ás. Empate conta a favor ("ou igual"); no 2 o palpite é "maior" e no Ás é "menor". Cada carta é sorteada de um baralho completo. Multiplicador = 0,98 × Π(1 ÷ chance). RTP 98%.</p></>}
    >
      <Stats>
        <Stat label="ACERTOS" value={v ? v.steps.filter((s) => s.ok && s.dir !== "skip").length : 0} />
        <Stat label="ATUAL" value={fmtMult(v?.multiplier ?? 1)} tone="win" />
        <Stat label="PRÊMIO" value={money(bet, v?.multiplier ?? 1)} tone="gold" />
      </Stats>
      <div className="px-3 pt-2 h-[78px] flex gap-1.5 overflow-x-auto no-scrollbar items-end">
        {cards.slice(0, -1).map((c, i) => {
          const st = v!.steps[i];
          return (
            <div key={i} className="relative shrink-0 scale-[0.72] origin-bottom-left -mr-3">
              <PlayingCard card={c} size="sm" index={-1} from={{ x: 0, y: 0 }} />
              {st && <span className={cls("absolute -right-1 -top-1 w-5 h-5 rounded-full grid place-items-center text-[10px] font-black", st.dir === "skip" ? "bg-white/30" : st.ok ? "bg-win-500 text-space-950" : "bg-loss-500")}>{st.dir === "hi" ? "▲" : st.dir === "lo" ? "▼" : "»"}</span>}
            </div>
          );
        })}
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center gap-6">
        <div className="text-center w-16">
          <div className="text-[10px] font-black text-white/45">MENOR</div>
          <div className="font-display font-black text-xl text-sky-300">{v ? `${Math.round(v.lo.p * 100)}%` : "—"}</div>
        </div>
        <div className="relative scale-[1.7]">
          <AnimatePresence mode="popLayout">
            {v ? (
              <motion.div key={cards.length} initial={{ x: 80, opacity: 0, rotate: 10 }} animate={{ x: 0, opacity: 1, rotate: 0 }} exit={{ x: -80, opacity: 0 }}>
                <PlayingCard card={v.card} size="md" index={-1} from={{ x: 0, y: 0 }} highlight={v.outcome === "bust" ? false : undefined} />
              </motion.div>
            ) : (
              <PlayingCard card={-1} size="md" index={-1} from={{ x: 0, y: 0 }} />
            )}
          </AnimatePresence>
          {v?.outcome === "bust" && <div className="absolute inset-0 rounded-[9px] ring-4 ring-loss-500" />}
        </div>
        <div className="text-center w-16">
          <div className="text-[10px] font-black text-white/45">MAIOR</div>
          <div className="font-display font-black text-xl text-gold-300">{v ? `${Math.round(v.hi.p * 100)}%` : "—"}</div>
        </div>
      </div>
      <div className="px-3 pb-2 flex justify-center gap-1">
        {RANKS.map((rk, i) => (
          <span key={rk} className={cls("w-[22px] h-6 rounded text-[10px] font-black grid place-items-center", v && i === r ? "bg-gold-400 text-space-950" : v && i > r ? "bg-gold-400/15 text-gold-200/80" : v && i < r ? "bg-sky-400/15 text-sky-200/80" : "bg-white/5 text-white/40")}>{rk}</span>
        ))}
      </div>
      <Footer>
        {active ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Btn variant="gold" size="lg" disabled={S.busy} onClick={() => guess("hi")}>
                <span className="flex flex-col leading-tight"><span>▲ {hiLabel}</span><span className="text-[11px] opacity-80">{fmtMult(v!.hi.mult)}</span></span>
              </Btn>
              <Btn variant="violet" size="lg" disabled={S.busy} onClick={() => guess("lo")}>
                <span className="flex flex-col leading-tight"><span>▼ {loLabel}</span><span className="text-[11px] opacity-80">{fmtMult(v!.lo.mult)}</span></span>
              </Btn>
            </div>
            <div className="flex gap-2">
              <Btn variant="glass" size="lg" className="w-28" disabled={S.busy} onClick={() => guess("skip")}>PULAR »</Btn>
              <Btn variant="green" size="lg" className="flex-1" disabled={S.busy || !hasWin} onClick={cashout}>SACAR {money(bet, v!.multiplier)}</Btn>
            </div>
          </>
        ) : (
          <>
            <BetInput value={bet} onChange={setBet} />
            <Btn variant="gold" size="lg" pulse disabled={S.busy} onClick={() => S.start(bet).then((x) => x && sfx.card())}>COMEÇAR</Btn>
            <ShareLink id={S.lastWin} />
          </>
        )}
      </Footer>
    </GameShell>
  );
}
