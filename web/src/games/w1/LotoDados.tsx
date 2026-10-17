import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { cls, fmt, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { speedFactor } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { GameShell, playInstant } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { Chips, finishFx, Footer, Hist, ShareLink, useHist, usePersist } from "./common";

const DIST: number[] = (() => {
  let d = [1];
  for (let k = 0; k < 5; k++) {
    const n = new Array(d.length + 6).fill(0);
    d.forEach((v, s) => {
      for (let f = 1; f <= 6; f++) n[s + f] += v;
    });
    d = n;
  }
  return d.map((v) => v / 7776);
})();
const prob = (type: string, value: number) => DIST.reduce((p, x, s) => p + (s >= 5 && (type === "exact" ? s === value : type === "under" ? s < value : s > value) ? x : 0), 0);
const multOf = (type: string, value: number) => {
  const p = prob(type, value);
  return p > 0 ? Math.floor((0.97 / p) * 100 + 1e-9) / 100 : 0;
};
const RANGE: Record<string, [number, number]> = { exact: [5, 30], under: [8, 28], over: [7, 27] };

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
};
export function Die({ v, rolling, i = 0 }: { v: number; rolling?: boolean; i?: number }) {
  return (
    <motion.div animate={rolling ? { rotate: [0, 90, 180, 270, 360], y: [0, -18, 0] } : { rotate: 0, y: 0 }} transition={rolling ? { repeat: Infinity, duration: 0.45, delay: i * 0.05 } : { type: "spring", damping: 10 }} className="w-full aspect-square">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_10px_rgba(0,0,0,0.5)]">
        <defs>
          <linearGradient id="diebg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#d4d4d8" />
          </linearGradient>
        </defs>
        <rect x="6" y="6" width="88" height="88" rx="18" fill="url(#diebg)" stroke="#a1a1aa" strokeWidth="2" />
        {PIPS[v]?.map(([x, y], k) => <circle key={k} cx={x} cy={y} r="8.5" fill={v === 1 ? "#dc2626" : "#18181b"} />)}
      </svg>
    </motion.div>
  );
}

export default function LotoDados() {
  const [bet, setBet] = useBet("loto-dados");
  const [type, setType] = usePersist<"exact" | "under" | "over">("ld_t", "over");
  const [value, setValue] = usePersist("ld_v", 20);
  const [dice, setDice] = useState([3, 3, 3, 3, 3]);
  const [rolling, setRolling] = useState(false);
  const [res, setRes] = useState<{ sum: number; win: boolean } | null>(null);
  const [lastId, setLastId] = useState<number | null>(null);
  const [hist, push] = useHist("loto-dados");
  const [lo, hi] = RANGE[type];
  const v = Math.max(lo, Math.min(hi, value));
  const m = multOf(type, v);
  const p = prob(type, v);
  const bars = useMemo(() => DIST.slice(5, 31), []);
  const maxBar = Math.max(...bars);
  const hitSum = (s: number) => (type === "exact" ? s === v : type === "under" ? s < v : s > v);

  async function play() {
    if (rolling) return;
    setRolling(true);
    setRes(null);
    haptic.impact("medium");
    const r = await playInstant<{ dice: number[]; sum: number; win: boolean; multiplier: number }>("loto-dados", bet, { type, value: v });
    if (!r) return setRolling(false);
    sfx.whoosh();
    await sleep(700 * speedFactor());
    setDice(r.result.dice);
    setRolling(false);
    sfx.chip();
    setRes({ sum: r.result.sum, win: r.result.win });
    push(r.result.sum, r.result.win);
    if (r.result.win) setLastId(r.roundId);
    await finishFx(r.payout, bet);
  }

  return (
    <GameShell
      title="Loto Dados"
      game="loto-dados"
      bg="radial-gradient(80% 50% at 50% 20%, rgba(220,38,38,0.25), transparent 70%), linear-gradient(180deg,#140707,#070303)"
      info={<><p>Cinco dados são lançados e somados (5 a 30). Aposte na soma exata, abaixo ou acima de um número.</p><p>O multiplicador vem da chance real de cada aposta: 0,97 ÷ probabilidade. A soma exata 17 ou 18 paga cerca de 9,7x; somar 30 paga 7.542x. RTP 97%.</p></>}
    >
      <Hist items={hist} format={(x) => String(x)} />
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 px-4">
        <div className="grid grid-cols-5 gap-2.5 w-full max-w-[380px] p-4 rounded-3xl" style={{ background: "radial-gradient(circle at 50% 30%, #166534, #052e16)", boxShadow: "inset 0 0 30px rgba(0,0,0,0.6), 0 0 0 6px #7c2d12" }}>
          {dice.map((d, i) => <Die key={i} v={rolling ? ((i + Date.now()) % 6) + 1 : d} rolling={rolling} i={i} />)}
        </div>
        <div className="h-10 grid place-items-center">
          {res && (
            <motion.div initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cls("font-display font-black text-3xl", res.win ? "text-win-400" : "text-loss-400")}>
              SOMA {res.sum}
            </motion.div>
          )}
        </div>
        <div className="w-full max-w-[420px]">
          <div className="flex items-end gap-[2px] h-16">
            {bars.map((b, i) => {
              const s = i + 5;
              return (
                <button key={s} onClick={() => !rolling && setValue(Math.max(lo, Math.min(hi, s)))} className={cls("flex-1 rounded-t-sm transition-colors", res?.sum === s ? "bg-white" : hitSum(s) ? "bg-win-500/80" : "bg-white/15")} style={{ height: `${(b / maxBar) * 100}%` }} />
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] font-black text-white/40 mt-1 tabular">
            <span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
          </div>
        </div>
      </div>
      <Footer>
        <Chips value={type} onChange={setType} disabled={rolling} options={[{ value: "under", label: "Abaixo de" }, { value: "exact", label: "Exata" }, { value: "over", label: "Acima de" }]} />
        <div className="glass rounded-2xl px-3 py-2 flex items-center gap-3">
          <button className="press w-9 h-9 rounded-xl glass font-black" onClick={() => setValue(Math.max(lo, v - 1))}>−</button>
          <div className="flex-1 text-center">
            <div className="font-display font-black text-2xl tabular">{v}</div>
            <div className="text-[10px] font-black text-white/45">{(p * 100).toFixed(2)}% · paga {fmtMult(m)}</div>
          </div>
          <button className="press w-9 h-9 rounded-xl glass font-black" onClick={() => setValue(Math.min(hi, v + 1))}>+</button>
        </div>
        <BetInput value={bet} onChange={setBet} disabled={rolling} />
        <Btn variant="gold" size="lg" pulse={!rolling} disabled={rolling || m < 1.01} onClick={play}>LANÇAR · ganha {fmt(bet * m)}</Btn>
        <ShareLink id={lastId} />
      </Footer>
    </GameShell>
  );
}
