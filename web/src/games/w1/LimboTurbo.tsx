import { motion } from "framer-motion";
import { useState } from "react";
import { cls, fmt, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { speedFactor } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { GameShell, playInstant } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { Chips, finishFx, Footer, ShareLink, usePersist } from "./common";

export default function LimboTurbo() {
  const [bet, setBet] = useBet("limbo-turbo", 10);
  const [target, setTarget] = usePersist("lt_t", 2);
  const [count, setCount] = usePersist("lt_c", 10);
  const [input, setInput] = useState(String(target));
  const [results, setResults] = useState<(number | null)[]>([]);
  const [summary, setSummary] = useState<{ wins: number; payout: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastId, setLastId] = useState<number | null>(null);
  const chance = Math.min(99, 99 / target);

  function commit(raw: string) {
    const v = Math.max(1.01, Math.min(50000, Math.floor(Number(raw.replace(",", ".")) * 100) / 100 || 2));
    setTarget(v);
    setInput(String(v));
  }

  async function play() {
    if (busy) return;
    setBusy(true);
    setSummary(null);
    haptic.impact("medium");
    setResults(Array(count).fill(null));
    const r = await playInstant<{ results: number[]; wins: number }>("limbo-turbo", bet, { target, count }, bet * count);
    if (!r) {
      setBusy(false);
      setResults([]);
      return;
    }
    const step = Math.max(40, 200 / count) * speedFactor();
    for (let i = 0; i < count; i++) {
      await sleep(step);
      setResults((x) => x.map((v, j) => (j === i ? r.result.results[i] : v)));
      r.result.results[i] >= target ? sfx.gem() : sfx.tick();
    }
    setSummary({ wins: r.result.wins, payout: r.payout });
    if (r.payout > bet * count) setLastId(r.roundId);
    if (r.payout > 0) await finishFx(r.payout, bet * count);
    else await finishFx(0, bet);
    setBusy(false);
  }

  const cols = count <= 5 ? 5 : count <= 10 ? 5 : 5;

  return (
    <GameShell
      title="Limbo Turbo"
      game="limbo-turbo"
      bg="radial-gradient(70% 45% at 50% 30%, rgba(236,72,153,0.3), transparent 70%), linear-gradient(180deg,#14061a,#07030c)"
      info={<><p>Limbo em rajada: um toque faz 5, 10 ou 20 jogadas com o mesmo alvo. Cada resultado igual ou maior que o alvo paga aposta × alvo.</p><p>A aposta mostrada é por jogada (total = aposta × jogadas). Chance por jogada = 99% ÷ alvo. RTP 99%.</p></>}
    >
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 gap-4">
        <div className="grid gap-2 w-full max-w-[400px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
          {(results.length ? results : Array(count).fill(null)).map((x, i) => {
            const win = x != null && x >= target;
            return (
              <motion.div key={`${i}-${x}`} initial={x != null ? { scale: 0.5, rotateX: 90 } : false} animate={{ scale: 1, rotateX: 0 }} className={cls("h-12 rounded-xl grid place-items-center font-black text-[13px] tabular border", x == null ? "border-white/10 bg-white/[0.03] text-white/25" : win ? "border-win-400/60 bg-win-500/20 text-win-300" : "border-white/10 bg-white/5 text-white/55")}>
                {x == null ? "·" : fmtMult(x)}
              </motion.div>
            );
          })}
        </div>
        {summary && (
          <motion.div initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <div className={cls("font-display font-black text-3xl", summary.payout > bet * count ? "text-win-400" : summary.payout ? "text-gold-300" : "text-loss-400")}>
              {summary.wins}/{count} acertos
            </div>
            <div className="text-sm font-black text-white/60">{summary.payout ? `recebeu ${fmt(summary.payout)}` : "sem prêmio"} · apostou {fmt(bet * count)}</div>
          </motion.div>
        )}
      </div>
      <Footer>
        <div className="grid grid-cols-2 gap-2">
          <div className="glass rounded-2xl p-2 px-3">
            <div className="text-[10px] font-black text-white/45">ALVO</div>
            <input inputMode="decimal" value={input} disabled={busy} onChange={(e) => setInput(e.target.value)} onBlur={(e) => commit(e.target.value)} className="bg-transparent outline-none w-full font-extrabold text-lg tabular" />
          </div>
          <div className="glass rounded-2xl p-2 px-3">
            <div className="text-[10px] font-black text-white/45">CHANCE / JOGADA</div>
            <div className="font-extrabold text-lg tabular">{chance.toFixed(chance < 1 ? 3 : 2)}%</div>
          </div>
        </div>
        <Chips value={count} onChange={setCount} disabled={busy} options={[5, 10, 20].map((n) => ({ value: n, label: `${n} jogadas` }))} />
        <BetInput value={bet} onChange={setBet} disabled={busy} label="Aposta por jogada" />
        <Btn variant="gold" size="lg" pulse={!busy} disabled={busy} onClick={play}>RAJADA · total {fmt(bet * count)}</Btn>
        <ShareLink id={lastId} />
      </Footer>
    </GameShell>
  );
}
