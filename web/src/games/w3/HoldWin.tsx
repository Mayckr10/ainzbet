import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SymbolArt } from "../../art/Symbol";
import { MOEDAS } from "../../art/themes/themesH";
import { cls, fmt, fmtCompact, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { revealBalance, speedFactor, useApp } from "../../lib/store";
import { confirm, haptic } from "../../lib/tg";
import { bigWinTier, coinBurst, confetti, showBigWin } from "../../ui/effects";
import { GameShell, playInstant, shareRound } from "../../ui/GameShell";
import { BetInput, Btn, ChipIcon, CountUp, useBet } from "../../ui/kit";
import { Paylines, Reels, type ReelsHandle } from "../../ui/Reels";

type Cell = [number, number];
type Coin = { cell: Cell; value: number; jackpot?: string };
type LineWin = { line: number; symbol: number; count: number; mult: number; cells: Cell[] };
type Result = { base: { grid: number[][]; wins: LineWin[]; lineWin: number; coins: Coin[] } | null; feature: { start: Coin[]; rounds: Coin[][]; final: Coin[]; grand: boolean; win: number } | null; multiplier: number; bought: boolean };

const JP: Record<string, { label: string; color: string }> = {
  mini: { label: "MINI", color: "#38bdf8" },
  minor: { label: "MINOR", color: "#a855f7" },
  major: { label: "MAJOR", color: "#ef4444" },
  grand: { label: "GRAND", color: "#facc15" },
};
const BG = "radial-gradient(80% 50% at 50% 0%, rgba(250,204,21,0.35), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(22,163,74,0.3), transparent 70%), linear-gradient(180deg,#141005,#070502)";

function CoinFace({ coin, bet, fresh }: { coin: Coin; bet: number; fresh?: boolean }) {
  return (
    <motion.div initial={fresh ? { scale: 0, rotateY: 180 } : false} animate={{ scale: 1, rotateY: 0 }} transition={{ type: "spring", damping: 12 }} className="relative w-full h-full">
      <SymbolArt art={MOEDAS[10]} />
      <div className="absolute inset-0 grid place-items-center">
        {coin.jackpot ? (
          <span className="rounded px-1 text-[10px] font-black text-white" style={{ background: JP[coin.jackpot].color }}>{JP[coin.jackpot].label}</span>
        ) : (
          <span className="font-display font-black text-[13px] text-[#451a03]">{fmtCompact(coin.value * bet)}</span>
        )}
      </div>
    </motion.div>
  );
}

export default function HoldWin() {
  const id = "as-holdwin";
  const cfg = useApp((s) => s.config?.adv?.holdwin);
  const lines = useApp((s) => s.config?.adv?.lines ?? []);
  const reels = useRef<ReelsHandle>(null);
  const [bet, setBet] = useBet(id, 100);
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(false);
  const [hl, setHl] = useState<Set<string> | null>(null);
  const [act, setAct] = useState<number[]>([]);
  const [coinVals, setCoinVals] = useState<Map<string, Coin>>(new Map());
  const [feat, setFeat] = useState<{ locked: Map<string, Coin>; left: number; fresh: Set<string>; total: number } | null>(null);
  const [win, setWin] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [lastRound, setLastRound] = useState<number | null>(null);
  const busyRef = useRef(false);
  const initial = useRef(Array.from({ length: 5 }, () => [2 + Math.floor(Math.random() * 8), 10, 3 + Math.floor(Math.random() * 6)]));
  const jack = cfg?.jackpots ?? { mini: 20, minor: 50, major: 200, grand: 1000 };

  async function play(buy = false) {
    if (busyRef.current) {
      reels.current?.hurry();
      return;
    }
    const cost = buy ? bet * (cfg?.buyPrice ?? 60) : bet;
    if (buy && !(await confirm(`Comprar o Hold & Win por ${fmt(cost)} fichas?`))) return;
    busyRef.current = true;
    setBusy(true);
    try {
      setWin(0);
      setHl(null);
      setAct([]);
      setCoinVals(new Map());
      haptic.impact("medium");
      const r = await playInstant<Result>(id, bet, buy ? { buy: true } : {}, cost);
      if (!r) {
        setAuto(false);
        return;
      }
      const res = r.result;
      const sf = speedFactor();
      if (res.base) {
        reels.current?.start();
        await sleep(140);
        await reels.current?.stop(res.base.grid, { anticipate: res.base.coins.length >= 4 ? [3, 4] : [] });
        setCoinVals(new Map(res.base.coins.map((c) => [`${c.cell[0]}-${c.cell[1]}`, c])));
        if (res.base.wins.length) {
          const cells = new Set<string>();
          res.base.wins.forEach((w) => w.cells.forEach(([a, b]) => cells.add(`${a}-${b}`)));
          setHl(cells);
          setAct(res.base.wins.map((w) => w.line));
          const amt = Math.floor(bet * res.base.lineWin);
          setWin(amt);
          sfx.win(res.base.lineWin >= 5);
          await sleep(900 * sf);
        }
      }
      if (res.feature) {
        setHl(null);
        setAct([]);
        sfx.freeSpins();
        confetti();
        setBanner("HOLD & WIN!");
        haptic.impact("heavy");
        await sleep(1300);
        setBanner(null);
        const locked = new Map(res.feature.start.map((c) => [`${c.cell[0]}-${c.cell[1]}`, c]));
        let total = res.feature.start.reduce((a, c) => a + c.value, 0);
        setFeat({ locked: new Map(locked), left: cfg?.respins ?? 3, fresh: new Set(), total });
        await sleep(900 * sf);
        let left = cfg?.respins ?? 3;
        for (const round of res.feature.rounds) {
          sfx.spinStart();
          setFeat((f) => (f ? { ...f, fresh: new Set(), left: left - 1 } : f));
          await sleep(750 * sf);
          if (round.length) {
            for (const c of round) {
              locked.set(`${c.cell[0]}-${c.cell[1]}`, c);
              total += c.value;
            }
            left = cfg?.respins ?? 3;
            sfx.coin();
            haptic.impact("medium");
            setFeat({ locked: new Map(locked), left, fresh: new Set(round.map((c) => `${c.cell[0]}-${c.cell[1]}`)), total });
          } else {
            left--;
            sfx.reelStop();
          }
          await sleep(650 * sf);
        }
        if (res.feature.grand) {
          setBanner(`GRAND ${fmt(jack.grand * bet)}!`);
          sfx.jackpot();
          await sleep(2000);
          setBanner(null);
        }
        const amount = Math.floor(bet * res.feature.win);
        setWin((w) => w + amount);
        await sleep(900);
        setFeat(null);
      }
      setLastRound(r.roundId);
      if (res.base) initial.current = res.base.grid;
      if (bigWinTier(r.payout / bet) && r.payout > cost) await showBigWin(r.payout, r.payout / bet, res.feature ? "Hold & Win" : undefined);
      else if (r.payout > 0) {
        coinBurst(document.getElementById("hw-reels"), 10);
        await sleep(500);
        revealBalance();
      } else revealBalance();
    } catch {
      reels.current?.reset(initial.current);
      setFeat(null);
      revealBalance();
      setAuto(false);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    if (auto && !busy) {
      const t = setTimeout(() => play(false), 420 * speedFactor());
      return () => clearTimeout(t);
    }
  }, [auto, busy]);

  return (
    <GameShell
      title="Hold & Win das Moedas"
      game={id}
      bg={BG}
      info={
        <>
          <p><b>HOLD & WIN.</b> Moedas de ouro trazem valores em fichas ou jackpots. Com 6 ou mais moedas na tela começa o recurso: as moedas travam e você ganha 3 re-spins. Cada moeda nova trava e volta o contador para 3.</p>
          <p>No fim, todas as moedas pagam. Encher as 15 casas paga o <b>GRAND (1.000x)</b>. Jackpots: Mini {jack.mini}x · Minor {jack.minor}x · Major {jack.major}x.</p>
          <p>Fora do recurso, 20 linhas pagam normalmente (o Cofre é Wild). Comprar o recurso: {cfg?.buyPrice}x a aposta (começa com 6 moedas).</p>
          <p className="text-white/50 text-xs">RTP ≈ 96% (calibrado por simulação). Prêmio máximo 50.000x.</p>
        </>
      }
    >
      <div className="relative flex-1 flex flex-col justify-center px-2 min-h-0">
        <div className="grid grid-cols-4 gap-1.5 mb-3 mx-auto w-full max-w-[460px]">
          {(["grand", "major", "minor", "mini"] as const).map((k) => (
            <div key={k} className="rounded-xl py-1 text-center border" style={{ borderColor: JP[k].color + "88", background: JP[k].color + "22" }}>
              <div className="text-[9px] font-black tracking-widest" style={{ color: JP[k].color }}>{JP[k].label}</div>
              <div className="text-[12px] font-black text-white tabular">{fmtCompact(jack[k] * bet)}</div>
            </div>
          ))}
        </div>
        <div id="hw-reels" className="relative mx-auto w-full max-w-[460px] rounded-[26px] p-[2.5px]" style={{ background: "linear-gradient(180deg,#fef08a,#ca8a04 50%,#14532d)" }}>
          <div className="relative rounded-[24px] p-2 aspect-[5/3.3]" style={{ background: "#120e04" }}>
            <Reels
              ref={reels}
              theme={id}
              live={[10]}
              reels={5}
              rows={3}
              initial={initial.current}
              pool={[2, 3, 4, 5, 6, 7, 8, 9, 6, 7, 8, 9, 0, 10, 10]}
              gap={5}
              aspect={1.08}
              highlight={hl}
              anticipationColor="#facc15"
              cellClass="rounded-xl bg-gradient-to-b from-yellow-100/[0.07] to-transparent"
              renderSymbol={(s, r, w) =>
                s === 10 && coinVals.get(`${r}-${w}`) ? <CoinFace coin={coinVals.get(`${r}-${w}`)!} bet={bet} /> : <SymbolArt art={MOEDAS[s]} />
              }
            >
              <Paylines lines={lines} active={act} reels={5} rows={3} colors={["#fde047", "#86efac", "#fbbf24", "#fff", "#facc15"]} />
            </Reels>
            <AnimatePresence>
              {feat && (
                <motion.div className="absolute inset-2 grid grid-cols-5 grid-rows-3 gap-[5px] z-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {Array.from({ length: 15 }).map((_, i) => {
                    const c = Math.floor(i / 3);
                    const r = i % 3;
                    const k = `${c}-${r}`;
                    const coin = feat.locked.get(k);
                    return (
                      <div key={i} className="rounded-xl grid place-items-center relative overflow-hidden" style={{ gridColumn: c + 1, gridRow: r + 1, background: coin ? "rgba(250,204,21,0.18)" : "rgba(0,0,0,0.75)", boxShadow: coin ? "inset 0 0 0 2px #facc15" : "inset 0 0 0 1px rgba(255,255,255,0.08)" }}>
                        {coin ? (
                          <div className="w-[86%] h-[86%]"><CoinFace coin={coin} bet={bet} fresh={feat.fresh.has(k)} /></div>
                        ) : (
                          <motion.div className="w-6 h-6 rounded-full border-2 border-yellow-400/30" animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ repeat: Infinity, duration: 0.6, delay: (i % 5) * 0.08 }} />
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {banner && (
                <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.3, opacity: 0 }} className="absolute inset-0 grid place-items-center pointer-events-none z-30">
                  <div className="bg-black/75 rounded-2xl px-5 py-2.5 border border-yellow-300/30">
                    <div className="font-display font-black text-2xl gold-text">{banner}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="h-14 flex items-center justify-center gap-4">
          {feat && (
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => <span key={i} className={cls("w-3.5 h-3.5 rounded-full", i < feat.left ? "bg-yellow-400 shadow-[0_0_8px_#facc15]" : "bg-white/15")} />)}
              </div>
              <span className="text-xs font-black text-white/60">RE-SPINS</span>
              <span className="font-display font-black text-lg text-yellow-300">{fmt(feat.total * bet)}</span>
            </div>
          )}
          {!feat && win > 0 && (
            <div className="flex items-center gap-2">
              <ChipIcon size={22} />
              <CountUp value={win} className="font-display font-black text-2xl text-white" onTick={sfx.count} />
              <span className="text-xs font-black text-yellow-300">{fmtMult(win / bet)}</span>
            </div>
          )}
        </div>
      </div>
      <div className="relative px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <div className="flex gap-2">
          <Btn variant="glass" size="lg" className="w-[84px]" onClick={() => setAuto((a) => !a)}>{auto ? "PARAR" : "AUTO"}</Btn>
          <Btn variant="gold" size="lg" className="flex-1" pulse={!busy} onClick={() => play(false)}>{busy ? "PARAR" : "GIRAR"}</Btn>
          <Btn variant="violet" size="lg" className="w-[110px] text-[11px] leading-tight" disabled={busy} onClick={() => play(true)}>
            <span>COMPRAR<br />RECURSO {cfg?.buyPrice ?? ""}x</span>
          </Btn>
        </div>
        {lastRound && !busy && win > 0 && <button onClick={() => shareRound(lastRound)} className="text-[11px] font-black press text-yellow-300">COMPARTILHAR NO GRUPO ↗</button>}
      </div>
    </GameShell>
  );
}
