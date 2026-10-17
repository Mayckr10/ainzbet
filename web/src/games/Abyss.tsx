import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ABYSS_ART, ABYSS_NAMES } from "../art/abyss";
import { SymbolArt } from "../art/Symbol";
import { cls, fmt, fmtMult, sleep } from "../lib/format";
import { sfx } from "../lib/sound";
import { revealBalance, speedFactor, useApp } from "../lib/store";
import { confirm, haptic } from "../lib/tg";
import { bigWinTier, coinBurst, confetti, showBigWin } from "../ui/effects";
import { GameShell, playInstant, shareRound } from "../ui/GameShell";
import { BetInput, Btn, ChipIcon, CountUp, useBet } from "../ui/kit";
import { Paylines, Reels, type ReelsHandle } from "../ui/Reels";

const POOL = [2, 3, 4, 5, 6, 7, 8, 5, 6, 7, 8, 0, 1];
type Spin = { grid: number[][]; wildMults: number[][] | null; wins: { line: number; symbol: number; count: number; mult: number }[]; scatter: { count: number; cells: [number, number][]; mult: number }; multiplier: number; freeSpinsWon: number };

export default function Abyss() {
  const cfg = useApp((s) => s.config?.fruit);
  const reels = useRef<ReelsHandle>(null);
  const [bet, setBet] = useBet("slots-fruit", 100);
  const [busy, setBusy] = useState(false);
  const [hl, setHl] = useState<Set<string> | null>(null);
  const [lines, setLines] = useState<number[]>([]);
  const [wm, setWm] = useState<number[][] | null>(null);
  const [win, setWin] = useState(0);
  const [free, setFree] = useState<{ left: number; total: number; win: number } | null>(null);
  const [intro, setIntro] = useState<number | null>(null);
  const [auto, setAuto] = useState(false);
  const [lastRound, setLastRound] = useState<number | null>(null);
  const autoRef = useRef(false);
  const busyRef = useRef(false);
  autoRef.current = auto;
  const introResolve = useRef<() => void>(() => {});
  const initial = useRef(Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => POOL[(Math.random() * 11) | 0])));

  async function showSpin(s: Spin, b: number, inFree: boolean) {
    const sf = speedFactor();
    setHl(null);
    setLines([]);
    setWm(null);
    reels.current?.start();
    await sleep(120);
    const anticipate: number[] = [];
    let sc = 0;
    s.grid.forEach((col, r) => {
      if (sc >= 2 && r >= 2) anticipate.push(r);
      if (col.includes(1)) sc++;
    });
    await reels.current?.stop(s.grid, { anticipate });
    if (s.wildMults) {
      const has = s.wildMults.some((c) => c.some((v) => v > 0));
      if (has) {
        setWm(s.wildMults);
        sfx.gem();
        await sleep(450 * sf);
      }
    }
    const cells = new Set<string>();
    s.wins.forEach((w) => {
      const pattern = cfg?.lines?.[w.line] ?? [];
      for (let r = 0; r < w.count; r++) cells.add(`${r}-${pattern[r]}`);
    });
    if (s.scatter.count >= 3) s.scatter.cells.forEach(([a, c]) => cells.add(`${a}-${c}`));
    if (cells.size) {
      setHl(cells);
      setLines(s.wins.map((w) => w.line));
      const amount = Math.floor(b * s.multiplier);
      if (amount > 0) {
        setWin((x) => x + amount);
        if (inFree) setFree((f) => (f ? { ...f, win: f.win + amount } : f));
        sfx.win(s.multiplier >= 5);
        haptic.success();
      } else sfx.scatter();
      await sleep((s.wins.length > 2 ? 1000 : 750) * sf);
    }
  }

  async function play(buy = false) {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await runPlay(buy);
    } catch {
      reels.current?.reset(initial.current);
      setFree(null);
      setIntro(null);
      revealBalance();
      setAuto(false);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function runPlay(buy: boolean) {
    const cost = buy ? bet * (cfg?.buyPrice ?? 52) : bet;
    if (buy && !(await confirm(`Comprar o bônus de giros grátis por ${fmt(cost)} fichas?`))) return;
    if (buy) setAuto(false);
    setBusy(true);
    setWin(0);
    haptic.impact("medium");
    const r = await playInstant<{ base: Spin | null; free: Spin[]; multiplier: number; maxWin: boolean }>("slots-fruit", bet, buy ? { buy: true } : {}, cost);
    if (!r) {
      setAuto(false);
      return;
    }
    const res = r.result;
    if (res.base) await showSpin(res.base, bet, false);
    if (res.free.length) {
      setAuto(false);
      await sleep(300);
      sfx.freeSpins();
      confetti();
      const first = buy ? 12 : res.base?.freeSpinsWon ?? 12;
      await new Promise<void>((resolve) => {
        introResolve.current = resolve;
        setIntro(first);
      });
      let total = first;
      setFree({ left: first, total, win: 0 });
      for (let i = 0; i < res.free.length; i++) {
        setFree((f) => (f ? { ...f, left: f.left - 1 } : f));
        await showSpin(res.free[i], bet, true);
        if (res.free[i].freeSpinsWon) {
          total += res.free[i].freeSpinsWon;
          setFree((f) => (f ? { ...f, left: f.left + res.free[i].freeSpinsWon, total } : f));
          sfx.freeSpins();
        }
      }
      await sleep(400);
      setFree(null);
    }
    setHl(null);
    setLines([]);
    setLastRound(r.roundId);
    const mult = r.payout / cost;
    if (bigWinTier(r.payout / bet) && r.payout > cost) await showBigWin(r.payout, r.payout / bet, res.free.length ? "Giros grátis" : undefined);
    else if (r.payout > 0) {
      coinBurst(document.getElementById("abyss-reels"), mult >= 3 ? 20 : 10);
      await sleep(600);
      revealBalance();
    } else revealBalance();
    initial.current = (res.free.length ? res.free[res.free.length - 1].grid : res.base?.grid) ?? initial.current;
  }

  useEffect(() => {
    if (auto && !busy) {
      const t = setTimeout(() => play(false), 400 * speedFactor());
      return () => clearTimeout(t);
    }
  }, [auto, busy]);

  return (
    <GameShell
      title="Jardim Abissal"
      game="slots-fruit"
      className="bg-[#020b1a]"
      info={<AbyssRules cfg={cfg} bet={bet} />}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(70% 50% at 50% 0%, rgba(14,165,233,0.25), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(124,58,237,0.25), transparent 70%)" }} />
      <Bubbles />
      <div className="relative flex-1 flex flex-col justify-center px-2">
        <div className="h-14 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {free ? (
              <motion.div key="f" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl px-4 py-1.5 flex gap-4 items-center border border-cyan-300/40 bg-cyan-950/50">
                <div className="text-center"><div className="text-[9px] font-black tracking-widest text-cyan-200/70">GIROS</div><div className="font-display font-black text-xl text-cyan-200">{free.left}</div></div>
                <div className="text-center"><div className="text-[9px] font-black tracking-widest text-cyan-200/70">BÔNUS</div><CountUp value={free.win} className="font-display font-black text-lg text-white" /></div>
              </motion.div>
            ) : (
              <motion.div key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] font-bold text-cyan-100/60">20 linhas · Kraken multiplicador nos giros grátis</motion.div>
            )}
          </AnimatePresence>
        </div>
        <div id="abyss-reels" className="mx-auto w-full max-w-[460px] rounded-[26px] p-[2px]" style={{ background: "linear-gradient(180deg, #67e8f9, #7c3aed)" }}>
          <div className="rounded-[24px] bg-[#04142b]/95 p-2 aspect-[5/3.1]">
            <Reels
              ref={reels}
              theme="abyss"
              live={[0]}
              reels={5}
              rows={3}
              initial={initial.current}
              pool={POOL}
              gap={5}
              highlight={hl}
              cellClass="rounded-xl bg-gradient-to-b from-cyan-300/[0.07] to-transparent"
              renderSymbol={(s, r, w) => (
                <SymbolArt art={ABYSS_ART[s]}>
                  {s === 0 && wm?.[r]?.[w] ? (
                    <g>
                      <circle cx="78" cy="20" r="17" fill="#f97316" stroke="#fff7ed" strokeWidth="2.5" />
                      <text x="78" y="26" textAnchor="middle" fontFamily="Unbounded" fontWeight="900" fontSize="15" fill="#fff">{wm[r][w]}x</text>
                    </g>
                  ) : null}
                </SymbolArt>
              )}
            >
              <Paylines lines={cfg?.lines ?? []} active={lines} reels={5} rows={3} colors={["#67e8f9", "#f0abfc", "#fde047", "#86efac", "#fb923c"]} />
            </Reels>
          </div>
        </div>
        <div className="h-14 flex items-center justify-center">
          {win > 0 && (
            <div className="flex items-center gap-2">
              <ChipIcon size={22} />
              <CountUp value={win} className="font-display font-black text-2xl text-cyan-200" onTick={sfx.count} />
              <span className="text-xs font-black text-cyan-200/70">{fmtMult(win / bet)}</span>
            </div>
          )}
        </div>
      </div>
      <div className="relative px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <div className="flex gap-2">
          <Btn variant="glass" size="lg" className="w-[84px]" onClick={() => setAuto((a) => !a)}>{auto ? "PARAR" : "AUTO"}</Btn>
          <Btn variant="gold" size="lg" className="flex-1" pulse={!busy} onClick={() => (busy ? reels.current?.hurry() : play(false))}>{busy ? "PARAR" : "GIRAR"}</Btn>
          <Btn variant="violet" size="lg" className="w-[110px] text-[11px] leading-tight" disabled={busy} onClick={() => play(true)}>
            <span>COMPRAR<br />BÔNUS {cfg?.buyPrice ?? 52}x</span>
          </Btn>
        </div>
        {lastRound && !busy && win > 0 && <button onClick={() => shareRound(lastRound)} className="text-[11px] font-black text-cyan-300 press">COMPARTILHAR NO GRUPO ↗</button>}
      </div>
      <AnimatePresence>
        {intro && (
          <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-[#020b1a]/90" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }} className="text-center px-6">
              <div className="w-28 h-28 mx-auto"><SymbolArt art={ABYSS_ART[1]} /></div>
              <div className="font-display font-black text-6xl text-cyan-200 mt-2">{intro}</div>
              <div className="font-display font-black text-2xl">GIROS GRÁTIS</div>
              <p className="text-sm text-cyan-100/70 mt-3 max-w-xs">O Olho do Kraken aparece com multiplicadores de 2x a 500x que somam em cada linha.</p>
              <Btn variant="gold" size="xl" className="mt-7 w-60" pulse onClick={() => { setIntro(null); introResolve.current(); }}>MERGULHAR</Btn>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
}

function Bubbles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-cyan-200/30"
          style={{ left: `${(i * 37) % 100}%`, width: 6 + (i % 4) * 4, height: 6 + (i % 4) * 4 }}
          initial={{ y: "110vh" }}
          animate={{ y: "-10vh" }}
          transition={{ repeat: Infinity, duration: 9 + (i % 5) * 2, delay: i * 0.7, ease: "linear" }}
        />
      ))}
    </div>
  );
}

function AbyssRules({ cfg, bet }: { cfg: any; bet: number }) {
  if (!cfg) return null;
  const lineBet = bet / 20;
  return (
    <>
      <p>5 rolos, 3 linhas e 20 linhas de pagamento fixas. Pagamentos da esquerda para a direita; valores abaixo para a aposta atual.</p>
      <div className="grid grid-cols-2 gap-2">
        {[2, 3, 4, 5, 6, 7, 8].map((s) => (
          <div key={s} className="glass rounded-xl p-2 flex items-center gap-2">
            <div className="w-11 h-11 shrink-0"><SymbolArt art={ABYSS_ART[s]} /></div>
            <div className="text-[11px] leading-tight">
              <div className="font-bold">{ABYSS_NAMES[s]}</div>
              {[5, 4, 3].map((n) => <div key={n}>{n}× <b className="text-gold-300">{fmt(cfg.pays[s][n] * lineBet)}</b></div>)}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 items-center"><div className="w-12 h-12"><SymbolArt art={ABYSS_ART[0]} /></div><div><b>Olho do Kraken</b>: curinga nos rolos 2, 3 e 4. Nos giros grátis vem com multiplicador ({cfg.wildMults.join(", ")}x) e os multiplicadores da linha somam.</div></div>
      <div className="flex gap-3 items-center"><div className="w-12 h-12"><SymbolArt art={ABYSS_ART[1]} /></div><div><b>Pérola Negra</b>: 3, 4 ou 5 pagam {cfg.scatterPays[3]}x, {cfg.scatterPays[4]}x ou {cfg.scatterPays[5]}x a aposta e dão {cfg.freeSpinsFor[3]}, {cfg.freeSpinsFor[4]} ou {cfg.freeSpinsFor[5]} giros grátis (+5 com 3 pérolas durante o bônus).</div></div>
      <p><b>Comprar bônus</b>: {cfg.buyPrice}x a aposta para ir direto aos {cfg.freeSpinsFor[3]} giros grátis.</p>
      <p className="text-white/50 text-xs">RTP ≈ 95,6%. Prêmio máximo 50.000x.</p>
    </>
  );
}
